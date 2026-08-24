// backend/models/ExpenseCategory.js
const mongoose = require("mongoose");

const expenseCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Ek naam ki do category na hon
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ExpenseCategory", expenseCategorySchema);
