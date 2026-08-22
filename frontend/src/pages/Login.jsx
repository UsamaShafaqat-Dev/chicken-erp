import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!userId || !password) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      // Backend API call
      const response = await axios.post(
        "https://asia-poultry-api.onrender.com//api/auth/login",
        { userId, password },
        { withCredentials: true }, // Cookies (JWT) receive karne ke liye
      );

      // Agar login successful ho
      toast.success(`Welcome back, ${response.data.name}!`);

      // User ka data localStorage mein save kar lein
      localStorage.setItem("userInfo", JSON.stringify(response.data));

      // Dashboard par bhej dein
      navigate("/");
    } catch (error) {
      // Custom Error handling (No old popups)
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🐔</span>
          </div>
          {/* 🔥 NAYA: Yahan naam change kar diya gaya hai */}
          <h2 className="text-2xl font-bold text-gray-800">
            Asia Poultry Business
          </h2>
          <p className="text-gray-500 text-sm mt-1">Management System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              placeholder="Enter your User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0a5228] hover:bg-green-800 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center"
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
