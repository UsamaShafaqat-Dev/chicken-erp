const Employee = require("../models/Employee");
const SalaryTransaction = require("../models/SalaryTransaction");
const Expense = require("../models/Expense");
const Payment = require("../models/Payment"); // 🔥 NAYA: Payment table link kar diya

// Helper to fix 5 AM timezone bug
const getSafeUTC = (dateStr) => {
  return dateStr
    ? new Date(dateStr.split("T")[0] + "T12:00:00.000Z")
    : new Date();
};

const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createEmployee = async (req, res) => {
  try {
    const { name, mobile, designation, monthlySalary, openingBalance } =
      req.body;
    let initialBalance = Number(openingBalance) || 0;

    const employee = await Employee.create({
      name,
      mobile: mobile || null,
      designation,
      monthlySalary,
      currentBalance: initialBalance,
    });
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, designation, monthlySalary, openingBalance } =
      req.body;

    const employee = await Employee.findById(id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    employee.name = name;
    employee.mobile = mobile || null;
    employee.designation = designation;
    employee.monthlySalary = monthlySalary;

    if (openingBalance !== undefined && openingBalance !== "") {
      employee.currentBalance = Number(openingBalance);
    }

    await employee.save();
    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    await SalaryTransaction.deleteMany({ employee: id });
    res.json({ message: "Employee deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addTransaction = async (req, res) => {
  try {
    const { employeeId, amount, type, description, date } = req.body;
    const safeDate = getSafeUTC(date); // 🔥 Timezone fix applied

    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    if (type === "salary_added") {
      employee.currentBalance += Number(amount);
      await Expense.create({
        category: "Staff Salary",
        description: `${employee.name} - ${description || "Monthly Salary"}`,
        amount: Number(amount),
        paymentMethod: "cash",
        date: safeDate,
      });
    } else if (type === "payment_given") {
      employee.currentBalance -= Number(amount);
    }

    await employee.save();

    const transaction = await SalaryTransaction.create({
      employee: employeeId,
      amount,
      type,
      description,
      date: safeDate,
    });

    res
      .status(201)
      .json({ message: "Transaction successful", transaction, employee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔥 NAYA: Ab Payments page ki entries bhi Ledger mein aayengi
const getEmployeeLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    // Get direct salary transactions
    const salaryTxns = await SalaryTransaction.find({ employee: id }).lean();

    // Get payments made from the "Payments" page
    const payments = await Payment.find({ employee: id }).lean();

    const formattedSalaryTxns = salaryTxns.map((tx) => ({
      _id: tx._id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      date: tx.date,
      isFromPaymentPage: false,
    }));

    const formattedPayments = payments.map((p) => ({
      _id: p._id,
      type: "payment_given",
      amount: p.amount,
      description: p.notes
        ? `(Via Payments Page) ${p.notes}`
        : "(Via Payments Page) Advance/Salary",
      date: p.date,
      isFromPaymentPage: true, // Label to identify external payment
    }));

    // Combine and sort by date
    const combinedTransactions = [
      ...formattedSalaryTxns,
      ...formattedPayments,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ employee, transactions: combinedTransactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await SalaryTransaction.findById(id);
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    const employee = await Employee.findById(transaction.employee);
    if (employee) {
      if (transaction.type === "salary_added") {
        employee.currentBalance -= Number(transaction.amount);
      } else if (transaction.type === "payment_given") {
        employee.currentBalance += Number(transaction.amount);
      }
      await employee.save();
    }

    await SalaryTransaction.findByIdAndDelete(id);
    res.json({ message: "Transaction deleted and balance reversed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  addTransaction,
  getEmployeeLedger,
  deleteTransaction,
};
