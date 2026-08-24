const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["receive", "pay"],
      required: true, // 'receive' for Customers, 'pay' for Suppliers/Staff
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    // 🔥 NAYA: Employee (Staff) ka link add kiya
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    cashAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CashAccount",
      required: true,
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
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
