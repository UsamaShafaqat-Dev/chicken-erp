const express = require("express");
const router = express.Router();
const {
  createAccount,
  getAccounts,
  transferCash,
  getAccountLedger,
} = require("../controllers/cashController");

// Authentication middleware اگر آپ یوز کر رہے ہیں تو وہ لگا لیں (مثلاً protect)
router.post("/accounts", createAccount);
router.get("/accounts", getAccounts);
router.post("/transfer", transferCash);
router.get("/ledger/:id", getAccountLedger);

module.exports = router;
