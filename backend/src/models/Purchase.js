const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Supplier",
    },
    weight: { type: Number, required: true }, // KG mein
    rate: { type: Number, required: true }, // Per KG rate
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "credit"],
      default: "cash",
    },
    date: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Purchase", purchaseSchema);
