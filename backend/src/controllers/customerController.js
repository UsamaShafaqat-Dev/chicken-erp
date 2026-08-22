const Customer = require("../models/Customer");
// 🔥 NAYA: Sales aur Payments ke models import kiye hain (Agar aap ke models ka naam thora mukhtalif hai toh yahan path theek kar lijiye ga)
const Sale = require("../models/Sale");
const Payment = require("../models/Payment");

// @desc    Get all customers with calculated totals
// @route   GET /api/customers
const getCustomers = async (req, res) => {
  try {
    // .lean() lagaya taake Mongoose humein khalis JS objects de jin mein hum naye fields add kar sakein
    const customers = await Customer.find().lean().sort({ createdAt: -1 });

    // Database se saari sales aur payments utha li
    const sales = await Sale.find().lean();
    const payments = await Payment.find().lean();

    // Har customer ke liye total calculate kar rahe hain
    const customersWithTotals = customers.map((customer) => {
      const custId = customer._id.toString();

      // Is customer ki saari sales aur payments filter ki
      const customerSales = sales.filter(
        (s) => s.customer?.toString() === custId,
      );
      const customerPayments = payments.filter(
        (p) => p.customer?.toString() === custId,
      );

      // 1. Total Purchases: (Sales wale dabe ka totalAmount)
      const totalPurchases = customerSales.reduce(
        (sum, sale) => sum + (Number(sale.totalAmount) || 0),
        0,
      );

      // 2. Total Paid: (Sale ke waqt jo cash diya + Baad mein Ledger/Payments se jo cash diya)
      const paidAtSaleTime = customerSales.reduce(
        (sum, sale) => sum + (Number(sale.paidAmount) || 0),
        0,
      );
      const paidLater = customerPayments.reduce((sum, payment) => {
        // Agar payment 'received' hai toh plus karo (Agar aap ne type rakhi hui hai)
        return sum + (Number(payment.amount) || 0);
      }, 0);

      const totalPaid = paidAtSaleTime + paidLater;

      // Customer ke data mein ye 2 nayi cheezein add kar ke bhej di
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
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: "Customer removed" });
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
