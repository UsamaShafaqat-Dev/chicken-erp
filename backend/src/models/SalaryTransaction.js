const mongoose = require("mongoose");

const salaryTransactionSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["salary_added", "payment_given"],
      required: true,
    },
    // salary_added = Khate mein paise jama (Dene hain)
    // payment_given = Advance ya Salary de di (Khate se cut gaye)
    description: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SalaryTransaction", salaryTransactionSchema);
