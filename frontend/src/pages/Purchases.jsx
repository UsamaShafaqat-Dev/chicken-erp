import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  Calendar,
  Scale,
  Edit,
} from "lucide-react";

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // 🔥 FIX: Double click lock state
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    supplier: "",
    weight: "",
    rate: "",
    totalAmount: 0,
    paidAmount: "",
    balanceDue: 0,
    paymentMethod: "cash",
    date: "",
    notes: "",
  });

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const isOwner = userInfo?.role === "owner";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purchasesRes, suppliersRes] = await Promise.all([
        axios.get("https://asia-poultry-api.onrender.com/api/purchases", {
          withCredentials: true,
        }),
        axios.get("https://asia-poultry-api.onrender.com/api/suppliers", {
          withCredentials: true,
        }),
      ]);
      setPurchases(purchasesRes.data);
      setSuppliers(suppliersRes.data.filter((s) => s.status !== "inactive"));
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === "weight" || name === "rate") {
      const weight = parseFloat(newFormData.weight) || 0;
      const rate = parseFloat(newFormData.rate) || 0;

      const totalAmount = weight * rate;
      newFormData.totalAmount = totalAmount;

      newFormData.balanceDue =
        totalAmount - (parseFloat(newFormData.paidAmount) || 0);
    } else if (name === "paymentMethod") {
      if (value === "credit") {
        newFormData.paidAmount = "";
        newFormData.balanceDue = parseFloat(newFormData.totalAmount) || 0;
      }
    } else if (name === "paidAmount") {
      const totalAmount = parseFloat(newFormData.totalAmount) || 0;
      newFormData.balanceDue = totalAmount - (parseFloat(value) || 0);
    }

    setFormData(newFormData);
  };

  const openModal = (purchase = null) => {
    if (purchase) {
      setFormData({
        supplier: purchase.supplier?._id || "",
        weight: purchase.weight,
        rate: purchase.rate,
        totalAmount: purchase.totalAmount,
        paidAmount: purchase.paidAmount,
        balanceDue: purchase.balanceDue,
        paymentMethod: purchase.paymentMethod || "cash",
        date: new Date(purchase.date).toISOString().split("T")[0],
        notes: purchase.notes || "",
      });
      setEditingId(purchase._id);
    } else {
      setFormData({
        supplier: "",
        weight: "",
        rate: "",
        totalAmount: 0,
        paidAmount: "",
        balanceDue: 0,
        paymentMethod: "cash",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // 🔥 FIX: Prevent double click

    if (!formData.supplier || !formData.weight || !formData.rate)
      return toast.error("Supplier, Weight, and Rate are required");

    setIsSubmitting(true); // 🔥 FIX: Lock ON
    try {
      if (editingId) {
        await axios.put(
          `https://asia-poultry-api.onrender.com/api/purchases/${editingId}`,
          formData,
          { withCredentials: true },
        );
        toast.success("Purchase updated successfully");
      } else {
        await axios.post(
          "https://asia-poultry-api.onrender.com/api/purchases",
          formData,
          {
            withCredentials: true,
          },
        );
        toast.success("Purchase added successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false); // 🔥 FIX: Lock OFF
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `https://asia-poultry-api.onrender.com/api/purchases/${deletingId}`,
        {
          withCredentials: true,
        },
      );
      toast.success("Purchase deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete purchase");
    }
  };

  const filteredPurchases = purchases.filter((p) =>
    p.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-gray-100 p-2 rounded-lg flex-1 sm:w-72 flex items-center gap-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by broker name..."
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
          <Plus size={18} /> Add Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
        {/* DESKTOP TABLE */}
        <div className="hidden lg:block w-full">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <th className="px-3 py-4 font-medium">Date</th>
                <th className="px-3 py-4 font-medium">Broker / Supplier</th>
                <th className="px-3 py-4 font-medium">Weight (KG)</th>
                <th className="px-3 py-4 font-medium">Rate</th>
                <th className="px-3 py-4 font-medium">Total Amount</th>
                <th className="px-3 py-4 font-medium">Paid</th>
                <th className="px-3 py-4 font-medium">Due Balance</th>
                <th className="px-3 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-gray-500">
                    Loading purchases...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-gray-500">
                    No purchases found.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr
                    key={purchase._id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-4 text-gray-600">
                      {new Date(purchase.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-3 py-4 font-bold text-gray-800">
                      {purchase.supplier?.name || "Unknown"}
                    </td>
                    <td className="px-3 py-4 text-gray-800 font-medium">
                      {purchase.weight} KG
                    </td>
                    <td className="px-3 py-4 text-gray-600">
                      Rs. {purchase.rate}
                    </td>
                    <td className="px-3 py-4 text-blue-600 font-bold">
                      Rs. {purchase.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-3 py-4 text-green-600 font-medium">
                      Rs. {purchase.paidAmount.toLocaleString()}
                    </td>
                    <td
                      className={`px-3 py-4 font-bold ${purchase.balanceDue > 0 ? "text-red-500" : "text-gray-600"}`}
                    >
                      {purchase.balanceDue > 0
                        ? `Rs. ${purchase.balanceDue.toLocaleString()}`
                        : "Nil"}
                    </td>
                    <td className="px-3 py-4 flex justify-center items-center gap-1.5">
                      {isOwner ? (
                        <>
                          <button
                            onClick={() => openModal(purchase)}
                            className="flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2 py-1.5 rounded text-xs font-medium transition-colors"
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(purchase._id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="flex items-center gap-1 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-2 py-1.5 rounded text-xs font-medium transition-colors"
                          >
                            <Trash2 size={14} /> Del
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">No Action</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="lg:hidden flex flex-col">
          {filteredPurchases.map((purchase, index) => (
            <div
              key={purchase._id}
              className={`p-4 flex flex-col gap-4 ${index !== filteredPurchases.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {purchase.supplier?.name || "Unknown"}
                  </h3>
                  <p className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                    <Calendar size={14} />{" "}
                    {new Date(purchase.date).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
                  <p className="text-sm font-bold text-blue-600">
                    Rs. {purchase.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Weight</p>
                  <p className="font-medium flex items-center gap-1">
                    <Scale size={14} /> {purchase.weight} KG
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Rate</p>
                  <p className="font-medium">Rs. {purchase.rate}</p>
                </div>

                <div className="col-span-2 pt-2 border-t border-gray-200 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Paid</p>
                    <p className="font-medium text-green-600">
                      Rs. {purchase.paidAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Due Balance</p>
                    <p
                      className={`font-bold ${purchase.balanceDue > 0 ? "text-red-500" : "text-gray-600"}`}
                    >
                      {purchase.balanceDue > 0
                        ? `Rs. ${purchase.balanceDue.toLocaleString()}`
                        : "Nil"}
                    </p>
                  </div>
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(purchase)}
                    className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors border border-blue-100"
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeletingId(purchase._id);
                      setIsDeleteModalOpen(true);
                    }}
                    className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors border border-red-100"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? "Edit Purchase" : "Add New Purchase"}
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
                    Select Broker/Supplier *
                  </label>
                  <select
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    required
                    disabled={editingId}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none ${editingId ? "bg-gray-100 text-gray-500" : "focus:ring-2 focus:ring-green-500 bg-white"}`}
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.mobile})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Total Weight (KG) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Rate per KG (Rs) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="rate"
                    value={formData.rate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-600 font-medium mb-1 text-xs">
                    Total Amount (Auto)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={formData.totalAmount}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 font-bold text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-gray-800 font-medium mb-1 text-xs">
                    Paid Amount (Rs)
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    value={formData.paidAmount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1 text-xs">
                    Due Balance (Auto)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={formData.balanceDue}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 font-bold text-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="credit">Credit / Udhaar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Notes / Vehicle No
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Optional notes..."
                  />
                </div>
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
                  disabled={isSubmitting} // 🔥 FIX
                  className={`px-4 py-2 bg-[#0a5228] text-white rounded-lg font-medium flex items-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-green-800"}`}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId
                      ? "Update Purchase"
                      : "Save Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Delete Purchase?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure? Deleting this will reverse the supplier's balance
              automatically.
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

export default Purchases;
