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
  ShoppingCart,
  DollarSign,
  Wallet,
  AlertCircle,
  Printer,
  Save,
} from "lucide-react";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [dailyRates, setDailyRates] = useState({
    bahawalpurRate: "",
    supplyRate: "",
  });
  const [savingRates, setSavingRates] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    customer: "",
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
      const [salesRes, customersRes] = await Promise.all([
        axios.get("https://asia-poultry-api.onrender.com/api/sales", { withCredentials: true }),
        axios.get("https://asia-poultry-api.onrender.com/api/customers", {
          withCredentials: true,
        }),
      ]);
      setSales(salesRes.data);
      setCustomers(customersRes.data.filter((c) => c.status !== "inactive"));
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRatesForDate = async (dateStr) => {
    if (!dateStr) return setDailyRates({ bahawalpurRate: "", supplyRate: "" });
    try {
      const { data } = await axios.get(
        `https://asia-poultry-api.onrender.com/api/daily-rates/${dateStr}`,
        { withCredentials: true },
      );
      setDailyRates({
        bahawalpurRate: data.bahawalpurRate || "",
        supplyRate: data.supplyRate || "",
      });
    } catch (error) {
      console.log("Failed to fetch rates");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchRatesForDate(filterDate);
  }, [filterDate]);

  const handleSaveRates = async () => {
    if (!filterDate) return toast.error("Please select a date first");
    try {
      setSavingRates(true);
      await axios.post(
        "https://asia-poultry-api.onrender.com/api/daily-rates",
        {
          date: filterDate,
          bahawalpurRate: Number(dailyRates.bahawalpurRate),
          supplyRate: Number(dailyRates.supplyRate),
        },
        { withCredentials: true },
      );
      toast.success("Rates saved for this date!");
    } catch (error) {
      toast.error("Failed to save rates");
    } finally {
      setSavingRates(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === "weight" || name === "rate" || name === "paidAmount") {
      const weight = parseFloat(newFormData.weight) || 0;
      const rate = parseFloat(newFormData.rate) || 0;
      const paidAmount = parseFloat(newFormData.paidAmount) || 0;

      const totalAmount = weight * rate;
      const balanceDue = totalAmount - paidAmount;

      newFormData.totalAmount = totalAmount;
      newFormData.balanceDue = balanceDue;
    }
    setFormData(newFormData);
  };

  const openModal = (sale = null) => {
    if (sale) {
      setFormData({
        customer: sale.customer?._id || "",
        weight: sale.weight,
        rate: sale.rate,
        totalAmount: sale.totalAmount,
        paidAmount: sale.paidAmount,
        balanceDue: sale.balanceDue,
        paymentMethod: sale.paymentMethod || "cash",
        date: new Date(sale.date).toISOString().split("T")[0],
        notes: sale.notes || "",
      });
      setEditingId(sale._id);
    } else {
      setFormData({
        customer: "",
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
    if (!formData.customer || !formData.weight || !formData.rate)
      return toast.error("Customer, Weight, and Rate are required");

    try {
      if (editingId) {
        await axios.put(
          `https://asia-poultry-api.onrender.com/api/sales/${editingId}`,
          formData,
          { withCredentials: true },
        );
        toast.success("Sale updated successfully");
      } else {
        await axios.post("https://asia-poultry-api.onrender.com/api/sales", formData, {
          withCredentials: true,
        });
        toast.success("Sale added successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`https://asia-poultry-api.onrender.com/api/sales/${deletingId}`, {
        withCredentials: true,
      });
      toast.success("Sale deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete sale");
    }
  };

  const filteredSales = sales.filter((s) => {
    const matchName = s.customer?.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const saleDate = new Date(s.date).toISOString().split("T")[0];
    const matchDate = filterDate ? saleDate === filterDate : true;

    return matchName && matchDate;
  });

  const totalWeight = filteredSales.reduce(
    (sum, sale) => sum + (Number(sale.weight) || 0),
    0,
  );
  const totalAmount = filteredSales.reduce(
    (sum, sale) => sum + (Number(sale.totalAmount) || 0),
    0,
  );
  const totalPaid = filteredSales.reduce(
    (sum, sale) => sum + (Number(sale.paidAmount) || 0),
    0,
  );
  const totalOutstanding = filteredSales.reduce(
    (sum, sale) => sum + (Number(sale.balanceDue) || 0),
    0,
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    // 🔥 FIX: print:overflow-visible lagaya ta k lamba table bhi theek se print ho aglay page par
    <div className="space-y-6 w-full min-w-0 print:bg-white print:m-0 print:p-0 overflow-hidden print:overflow-visible">
      {/* Print Header */}
      <div className="hidden print:block mb-8 text-center border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-black text-gray-900 uppercase">
          Asia Poultry Business
        </h1>
        <h2 className="text-lg font-bold text-gray-600 mt-1">
          Daily Sales Report:{" "}
          {filterDate
            ? new Date(filterDate).toLocaleDateString("en-GB")
            : "All Time"}
        </h2>

        {filterDate && (
          <div className="flex justify-center gap-12 mt-4 bg-gray-100 p-3 rounded-lg border border-gray-300">
            <p className="font-bold text-lg text-gray-800">
              BAHAWALPUR RATE:{" "}
              <span className="text-blue-700">
                Rs. {dailyRates.bahawalpurRate || "0"}
              </span>
            </p>
            <p className="font-bold text-lg text-gray-800">
              SUPPLY RATE:{" "}
              <span className="text-green-700">
                Rs. {dailyRates.supplyRate || "0"}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards Report */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Sold (KG)</p>
            <h3 className="text-xl font-bold text-gray-800">
              {totalWeight} KG
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">
              Total Sale Amount
            </p>
            <h3 className="text-xl font-bold text-gray-800">
              Rs. {totalAmount.toLocaleString()}
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-full text-purple-600">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Cash Received</p>
            <h3 className="text-xl font-bold text-gray-800">
              Rs. {totalPaid.toLocaleString()}
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-full text-red-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pending Udhaar</p>
            <h3 className="text-xl font-bold text-gray-800">
              Rs. {totalOutstanding.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 print:hidden">
        {/* Search aur Date Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-gray-100 p-2 rounded-lg w-full sm:w-64 flex items-center gap-2">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search customer..."
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="bg-gray-100 p-2 rounded-lg w-full sm:w-48 flex items-center gap-2 border-2 border-transparent focus-within:border-blue-400 transition-colors">
            <Calendar size={18} className="text-blue-500 shrink-0" />
            <input
              type="date"
              className="bg-transparent border-none outline-none text-sm w-full text-gray-700 cursor-pointer font-bold"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {filterDate && (
          <div className="flex flex-row items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 shrink-0 whitespace-nowrap overflow-hidden">
            <span className="text-xs font-bold text-blue-800 mr-2 shrink-0">
              BWP Rate:
            </span>
            <input
              type="number"
              placeholder="0"
              value={dailyRates.bahawalpurRate}
              onChange={(e) =>
                setDailyRates({ ...dailyRates, bahawalpurRate: e.target.value })
              }
              className="w-16 px-1.5 py-1 text-sm border border-blue-200 rounded outline-none focus:border-blue-500 font-bold text-center shrink-0"
            />

            <div className="w-px h-5 bg-blue-200 mx-3 shrink-0"></div>

            <span className="text-xs font-bold text-green-800 mr-2 shrink-0">
              Supply Rate:
            </span>
            <input
              type="number"
              placeholder="0"
              value={dailyRates.supplyRate}
              onChange={(e) =>
                setDailyRates({ ...dailyRates, supplyRate: e.target.value })
              }
              className="w-16 px-1.5 py-1 text-sm border border-green-200 rounded outline-none focus:border-green-500 font-bold text-center shrink-0"
            />

            <button
              onClick={handleSaveRates}
              disabled={savingRates}
              className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded transition-colors ml-3 shrink-0"
              title="Save Daily Rates"
            >
              <Save size={16} />
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={18} /> Print
          </button>
          <button
            onClick={() => openModal()}
            className="flex-1 sm:flex-none bg-[#0a5228] hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Add Sale
          </button>
        </div>
      </div>

      {/* 🔥 FIX: Yahan print:overflow-visible lagaya hai ta k print mein table gayab na ho */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden print:border-none print:shadow-none print:overflow-visible">
        {/* DESKTOP TABLE VIEW */}
        {/* 🔥 FIX: Yahan print:block lagaya hai ta k ye print screen par laazmi show ho, beshak mobile size assume kare */}
        <div className="hidden lg:block print:block w-full overflow-x-auto pb-2 print:overflow-visible custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm print:text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 print:bg-gray-200 print:text-black">
                <th className="px-3 py-4 print:py-2 font-medium whitespace-nowrap">
                  Date
                </th>
                <th className="px-3 py-4 print:py-2 font-medium whitespace-nowrap">
                  Customer Name
                </th>
                <th className="px-3 py-4 print:py-2 font-medium whitespace-nowrap">
                  Weight (KG)
                </th>
                <th className="px-3 py-4 print:py-2 font-medium whitespace-nowrap">
                  Rate
                </th>
                <th className="px-3 py-4 print:py-2 font-medium whitespace-nowrap">
                  Total Amount
                </th>
                <th className="px-3 py-4 print:py-2 font-medium whitespace-nowrap">
                  Paid Amount
                </th>
                <th className="px-3 py-4 print:py-2 font-medium whitespace-nowrap">
                  Outstanding
                </th>
                <th className="px-3 py-4 print:py-2 font-medium text-center whitespace-nowrap print:hidden">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-gray-500">
                    Loading sales...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-gray-500">
                    {filterDate
                      ? "No sales found for this date."
                      : "No sales records found."}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr
                    key={sale._id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors print:border-b-2 print:border-gray-300"
                  >
                    <td className="px-3 py-4 print:py-2 text-gray-600 print:text-black whitespace-nowrap">
                      {new Date(sale.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-3 py-4 print:py-2 font-bold text-gray-800 print:text-black whitespace-nowrap">
                      <p className="truncate max-w-[150px] print:max-w-none print:whitespace-normal">
                        {sale.customer?.name || "Unknown"}
                      </p>
                    </td>
                    <td className="px-3 py-4 print:py-2 text-gray-800 font-medium print:text-black whitespace-nowrap">
                      {sale.weight} KG
                    </td>
                    <td className="px-3 py-4 print:py-2 text-gray-600 print:text-black whitespace-nowrap">
                      Rs. {sale.rate}
                    </td>
                    <td className="px-3 py-4 print:py-2 text-blue-600 font-bold print:text-black whitespace-nowrap">
                      Rs. {sale.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-3 py-4 print:py-2 text-green-600 font-medium print:text-black whitespace-nowrap">
                      Rs. {sale.paidAmount.toLocaleString()}
                    </td>
                    <td
                      className={`px-3 py-4 print:py-2 font-bold whitespace-nowrap print:text-black ${sale.balanceDue > 0 ? "text-red-500" : "text-gray-600"}`}
                    >
                      {sale.balanceDue > 0
                        ? `Rs. ${sale.balanceDue.toLocaleString()}`
                        : "Nil"}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap print:hidden">
                      <div className="flex justify-center items-center gap-1.5">
                        {isOwner ? (
                          <>
                            <button
                              onClick={() => openModal(sale)}
                              className="flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2 py-1.5 rounded text-xs font-medium transition-colors"
                            >
                              <Edit size={14} /> Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeletingId(sale._id);
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
            {/* 🔥 FIX: print:table-row-group lagaya ta k footer totals theek se print hon */}
            <tfoot className="hidden print:table-row-group bg-gray-100 font-bold text-black border-t-4 border-gray-800">
              <tr>
                <td colSpan="2" className="px-3 py-3 text-right">
                  TOTAL:
                </td>
                <td className="px-3 py-3">{totalWeight} KG</td>
                <td className="px-3 py-3">-</td>
                <td className="px-3 py-3">
                  Rs. {totalAmount.toLocaleString()}
                </td>
                <td className="px-3 py-3">Rs. {totalPaid.toLocaleString()}</td>
                <td className="px-3 py-3">
                  Rs. {totalOutstanding.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* MOBILE CARDS VIEW */}
        <div className="lg:hidden flex flex-col print:hidden">
          {filteredSales.map((sale, index) => (
            <div
              key={sale._id}
              className={`p-4 flex flex-col gap-4 ${index !== filteredSales.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {sale.customer?.name || "Unknown"}
                  </h3>
                  <p className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                    <Calendar size={14} />{" "}
                    {new Date(sale.date).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
                  <p className="text-sm font-bold text-blue-600">
                    Rs. {sale.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Weight</p>
                  <p className="font-medium flex items-center gap-1">
                    <Scale size={14} /> {sale.weight} KG
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Rate</p>
                  <p className="font-medium">Rs. {sale.rate}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-200 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Paid Amount</p>
                    <p className="font-medium text-green-600">
                      Rs. {sale.paidAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">
                      Outstanding Balance
                    </p>
                    <p
                      className={`font-bold ${sale.balanceDue > 0 ? "text-red-500" : "text-gray-600"}`}
                    >
                      {sale.balanceDue > 0
                        ? `Rs. ${sale.balanceDue.toLocaleString()}`
                        : "Nil"}
                    </p>
                  </div>
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(sale)}
                    className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors border border-blue-100"
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeletingId(sale._id);
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div
            className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col"
            style={{ maxHeight: "90vh" }}
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? "Edit Sale" : "Add New Sale"}
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
              className="p-5 space-y-4 text-sm overflow-y-auto custom-scrollbar flex-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Select Customer *
                  </label>
                  <select
                    name="customer"
                    value={formData.customer}
                    onChange={handleInputChange}
                    required
                    disabled={editingId}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none ${editingId ? "bg-gray-100 text-gray-500" : "focus:ring-2 focus:ring-green-500 bg-white"}`}
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.mobile})
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
                    Outstanding Due (Auto)
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
                    {formData.paymentMethod === "bank"
                      ? "Bank Details / Slip No"
                      : "Notes / Vehicle No"}
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder={
                      formData.paymentMethod === "bank"
                        ? "e.g. Meezan Bank TXN-123"
                        : "Optional notes..."
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
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-4 py-2 bg-[#0a5228] text-white rounded-lg hover:bg-green-800 font-medium flex items-center gap-2"
              >
                {editingId ? "Update Sale" : "Save Sale"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Delete Sale?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure? Deleting this will reverse the customer's balance
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

export default Sales;
