import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // 🔥 NAYA
import axios from "axios";
import toast from "react-hot-toast";
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  Eye,
  EyeOff,
  Camera,
} from "lucide-react";

const Settings = () => {
  const navigate = useNavigate(); // 🔥 NAYA

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    userId: "",
    password: "",
    profilePic: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  useEffect(() => {
    // 🔥 FIX: Agar owner nahi hai, to direct Dashboard par phaink do!
    if (userInfo?.role !== "owner") {
      toast.error("Access Denied! Only Owner can access settings.");
      navigate("/");
      return;
    }

    if (userInfo) {
      setFormData({
        name: userInfo.name || "",
        email: userInfo.email || "",
        userId: userInfo.userId || "",
        password: "",
        profilePic: "",
      });
      if (userInfo.profilePic) setImagePreview(userInfo.profilePic);
    }
  }, [navigate]);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, profilePic: reader.result });
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    try {
      setLoading(true);
      toast.loading("Uploading profile picture & saving...", {
        id: "save-toast",
      });

      const { data } = await axios.put(
        "http://129.121.140.57:5000/api/users/profile",
        formData,
        { withCredentials: true },
      );

      localStorage.setItem("userInfo", JSON.stringify(data));
      toast.success("Profile updated successfully!", { id: "save-toast" });

      setFormData({ ...formData, password: "", profilePic: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed", {
        id: "save-toast",
      });
    } finally {
      setLoading(false);
    }
  };

  // Agar staff ghalti se yahan tak poanch gaya hai, to screen par kuch na dikhao jab tak redirect na ho jaye
  if (userInfo?.role !== "owner") return null;

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon size={24} className="text-gray-600" /> Account Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal profile and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gradient-to-br from-[#0a5228] to-green-800 p-6 rounded-xl shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div
            className="relative group cursor-pointer mb-4"
            onClick={() => fileInputRef.current.click()}
          >
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl font-black text-white backdrop-blur-sm border-4 border-white/30 shadow-lg overflow-hidden">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                userInfo?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={28} className="text-white" />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          <h3 className="text-2xl font-bold text-white">{userInfo?.name}</h3>
          <p className="text-green-100 flex items-center gap-1.5 mt-1">
            <Mail size={14} /> {userInfo?.email}
          </p>

          <div className="mt-6 bg-white/10 px-4 py-2 rounded-lg border border-white/20 text-white backdrop-blur-sm flex items-center gap-2">
            <ShieldCheck size={18} className="text-green-300" />
            <span className="font-bold uppercase tracking-wider text-sm">
              {userInfo?.role === "owner"
                ? "System Administrator"
                : "Staff Member"}
            </span>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-3">
            Edit Profile Information
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">
                User ID (For Login)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. admin@oxege.com"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-gray-700 font-medium mb-1 text-sm">
                New Password (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Leave blank to keep current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                If you want to change your password, type it here (min 6
                characters).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full sm:w-auto bg-[#0a5228] hover:bg-green-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
            >
              <Save size={18} />{" "}
              {loading ? "Saving Changes..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
