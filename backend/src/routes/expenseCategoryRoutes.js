const express = require("express");
const router = express.Router();
const ExpenseCategory = require("../models/ExpenseCategory");

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

module.exports = router;
