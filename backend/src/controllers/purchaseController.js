const Purchase = require("../models/Purchase");
const Supplier = require("../models/Supplier");

// @desc    Get all purchases
// @route   GET /api/purchases
const getPurchases = async (req, res) => {
  try {
    // Populate se humein Supplier ka naam mil jayega uski ID ke bajaye
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

    // Total aur Due automatically calculate karna (Ghalti ki koi gunjaish nahi)
    const totalAmount = Number(weight) * Number(rate);
    const dueAmount = totalAmount - Number(paidAmount || 0);

    // 1. Purchase Record Create Karein
    const purchase = await Purchase.create({
      supplier,
      weight,
      rate,
      totalAmount,
      paidAmount: paidAmount || 0,
      balanceDue: dueAmount,
      paymentMethod,
      date: date || Date.now(),
      notes,
    });

    // 2. Supplier ka Payable Balance Update Karein (Agar udhaar hai)
    if (dueAmount > 0 || dueAmount < 0) {
      const supplierRecord = await Supplier.findById(supplier);
      if (supplierRecord) {
        supplierRecord.currentBalance += dueAmount;
        await supplierRecord.save();
      }
    }

    // Note: Stock update ka logic hum next phase mein Sales ke sath lagayenge (taake Plus/Minus easily manage ho)

    res.status(201).json(purchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a purchase (Owner Only - Adjusts Supplier Balance)
// @route   DELETE /api/purchases/:id
const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase)
      return res.status(404).json({ message: "Purchase not found" });

    // Jab purchase delete ho toh Supplier ka udhaar wapis reverse karein
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

// @desc    Update a purchase (Owner Only)
// @route   PUT /api/purchases/:id
const updatePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase)
      return res.status(404).json({ message: "Purchase not found" });

    const { weight, rate, paidAmount, paymentMethod, date, notes } = req.body;

    // Auto-Calculate new totals
    const totalAmount = Number(weight) * Number(rate);
    const newDueAmount = totalAmount - Number(paidAmount || 0);

    // Purane due aur naye due ka farq (Difference) nikalein
    const oldDueAmount = purchase.balanceDue;
    const dueDifference = newDueAmount - oldDueAmount;

    // Purchase update karein
    purchase.weight = weight;
    purchase.rate = rate;
    purchase.totalAmount = totalAmount;
    purchase.paidAmount = paidAmount || 0;
    purchase.balanceDue = newDueAmount;
    purchase.paymentMethod = paymentMethod;
    purchase.date = date || purchase.date;
    purchase.notes = notes;

    await purchase.save();

    // Supplier ka Payable Balance automatically adjust karein
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
