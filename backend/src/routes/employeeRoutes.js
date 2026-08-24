const express = require("express");
const router = express.createRouter ? express.createRouter() : express.Router();
const { protect } = require("../middleware/authMiddleware");
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
