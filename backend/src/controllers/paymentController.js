const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Employee = require("../models/Employee");
const CashAccount = require("../models/CashAccount");
const CashTransaction = require("../models/CashTransaction");
const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");
const Expense = require("../models/Expense");

// Helper function to prevent timezone jumping (5 AM bug fix)
const getSafeUTC = (dateStr) => {
  return dateStr
    ? new Date(dateStr.split("T")[0] + "T12:00:00.000Z")
    : new Date();
};

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
      payeeType,
      expenseCategory,
    } = req.body;
    const paymentAmount = Number(amount);
    const safeDate = getSafeUTC(date);

    if (!cashAccountId)
      return res.status(400).json({ message: "Please select a Cash Account" });
    const cashAcc = await CashAccount.findById(cashAccountId);

    if (type === "pay" && payeeType === "expense" && expenseCategory) {
      const expenseDoc = await Expense.create({
        category: expenseCategory,
        description: notes || "Direct Expense from Payments",
        amount: paymentAmount,
        paymentMethod: method,
        date: safeDate,
      });

      const payment = await Payment.create({
        type,
        amount: paymentAmount,
        method,
        date: safeDate,
        notes: `[EXPENSE:${expenseDoc._id}] ${notes || ""}`,
        cashAccountId,
      });

      if (cashAcc) {
        cashAcc.balance -= paymentAmount;
        await cashAcc.save();
        await CashTransaction.create({
          fromAccount: cashAccountId,
          amount: paymentAmount,
          transactionType: "expense",
          particulars: `Expense: ${expenseCategory} - ${notes || ""}`,
          date: safeDate,
        });
      }
      return res.status(201).json(payment);
    }

    const payment = await Payment.create({
      type,
      customer,
      supplier,
      employee,
      amount: paymentAmount,
      method,
      date: safeDate,
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
          date: safeDate,
        });
      }
    } else if (type === "pay" && employee) {
      const empRecord = await Employee.findById(employee);
      if (empRecord) {
        if (empRecord.currentBalance !== undefined)
          empRecord.currentBalance -= paymentAmount;
        else if (empRecord.balance !== undefined)
          empRecord.balance -= paymentAmount;
        await empRecord.save();
      }
      if (cashAcc) {
        cashAcc.balance -= paymentAmount;
        await cashAcc.save();
        // 🔥 FIX: Added notes details explicitly for Salary Ledger
        await CashTransaction.create({
          fromAccount: cashAccountId,
          amount: paymentAmount,
          transactionType: "employee_salary",
          referenceId: employee,
          particulars: `Salary/Advance to ${empRecord?.name || "Employee"} - Details: ${notes || "None"}`,
          date: safeDate,
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
          date: safeDate,
        });
      }
    }

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const oldAmount = payment.amount;
    const newAmount = Number(req.body.amount);
    const safeDate = req.body.date ? getSafeUTC(req.body.date) : payment.date;

    // 🔥 FIX: 1. REVERT OLD BALANCES FIRST
    if (payment.type === "receive" && payment.customer) {
      await Customer.findByIdAndUpdate(payment.customer, {
        $inc: { currentBalance: oldAmount },
      });
    } else if (payment.type === "pay") {
      if (payment.supplier)
        await Supplier.findByIdAndUpdate(payment.supplier, {
          $inc: { currentBalance: oldAmount },
        });
      else if (payment.employee) {
        const oldEmp = await Employee.findById(payment.employee);
        if (oldEmp) {
          if (oldEmp.currentBalance !== undefined)
            oldEmp.currentBalance += oldAmount;
          if (oldEmp.balance !== undefined) oldEmp.balance += oldAmount;
          await oldEmp.save();
        }
      }
    }
    if (payment.cashAccountId) {
      const revertAmount = payment.type === "receive" ? -oldAmount : oldAmount;
      await CashAccount.findByIdAndUpdate(payment.cashAccountId, {
        $inc: { balance: revertAmount },
      });
    }

    // 🔥 FIX: 2. UPDATE PAYMENT DOCUMENT WITH NEW VALUES (INCLUDING NAME/PARTY CHANGE)
    payment.amount = newAmount;
    payment.method = req.body.method;
    payment.date = safeDate;

    if (req.body.customer !== undefined)
      payment.customer = req.body.customer || null;
    if (req.body.supplier !== undefined)
      payment.supplier = req.body.supplier || null;
    if (req.body.employee !== undefined)
      payment.employee = req.body.employee || null;
    if (req.body.cashAccountId !== undefined)
      payment.cashAccountId = req.body.cashAccountId;

    const isExpense = payment.notes && payment.notes.startsWith("[EXPENSE:");
    if (isExpense) {
      const expId = payment.notes.split("]")[0].replace("[EXPENSE:", "");
      payment.notes = `[EXPENSE:${expId}] ${req.body.notes || ""}`;
      await Expense.findByIdAndUpdate(expId, {
        amount: newAmount,
        description: req.body.notes || "Direct Expense from Payments",
        paymentMethod: req.body.method,
        date: payment.date,
      });
    } else {
      payment.notes = req.body.notes;
    }

    await payment.save();

    // 🔥 FIX: 3. APPLY NEW BALANCES TO THE NEW/UPDATED PARTY
    let partyNameForLedger = "Party";
    if (payment.type === "receive" && payment.customer) {
      const newCust = await Customer.findByIdAndUpdate(
        payment.customer,
        { $inc: { currentBalance: -newAmount } },
        { new: true },
      );
      if (newCust) partyNameForLedger = newCust.name;
    } else if (payment.type === "pay") {
      if (payment.supplier) {
        const newSupp = await Supplier.findByIdAndUpdate(
          payment.supplier,
          { $inc: { currentBalance: -newAmount } },
          { new: true },
        );
        if (newSupp) partyNameForLedger = newSupp.name;
      } else if (payment.employee) {
        const newEmp = await Employee.findById(payment.employee);
        if (newEmp) {
          if (newEmp.currentBalance !== undefined)
            newEmp.currentBalance -= newAmount;
          if (newEmp.balance !== undefined) newEmp.balance -= newAmount;
          await newEmp.save();
          partyNameForLedger = newEmp.name;
        }
      }
    }
    if (payment.cashAccountId) {
      const applyAmount = payment.type === "receive" ? newAmount : -newAmount;
      await CashAccount.findByIdAndUpdate(payment.cashAccountId, {
        $inc: { balance: applyAmount },
      });
    }

    // 🔥 FIX: 4. UPDATE CASH TRANSACTION DETAILS
    let updatedParticulars = `${payment.type === "receive" ? "Received from" : "Paid to"} ${partyNameForLedger} - ${req.body.notes || "Updated"}`;
    if (payment.employee)
      updatedParticulars = `Salary/Advance to ${partyNameForLedger} - Details: ${req.body.notes || "Updated"}`;

    await CashTransaction.updateMany(
      {
        amount: oldAmount,
        $or: [
          { fromAccount: payment.cashAccountId },
          { toAccount: payment.cashAccountId },
        ],
      },
      {
        $set: {
          amount: newAmount,
          date: payment.date,
          particulars: updatedParticulars,
          referenceId: payment.customer || payment.supplier || payment.employee,
        },
      },
    );

    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    await CashTransaction.deleteMany({
      amount: payment.amount,
      $or: [
        { fromAccount: payment.cashAccountId },
        { toAccount: payment.cashAccountId },
      ],
    });

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
