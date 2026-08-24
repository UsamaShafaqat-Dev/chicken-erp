const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String },
    designation: { type: String, default: "Staff" },
    monthlySalary: { type: Number, required: true, default: 0 },
    // currentBalance: Agar Plus (+) mein hai toh matlab humne salary deni hai. Agar Minus (-) mein hai toh matlab usne Advance liya hua hai.
    currentBalance: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Employee", employeeSchema);
