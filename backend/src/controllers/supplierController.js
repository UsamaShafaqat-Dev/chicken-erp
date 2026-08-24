const Supplier = require("../models/Supplier");
const Purchase = require("../models/Purchase"); // 🔥 FIX: Purchase model add kiya

// @desc    Get all suppliers
// @route   GET /api/suppliers
const getSuppliers = async (req, res) => {
  try {
    // .lean() lagaya taake hum custom fields (totalPurchases, totalPaid) add kar sakein
    const suppliers = await Supplier.find().sort({ createdAt: -1 }).lean();

    // Har supplier k liye Purchases aur Paid calculate karein
    const updatedSuppliers = await Promise.all(
      suppliers.map(async (supplier) => {
        let totalPurchases = 0;

        try {
          // Supplier ki saari purchases uthayen aur totalAmount jama (sum) karein
          const purchases = await Purchase.find({ supplier: supplier._id });
          purchases.forEach((p) => {
            totalPurchases += Number(p.totalAmount) || 0;
          });
        } catch (err) {
          console.log("Failed to fetch purchases for supplier", err);
        }

        // 🔥 VIP MATH TRICK:
        // Current Balance = Opening + Purchases - Paid
        // Iska matlab hai k: Paid = Opening + Purchases - Current Balance
        let totalPaid =
          (Number(supplier.openingBalance) || 0) +
          totalPurchases -
          (Number(supplier.currentBalance) || 0);

        // Agar kisi wajah se calculations minus me jayen to usay 0 set kar do
        if (totalPaid < 0) totalPaid = 0;

        return {
          ...supplier,
          totalPurchases,
          totalPaid,
        };
      }),
    );

    res.json(updatedSuppliers);
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
