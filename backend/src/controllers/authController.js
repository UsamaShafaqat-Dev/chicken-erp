const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc    Register a new user (Owner ya Staff)
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, userId, password, mobile, role } = req.body;

    const userExists = await User.findOne({ userId });
    if (userExists) {
      return res.status(400).json({ message: "User ID already exists" });
    }

    const user = await User.create({
      name,
      userId,
      password,
      mobile,
      role: role || "staff", // Default role staff hoga agar provide na kiya jaye
    });

    if (user) {
      generateToken(res, user._id);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        userId: user.userId,
        mobile: user.mobile,
        role: user.role,
        profilePic: user.profilePic, // 🔥 NAYA: Profile picture add kar di
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { userId, password } = req.body;

    const user = await User.findOne({ userId });

    if (user && (await user.matchPassword(password))) {
      if (user.status === "inactive") {
        return res
          .status(403)
          .json({ message: "Your account is inactive. Contact Admin." });
      }

      generateToken(res, user._id);
      res.json({
        _id: user._id,
        name: user.name,
        userId: user.userId,
        mobile: user.mobile,
        role: user.role,
        profilePic: user.profilePic, // 🔥 NAYA: Login k waqt picture bhi sath aayegi ab!
      });
    } else {
      res.status(401).json({ message: "Invalid User ID or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
const logoutUser = (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { registerUser, loginUser, logoutUser };
