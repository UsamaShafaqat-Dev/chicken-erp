import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Users as UsersIcon,
  Plus,
  Trash2,
  Mail,
  Lock,
  UserPlus,
  Shield,
  ShieldCheck,
  AlertTriangle,
  User,
} from "lucide-react";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // 🔥 FIX: formData mein userId add kiya hai
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    userId: "",
    password: "",
    role: "staff",
  });

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const isOwner = userInfo?.role === "owner";

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("https://asiapoultrybusiness.com/api/users", {
        withCredentials: true,
      });
      setUsers(data);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) fetchUsers();
  }, [isOwner]);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.email ||
      !formData.userId ||
      !formData.password
    ) {
      return toast.error("All fields are required");
    }
    if (formData.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    try {
      await axios.post("https://asiapoultrybusiness.com/api/users", formData, {
        withCredentials: true,
      });
      toast.success("User account created successfully");
      setIsModalOpen(false);
      setFormData({
        name: "",
        email: "",
        userId: "",
        password: "",
        role: "staff",
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`https://asiapoultrybusiness.com/api/users/${deletingId}`, {
        withCredentials: true,
      });
      toast.success("User deleted successfully");
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <Shield size={64} className="text-red-200 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-500 mt-2">
          Only the Owner can view and manage staff accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <UsersIcon size={24} className="text-indigo-600" /> Users & Staff
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage system access and employee accounts
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-[#0a5228] hover:bg-green-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <UserPlus size={18} /> Add New Staff
        </button>
      </div>

      {loading ? (
        <div className="text-center p-10 text-gray-500">Loading users...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map((user) => (
            <div
              key={user._id}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 right-0">
                {user.role === "owner" ? (
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <ShieldCheck size={12} /> OWNER
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                    <UsersIcon size={12} /> STAFF
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mb-4 mt-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${user.role === "owner" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                    <User size={12} /> {user.userId || "No ID"}
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                <p className="text-xs text-gray-400">
                  Added: {new Date(user.createdAt).toLocaleDateString()}
                </p>
                {user.role !== "owner" && (
                  <button
                    onClick={() => {
                      setDeletingId(user._id);
                      setIsDeleteModalOpen(true);
                    }}
                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                    title="Delete Staff"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="bg-gray-50 p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <UserPlus size={20} className="text-indigo-600" /> Create Staff
                Account
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Staff members can manage entries but cannot delete records or
                view reports.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UsersIcon size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Ali Raza"
                  />
                </div>
              </div>

              {/* 🔥 NEW: User ID Input */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  User ID (For Login) *
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
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. ali123"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Email Address *
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
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="staff@oxege.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength="6"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium w-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0a5228] text-white rounded-lg hover:bg-green-800 font-medium w-full"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal Code Remains Same */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Remove Staff?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to revoke access for this staff member? They
              will no longer be able to login.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 flex-1 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 flex-1 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
