const mongoose = require("mongoose");

const cashTransactionSchema = new mongoose.Schema(
  {
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CashAccount",
      default: null,
    }, // پیسے کہاں سے آئے؟ (اگر کسٹمر نے دیے تو یہ null ہوگا)
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CashAccount",
      default: null,
    }, // پیسے کہاں گئے؟ (اگر بروکر کو دیے تو یہ null ہوگا)
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
      ],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId, // Customer ID, Supplier ID, یا Payment ID کا حوالہ
    },
    particulars: {
      type: String,
      required: true,
    }, // تفصیل، مثلاً: "Ali transferred cash to Rana Shabbir"
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CashTransaction", cashTransactionSchema);
