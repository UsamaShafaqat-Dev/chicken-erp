const express = require("express");
const router = express.Router();
const {
  getUsers,
  createUser,
  deleteUser,
  updateUserProfile,
} = require("../controllers/userController");
const { protect, ownerOnly } = require("../middlewares/authMiddleware");

// 🔥 NEW: Profile update route
router.route("/profile").put(protect, updateUserProfile);

router
  .route("/")
  .get(protect, ownerOnly, getUsers)
  .post(protect, ownerOnly, createUser);

router.route("/:id").delete(protect, ownerOnly, deleteUser);

module.exports = router;
