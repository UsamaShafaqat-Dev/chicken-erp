const express = require("express");
const router = express.Router();
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");
const { protect, ownerOnly } = require("../middlewares/authMiddleware");

router.route("/").get(protect, getExpenses).post(protect, createExpense);

router
  .route("/:id")
  .put(protect, ownerOnly, updateExpense)
  .delete(protect, ownerOnly, deleteExpense);

module.exports = router;
