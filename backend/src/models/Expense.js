const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true, // Jaise: 'Salary', 'Utility Bill', 'Petrol', 'Food', 'Other'
    },
    description: {
      type: String,
      required: true, // Kharchay ki detail
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank"],
      default: "cash",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Expense", expenseSchema);
