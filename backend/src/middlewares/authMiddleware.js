const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 1. User Logged In Check (Protect Route)
const protect = async (req, res, next) => {
  let token = req.cookies.jwt;

  if (token) {
    try {
      // Token ko verify karna
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Database se user nikal kar request mein daalna (password ke ilawa)
      req.user = await User.findById(decoded.userId).select("-password");

      next(); // Agle function par bhej do
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// 2. Owner Permission Check (Admin Only)
const ownerOnly = (req, res, next) => {
  if (req.user && req.user.role === "owner") {
    next(); // Agar owner hai toh action perform karne do
  } else {
    res
      .status(403)
      .json({ message: "Not authorized! Only owner can perform this action." });
  }
};

module.exports = { protect, ownerOnly };
