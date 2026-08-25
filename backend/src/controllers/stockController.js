const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");

// @desc    Get Stock Summary
// @route   GET /api/stock
const getStockSummary = async (req, res) => {
  try {
    const purchases = await Purchase.aggregate([
      { $group: { _id: null, totalWeight: { $sum: "$weight" } } },
    ]);
    const totalPurchased = purchases.length > 0 ? purchases[0].totalWeight : 0;

    const sales = await Sale.aggregate([
      { $group: { _id: null, totalWeight: { $sum: "$weight" } } },
    ]);
    const totalSold = sales.length > 0 ? sales[0].totalWeight : 0;

    const currentStock = totalPurchased - totalSold;

    const allPurchases = await Purchase.find()
      .populate("supplier", "name")
      .sort({ date: -1 });
      
    const allSales = await Sale.find()
      .populate("customer", "name")
      .sort({ date: -1 });

    let history = [];
    
    allPurchases.forEach((p) =>
      history.push({
        _id: p._id, 
        type: "IN",
        party: p.supplier?.name,
        weight: p.weight,
        rate: p.rate, 
        totalAmount: p.totalAmount, 
        paidAmount: p.paidAmount, // 🔥 Added for Edit
        paymentMethod: p.paymentMethod, // 🔥 Added for Edit
        notes: p.notes, // 🔥 Added for Edit
        date: p.date,
      }),
    );

    allSales.forEach((s) =>
      history.push({
        _id: s._id,
        type: "OUT",
        party: s.customer?.name,
        weight: s.weight,
        rate: s.rate, 
        totalAmount: s.totalAmount, 
        paidAmount: s.paidAmount,
        paymentMethod: s.paymentMethod,
        notes: s.notes,
        date: s.date,
      }),
    );

    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      totalPurchased,
      totalSold,
      currentStock,
      history: history,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStockSummary };