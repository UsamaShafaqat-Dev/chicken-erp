const express = require("express");
const router = express.Router();
const {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
} = require("../controllers/paymentController");
const { protect, ownerOnly } = require("../middlewares/authMiddleware");

router.route("/").get(protect, getPayments).post(protect, createPayment);

router
  .route("/:id")
  .put(protect, ownerOnly, updatePayment)
  .delete(protect, ownerOnly, deletePayment);

module.exports = router;
