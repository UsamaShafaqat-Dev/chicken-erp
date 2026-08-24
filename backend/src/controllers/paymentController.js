const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const CashAccount = require("../models/CashAccount");
const CashTransaction = require("../models/CashTransaction");
const Purchase = require("../models/Purchase"); // 🔥 NAYA: Purchase Model Link Kiya
const Sale = require("../models/Sale"); // 🔥 NAYA: Sale Model Link Kiya

// @desc    Get all payments
// @route   GET /api/payments
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("customer", "name mobile")
      .populate("supplier", "name mobile")
      .populate("cashAccountId", "name")
      .sort({ date: -1, createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new payment (With Auto-Allocate to Bills)
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
      cashAccountId,
    });

    const cashAcc = await CashAccount.findById(cashAccountId);

    // 2. Balances Update Karein AUR Puranay Bills ko Auto-Paid Karein
    if (type === "receive" && customer) {
      // A) Customer ka main balance minus karein
      const customerRecord = await Customer.findById(customer);
      if (customerRecord) {
        customerRecord.currentBalance -= paymentAmount;
        await customerRecord.save();
      }

      // B) Cash Book update karein
      if (cashAcc) {
        cashAcc.balance += paymentAmount;
        await cashAcc.save();

        await CashTransaction.create({
          toAccount: cashAccountId,
          amount: paymentAmount,
          transactionType: "customer_recovery",
          referenceId: customer,
          particulars: `Received from ${customerRecord?.name || "Customer"} - ${notes || "Payment"}`,
          date: date,
        });
      }

      // 🔥 C) NAYA JADOO: Customer ke purane Sales Bills ko auto-paid karein (FIFO)
      let remainingAmount = paymentAmount;
      // Sirf wo bills uthao jin mein udhaar baqi hai, sab se purana pehle aaye
      const pendingSales = await Sale.find({
        customer: customer,
        balanceDue: { $gt: 0 },
      }).sort({ date: 1 });

      for (let sale of pendingSales) {
        if (remainingAmount <= 0) break; // Agar diye hue paise khatam ho gaye toh ruk jao

        if (remainingAmount >= sale.balanceDue) {
          // Bill poora clear ho gaya
          remainingAmount -= sale.balanceDue;
          sale.paidAmount += sale.balanceDue;
          sale.balanceDue = 0;
        } else {
          // Bill thora sa clear hua
          sale.paidAmount += remainingAmount;
          sale.balanceDue -= remainingAmount;
          remainingAmount = 0;
        }
        await sale.save();
      }
    } else if (type === "pay" && supplier) {
      // A) Supplier ka main balance minus karein
      const supplierRecord = await Supplier.findById(supplier);
      if (supplierRecord) {
        supplierRecord.currentBalance -= paymentAmount;
        await supplierRecord.save();
      }

      // B) Cash Book update karein
      if (cashAcc) {
        cashAcc.balance -= paymentAmount;
        await cashAcc.save();

        await CashTransaction.create({
          fromAccount: cashAccountId,
          amount: paymentAmount,
          transactionType: "supplier_payment",
          referenceId: supplier,
          particulars: `Paid to ${supplierRecord?.name || "Supplier"} - ${notes || "Payment"}`,
          date: date,
        });
      }

      // 🔥 C) NAYA JADOO: Supplier ke purane Purchase Bills ko auto-paid karein (FIFO)
      let remainingAmount = paymentAmount;
      // Sirf wo purchase uthao jin mein udhaar baqi hai, sab se purana pehle aaye
      const pendingPurchases = await Purchase.find({
        supplier: supplier,
        balanceDue: { $gt: 0 },
      }).sort({ date: 1 });

      for (let purchase of pendingPurchases) {
        if (remainingAmount <= 0) break; // Agar diye hue paise khatam ho gaye toh ruk jao

        if (remainingAmount >= purchase.balanceDue) {
          // Bill poora clear ho gaya
          remainingAmount -= purchase.balanceDue;
          purchase.paidAmount += purchase.balanceDue;
          purchase.balanceDue = 0;
        } else {
          // Bill thora sa clear hua
          purchase.paidAmount += remainingAmount;
          purchase.balanceDue -= remainingAmount;
          remainingAmount = 0;
        }
        await purchase.save();
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
    const difference = newAmount - oldAmount;

    payment.amount = newAmount;
    payment.method = req.body.method;
    payment.date = req.body.date || payment.date;
    payment.notes = req.body.notes;

    await payment.save();

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

    if (payment.cashAccountId) {
      const cashAcc = await CashAccount.findById(payment.cashAccountId);
      if (cashAcc) {
        if (payment.type === "receive") {
          cashAcc.balance -= payment.amount;
        } else if (payment.type === "pay") {
          cashAcc.balance += payment.amount;
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
