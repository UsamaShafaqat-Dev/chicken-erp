const mongoose = require("mongoose");

const dailyRateSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true },
    bahawalpurRate: { type: Number, default: 0 },
    supplyRate: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DailyRate", dailyRateSchema);
