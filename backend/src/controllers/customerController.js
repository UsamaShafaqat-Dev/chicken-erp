const Customer = require("../models/Customer");
const Sale = require("../models/Sale");
const Payment = require("../models/Payment");

// @desc    Get all customers with calculated totals
// @route   GET /api/customers
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().lean().sort({ createdAt: -1 });
    const sales = await Sale.find().lean();
    const payments = await Payment.find().lean();

    const customersWithTotals = customers.map((customer) => {
      const custId = customer._id.toString();
      const customerSales = sales.filter(
        (s) => s.customer?.toString() === custId,
      );
      const customerPayments = payments.filter(
        (p) => p.customer?.toString() === custId,
      );

      const totalPurchases = customerSales.reduce(
        (sum, sale) => sum + (Number(sale.totalAmount) || 0),
        0,
      );
      const paidAtSaleTime = customerSales.reduce(
        (sum, sale) => sum + (Number(sale.paidAmount) || 0),
        0,
      );
      const paidLater = customerPayments.reduce(
        (sum, payment) => sum + (Number(payment.amount) || 0),
        0,
      );

      const totalPaid = paidAtSaleTime + paidLater;

      return {
        ...customer,
        totalPurchases,
        totalPaid,
      };
    });

    res.json(customersWithTotals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new customer
// @route   POST /api/customers
const createCustomer = async (req, res) => {
  try {
    const { name, mobile, whatsapp, area, address, openingBalance, notes } =
      req.body;
    const customer = await Customer.create({
      name,
      mobile,
      whatsapp,
      area,
      address,
      openingBalance: Number(openingBalance) || 0,
      currentBalance: Number(openingBalance) || 0,
      notes,
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update customer (Owner Only)
// @route   PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    const newOpeningBalance = Number(req.body.openingBalance) || 0;
    const oldOpeningBalance = customer.openingBalance || 0;
    const balanceDiff = newOpeningBalance - oldOpeningBalance;

    const updatedData = {
      ...req.body,
      openingBalance: newOpeningBalance,
      currentBalance: customer.currentBalance + balanceDiff,
    };

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true },
    );
    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete customer (Owner Only)
// @route   DELETE /api/customers/:id
const deleteCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // 🔥 SECURITY LOCK 1: Balance Check
    if (customer.currentBalance !== 0 || customer.openingBalance !== 0) {
      return res.status(400).json({
        message: `Deletion Failed! This customer has a balance of Rs. ${customer.currentBalance}. Please clear the balance to 0 before deleting.`,
      });
    }

    // 🔥 SECURITY LOCK 2: Transactions Check
    const salesCount = await Sale.countDocuments({ customer: customerId });
    const paymentsCount = await Payment.countDocuments({
      customer: customerId,
    });

    if (salesCount > 0 || paymentsCount > 0) {
      return res.status(400).json({
        message: `Deletion Failed! This customer has ${salesCount} sales and ${paymentsCount} payments recorded. Delete their history first.`,
      });
    }

    // Agar sab clear hai toh delete kar do
    await Customer.findByIdAndDelete(customerId);
    res.json({ message: "Customer removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
