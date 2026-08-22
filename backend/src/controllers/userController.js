const User = require("../models/User");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, userId, password, role } = req.body;
    const userExists = await User.findOne({ $or: [{ email }, { userId }] });
    if (userExists)
      return res
        .status(400)
        .json({ message: "Email or User ID already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      userId,
      password: hashedPassword,
      role: role || "staff",
    });
    res
      .status(201)
      .json({
        _id: user._id,
        name: user.name,
        email: user.email,
        userId: user.userId,
        role: user.role,
      });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id)
      return res
        .status(400)
        .json({ message: "You cannot delete your own admin account" });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔥 Profile & Picture Update Function
const updateUserProfile = async (req, res) => {
  try {
    // 🔥 FIX: Cloudinary config ko function ke andar rakh diya taake .env file theek se load ho jaye
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.userId = req.body.userId || user.userId;

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      // Agar picture backend par aayi hai, toh Cloudinary par bhej do
      if (req.body.profilePic) {
        const uploadRes = await cloudinary.uploader.upload(
          req.body.profilePic,
          {
            folder: "oxege_poultry_profiles",
          },
        );
        user.profilePic = uploadRes.secure_url;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        userId: updatedUser.userId,
        role: updatedUser.role,
        profilePic: updatedUser.profilePic,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Email or User ID is already taken by someone else" });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, createUser, deleteUser, updateUserProfile };
