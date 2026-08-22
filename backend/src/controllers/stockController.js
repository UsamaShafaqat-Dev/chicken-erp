const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");

// @desc    Get Stock Summary
// @route   GET /api/stock
const getStockSummary = async (req, res) => {
  try {
    // 1. Total Purchased Weight calculate karein
    const purchases = await Purchase.aggregate([
      { $group: { _id: null, totalWeight: { $sum: "$weight" } } },
    ]);
    const totalPurchased = purchases.length > 0 ? purchases[0].totalWeight : 0;

    // 2. Total Sold Weight calculate karein
    const sales = await Sale.aggregate([
      { $group: { _id: null, totalWeight: { $sum: "$weight" } } },
    ]);
    const totalSold = sales.length > 0 ? sales[0].totalWeight : 0;

    // 3. Current Available Stock (In - Out)
    const currentStock = totalPurchased - totalSold;

    // 4. Recent Stock Movements (Aakhri 5 transactions)
    const recentPurchases = await Purchase.find()
      .populate("supplier", "name")
      .sort({ createdAt: -1 })
      .limit(10);
    const recentSales = await Sale.find()
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    // Dono arrays ko mila kar date wise sort kar lein taake combined history ban jaye
    let history = [];
    recentPurchases.forEach((p) =>
      history.push({
        type: "IN",
        party: p.supplier?.name,
        weight: p.weight,
        rate: p.rate, // 🔥 FIX: Rate add kar diya
        totalAmount: p.totalAmount, // 🔥 FIX: Total Amount add kar diya
        date: p.date,
      }),
    );
    recentSales.forEach((s) =>
      history.push({
        type: "OUT",
        party: s.customer?.name,
        weight: s.weight,
        rate: s.rate, // 🔥 FIX: Rate add kar diya
        totalAmount: s.totalAmount, // 🔥 FIX: Total Amount add kar diya
        date: s.date,
      }),
    );

    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      totalPurchased,
      totalSold,
      currentStock,
      history: history.slice(0, 15), // Aakhri 15 records
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStockSummary };
