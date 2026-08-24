const Employee = require("../models/Employee");
const SalaryTransaction = require("../models/SalaryTransaction");

// 1. Get all employees
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Add new employee
const createEmployee = async (req, res) => {
  try {
    const { name, mobile, designation, monthlySalary } = req.body;
    const employee = await Employee.create({
      name,
      mobile: mobile || null, // 🔥 FIX: Khali string ki jagah null jayega taake duplicate error na aaye
      designation,
      monthlySalary,
    });
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 3. Update Employee (Edit)
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, designation, monthlySalary } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      id,
      {
        name,
        mobile: mobile || null, // 🔥 FIX: Yahan bhi null jayega
        designation,
        monthlySalary,
      },
      { new: true },
    );
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 4. Delete Employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    // Employee delete hone par uska khata bhi delete ho jaye
    await SalaryTransaction.deleteMany({ employee: id });

    res.json({ message: "Employee and related data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Add Transaction (Salary lagana ya Advance Dena)
const addTransaction = async (req, res) => {
  try {
    const { employeeId, amount, type, description, date } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    // Balance update logic
    if (type === "salary_added") {
      employee.currentBalance += Number(amount); // Plus (Humne dene hain)
    } else if (type === "payment_given") {
      employee.currentBalance -= Number(amount); // Minus (Humne de diye / Advance)
    }

    await employee.save();

    const transaction = await SalaryTransaction.create({
      employee: employeeId,
      amount,
      type,
      description,
      date: date || Date.now(),
    });

    res
      .status(201)
      .json({ message: "Transaction successful", transaction, employee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Get Employee Ledger (Khata History)
const getEmployeeLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    const transactions = await SalaryTransaction.find({ employee: id }).sort({
      date: -1,
    });

    res.json({ employee, transactions });
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
};
