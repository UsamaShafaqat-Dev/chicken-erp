const CashAccount = require("../models/CashAccount");
const CashTransaction = require("../models/CashTransaction");

// 1. نیا کیش اکاؤنٹ بنائیں (لڑکے کا یا اونر کا)
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

// 2. تمام کیش اکاؤنٹس کی لسٹ منگوائیں
const getAccounts = async (req, res) => {
  try {
    const accounts = await CashAccount.find({ status: "active" });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. ایک اکاؤنٹ سے دوسرے اکاؤنٹ میں پیسے ٹرانسفر کریں (جیسے لڑکے سے رانا صاحب کو)
const transferCash = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, particulars, date } = req.body;

    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // پیسے دینے والے کے اکاؤنٹ سے رقم کم کریں
    const fromAccount = await CashAccount.findById(fromAccountId);
    if (fromAccount.balance < amount) {
      return res
        .status(400)
        .json({ message: `Insufficient balance in ${fromAccount.name}` });
    }
    fromAccount.balance -= Number(amount);
    await fromAccount.save();

    // پیسے لینے والے کے اکاؤنٹ میں رقم جمع کریں
    const toAccount = await CashAccount.findById(toAccountId);
    toAccount.balance += Number(amount);
    await toAccount.save();

    // ٹرانسفر کی ہسٹری محفوظ کریں
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

// 4. کسی ایک اکاؤنٹ کا لیجر (ہسٹری) نکالیں
const getAccountLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await CashAccount.findById(id);

    // وہ ٹرانزیکشنز جہاں یہ اکاؤنٹ پیسے دینے والا یا لینے والا تھا
    const transactions = await CashTransaction.find({
      $or: [{ fromAccount: id }, { toAccount: id }],
    })
      .populate("fromAccount name")
      .populate("toAccount name")
      .sort({ date: -1 });

    res.json({ account, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAccount,
  getAccounts,
  transferCash,
  getAccountLedger,
};
