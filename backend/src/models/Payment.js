const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["receive", "pay"],
      required: true, // 'receive' for Customers, 'pay' for Suppliers
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    // 🔥 NAYA ADD KIYA: Cash Account ko link karne ke liye
    cashAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CashAccount",
      required: true, // Lazmi ho gya k payment kahan aayi ya kahan se gayi
    },
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: ["cash", "bank", "cheque"],
      default: "cash",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String, // Bank slip number, Cheque number etc.
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
