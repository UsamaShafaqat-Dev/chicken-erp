const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  addTransaction,
  getEmployeeLedger,
  deleteTransaction, // 🔥 NAYA
} = require("../controllers/employeeController");

// Get & Create
router.route("/").get(protect, getEmployees).post(protect, createEmployee);

// Transactions
router.post("/transaction", protect, addTransaction);
router.delete("/transaction/:id", protect, deleteTransaction); // 🔥 NAYA: Single entry delete ka route

// Edit, Delete & Ledger
router
  .route("/:id")
  .put(protect, updateEmployee)
  .delete(protect, deleteEmployee);

router.get("/:id/ledger", protect, getEmployeeLedger);

module.exports = router;
