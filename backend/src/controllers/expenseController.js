const Expense = require("../models/Expense");
const ExpenseCategory = require("../models/ExpenseCategory"); // Category Model add kiya gaya hai backend mein

// @desc    Get all expenses
// @route   GET /api/expenses
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an expense
// @route   POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const { category, description, amount, paymentMethod, date } = req.body;

    const expense = await Expense.create({
      category,
      description,
      amount: Number(amount),
      paymentMethod,
      date: date || Date.now(),
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an expense (Owner Only)
// @route   PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an expense (Owner Only)
// @route   DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    res.json({ message: "Expense removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔥 NAYA: Expense Category banate waqt Opening Balance dalne ki logic
const createCategory = async (req, res) => {
  try {
    const { name, openingBalance } = req.body;

    // Save the category
    const newCat = await ExpenseCategory.create({ name });

    // Agar opening balance bheja gaya hai, to usey ek 'Expense' ke tor par add kar dein
    if (openingBalance && Number(openingBalance) > 0) {
      await Expense.create({
        category: name,
        description: "Opening Balance / Previous Record",
        amount: Number(openingBalance),
        paymentMethod: "cash",
        date: Date.now(),
      });
    }

    res.status(201).json(newCat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  createCategory,
};
