const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const Payment = require("../models/Payment");

// @desc    Get Ledger Statement for a Party
// @route   GET /api/ledgers
const getLedger = async (req, res) => {
  try {
    const { type, id } = req.query; // type: 'customer' or 'supplier'

    if (!type || !id) {
      return res
        .status(400)
        .json({ message: "Type and Party ID are required" });
    }

    let partyInfo;
    let transactions = [];
    let runningBalance = 0;

    if (type === "customer") {
      partyInfo = await Customer.findById(id);
      if (!partyInfo)
        return res.status(404).json({ message: "Customer not found" });

      runningBalance = partyInfo.openingBalance || 0;
      transactions.push({
        date: partyInfo.createdAt,
        particulars: "Opening Balance",
        debit: runningBalance > 0 ? runningBalance : 0,
        credit: runningBalance < 0 ? Math.abs(runningBalance) : 0,
        balance: runningBalance,
        isOpening: true,
      });

      // 1. Get Sales (Customer ne udhaar liya -> Debit)
      const sales = await Sale.find({ customer: id });
      sales.forEach((sale) => {
        transactions.push({
          date: sale.date,
          particulars: `Sale - Weight: ${sale.weight}KG @ Rs.${sale.rate} (Bill/Note: ${sale.notes || "N/A"})`,
          debit: sale.totalAmount,
          credit: 0,
          type: "sale",
        });
      });

      // 2. Get Payments (Customer ne paise diye -> Credit)
      const payments = await Payment.find({ customer: id, type: "receive" });
      payments.forEach((payment) => {
        transactions.push({
          date: payment.date,
          particulars: `Payment Received - ${payment.method} (Slip/Note: ${payment.notes || "N/A"})`,
          debit: 0,
          credit: payment.amount,
          type: "payment",
        });
      });
    } else if (type === "supplier") {
      partyInfo = await Supplier.findById(id);
      if (!partyInfo)
        return res.status(404).json({ message: "Supplier not found" });

      runningBalance = partyInfo.openingBalance || 0;
      transactions.push({
        date: partyInfo.createdAt,
        particulars: "Opening Balance",
        debit: runningBalance < 0 ? Math.abs(runningBalance) : 0,
        credit: runningBalance > 0 ? runningBalance : 0,
        balance: runningBalance,
        isOpening: true,
      });

      // 1. Get Purchases (Hum ne udhaar liya -> Credit)
      const purchases = await Purchase.find({ supplier: id });
      purchases.forEach((purchase) => {
        transactions.push({
          date: purchase.date,
          particulars: `Purchase - Weight: ${purchase.weight}KG @ Rs.${purchase.rate} (Bill/Note: ${purchase.notes || "N/A"})`,
          debit: 0,
          credit: purchase.totalAmount,
          type: "purchase",
        });
      });

      // 2. Get Payments (Hum ne paise diye -> Debit)
      const payments = await Payment.find({ supplier: id, type: "pay" });
      payments.forEach((payment) => {
        transactions.push({
          date: payment.date,
          particulars: `Payment Sent - ${payment.method} (Slip/Note: ${payment.notes || "N/A"})`,
          debit: payment.amount,
          credit: 0,
          type: "payment",
        });
      });
    }

    // Transactions ko Date ke hisaab se sort karein
    const openingTx = transactions.find((t) => t.isOpening);
    const otherTxs = transactions.filter((t) => !t.isOpening);
    otherTxs.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Running Balance Calculate karein
    let finalTransactions = [openingTx];
    let currentBal = openingTx.balance;

    otherTxs.forEach((tx) => {
      if (type === "customer") {
        currentBal = currentBal + tx.debit - tx.credit; // Customer: Debit(+) Credit(-)
      } else {
        currentBal = currentBal + tx.credit - tx.debit; // Supplier: Credit(+) Debit(-)
      }
      tx.balance = currentBal;
      finalTransactions.push(tx);
    });

    res.json({
      party: partyInfo,
      transactions: finalTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLedger };
