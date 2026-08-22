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

    // Date Filter Logic (Agar user ne date select ki hai)
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Din ka start
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Din ka end

      query.date = { $gte: start, $lte: end };
    }

    // Database se data uthana
    const sales = await Sale.find(query);
    const purchases = await Purchase.find(query);
    const expenses = await Expense.find(query);
    const payments = await Payment.find(query);

    // Calculations
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

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

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
      payments: { received: totalReceived, paid: totalPaid },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getReports };
