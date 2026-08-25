const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Employee = require("../models/Employee");
const CashAccount = require("../models/CashAccount");
const CashTransaction = require("../models/CashTransaction");
const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");
const Expense = require("../models/Expense"); // 🔥 NAYA: Expense model link kiya

// @desc    Get all payments
// @route   GET /api/payments
const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("customer", "name mobile")
      .populate("supplier", "name mobile")
      .populate("employee", "name mobile")
      .populate("cashAccountId", "name")
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
      employee,
      amount,
      method,
      date,
      notes,
      cashAccountId,
      payeeType, // 🔥 NAYA
      expenseCategory, // 🔥 NAYA
    } = req.body;
    const paymentAmount = Number(amount);

    if (!cashAccountId) {
      return res.status(400).json({ message: "Please select a Cash Account" });
    }

    const cashAcc = await CashAccount.findById(cashAccountId);

    // 🔥 NAYA: Agar Payment 'Expense' ke liye hai (Master Voucher Logic)
    if (type === "pay" && payeeType === "expense" && expenseCategory) {
      // 1. Expense create karein
      const expenseDoc = await Expense.create({
        category: expenseCategory,
        description: notes || "Direct Expense from Payments",
        amount: paymentAmount,
        paymentMethod: method,
        date: date || Date.now(),
      });

      // 2. Payment create karein (Expense ki ID notes me chhupa denge taake baad me delete ho sake)
      const payment = await Payment.create({
        type,
        amount: paymentAmount,
        method,
        date,
        notes: `[EXPENSE:${expenseDoc._id}] ${notes || ""}`,
        cashAccountId,
      });

      // 3. Cash minus karein aur History banayen
      if (cashAcc) {
        cashAcc.balance -= paymentAmount;
        await cashAcc.save();
        await CashTransaction.create({
          fromAccount: cashAccountId,
          amount: paymentAmount,
          transactionType: "expense",
          particulars: `Expense: ${expenseCategory} - ${notes || ""}`,
          date: date || Date.now(),
        });
      }
      return res.status(201).json(payment);
    }

    // --- BAKI PURANA LOGIC (Customer, Supplier, Employee) ---
    const payment = await Payment.create({
      type,
      customer,
      supplier,
      employee,
      amount: paymentAmount,
      method,
      date,
      notes,
      cashAccountId,
    });

    if (type === "receive" && customer) {
      const customerRecord = await Customer.findById(customer);
      if (customerRecord) {
        customerRecord.currentBalance -= paymentAmount;
        await customerRecord.save();
      }

      if (cashAcc) {
        cashAcc.balance += paymentAmount;
        await cashAcc.save();

        await CashTransaction.create({
          toAccount: cashAccountId,
          amount: paymentAmount,
          transactionType: "customer_recovery",
          referenceId: customer,
          particulars: `Received from ${customerRecord?.name || "Customer"} - ${notes || "Payment"}`,
          date: date || Date.now(),
        });
      }

      let remainingAmount = paymentAmount;
      const pendingSales = await Sale.find({
        customer: customer,
        balanceDue: { $gt: 0 },
      }).sort({ date: 1 });

      for (let sale of pendingSales) {
        if (remainingAmount <= 0) break;
        if (remainingAmount >= sale.balanceDue) {
          remainingAmount -= sale.balanceDue;
          sale.paidAmount += sale.balanceDue;
          sale.balanceDue = 0;
        } else {
          sale.paidAmount += remainingAmount;
          sale.balanceDue -= remainingAmount;
          remainingAmount = 0;
        }
        await sale.save();
      }
    } else if (type === "pay" && employee) {
      const empRecord = await Employee.findById(employee);
      if (empRecord) {
        if (empRecord.currentBalance !== undefined) {
          empRecord.currentBalance -= paymentAmount;
        } else if (empRecord.balance !== undefined) {
          empRecord.balance -= paymentAmount;
        }
        await empRecord.save();
      }

      if (cashAcc) {
        cashAcc.balance -= paymentAmount;
        await cashAcc.save();

        await CashTransaction.create({
          fromAccount: cashAccountId,
          amount: paymentAmount,
          transactionType: "employee_salary",
          referenceId: employee,
          particulars: `Salary/Advance: ${empRecord?.name || "Employee"} - ${notes || ""}`,
          date: date || Date.now(),
        });
      }
    } else if (type === "pay" && supplier) {
      const supplierRecord = await Supplier.findById(supplier);
      if (supplierRecord) {
        supplierRecord.currentBalance -= paymentAmount;
        await supplierRecord.save();
      }

      if (cashAcc) {
        cashAcc.balance -= paymentAmount;
        await cashAcc.save();

        await CashTransaction.create({
          fromAccount: cashAccountId,
          amount: paymentAmount,
          transactionType: "supplier_payment",
          referenceId: supplier,
          particulars: `Paid to ${supplierRecord?.name || "Supplier"} - ${notes || "Payment"}`,
          date: date || Date.now(),
        });
      }

      let remainingAmount = paymentAmount;
      const pendingPurchases = await Purchase.find({
        supplier: supplier,
        balanceDue: { $gt: 0 },
      }).sort({ date: 1 });

      for (let purchase of pendingPurchases) {
        if (remainingAmount <= 0) break;
        if (remainingAmount >= purchase.balanceDue) {
          remainingAmount -= purchase.balanceDue;
          purchase.paidAmount += purchase.balanceDue;
          purchase.balanceDue = 0;
        } else {
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

// @desc    Update a payment
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

    const isExpense = payment.notes && payment.notes.startsWith("[EXPENSE:");
    if (isExpense) {
      const expId = payment.notes.split("]")[0].replace("[EXPENSE:", "");
      payment.notes = `[EXPENSE:${expId}] ${req.body.notes || ""}`;

      await Expense.findByIdAndUpdate(expId, {
        amount: newAmount,
        description: req.body.notes || "Direct Expense from Payments",
        paymentMethod: req.body.method,
        date: req.body.date || payment.date,
      });
    } else {
      payment.notes = req.body.notes;
    }

    await payment.save();

    // 🔥 FIX: CashTransaction History ko bhi update karo!
    await CashTransaction.updateMany(
      {
        amount: oldAmount,
        $or: [
          { fromAccount: payment.cashAccountId },
          { toAccount: payment.cashAccountId },
        ],
      },
      { $set: { amount: newAmount, date: payment.date } },
    );

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
    } else if (payment.type === "pay" && payment.employee) {
      const empRecord = await Employee.findById(payment.employee);
      if (empRecord) {
        if (empRecord.currentBalance !== undefined)
          empRecord.currentBalance -= difference;
        else if (empRecord.balance !== undefined)
          empRecord.balance -= difference;
        await empRecord.save();
      }
    }

    if (payment.cashAccountId) {
      const cashAcc = await CashAccount.findById(payment.cashAccountId);
      if (cashAcc) {
        if (payment.type === "receive") cashAcc.balance += difference;
        else if (payment.type === "pay") cashAcc.balance -= difference;
        await cashAcc.save();
      }
    }

    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // 🔥 FIX GHOST HISTORY: Khate me se original entry ko dhoond kar delete karo
    await CashTransaction.deleteMany({
      amount: payment.amount,
      $or: [
        { fromAccount: payment.cashAccountId },
        { toAccount: payment.cashAccountId },
      ],
    });

    // 🔥 Agar Expense tha, to usko Expense db se bhi ura do
    if (payment.notes && payment.notes.startsWith("[EXPENSE:")) {
      const expId = payment.notes.split("]")[0].replace("[EXPENSE:", "");
      await Expense.findByIdAndDelete(expId);
    } else if (payment.type === "receive" && payment.customer) {
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
    } else if (payment.type === "pay" && payment.employee) {
      const empRecord = await Employee.findById(payment.employee);
      if (empRecord) {
        if (empRecord.currentBalance !== undefined)
          empRecord.currentBalance += payment.amount;
        else if (empRecord.balance !== undefined)
          empRecord.balance += payment.amount;
        await empRecord.save();
      }
    }

    if (payment.cashAccountId) {
      const cashAcc = await CashAccount.findById(payment.cashAccountId);
      if (cashAcc) {
        if (payment.type === "receive") cashAcc.balance -= payment.amount;
        else if (payment.type === "pay") cashAcc.balance += payment.amount;
        await cashAcc.save();
      }
    }

    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: "Payment and associated history completely deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPayments, createPayment, updatePayment, deletePayment };
