import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  X,
  Users,
  Wallet,
  History,
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Edit, // 🔥 NAYA
  Trash2, // 🔥 NAYA
  AlertTriangle, // 🔥 NAYA
} from "lucide-react";

const Salaries = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals State
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // 🔥 NAYA

  // Data States
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null); // 🔥 NAYA
  const [deletingId, setDeletingId] = useState(null); // 🔥 NAYA

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const isOwner = userInfo?.role === "owner"; // Sirf owner edit/delete kar sakta hai

  // Forms
  const [empForm, setEmpForm] = useState({
    name: "",
    mobile: "",
    designation: "Staff",
    monthlySalary: "",
  });

  const [txnForm, setTxnForm] = useState({
    type: "salary_added",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "https://asia-poultry-api.onrender.com/api/employees",
        {
          withCredentials: true,
        },
      );
      setEmployees(data);
    } catch (error) {
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // --- 🔥 NAYA: Open Edit or Create Modal ---
  const openEmpModal = (emp = null) => {
    if (emp) {
      setEmpForm({
        name: emp.name,
        mobile: emp.mobile || "",
        designation: emp.designation || "Staff",
        monthlySalary: emp.monthlySalary,
      });
      setEditingId(emp._id);
    } else {
      setEmpForm({
        name: "",
        mobile: "",
        designation: "Staff",
        monthlySalary: "",
      });
      setEditingId(null);
    }
    setIsEmpModalOpen(true);
  };

  // --- Handlers ---
  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await axios.put(
          `https://asia-poultry-api.onrender.com/api/employees/${editingId}`,
          empForm,
          { withCredentials: true },
        );
        toast.success("Employee updated successfully!");
      } else {
        await axios.post(
          "https://asia-poultry-api.onrender.com/api/employees",
          empForm,
          { withCredentials: true },
        );
        toast.success("Employee added successfully!");
      }
      setIsEmpModalOpen(false);
      setEmpForm({
        name: "",
        mobile: "",
        designation: "Staff",
        monthlySalary: "",
      });
      fetchEmployees();
    } catch (error) {
      toast.error("Failed to save employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTxnSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.post(
        "https://asia-poultry-api.onrender.com/api/employees/transaction",
        { ...txnForm, employeeId: selectedEmp._id },
        { withCredentials: true },
      );
      toast.success("Entry added to khata!");
      setIsTxnModalOpen(false);
      setTxnForm({ ...txnForm, amount: "", description: "" });
      fetchEmployees();
    } catch (error) {
      toast.error("Failed to add transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 🔥 NAYA: Confirm Delete Handler ---
  const confirmDelete = async () => {
    try {
      await axios.delete(
        `https://asia-poultry-api.onrender.com/api/employees/${deletingId}`,
        { withCredentials: true },
      );
      toast.success("Employee deleted successfully");
      setIsDeleteModalOpen(false);
      fetchEmployees();
    } catch (error) {
      toast.error("Failed to delete employee");
    }
  };

  const openLedger = async (emp) => {
    try {
      setSelectedEmp(emp);
      setIsLedgerModalOpen(true);
      const { data } = await axios.get(
        `https://asia-poultry-api.onrender.com/api/employees/${emp._id}/ledger`,
        { withCredentials: true },
      );
      setLedgerData(data.transactions);
    } catch (error) {
      toast.error("Failed to load ledger");
      setIsLedgerModalOpen(false);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 w-full">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-gray-100 p-2 rounded-lg flex-1 sm:w-72 flex items-center gap-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => openEmpModal()}
          className="w-full sm:w-auto bg-[#0a5228] hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add Employee
        </button>
      </div>

      {/* Employees Grid */}
      {loading ? (
        <div className="text-center p-8 text-gray-500">
          Loading staff details...
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center p-8 text-gray-500 bg-white rounded-xl">
          No employees found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <Users size={18} className="text-blue-600" /> {emp.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <Briefcase size={14} /> {emp.designation}
                  </p>
                </div>

                {/* 🔥 NAYA: Edit / Delete Buttons & Salary */}
                <div className="flex flex-col items-end gap-2">
                  {isOwner && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEmpModal(emp)}
                        className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition-colors"
                        title="Edit Employee"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingId(emp._id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors"
                        title="Delete Employee"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Monthly Salary</p>
                    <p className="font-bold text-gray-700">
                      Rs. {emp.monthlySalary.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">
                    Khata Balance
                  </p>
                  <p
                    className={`text-lg font-black ${emp.currentBalance > 0 ? "text-green-600" : emp.currentBalance < 0 ? "text-red-500" : "text-gray-700"}`}
                  >
                    Rs. {Math.abs(emp.currentBalance).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {emp.currentBalance > 0
                      ? "(Humne Dene Hain)"
                      : emp.currentBalance < 0
                        ? "(Advance Liya Hai)"
                        : "(Clear)"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => {
                    setSelectedEmp(emp);
                    setIsTxnModalOpen(true);
                  }}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-1.5 border border-blue-100"
                >
                  <Wallet size={16} /> Add Entry
                </button>
                <button
                  onClick={() => openLedger(emp)}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-1.5 border border-gray-200"
                >
                  <History size={16} /> Khata
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. ADD/EDIT EMPLOYEE MODAL */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? "Edit Staff" : "Add New Staff"}
              </h2>
              <button
                onClick={() => setIsEmpModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEmpSubmit} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Employee Name *
                </label>
                <input
                  type="text"
                  required
                  value={empForm.name}
                  onChange={(e) =>
                    setEmpForm({ ...empForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500"
                  placeholder="Ali Raza"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Mobile No
                  </label>
                  <input
                    type="text"
                    value={empForm.mobile}
                    onChange={(e) =>
                      setEmpForm({ ...empForm, mobile: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={empForm.designation}
                    onChange={(e) =>
                      setEmpForm({ ...empForm, designation: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500"
                    placeholder="e.g. Driver, Staff"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Fixed Monthly Salary (Rs) *
                </label>
                <input
                  type="number"
                  required
                  value={empForm.monthlySalary}
                  onChange={(e) =>
                    setEmpForm({ ...empForm, monthlySalary: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500"
                  placeholder="0"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#0a5228] text-white rounded-lg hover:bg-green-800 font-medium"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId
                      ? "Update Employee"
                      : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD TRANSACTION MODAL */}
      {isTxnModalOpen && selectedEmp && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Khata Entry</h2>
                <p className="text-xs text-gray-500">
                  For:{" "}
                  <span className="font-bold text-gray-700">
                    {selectedEmp.name}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setIsTxnModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleTxnSubmit} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Entry Type *
                </label>
                <select
                  value={txnForm.type}
                  onChange={(e) =>
                    setTxnForm({ ...txnForm, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white font-medium"
                >
                  <option value="salary_added">
                    🟢 Mahinay Ki Salary Ban Gayi (Jama)
                  </option>
                  <option value="payment_given">
                    🔴 Advance / Cash De Diya (Naam)
                  </option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Amount (Rs) *
                  </label>
                  <input
                    type="number"
                    required
                    value={txnForm.amount}
                    onChange={(e) =>
                      setTxnForm({ ...txnForm, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={txnForm.date}
                    onChange={(e) =>
                      setTxnForm({ ...txnForm, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Details / Month
                </label>
                <input
                  type="text"
                  value={txnForm.description}
                  onChange={(e) =>
                    setTxnForm({ ...txnForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  placeholder="e.g. August 2026 Salary ya Bijli ka bill"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTxnModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {isSubmitting ? "Processing..." : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. LEDGER (KHATA) MODAL */}
      {isLedgerModalOpen && selectedEmp && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col"
            style={{ maxHeight: "85vh" }}
          >
            <div className="p-5 border-b border-gray-100 bg-gray-50 shrink-0 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {selectedEmp.name} - Khata
                </h2>
                <p
                  className={`text-sm font-bold mt-1 ${selectedEmp.currentBalance > 0 ? "text-green-600" : selectedEmp.currentBalance < 0 ? "text-red-500" : "text-gray-600"}`}
                >
                  Current Balance: Rs.{" "}
                  {Math.abs(selectedEmp.currentBalance).toLocaleString()}{" "}
                  {selectedEmp.currentBalance > 0
                    ? "(Dene hain)"
                    : selectedEmp.currentBalance < 0
                      ? "(Advance)"
                      : ""}
                </p>
              </div>
              <button
                onClick={() => setIsLedgerModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 custom-scrollbar flex-1 bg-white">
              {ledgerData.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  Koi entry nahi mili...
                </div>
              ) : (
                <div className="space-y-3">
                  {ledgerData.map((tx) => (
                    <div
                      key={tx._id}
                      className="flex justify-between items-center p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex gap-3 items-center">
                        <div
                          className={`p-2 rounded-full ${tx.type === "salary_added" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                        >
                          {tx.type === "salary_added" ? (
                            <ArrowDownRight size={18} />
                          ) : (
                            <ArrowUpRight size={18} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {tx.type === "salary_added"
                              ? "Salary Added (Jama)"
                              : "Payment Given (Naam)"}
                          </p>
                          <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                            <span>
                              {new Date(tx.date).toLocaleDateString("en-GB")}
                            </span>
                            {tx.description && <span>• {tx.description}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${tx.type === "salary_added" ? "text-green-600" : "text-red-600"}`}
                        >
                          {tx.type === "salary_added" ? "+" : "-"} Rs.{" "}
                          {tx.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. 🔥 NAYA: DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Delete Employee?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure? This will delete the employee and their entire khata
              history permanently.
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

export default Salaries;
