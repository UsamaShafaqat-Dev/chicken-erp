const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const Payment = require("../models/Payment");

// @desc    Get Ledger Statement for a Party
// @route   GET /api/ledgers
const getLedger = async (req, res) => {
  try {
    // 🔥 FIX: startDate aur endDate ko query se nikal liya
    const { type, id, startDate, endDate } = req.query;

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
        particulars: "Account Opening Balance",
        debit: runningBalance > 0 ? runningBalance : 0,
        credit: runningBalance < 0 ? Math.abs(runningBalance) : 0,
        balance: runningBalance,
        isOpening: true,
      });

      // 1. Get Sales
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

      // 2. Get Payments
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
        particulars: "Account Opening Balance",
        debit: runningBalance < 0 ? Math.abs(runningBalance) : 0,
        credit: runningBalance > 0 ? runningBalance : 0,
        balance: runningBalance,
        isOpening: true,
      });

      // 1. Get Purchases
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

      // 2. Get Payments
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

    // Sab se pehle shuru se le kar end tak saari calculation karein
    let allTransactionsCalculated = [];
    let currentBal = openingTx.balance;

    otherTxs.forEach((tx) => {
      if (type === "customer") {
        currentBal = currentBal + tx.debit - tx.credit;
      } else {
        currentBal = currentBal + tx.credit - tx.debit;
      }
      tx.balance = currentBal;
      allTransactionsCalculated.push(tx);
    });

    // 🔥 FIX: DATE FILTERING LOGIC
    let finalTransactions = [];

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0); // Agar start date nahi, to shuru se
      start.setHours(0, 0, 0, 0);

      const end = endDate ? new Date(endDate) : new Date("2100-01-01"); // Agar end date nahi, to hamesha tak
      end.setHours(23, 59, 59, 999);

      // 1. Pichla Hisaab (Brought Forward) dhundhein
      let broughtForwardBalance = openingTx.balance;
      for (let i = 0; i < allTransactionsCalculated.length; i++) {
        let txDate = new Date(allTransactionsCalculated[i].date);
        if (txDate < start) {
          broughtForwardBalance = allTransactionsCalculated[i].balance;
        } else {
          break; // Filter wali dates shuru ho gayi hain
        }
      }

      // Brought Forward entry set karein
      let bfDebit = 0;
      let bfCredit = 0;
      if (type === "customer") {
        if (broughtForwardBalance > 0) bfDebit = broughtForwardBalance;
        else if (broughtForwardBalance < 0)
          bfCredit = Math.abs(broughtForwardBalance);
      } else {
        if (broughtForwardBalance > 0) bfCredit = broughtForwardBalance;
        else if (broughtForwardBalance < 0)
          bfDebit = Math.abs(broughtForwardBalance);
      }

      finalTransactions.push({
        date: startDate ? new Date(startDate) : openingTx.date,
        particulars: "Brought Forward (Pichla Hisaab)",
        debit: bfDebit,
        credit: bfCredit,
        balance: broughtForwardBalance,
        isOpening: true,
      });

      // 2. Sirf range wali transactions filter karein
      const rangeTxs = allTransactionsCalculated.filter((tx) => {
        let txDate = new Date(tx.date);
        return txDate >= start && txDate <= end;
      });

      finalTransactions = [...finalTransactions, ...rangeTxs];
    } else {
      // Agar koi date filter nahi laga to poora ledger dikhao
      finalTransactions = [openingTx, ...allTransactionsCalculated];
    }

    res.json({
      party: partyInfo,
      transactions: finalTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLedger };
