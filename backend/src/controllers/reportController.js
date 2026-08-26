const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const Expense = require("../models/Expense");
const Payment = require("../models/Payment");
const CashTransaction = require("../models/CashTransaction");
const CashAccount = require("../models/CashAccount");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Employee = require("../models/Employee");

// @desc    Get Business Reports / Summary
// @route   GET /api/reports
const getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    // Date Filter Logic
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const sales = await Sale.find(query);
    const purchases = await Purchase.find(query);
    const expenses = await Expense.find(query);
    const payments = await Payment.find(query).populate("employee", "name");

    const totalSalesWeight = sales.reduce((acc, curr) => acc + curr.weight, 0);
    const totalSalesAmount = sales.reduce(
      (acc, curr) => acc + curr.totalAmount,
      0,
    );

    const totalPurchaseWeight = purchases.reduce(
      (acc, curr) => acc + curr.weight,
      0,
    );
    const totalPurchaseAmount = purchases.reduce(
      (acc, curr) => acc + curr.totalAmount,
      0,
    );

    // Expense Breakdown Logic
    let expenseDetails = {};

    // Normal Expenses
    expenses.forEach((e) => {
      const cat = e.category || "Other";
      expenseDetails[cat] = (expenseDetails[cat] || 0) + e.amount;
    });

    // Staff Salaries
    payments.forEach((p) => {
      if (p.type === "pay" && p.employee) {
        expenseDetails["Staff Salary"] =
          (expenseDetails["Staff Salary"] || 0) + p.amount;
      }
    });

    const totalExpenses = Object.values(expenseDetails).reduce(
      (acc, curr) => acc + curr,
      0,
    );

    const totalReceived = payments
      .filter((p) => p.type === "receive")
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalPaid = payments
      .filter((p) => p.type === "pay")
      .reduce((acc, curr) => acc + curr.amount, 0);

    res.json({
      sales: { weight: totalSalesWeight, amount: totalSalesAmount },
      purchases: { weight: totalPurchaseWeight, amount: totalPurchaseAmount },
      expenses: totalExpenses,
      expenseDetails: expenseDetails,
      payments: { received: totalReceived, paid: totalPaid },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔥 NAYA: Factory Reset Database (Testing data clean karne ke liye)
const resetData = async (req, res) => {
  try {
    // 1. Delete all transactions (Bills, Payments, Expenses)
    await Sale.deleteMany({});
    await Purchase.deleteMany({});
    await Expense.deleteMany({});
    await Payment.deleteMany({});
    await CashTransaction.deleteMany({});

    // 2. Reset all Balances to 0
    await CashAccount.updateMany({}, { balance: 0 });
    await Customer.updateMany(
      {},
      { currentBalance: 0, totalPurchases: 0, totalPaid: 0 },
    );
    await Supplier.updateMany(
      {},
      { currentBalance: 0, totalPurchases: 0, totalPaid: 0 },
    );
    await Employee.updateMany(
      {},
      { currentBalance: 0, balance: 0, monthlySalary: 0 },
    );

    res.json({ message: "Software Reset Successful! All totals are now 0." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getReports, resetData };
