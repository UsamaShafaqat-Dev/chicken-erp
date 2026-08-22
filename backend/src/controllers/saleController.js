const Sale = require("../models/Sale");
const Customer = require("../models/Customer");

// @desc    Get all sales
// @route   GET /api/sales
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("customer", "name mobile")
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new sale
// @route   POST /api/sales
const createSale = async (req, res) => {
  try {
    const { customer, weight, rate, paidAmount, paymentMethod, date, notes } =
      req.body;

    const totalAmount = Number(weight) * Number(rate);
    const dueAmount = totalAmount - Number(paidAmount || 0);

    // Sale record create karein
    const sale = await Sale.create({
      customer,
      weight,
      rate,
      totalAmount,
      paidAmount: paidAmount || 0,
      balanceDue: dueAmount,
      paymentMethod,
      date: date || Date.now(),
      notes,
    });

    // Customer ka Outstanding Balance update karein
    if (dueAmount !== 0) {
      const customerRecord = await Customer.findById(customer);
      if (customerRecord) {
        customerRecord.currentBalance += dueAmount;
        await customerRecord.save();
      }
    }

    res.status(201).json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a sale (Owner Only)
// @route   PUT /api/sales/:id
const updateSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    const { weight, rate, paidAmount, paymentMethod, date, notes } = req.body;

    const totalAmount = Number(weight) * Number(rate);
    const newDueAmount = totalAmount - Number(paidAmount || 0);
    const oldDueAmount = sale.balanceDue;
    const dueDifference = newDueAmount - oldDueAmount;

    sale.weight = weight;
    sale.rate = rate;
    sale.totalAmount = totalAmount;
    sale.paidAmount = paidAmount || 0;
    sale.balanceDue = newDueAmount;
    sale.paymentMethod = paymentMethod;
    sale.date = date || sale.date;
    sale.notes = notes;

    await sale.save();

    // Customer ka Outstanding Balance adjust karein
    if (dueDifference !== 0) {
      const customerRecord = await Customer.findById(sale.customer);
      if (customerRecord) {
        customerRecord.currentBalance += dueDifference;
        await customerRecord.save();
      }
    }

    res.json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a sale (Owner Only)
// @route   DELETE /api/sales/:id
const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    // Sale delete karne par Customer ka balance reverse karein
    if (sale.balanceDue !== 0) {
      const customerRecord = await Customer.findById(sale.customer);
      if (customerRecord) {
        customerRecord.currentBalance -= sale.balanceDue;
        await customerRecord.save();
      }
    }

    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: "Sale deleted and balance reversed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSales, createSale, updateSale, deleteSale };
