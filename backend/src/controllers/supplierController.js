const Supplier = require("../models/Supplier");

// @desc    Get all suppliers
// @route   GET /api/suppliers
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
const createSupplier = async (req, res) => {
  try {
    const { name, mobile, whatsapp, address, openingBalance, notes } = req.body;

    const supplier = await Supplier.create({
      name,
      mobile,
      whatsapp,
      address,
      openingBalance: openingBalance || 0,
      currentBalance: openingBalance || 0,
      notes,
    });

    res.status(201).json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update supplier (Owner Only)
// @route   PUT /api/suppliers/:id
// @desc    Update supplier (Owner Only)
// @route   PUT /api/suppliers/:id
const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier)
      return res.status(404).json({ message: "Supplier not found" });

    // Calculate difference
    const newOpeningBalance = Number(req.body.openingBalance) || 0;
    const oldOpeningBalance = supplier.openingBalance || 0;
    const balanceDiff = newOpeningBalance - oldOpeningBalance;

    // Auto adjust currentBalance
    const updatedData = {
      ...req.body,
      openingBalance: newOpeningBalance,
      currentBalance: supplier.currentBalance + balanceDiff,
    };

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true },
    );
    res.json(updatedSupplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete supplier (Owner Only)
// @route   DELETE /api/suppliers/:id
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier)
      return res.status(404).json({ message: "Supplier not found" });
    res.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
