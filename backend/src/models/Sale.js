const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    weight: { type: Number, required: true }, // KG mein (Yeh lazmi hai)
    rate: { type: Number, default: 0 }, // Per KG rate (Ab required nahi)
    totalAmount: { type: Number, default: 0 }, // (Ab required nahi)
    paidAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "credit"],
      default: "cash",
    },
    date: { type: Date, default: Date.now },
    notes: { type: String }, // Gaari ka number ya koi aur detail
  },
  { timestamps: true },
);

module.exports = mongoose.model("Sale", saleSchema);
