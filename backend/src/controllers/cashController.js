const CashAccount = require("../models/CashAccount");
const CashTransaction = require("../models/CashTransaction");

// 1. Naya cash account banayen (Larkay ka ya Owner ka)
const createAccount = async (req, res) => {
  try {
    const { name, type, initialBalance } = req.body;
    const account = await CashAccount.create({
      name,
      type,
      balance: initialBalance || 0,
    });
    res.status(201).json(account);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 2. Tamam cash accounts ki list mangwayen
const getAccounts = async (req, res) => {
  try {
    const accounts = await CashAccount.find({ status: "active" });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Ek account se doosre account mein paise transfer karein (jaise larkay se owner ko)
const transferCash = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, particulars, date } = req.body;

    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Paise dene wale ke account se raqam kam karein
    const fromAccount = await CashAccount.findById(fromAccountId);
    if (fromAccount.balance < amount) {
      return res
        .status(400)
        .json({ message: `Insufficient balance in ${fromAccount.name}` });
    }
    fromAccount.balance -= Number(amount);
    await fromAccount.save();

    // Paise lene wale ke account mein raqam jama karein
    const toAccount = await CashAccount.findById(toAccountId);
    toAccount.balance += Number(amount);
    await toAccount.save();

    // Transfer ki history mehfooz karein
    const transaction = await CashTransaction.create({
      fromAccount: fromAccountId,
      toAccount: toAccountId,
      amount: Number(amount),
      transactionType: "internal_transfer",
      particulars:
        particulars ||
        `Cash transferred from ${fromAccount.name} to ${toAccount.name}`,
      date: date || Date.now(),
    });

    res
      .status(200)
      .json({ message: "Cash transferred successfully", transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Kisi ek account ka ledger (history) nikalen
const getAccountLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await CashAccount.findById(id);

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    // 🔥 FIX: Populate ko theek kiya, aur frontend k mutabiq calculations kar k bhejein
    const transactions = await CashTransaction.find({
      $or: [{ fromAccount: id }, { toAccount: id }],
    })
      .populate("fromAccount", "name")
      .populate("toAccount", "name")
      .sort({ date: -1 });

    // Frontend ko data formatted chahiye (IN / OUT type k sath)
    const formattedTransactions = transactions.map((tx) => {
      // Check karein k paisa is account me aaya hai (IN) ya yahan se gaya hai (OUT)
      const isReceive = tx.toAccount && tx.toAccount._id.toString() === id;

      let otherPartyName = "System / Adjustment";
      if (isReceive && tx.fromAccount) {
        otherPartyName = tx.fromAccount.name;
      } else if (!isReceive && tx.toAccount) {
        otherPartyName = tx.toAccount.name;
      }

      return {
        _id: tx._id,
        type: isReceive ? "in" : "out",
        amount: tx.amount,
        particulars:
          tx.particulars ||
          (isReceive
            ? `Received from ${otherPartyName}`
            : `Paid to ${otherPartyName}`),
        date: tx.date,
        transactionType: tx.transactionType,
      };
    });

    // Hum apna formatted data bhejenge jo frontend handle kar sake
    res.json({
      success: true,
      ledger: {
        accountName: account.name,
        balance: account.balance,
        transactions: formattedTransactions,
      },
    });
  } catch (error) {
    console.error("Ledger Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createAccount,
  getAccounts,
  transferCash,
  getAccountLedger,
};
