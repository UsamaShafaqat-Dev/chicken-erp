const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const Expense = require("../models/Expense");
const Payment = require("../models/Payment");

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

    // 🔥 Expense Breakdown Logic
    let expenseDetails = {};

    // Normal Expenses
    expenses.forEach((e) => {
      const cat = e.category || "Other";
      expenseDetails[cat] = (expenseDetails[cat] || 0) + e.amount;
    });

    // Staff Salaries (jo Payments se direct aayi hain)
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
      expenseDetails: expenseDetails, // 🔥 Yahan se detail frontend pe jayegi
      payments: { received: totalReceived, paid: totalPaid },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getReports };
