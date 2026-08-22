const express = require("express");
const router = express.Router();
const {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");
const { protect, ownerOnly } = require("../middlewares/authMiddleware");

// Get aur Create koi bhi logged in user (Staff/Owner) kar sakta hai
router.route("/").get(protect, getCustomers).post(protect, createCustomer);

// Update aur Delete sirf Owner kar sakta hai
router
  .route("/:id")
  .put(protect, ownerOnly, updateCustomer)
  .delete(protect, ownerOnly, deleteCustomer);

module.exports = router;
