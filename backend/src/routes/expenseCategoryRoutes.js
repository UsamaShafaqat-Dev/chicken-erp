const express = require("express");
const router = express.Router();
const ExpenseCategory = require("../models/ExpenseCategory");
const Expense = require("../models/Expense"); // 🔥 Added to delete related expenses

// Sab categories lana
router.get("/", async (req, res) => {
  try {
    const categories = await ExpenseCategory.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// Nayi category add karna
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const existing = await ExpenseCategory.findOne({ name });
    if (existing)
      return res.status(400).json({ message: "Category already exists" });

    const newCategory = new ExpenseCategory({ name });
    await newCategory.save();

    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔥 NAYA: Edit Category
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const category = await ExpenseCategory.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    // Update the category name in the category collection
    const oldName = category.name;
    category.name = name;
    await category.save();

    // Also update all expenses that used the old category name
    await Expense.updateMany({ category: oldName }, { category: name });

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔥 NAYA: Delete Category
router.delete("/:id", async (req, res) => {
  try {
    const category = await ExpenseCategory.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    // Delete all expenses related to this category first
    await Expense.deleteMany({ category: category.name });

    // Delete the category itself
    await ExpenseCategory.findByIdAndDelete(req.params.id);

    res.json({ message: "Category and all related expenses deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
