const CashAccount = require("../models/CashAccount");
const CashTransaction = require("../models/CashTransaction");

// 1. Naya cash account banayen
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

// 3. Ek account se doosre account mein paise transfer karein
const transferCash = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, particulars, date } = req.body;

    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const fromAccount = await CashAccount.findById(fromAccountId);
    if (fromAccount.balance < amount) {
      return res
        .status(400)
        .json({ message: `Insufficient balance in ${fromAccount.name}` });
    }
    fromAccount.balance -= Number(amount);
    await fromAccount.save();

    const toAccount = await CashAccount.findById(toAccountId);
    toAccount.balance += Number(amount);
    await toAccount.save();

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

    const transactions = await CashTransaction.find({
      $or: [{ fromAccount: id }, { toAccount: id }],
    })
      .populate("fromAccount", "name")
      .populate("toAccount", "name")
      .sort({ date: -1 });

    const formattedTransactions = transactions.map((tx) => {
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

// 🔥 5. NAYA: Update Cash Account (Edit)
const updateAccount = async (req, res) => {
  try {
    const { name, type, initialBalance } = req.body;
    const account = await CashAccount.findById(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found" });

    account.name = name || account.name;
    account.type = type || account.type;
    if (initialBalance !== undefined && initialBalance !== "") {
      account.balance = Number(initialBalance);
    }

    await account.save();
    res.json(account);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🔥 6. NAYA: Delete Cash Account
const deleteAccount = async (req, res) => {
  try {
    const account = await CashAccount.findByIdAndDelete(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found" });

    // Is account ki sari transactions bhi delete kar denge
    await CashTransaction.deleteMany({
      $or: [{ fromAccount: req.params.id }, { toAccount: req.params.id }],
    });

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAccount,
  getAccounts,
  transferCash,
  getAccountLedger,
  updateAccount,
  deleteAccount,
};
