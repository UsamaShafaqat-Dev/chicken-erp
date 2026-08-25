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

    // 4. Stock Movements (Puri history taake frontend pe date filter 100% sahi chale)
    const allPurchases = await Purchase.find()
      .populate("supplier", "name")
      .sort({ date: -1 });

    const allSales = await Sale.find()
      .populate("customer", "name")
      .sort({ date: -1 });

    // Dono arrays ko mila kar date wise sort kar lein taake combined history ban jaye
    let history = [];

    allPurchases.forEach((p) =>
      history.push({
        _id: p._id, // 🔥 FIX 1: ID bhej di taake Delete ka button show ho aur kaam kare!
        type: "IN",
        party: p.supplier?.name,
        weight: p.weight,
        rate: p.rate,
        totalAmount: p.totalAmount,
        date: p.date,
      }),
    );

    allSales.forEach((s) =>
      history.push({
        _id: s._id, // 🔥 FIX 1: Sales ki ID bhi bhej di
        type: "OUT",
        party: s.customer?.name,
        weight: s.weight,
        rate: s.rate,
        totalAmount: s.totalAmount,
        date: s.date,
      }),
    );

    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      totalPurchased,
      totalSold,
      currentStock,
      history: history, // 🔥 FIX 2: Limit hata di taake life-time purana data bhi filter ho sakay
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStockSummary };
