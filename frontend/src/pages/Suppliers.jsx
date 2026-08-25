import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MessageCircle,
  X,
  AlertTriangle,
  MapPin,
  Phone,
} from "lucide-react";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // 🔥 NAYA: Double click rokne ke liye lock
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    whatsapp: "",
    address: "",
    openingBalance: 0,
    notes: "",
  });

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const isOwner = userInfo?.role === "owner";

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "https://asia-poultry-api.onrender.com/api/suppliers",
        {
          withCredentials: true,
        },
      );
      setSuppliers(data);
    } catch (error) {
      toast.error("Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const openModal = (supplier = null) => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        mobile: supplier.mobile || "",
        whatsapp: supplier.whatsapp || "",
        address: supplier.address || "",
        openingBalance: supplier.openingBalance,
        notes: supplier.notes || "",
      });
      setEditingId(supplier._id);
    } else {
      setFormData({
        name: "",
        mobile: "",
        whatsapp: "",
        address: "",
        openingBalance: 0,
        notes: "",
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // 🔥 FIX: Agar pehle se save ho raha hai toh return kar do

    if (!formData.name) return toast.error("Broker Name is required");

    setIsSubmitting(true); // 🔥 FIX: Button Lock ON
    try {
      if (editingId) {
        await axios.put(
          `https://asia-poultry-api.onrender.com/api/suppliers/${editingId}`,
          formData,
          { withCredentials: true },
        );
        toast.success("Supplier updated successfully");
      } else {
        await axios.post(
          "https://asia-poultry-api.onrender.com/api/suppliers",
          formData,
          {
            withCredentials: true,
          },
        );
        toast.success("Supplier added successfully");
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false); // 🔥 FIX: Button Lock OFF
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `https://asia-poultry-api.onrender.com/api/suppliers/${deletingId}`,
        {
          withCredentials: true,
        },
      );
      toast.success("Supplier deleted successfully");
      setIsDeleteModalOpen(false);
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete supplier");
    }
  };

  const handleWhatsAppClick = (phone) => {
    if (!phone) return toast.error("WhatsApp number not available");
    let cleanNumber = phone.replace(/[^0-9]/g, "");
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "92" + cleanNumber.substring(1);
    }
    window.open(`https://wa.me/${cleanNumber}`, "_blank");
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.mobile && s.mobile.includes(searchQuery)),
  );

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-gray-100 p-2 rounded-lg flex-1 sm:w-72 flex items-center gap-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search brokers..."
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-[#0a5228] hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
        {/* DESKTOP TABLE VIEW */}
        <div className="hidden lg:block w-full">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <th className="px-3 py-4 font-medium">Name</th>
                <th className="px-3 py-4 font-medium">Mobile</th>
                <th className="px-3 py-4 font-medium">WhatsApp</th>
                <th className="px-3 py-4 font-medium">Address</th>
                <th className="px-3 py-4 font-medium">Purchases</th>
                <th className="px-3 py-4 font-medium">Paid</th>
                <th className="px-3 py-4 font-medium">Payable</th>
                <th className="px-3 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-gray-500">
                    Loading suppliers...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-gray-500">
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier._id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-4 font-bold text-gray-800">
                      {supplier.name}
                    </td>
                    <td className="px-3 py-4 text-gray-800">
                      {supplier.mobile || "-"}
                    </td>
                    <td className="px-3 py-4 text-green-600 font-medium">
                      {supplier.whatsapp || "-"}
                    </td>
                    <td
                      className="px-3 py-4 text-gray-600 max-w-[120px] truncate"
                      title={supplier.address}
                    >
                      {supplier.address || "-"}
                    </td>
                    <td className="px-3 py-4 text-blue-600 font-medium">
                      Rs. {supplier.totalPurchases?.toLocaleString() || 0}
                    </td>
                    <td className="px-3 py-4 text-green-600 font-medium">
                      Rs. {supplier.totalPaid?.toLocaleString() || 0}
                    </td>
                    <td
                      className={`px-3 py-4 font-bold ${supplier.currentBalance > 0 ? "text-red-500" : "text-gray-600"}`}
                    >
                      {supplier.currentBalance > 0
                        ? `Rs. ${supplier.currentBalance.toLocaleString()}`
                        : "Nil"}
                    </td>
                    <td className="px-3 py-4 flex justify-center items-center gap-1.5">
                      <button
                        onClick={() =>
                          handleWhatsAppClick(
                            supplier.whatsapp || supplier.mobile,
                          )
                        }
                        className="flex items-center gap-1 text-green-600 bg-green-50 hover:bg-green-100 border border-green-100 px-2 py-1.5 rounded text-xs font-medium transition-colors"
                      >
                        <MessageCircle size={14} /> WA
                      </button>
                      {isOwner && (
                        <>
                          <button
                            onClick={() => openModal(supplier)}
                            className="flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2 py-1.5 rounded text-xs font-medium transition-colors"
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(supplier._id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="flex items-center gap-1 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-2 py-1.5 rounded text-xs font-medium transition-colors"
                          >
                            <Trash2 size={14} /> Del
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS VIEW */}
        <div className="lg:hidden flex flex-col">
          {filteredSuppliers.map((supplier, index) => (
            <div
              key={supplier._id}
              className={`p-4 flex flex-col gap-4 ${index !== filteredSuppliers.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  {supplier.name}
                </h3>
                <div className="flex flex-col gap-1 mt-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />{" "}
                    <span className="font-medium text-gray-700">
                      {supplier.mobile || "-"}
                    </span>
                  </p>
                  {supplier.whatsapp && (
                    <p className="flex items-center gap-2 text-green-600">
                      <MessageCircle size={14} />{" "}
                      <span className="font-medium">{supplier.whatsapp}</span>
                    </p>
                  )}
                  {supplier.address && (
                    <p className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />{" "}
                      {supplier.address}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Purchases</p>
                  <p className="font-medium text-blue-600">
                    Rs. {supplier.totalPurchases?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Paid</p>
                  <p className="font-medium text-green-600">
                    Rs. {supplier.totalPaid?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-200">
                  <p className="text-gray-500 text-xs mb-1">Payable Balance</p>
                  <p
                    className={`text-base font-bold ${supplier.currentBalance > 0 ? "text-red-500" : "text-gray-600"}`}
                  >
                    {supplier.currentBalance > 0
                      ? `Rs. ${supplier.currentBalance.toLocaleString()}`
                      : "Nil"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    handleWhatsAppClick(supplier.whatsapp || supplier.mobile)
                  }
                  className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg font-medium transition-colors border border-green-100"
                >
                  <MessageCircle size={16} /> WA
                </button>
                {isOwner && (
                  <>
                    <button
                      onClick={() => openModal(supplier)}
                      className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium transition-colors border border-blue-100"
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(supplier._id);
                        setIsDeleteModalOpen(true);
                      }}
                      className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg font-medium transition-colors border border-red-100"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? "Edit Supplier" : "Add New Supplier"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Broker Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="e.g. Ahmed Broker"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Mobile No
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="0300-1234567 (Optional)"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    WhatsApp No
                  </label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Opening Balance (Rs)
                  </label>
                  <input
                    type="number"
                    name="openingBalance"
                    value={formData.openingBalance}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Shop Address..."
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting} // 🔥 FIX
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting} // 🔥 FIX: Double click lock
                  className={`px-4 py-2 bg-[#0a5228] text-white rounded-lg font-medium transition-colors ${isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-green-800"}`}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId
                      ? "Update Supplier"
                      : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Delete Supplier?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete this supplier? This action cannot
              be undone.
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
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
