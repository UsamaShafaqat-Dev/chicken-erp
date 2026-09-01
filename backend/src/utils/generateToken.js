const jwt = require("jsonwebtoken");

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  // 🔥 FIX: HTTP VPS (bina SSL) ke liye secure ko 'false' aur sameSite ko 'lax' kiya gaya hai
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: true, // True sirf HTTPS (SSL) par kaam karta hai
    sameSite: "lax", // IP address aur HTTP ke liye best hai
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days
  });
};

module.exports = generateToken;
