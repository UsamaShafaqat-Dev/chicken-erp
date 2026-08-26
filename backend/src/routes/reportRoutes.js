const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { getReports, resetData } = require("../controllers/reportController"); // 🔥 NAYA: resetData import kiya

router.get("/", protect, getReports);
router.delete("/reset", protect, resetData); // 🔥 NAYA: Reset Route add kiya

module.exports = router;
