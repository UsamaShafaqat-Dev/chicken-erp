const express = require("express");
const router = express.Router();
const {
  getPurchases,
  createPurchase,
  deletePurchase,
  updatePurchase,
} = require("../controllers/purchaseController");
const { protect, ownerOnly } = require("../middlewares/authMiddleware");

router.route("/").get(protect, getPurchases).post(protect, createPurchase);

router
  .route("/:id")
  .put(protect, ownerOnly, updatePurchase) // Edit Route Add ho gaya
  .delete(protect, ownerOnly, deletePurchase);

module.exports = router;
