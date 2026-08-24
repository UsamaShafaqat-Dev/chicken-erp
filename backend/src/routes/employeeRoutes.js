const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  getEmployees,
  createEmployee,
  updateEmployee, // 🔥 NAYA
  deleteEmployee, // 🔥 NAYA
  addTransaction,
  getEmployeeLedger,
} = require("../controllers/employeeController");

// Get & Create
router.route("/").get(protect, getEmployees).post(protect, createEmployee);

// 🔥 NAYA: Edit & Delete
router
  .route("/:id")
  .put(protect, updateEmployee)
  .delete(protect, deleteEmployee);

// Transactions & Ledger
router.post("/transaction", protect, addTransaction);
router.get("/:id/ledger", protect, getEmployeeLedger);

module.exports = router;
