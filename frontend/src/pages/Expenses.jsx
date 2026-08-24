import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
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
  Tag,
  FileText,
  Printer,
  History,
} from "lucide-react";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Nayi Category add karne ka Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // 🔥 NAYA: Khata/Ledger Modal States
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedCategoryLedger, setSelectedCategoryLedger] = useState({
    category: "",
    total: 0,
    transactions: [],
  });
  const printRef = useRef(null);

  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    category: "",
    description: "",
    amount: "",
    paymentMethod: "cash",
    date: "",
  });

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const isOwner = userInfo?.role === "owner";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesRes, categoriesRes] = await Promise.all([
        axios.get("https://asia-poultry-api.onrender.com/api/expenses", {
          withCredentials: true,
        }),
        axios
          .get("https://asia-poultry-api.onrender.com/api/expense-categories", {
            withCredentials: true,
          })
          .catch(() => ({ data: [] })),
      ]);

      setExpenses(expensesRes.data);

      const dbCategories = categoriesRes.data || [];
      const defaultCats = [
        "Food / Refreshment",
        "Fuel / Petrol",
        "Utility Bill",
        "Staff Salary",
        "Rent",
        "Other",
      ];

      let finalCats =
        dbCategories.length > 0 ? dbCategories.map((c) => c.name) : defaultCats;

      // Agar koi aisa kharcha hai jiski category list mein nahi, usay list mein daal do
      expensesRes.data.forEach((e) => {
        if (!finalCats.includes(e.category)) finalCats.push(e.category);
      });

      setCategories(finalCats);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
        category: categories.length > 0 ? categories[0] : "Other",
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
    if (isSubmitting) return;

    if (!formData.description || !formData.amount || !formData.category)
      return toast.error("Category, Description and Amount are required");

    setIsSubmitting(true);
    try {
      if (editingId) {
        await axios.put(
          `https://asia-poultry-api.onrender.com/api/expenses/${editingId}`,
          formData,
          { withCredentials: true },
        );
        toast.success("Expense updated successfully");
      } else {
        await axios.post(
          "https://asia-poultry-api.onrender.com/api/expenses",
          formData,
          { withCredentials: true },
        );
        toast.success("Expense added successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `https://asia-poultry-api.onrender.com/api/expenses/${deletingId}`,
        { withCredentials: true },
      );
      toast.success("Expense deleted");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return toast.error("Name cannot be empty");

    setSavingCategory(true);
    try {
      const { data } = await axios.post(
        "https://asia-poultry-api.onrender.com/api/expense-categories",
        { name: newCategoryName.trim() },
        { withCredentials: true },
      );
      toast.success("New Khata Added!");
      setCategories([...categories, data.name]);
      setFormData({ ...formData, category: data.name });
      setNewCategoryName("");
      setIsCategoryModalOpen(false);
    } catch (error) {
      toast.error("Failed to add category");
    } finally {
      setSavingCategory(false);
    }
  };

  // 🔥 NAYA: Group Expenses by Category (Cards banane ke liye)
  const getCategoryStats = () => {
    return categories
      .map((cat) => {
        const catExpenses = expenses.filter((e) => e.category === cat);
        const total = catExpenses.reduce(
          (sum, e) => sum + (Number(e.amount) || 0),
          0,
        );
        return { category: cat, total, transactions: catExpenses };
      })
      .filter(
        (stat) =>
          stat.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stat.total > 0,
      );
    // Sirf wo cards show hongay jinme kharcha hua ho ya search kiya gaya ho
  };

  const openLedger = (stat) => {
    setSelectedCategoryLedger({
      category: stat.category,
      total: stat.total,
      transactions: stat.transactions.sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      ), // Latest pehle
    });
    setShowLedgerModal(true);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Expense_Ledger_${selectedCategoryLedger.category}_${new Date().toISOString().split("T")[0]}`,
  });

  const categoryStats = getCategoryStats();

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-gray-100 p-2 rounded-lg flex-1 sm:w-80 flex items-center gap-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search Khata / Category..."
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Tag size={18} /> Add Khata
          </button>
          <button
            onClick={() => openModal()}
            className="flex-1 sm:flex-none bg-[#0a5228] hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </div>

      {/* Main Container - KHATA CARDS */}
      {loading ? (
        <div className="text-center p-10 text-gray-500">
          Loading Expenses Khatas...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryStats.map((stat, idx) => (
            <div
              key={idx}
              onClick={() => openLedger(stat)}
              className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                  <Receipt size={24} />
                </div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-50 px-2 py-1 rounded border border-gray-100">
                  {stat.transactions.length} Entries
                </span>
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                {stat.category}
              </h3>
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <History size={12} /> View Details
              </p>
              <h2 className="text-2xl font-black mt-auto text-red-600">
                Rs. {stat.total.toLocaleString()}
              </h2>
            </div>
          ))}
        </div>
      )}

      {/* 🔥 NAYA: EXPENSE LEDGER MODAL */}
      {showLedgerModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "90vh" }}
          >
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="text-blue-600" />{" "}
                  {selectedCategoryLedger.category}
                </h2>
                <p className="text-sm text-gray-500 mt-1 print:hidden">
                  Expense Ledger Details
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block print:hidden">
                  <p className="text-xs text-gray-500 font-bold uppercase">
                    Total Expense
                  </p>
                  <p className="text-lg font-black text-red-600">
                    Rs. {selectedCategoryLedger.total.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={handlePrint}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors flex items-center gap-1.5 font-bold text-sm shadow-sm"
                >
                  <Printer size={18} />{" "}
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  onClick={() => setShowLedgerModal(false)}
                  className="bg-white p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div
              ref={printRef}
              className="flex-1 overflow-y-auto p-5 bg-white custom-scrollbar print:p-8 print:w-full print:h-auto print:overflow-visible"
            >
              <div className="hidden print:block text-center mb-8 border-b-2 border-gray-800 pb-4">
                <h1 className="text-3xl font-black text-gray-900 mb-1">
                  ASIA POULTRY BUSINESS
                </h1>
                <p className="text-gray-600 font-bold mb-6">Expense Ledger</p>
                <div className="flex justify-between items-end text-left mt-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                      Khata Name:
                    </p>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedCategoryLedger.category}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Printed: {new Date().toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                      Total Spent:
                    </p>
                    <h2 className="text-2xl font-black text-red-600">
                      Rs. {selectedCategoryLedger.total.toLocaleString()}
                    </h2>
                  </div>
                </div>
              </div>

              {selectedCategoryLedger.transactions.length === 0 ? (
                <div className="text-center p-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200 print:hidden">
                  No entries found.
                </div>
              ) : (
                <div className="space-y-3 print:space-y-0 print:border-t print:border-gray-200">
                  {selectedCategoryLedger.transactions.map((tx, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:border-0 print:border-b print:border-gray-200 print:shadow-none print:rounded-none print:py-3 print:px-1"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 rounded-lg shrink-0 bg-red-100 text-red-600 print:border print:border-red-600 print:bg-white">
                          <ArrowUpRight size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm print:text-base">
                            {tx.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            {new Date(tx.date).toLocaleDateString("en-GB")}
                            <span className="capitalize bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 print:bg-white print:border-none">
                              via {tx.paymentMethod}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2 sm:gap-1 pl-11 sm:pl-0">
                        <p className="font-black text-red-600 print:text-base">
                          - Rs. {tx.amount.toLocaleString()}
                        </p>
                        {isOwner && (
                          <div className="flex gap-1.5 print:hidden">
                            <button
                              onClick={() => {
                                setShowLedgerModal(false);
                                openModal(tx);
                              }}
                              className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-[10px] font-bold hover:bg-blue-100 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setShowLedgerModal(false);
                                setDeletingId(tx._id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-red-600 bg-red-50 px-2 py-1 rounded text-[10px] font-bold hover:bg-red-100 transition-colors"
                            >
                              Del
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
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
                  Khata / Category *
                </label>
                <div className="flex gap-2">
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
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
                    title="Add New Category"
                  >
                    <Plus size={18} />
                  </button>
                </div>
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
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium w-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-[#0a5228] text-white rounded-lg font-medium w-full transition-colors ${isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-green-800"}`}
                >
                  {isSubmitting ? "Saving..." : editingId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY ADD MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-xs shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Tag size={18} className="text-blue-600" /> New Khata
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Khata Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Vehicle 9093"
                />
              </div>
              <button
                type="submit"
                disabled={savingCategory}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {savingCategory ? "Saving..." : "Add Khata"}
              </button>
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
