const Purchase = require("../models/Purchase");
const Supplier = require("../models/Supplier");

// @desc    Get all purchases
// @route   GET /api/purchases
const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate("supplier", "name mobile")
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new purchase
// @route   POST /api/purchases
const createPurchase = async (req, res) => {
  try {
    const { supplier, weight, rate, paidAmount, paymentMethod, date, notes } =
      req.body;

    // Rate agar khali aaye toh usay 0 maan lein
    const finalRate = Number(rate) || 0;
    const finalPaidAmount = Number(paidAmount) || 0;

    const totalAmount = Number(weight) * finalRate;
    const dueAmount = totalAmount - finalPaidAmount;

    // 1. Purchase Record Create Karein
    const purchase = await Purchase.create({
      supplier,
      weight,
      rate: finalRate,
      totalAmount,
      paidAmount: finalPaidAmount,
      balanceDue: dueAmount,
      paymentMethod,
      date: date || Date.now(),
      notes,
    });

    // 2. Supplier ka Payable Balance Update Karein
    if (dueAmount !== 0) {
      const supplierRecord = await Supplier.findById(supplier);
      if (supplierRecord) {
        supplierRecord.currentBalance += dueAmount;
        await supplierRecord.save();
      }
    }

    res.status(201).json(purchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a purchase
// @route   DELETE /api/purchases/:id
const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase)
      return res.status(404).json({ message: "Purchase not found" });

    if (purchase.balanceDue !== 0) {
      const supplierRecord = await Supplier.findById(purchase.supplier);
      if (supplierRecord) {
        supplierRecord.currentBalance -= purchase.balanceDue;
        await supplierRecord.save();
      }
    }

    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ message: "Purchase deleted and balance reversed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a purchase
// @route   PUT /api/purchases/:id
const updatePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase)
      return res.status(404).json({ message: "Purchase not found" });

    const { weight, rate, paidAmount, paymentMethod, date, notes } = req.body;

    // Rate agar khali aaye toh usay 0 maan lein
    const finalRate = Number(rate) || 0;
    const finalPaidAmount = Number(paidAmount) || 0;

    const totalAmount = Number(weight) * finalRate;
    const newDueAmount = totalAmount - finalPaidAmount;
    const oldDueAmount = purchase.balanceDue;
    const dueDifference = newDueAmount - oldDueAmount;

    purchase.weight = weight;
    purchase.rate = finalRate;
    purchase.totalAmount = totalAmount;
    purchase.paidAmount = finalPaidAmount;
    purchase.balanceDue = newDueAmount;
    purchase.paymentMethod = paymentMethod;
    purchase.date = date || purchase.date;
    purchase.notes = notes;

    await purchase.save();

    if (dueDifference !== 0) {
      const supplierRecord = await Supplier.findById(purchase.supplier);
      if (supplierRecord) {
        supplierRecord.currentBalance += dueDifference;
        await supplierRecord.save();
      }
    }

    res.json(purchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPurchases,
  createPurchase,
  deletePurchase,
  updatePurchase,
};
