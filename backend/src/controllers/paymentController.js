const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const CashAccount = require("../models/CashAccount"); // 🔥 NAYA ADD KIYA
const CashTransaction = require("../models/CashTransaction"); // 🔥 NAYA ADD KIYA

// @desc    Get all payments
// @route   GET /api/payments
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("customer", "name mobile")
      .populate("supplier", "name mobile")
      .populate("cashAccountId", "name") // 🔥 NAYA: Cash Account ka naam bhi fetch karega
      .sort({ date: -1, createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new payment
// @route   POST /api/payments
const createPayment = async (req, res) => {
  try {
    const {
      type,
      customer,
      supplier,
      amount,
      method,
      date,
      notes,
      cashAccountId,
    } = req.body;
    const paymentAmount = Number(amount);

    if (!cashAccountId) {
      return res.status(400).json({ message: "Please select a Cash Account" });
    }

    // 1. Payment Record Save Karein
    const payment = await Payment.create({
      type,
      customer,
      supplier,
      amount: paymentAmount,
      method,
      date,
      notes,
      cashAccountId, // 🔥 NAYA: Payment k andar cash account save kiya
    });

    const cashAcc = await CashAccount.findById(cashAccountId);

    // 2. Balances Auto-Update Karein (Customer/Supplier + Cash Book)
    if (type === "receive" && customer) {
      // Customer ne paise diye hain -> Outstanding Balance minus karein
      const customerRecord = await Customer.findById(customer);
      if (customerRecord) {
        customerRecord.currentBalance -= paymentAmount;
        await customerRecord.save();
      }

      // 🔥 NAYA: Cash Account mein paise PLUS karein
      if (cashAcc) {
        cashAcc.balance += paymentAmount;
        await cashAcc.save();

        // Ledger Transaction History
        await CashTransaction.create({
          toAccount: cashAccountId,
          amount: paymentAmount,
          transactionType: "customer_recovery",
          referenceId: customer,
          particulars: `Received from ${customerRecord?.name || "Customer"} - ${notes || "Payment"}`,
          date: date,
        });
      }
    } else if (type === "pay" && supplier) {
      // Hum ne Supplier ko paise diye hain -> Payable Balance minus karein
      const supplierRecord = await Supplier.findById(supplier);
      if (supplierRecord) {
        supplierRecord.currentBalance -= paymentAmount;
        await supplierRecord.save();
      }

      // 🔥 NAYA: Cash Account se paise MINUS karein
      if (cashAcc) {
        cashAcc.balance -= paymentAmount;
        await cashAcc.save();

        // Ledger Transaction History
        await CashTransaction.create({
          fromAccount: cashAccountId,
          amount: paymentAmount,
          transactionType: "supplier_payment",
          referenceId: supplier,
          particulars: `Paid to ${supplierRecord?.name || "Supplier"} - ${notes || "Payment"}`,
          date: date,
        });
      }
    }

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a payment (Owner Only)
// @route   PUT /api/payments/:id
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const newAmount = Number(req.body.amount);
    const oldAmount = payment.amount;
    const difference = newAmount - oldAmount; // Nayi aur purani payment ka farq

    // Payment update karein
    payment.amount = newAmount;
    payment.method = req.body.method;
    payment.date = req.body.date || payment.date;
    payment.notes = req.body.notes;

    await payment.save();

    // Balances ko reverse adjust karein
    if (payment.type === "receive" && payment.customer) {
      const customerRecord = await Customer.findById(payment.customer);
      if (customerRecord) {
        customerRecord.currentBalance -= difference;
        await customerRecord.save();
      }
    } else if (payment.type === "pay" && payment.supplier) {
      const supplierRecord = await Supplier.findById(payment.supplier);
      if (supplierRecord) {
        supplierRecord.currentBalance -= difference;
        await supplierRecord.save();
      }
    }

    // 🔥 NAYA: Update Cash Account Balance based on difference
    if (payment.cashAccountId) {
      const cashAcc = await CashAccount.findById(payment.cashAccountId);
      if (cashAcc) {
        if (payment.type === "receive") {
          cashAcc.balance += difference;
        } else if (payment.type === "pay") {
          cashAcc.balance -= difference;
        }
        await cashAcc.save();
      }
    }

    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a payment (Owner Only)
// @route   DELETE /api/payments/:id
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // Delete karne par balances ko wapis (Add) karein
    if (payment.type === "receive" && payment.customer) {
      const customerRecord = await Customer.findById(payment.customer);
      if (customerRecord) {
        customerRecord.currentBalance += payment.amount;
        await customerRecord.save();
      }
    } else if (payment.type === "pay" && payment.supplier) {
      const supplierRecord = await Supplier.findById(payment.supplier);
      if (supplierRecord) {
        supplierRecord.currentBalance += payment.amount;
        await supplierRecord.save();
      }
    }

    // 🔥 NAYA: Cash Account se bhi reverse karein
    if (payment.cashAccountId) {
      const cashAcc = await CashAccount.findById(payment.cashAccountId);
      if (cashAcc) {
        if (payment.type === "receive") {
          cashAcc.balance -= payment.amount; // Paisa wapis minus kar dia (Delete honay pe)
        } else if (payment.type === "pay") {
          cashAcc.balance += payment.amount; // Paisa wapis plus kar dia
        }
        await cashAcc.save();
      }
    }

    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: "Payment deleted and balances adjusted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPayments, createPayment, updatePayment, deletePayment };
