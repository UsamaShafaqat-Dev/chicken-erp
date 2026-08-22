const express = require("express");
const router = express.Router();
const {
  getSales,
  createSale,
  updateSale,
  deleteSale,
} = require("../controllers/saleController");
const { protect, ownerOnly } = require("../middlewares/authMiddleware");

router.route("/").get(protect, getSales).post(protect, createSale);

router
  .route("/:id")
  .put(protect, ownerOnly, updateSale)
  .delete(protect, ownerOnly, deleteSale);

module.exports = router;
