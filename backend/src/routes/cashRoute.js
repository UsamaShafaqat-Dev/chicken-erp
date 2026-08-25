const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  createAccount,
  getAccounts,
  transferCash,
  getAccountLedger,
  updateAccount, // 🔥 NAYA
  deleteAccount, // 🔥 NAYA
} = require("../controllers/cashController");

router
  .route("/accounts")
  .post(protect, createAccount)
  .get(protect, getAccounts);

// 🔥 NAYA: Edit اور Delete کے روٹس
router
  .route("/accounts/:id")
  .put(protect, updateAccount)
  .delete(protect, deleteAccount);

router.post("/transfer", protect, transferCash);
router.get("/ledger/:id", protect, getAccountLedger);

module.exports = router;
