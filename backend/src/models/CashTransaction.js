const mongoose = require("mongoose");

const cashTransactionSchema = new mongoose.Schema(
  {
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CashAccount",
      default: null,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CashAccount",
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionType: {
      type: String,
      enum: [
        "customer_recovery",
        "supplier_payment",
        "internal_transfer",
        "expense",
        "employee_salary", // 🔥 YEH WALA NAAM LAZMI HONA CHAHIYE
      ],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    particulars: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CashTransaction", cashTransactionSchema);
