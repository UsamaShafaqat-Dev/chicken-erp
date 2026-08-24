const express = require("express");
const router = express.Router();
// 🔥 FIX: 'middleware' ki jagah 'middlewares' kar diya
const { protect } = require("../middlewares/authMiddleware");
const {
  getEmployees,
  createEmployee,
  addTransaction,
  getEmployeeLedger,
} = require("../controllers/employeeController");

router.route("/").get(protect, getEmployees).post(protect, createEmployee);
router.post("/transaction", protect, addTransaction);
router.get("/:id/ledger", protect, getEmployeeLedger);

module.exports = router;
