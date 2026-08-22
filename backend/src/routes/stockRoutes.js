const express = require("express");
const router = express.Router();
const { getStockSummary } = require("../controllers/stockController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect, getStockSummary);

module.exports = router;
