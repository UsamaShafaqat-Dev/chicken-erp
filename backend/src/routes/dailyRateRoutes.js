const express = require("express");
const {
  getRateByDate,
  saveRate,
} = require("../controllers/dailyRateController");
const router = express.Router();

router.get("/:date", getRateByDate);
router.post("/", saveRate);

module.exports = router;
