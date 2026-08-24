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
  Edit,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  FileText,
  Wallet,
} from "lucide-react";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]); // 🔥 NAYA
  const [cashAccounts, setCashAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // 🔥 NAYA: Ye decide karega ke Supplier ko dena hai ya Employee ko
  const [payeeType, setPayeeType] = useState("supplier");

  const [formData, setFormData] = useState({
    type: "receive",
    customer: "",
    supplier: "",
    employee: "", // 🔥 NAYA
    cashAccountId: "",
    amount: "",
    method: "cash",
    date: "",
    notes: "",
  });

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const isOwner = userInfo?.role === "owner";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, customersRes, suppliersRes, cashRes] =
        await Promise.all([
          axios.get("https://asia-poultry-api.onrender.com/api/payments", {
            withCredentials: true,
          }),
          axios.get("https://asia-poultry-api.onrender.com/api/customers", {
            withCredentials: true,
          }),
          axios.get("https://asia-poultry-api.onrender.com/api/suppliers", {
            withCredentials: true,
          }),
          axios.get("https://asia-poultry-api.onrender.com/api/cash/accounts", {
            withCredentials: true,
          }),
        ]);

      // 🔥 Employee api fetch ki koshish karega
      let empData = [];
      try {
        const empRes = await axios.get(
          "https://asia-poultry-api.onrender.com/api/employees",
          { withCredentials: true },
        );
        empData = empRes.data;
      } catch (err) {
        console.log("Employees fetch issue or route named differently.");
      }

      setPayments(paymentsRes.data);
      setCustomers(customersRes.data.filter((c) => c.status !== "inactive"));
      setSuppliers(suppliersRes.data.filter((s) => s.status !== "inactive"));
      setEmployees(empData);
      setCashAccounts(cashRes.data);
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
    if (name === "type") {
      setFormData({
        ...formData,
        type: value,
        customer: "",
        supplier: "",
        employee: "",
      });
      if (value === "receive") setPayeeType("supplier"); // Reset toggle
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const openModal = (payment = null) => {
    if (payment) {
      setPayeeType(payment.employee ? "employee" : "supplier");
      setFormData({
        type: payment.type,
        customer: payment.customer?._id || "",
        supplier: payment.supplier?._id || "",
        employee: payment.employee?._id || "",
        cashAccountId:
          payment.cashAccountId?._id || payment.cashAccountId || "",
        amount: payment.amount,
        method: payment.method,
        date: new Date(payment.date).toISOString().split("T")[0],
        notes: payment.notes || "",
      });
      setEditingId(payment._id);
    } else {
      setPayeeType("supplier");
      setFormData({
        type: "receive",
        customer: "",
        supplier: "",
        employee: "",
        cashAccountId: "",
        amount: "",
        method: "cash",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (formData.type === "receive" && !formData.customer)
      return toast.error("Please select a customer");
    if (
      formData.type === "pay" &&
      payeeType === "supplier" &&
      !formData.supplier
    )
      return toast.error("Please select a supplier");
    if (
      formData.type === "pay" &&
      payeeType === "employee" &&
      !formData.employee
    )
      return toast.error("Please select a staff member");
    if (!formData.cashAccountId)
      return toast.error("Please select a Cash Account");
    if (!formData.amount || formData.amount <= 0)
      return toast.error("Please enter a valid amount");

    const payload = { ...formData };
    // Cleanup unwanted data
    if (payload.type === "receive") {
      delete payload.supplier;
      delete payload.employee;
    }
    if (payload.type === "pay" && payeeType === "supplier") {
      delete payload.customer;
      delete payload.employee;
    }
    if (payload.type === "pay" && payeeType === "employee") {
      delete payload.customer;
      delete payload.supplier;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        await axios.put(
          `https://asia-poultry-api.onrender.com/api/payments/${editingId}`,
          payload,
          { withCredentials: true },
        );
        toast.success("Payment updated successfully");
      } else {
        await axios.post(
          "https://asia-poultry-api.onrender.com/api/payments",
          payload,
          { withCredentials: true },
        );
        toast.success("Payment added successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `https://asia-poultry-api.onrender.com/api/payments/${deletingId}`,
        { withCredentials: true },
      );
      toast.success("Payment deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete payment");
    }
  };

  const filteredPayments = payments.filter((p) => {
    const partyName =
      p.type === "receive"
        ? p.customer?.name
        : p.employee
          ? p.employee?.name
          : p.supplier?.name;
    return (
      partyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cashAccountId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden box-border">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-gray-100 p-2 rounded-lg flex-1 sm:w-80 flex items-center gap-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, notes or account..."
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
          <Plus size={18} /> Add Payment
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden">
        {/* DESKTOP TABLE VIEW */}
        <div className="hidden lg:block w-full">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <th className="px-3 py-4 font-medium whitespace-nowrap">
                  Date
                </th>
                <th className="px-3 py-4 font-medium whitespace-nowrap">
                  Type
                </th>
                <th className="px-3 py-4 font-medium whitespace-nowrap">
                  Party Name
                </th>
                <th className="px-3 py-4 font-medium whitespace-nowrap">
                  Cash Account
                </th>
                <th className="px-3 py-4 font-medium whitespace-nowrap">
                  Method
                </th>
                <th className="px-3 py-4 font-medium w-full">
                  Notes / Details
                </th>
                <th className="px-3 py-4 font-medium whitespace-nowrap">
                  Amount
                </th>
                <th className="px-3 py-4 font-medium text-center whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-gray-500">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-gray-500">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(payment.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {payment.type === "receive" ? (
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded-md text-xs font-bold">
                          <ArrowDownLeft size={14} /> Received (In)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-orange-700 bg-orange-50 border border-orange-100 px-2 py-1 rounded-md text-xs font-bold">
                          <ArrowUpRight size={14} /> Paid (Out)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <p className="font-bold text-gray-800 truncate max-w-[150px]">
                        {payment.type === "receive"
                          ? payment.customer?.name || "Unknown"
                          : payment.employee
                            ? payment.employee?.name || "Unknown"
                            : payment.supplier?.name || "Unknown"}
                      </p>
                      <p className="text-[11px] text-gray-500 uppercase">
                        {payment.type === "receive"
                          ? "Customer"
                          : payment.employee
                            ? "Staff / Employee"
                            : "Broker / Supplier"}
                      </p>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded text-xs font-bold">
                        <Wallet size={14} />{" "}
                        {payment.cashAccountId?.name || "N/A"}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-gray-600 capitalize bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                        <CreditCard size={14} /> {payment.method}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      <div
                        className="flex items-center gap-1 truncate max-w-[120px] xl:max-w-[200px]"
                        title={payment.notes}
                      >
                        {payment.notes ? (
                          <>
                            <FileText
                              size={14}
                              className="text-gray-400 shrink-0"
                            />
                            <span className="truncate">{payment.notes}</span>
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                    <td
                      className={`px-3 py-3 font-bold text-base whitespace-nowrap ${payment.type === "receive" ? "text-green-600" : "text-red-500"}`}
                    >
                      {payment.type === "receive" ? "+" : "-"} Rs.{" "}
                      {payment.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex justify-center items-center gap-1.5">
                        {isOwner ? (
                          <>
                            <button
                              onClick={() => openModal(payment)}
                              className="flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2 py-1.5 rounded text-xs font-medium transition-colors"
                            >
                              <Edit size={14} /> Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeletingId(payment._id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="flex items-center gap-1 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-2 py-1.5 rounded text-xs font-medium transition-colors"
                            >
                              <Trash2 size={14} /> Del
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No Action
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS VIEW */}
        <div className="lg:hidden flex flex-col">
          {filteredPayments.map((payment, index) => (
            <div
              key={payment._id}
              className={`p-4 flex flex-col gap-4 ${index !== filteredPayments.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {payment.type === "receive" ? (
                      <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold border border-green-100">
                        IN
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-orange-700 bg-orange-50 px-2 py-0.5 rounded text-[10px] font-bold border border-orange-100">
                        OUT
                      </span>
                    )}
                    <span className="text-xs text-gray-500 uppercase">
                      {payment.type === "receive"
                        ? "Customer"
                        : payment.employee
                          ? "Staff"
                          : "Broker"}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {payment.type === "receive"
                      ? payment.customer?.name || "Unknown"
                      : payment.employee
                        ? payment.employee?.name || "Unknown"
                        : payment.supplier?.name || "Unknown"}
                  </h3>
                  <p className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                    <Calendar size={14} />{" "}
                    {new Date(payment.date).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0.5">Amount</p>
                  <p
                    className={`text-lg font-bold ${payment.type === "receive" ? "text-green-600" : "text-red-500"}`}
                  >
                    {payment.type === "receive" ? "+" : "-"} Rs.{" "}
                    {payment.amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100 space-y-2">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500 text-xs">Cash Account</span>
                  <span className="font-bold text-blue-700 flex items-center gap-1">
                    <Wallet size={14} /> {payment.cashAccountId?.name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500 text-xs">Payment Method</span>
                  <span className="font-medium text-gray-700 capitalize flex items-center gap-1">
                    <CreditCard size={14} /> {payment.method}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 text-xs block mb-1">
                    Notes / Details
                  </span>
                  <p className="font-medium text-gray-700">
                    {payment.notes || "No details provided"}
                  </p>
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => openModal(payment)}
                    className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors border border-blue-100"
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeletingId(payment._id);
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
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col"
            style={{ maxHeight: "90vh" }}
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? "Edit Payment" : "Add New Payment"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 space-y-5 text-sm overflow-y-auto custom-scrollbar flex-1"
            >
              <div className="flex gap-4">
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.type === "receive" ? "border-green-500 bg-green-50 text-green-700 font-bold" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="receive"
                    checked={formData.type === "receive"}
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={editingId}
                  />
                  <ArrowDownLeft size={18} /> Receive (Cash In)
                </label>
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.type === "pay" ? "border-orange-500 bg-orange-50 text-orange-700 font-bold" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="pay"
                    checked={formData.type === "pay"}
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={editingId}
                  />
                  <ArrowUpRight size={18} /> Send (Cash Out)
                </label>
              </div>

              {/* 🔥 NAYA: Payee Toggle (Agar type 'pay' hai) */}
              {formData.type === "pay" && !editingId && (
                <div className="flex gap-4 bg-gray-50 p-2 rounded-lg border border-gray-200 mt-2">
                  <label className="flex-1 flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 p-1">
                    <input
                      type="radio"
                      value="supplier"
                      checked={payeeType === "supplier"}
                      onChange={(e) => setPayeeType(e.target.value)}
                      className="accent-orange-600"
                    />
                    Broker / Supplier
                  </label>
                  <label className="flex-1 flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 p-1">
                    <input
                      type="radio"
                      value="employee"
                      checked={payeeType === "employee"}
                      onChange={(e) => setPayeeType(e.target.value)}
                      className="accent-orange-600"
                    />
                    Staff / Employee
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {formData.type === "receive" ? (
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Select Customer (To Receive From) *
                    </label>
                    <select
                      name="customer"
                      value={formData.customer}
                      onChange={handleInputChange}
                      required
                      disabled={editingId}
                      className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none ${editingId ? "bg-gray-100" : "bg-white focus:ring-2 focus:ring-green-500"}`}
                    >
                      <option value="">-- Choose Customer --</option>
                      {customers.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : payeeType === "supplier" ? (
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Select Broker/Supplier (To Pay To) *
                    </label>
                    <select
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      required
                      disabled={editingId}
                      className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none ${editingId ? "bg-gray-100" : "bg-white focus:ring-2 focus:ring-orange-500"}`}
                    >
                      <option value="">-- Choose Broker --</option>
                      {suppliers.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Select Staff / Employee (To Pay To) *
                    </label>
                    <select
                      name="employee"
                      value={formData.employee}
                      onChange={handleInputChange}
                      required
                      disabled={editingId}
                      className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none ${editingId ? "bg-gray-100" : "bg-white focus:ring-2 focus:ring-orange-500"}`}
                    >
                      <option value="">-- Choose Staff --</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  {formData.type === "receive"
                    ? "Received By (Select Account) *"
                    : "Paid From (Select Account) *"}
                </label>
                <select
                  name="cashAccountId"
                  value={formData.cashAccountId}
                  onChange={handleInputChange}
                  required
                  disabled={editingId}
                  className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none ${editingId ? "bg-gray-100" : "bg-white focus:ring-2 focus:ring-blue-500"}`}
                >
                  <option value="">-- Choose Cash Account --</option>
                  {cashAccounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.name} (Bal: Rs.{acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold text-lg text-gray-800"
                    placeholder="0"
                  />
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Payment Method
                  </label>
                  <select
                    name="method"
                    value={formData.method}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer / Online</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Details / Notes
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder={
                      payeeType === "employee"
                        ? "e.g. August Salary"
                        : "e.g. Cash collected"
                    }
                  />
                </div>
              </div>
            </form>

            <div className="p-4 flex justify-end gap-3 border-t border-gray-100 shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-4 py-2 bg-[#0a5228] text-white rounded-lg font-medium transition-colors ${isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-green-800"}`}
              >
                {isSubmitting
                  ? "Saving..."
                  : editingId
                    ? "Update Payment"
                    : "Save Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL HIDDEN */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Delete Payment?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure? Deleting this will reverse the account balance
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

export default Payments;
