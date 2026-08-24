const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, default: "" }, // 🔥 FIX: Required khatam kar diya
    whatsapp: { type: String },
    area: { type: String, required: true },
    address: { type: String },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    notes: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Customer", customerSchema);
