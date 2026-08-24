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
} = require("../controllers/employeeController");

// Get & Create
router.route("/").get(protect, getEmployees).post(protect, createEmployee);

// 🔥 FIX: /transaction ko /:id se UPAR rakhna zaroori hai!
router.post("/transaction", protect, addTransaction);

// Edit & Delete
router
  .route("/:id")
  .put(protect, updateEmployee)
  .delete(protect, deleteEmployee);

// Ledger
router.get("/:id/ledger", protect, getEmployeeLedger);

module.exports = router;
