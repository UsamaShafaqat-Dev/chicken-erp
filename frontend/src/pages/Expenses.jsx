import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Calendar,
  Receipt,
  Banknote,
} from "lucide-react";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    category: "Food / Refreshment",
    description: "",
    amount: "",
    paymentMethod: "cash",
    date: "",
  });

  const categories = [
    "Food / Refreshment",
    "Fuel / Petrol",
    "Utility Bill",
    "Salary / Wages",
    "Rent",
    "Maintenance",
    "Other",
  ];

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const isOwner = userInfo?.role === "owner";

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("http://localhost:5000/api/expenses", {
        withCredentials: true,
      });
      setExpenses(data);
    } catch (error) {
      toast.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const openModal = (expense = null) => {
    if (expense) {
      setFormData({
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        paymentMethod: expense.paymentMethod || "cash",
        date: new Date(expense.date).toISOString().split("T")[0],
      });
      setEditingId(expense._id);
    } else {
      setFormData({
        category: "Food / Refreshment",
        description: "",
        amount: "",
        paymentMethod: "cash",
        date: new Date().toISOString().split("T")[0],
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount)
      return toast.error("Description and Amount are required");

    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/expenses/${editingId}`,
          formData,
          { withCredentials: true },
        );
        toast.success("Expense updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/expenses", formData, {
          withCredentials: true,
        });
        toast.success("Expense added successfully");
      }
      setIsModalOpen(false);
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/expenses/${deletingId}`, {
        withCredentials: true,
      });
      toast.success("Expense deleted");
      setIsDeleteModalOpen(false);
      fetchExpenses();
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-gray-100 p-2 rounded-lg flex-1 sm:w-80 flex items-center gap-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
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
          <Plus size={18} /> Add Expense
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden">
        {/* DESKTOP TABLE */}
        <div className="hidden lg:block w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <th className="px-4 py-4 font-medium">Date</th>
                <th className="px-4 py-4 font-medium">Category</th>
                <th className="px-4 py-4 font-medium">Description</th>
                <th className="px-4 py-4 font-medium">Method</th>
                <th className="px-4 py-4 font-medium">Amount</th>
                <th className="px-4 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-gray-500">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr
                    key={expense._id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4 text-gray-600">
                      {new Date(expense.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-4">
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded text-xs font-bold">
                        {expense.category}
                      </span>
                    </td>
                    <td
                      className="px-4 py-4 font-medium text-gray-800 max-w-[250px] truncate"
                      title={expense.description}
                    >
                      {expense.description}
                    </td>
                    <td className="px-4 py-4 text-gray-600 capitalize flex items-center gap-1 mt-3">
                      <Banknote size={14} /> {expense.paymentMethod}
                    </td>
                    <td className="px-4 py-4 font-bold text-red-600">
                      Rs. {expense.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 flex justify-center items-center gap-1.5">
                      {isOwner ? (
                        <>
                          <button
                            onClick={() => openModal(expense)}
                            className="flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2 py-1.5 rounded text-xs font-medium transition-colors"
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(expense._id);
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
          {filteredExpenses.map((expense, index) => (
            <div
              key={expense._id}
              className={`p-4 flex flex-col gap-3 ${index !== filteredExpenses.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-md font-bold mb-1 inline-block">
                    {expense.category}
                  </span>
                  <h3 className="font-bold text-gray-800 text-base leading-tight">
                    {expense.description}
                  </h3>
                  <p className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                    <Calendar size={12} />{" "}
                    {new Date(expense.date).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-lg font-bold text-red-600">
                    Rs. {expense.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase flex items-center justify-end gap-1">
                    <Banknote size={10} /> {expense.paymentMethod}
                  </p>
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                  <button
                    onClick={() => openModal(expense)}
                    className="flex-1 flex justify-center items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium transition-colors border border-blue-100"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeletingId(expense._id);
                      setIsDeleteModalOpen(true);
                    }}
                    className="flex-1 flex justify-center items-center gap-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-medium transition-colors border border-red-100"
                  >
                    <Trash2 size={14} /> Delete
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
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Receipt size={20} />{" "}
                {editingId ? "Edit Expense" : "Add Expense"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
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

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. 5 ltr petrol for delivery"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Amount (Rs) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold text-red-600"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Paid Via
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank / Online</option>
                  </select>
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
                  {editingId ? "Update" : "Save"}
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
              Delete Expense?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to remove this expense record?
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

export default Expenses;
