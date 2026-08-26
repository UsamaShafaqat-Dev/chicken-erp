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
        accountId: account._id,
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

const deleteAccount = async (req, res) => {
  try {
    const account = await CashAccount.findByIdAndDelete(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found" });

    await CashTransaction.deleteMany({
      $or: [{ fromAccount: req.params.id }, { toAccount: req.params.id }],
    });

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔥 NAYA: Specific Cash Transaction (Transfer) ko Delete karke Balance Wapas karna
const deleteTransaction = async (req, res) => {
  try {
    const tx = await CashTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: "Transaction not found" });

    // Sirf Internal Transfer wali entry direct delete ho sakti hai
    if (tx.transactionType === "internal_transfer") {
      // Jahan se paise gaye the, usko wapas karo
      if (tx.fromAccount) {
        const fromAcc = await CashAccount.findById(tx.fromAccount);
        if (fromAcc) {
          fromAcc.balance += tx.amount;
          await fromAcc.save();
        }
      }
      // Jisko paise mile the, uske kat lo
      if (tx.toAccount) {
        const toAcc = await CashAccount.findById(tx.toAccount);
        if (toAcc) {
          toAcc.balance -= tx.amount;
          await toAcc.save();
        }
      }

      await CashTransaction.findByIdAndDelete(req.params.id);
      return res.json({
        message: "Transfer deleted and balances reverted successfully",
      });
    } else {
      // Agar wo koi aur payment hai (jaise customer recovery) to error do
      return res
        .status(400)
        .json({
          message:
            "Please delete this entry from its original page (Sales, Payments, or Expenses) to ensure correct account balances.",
        });
    }
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
  deleteTransaction, // 🔥 NAYA
};
