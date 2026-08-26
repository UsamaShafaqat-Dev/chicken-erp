const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  createAccount,
  getAccounts,
  transferCash,
  getAccountLedger,
  updateAccount,
  deleteAccount,
  deleteTransaction, 
} = require("../controllers/cashController");

router
  .route("/accounts")
  .post(protect, createAccount)
  .get(protect, getAccounts);

router
  .route("/accounts/:id")
  .put(protect, updateAccount)
  .delete(protect, deleteAccount);

router.post("/transfer", protect, transferCash);
router.get("/ledger/:id", protect, getAccountLedger);

// 🔥 NAYA: Transaction delete route
router.delete("/transaction/:id", protect, deleteTransaction);

module.exports = router;
