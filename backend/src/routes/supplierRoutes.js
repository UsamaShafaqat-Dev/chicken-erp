const express = require("express");
const router = express.Router();
const {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");
const { protect, ownerOnly } = require("../middlewares/authMiddleware");

router.route("/").get(protect, getSuppliers).post(protect, createSupplier);

router
  .route("/:id")
  .put(protect, ownerOnly, updateSupplier)
  .delete(protect, ownerOnly, deleteSupplier);

module.exports = router;
