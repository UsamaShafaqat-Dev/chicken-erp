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
  Package,
} from "lucide-react";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

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

  const todayDateStr = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, customersRes, purchasesRes, paymentsRes] =
        await Promise.all([
          axios.get("http://129.121.140.57:5000/api/sales", {
            withCredentials: true,
          }),
          axios.get("http://129.121.140.57:5000/api/customers", {
            withCredentials: true,
          }),
          axios.get("http://129.121.140.57:5000/api/purchases", {
            withCredentials: true,
          }),
          axios.get("http://129.121.140.57:5000/api/payments", {
            withCredentials: true,
          }),
        ]);
      setSales(salesRes.data);
      setCustomers(customersRes.data.filter((c) => c.status !== "inactive"));
      setPurchases(purchasesRes.data);
      setPayments(paymentsRes.data);
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
        `http://129.121.140.57:5000/api/daily-rates/${dateStr}`,
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
    fetchRatesForDate(toDate);
  }, [toDate]);

  const handleSaveRates = async () => {
    if (!toDate) return toast.error("Please select a date first");
    try {
      setSavingRates(true);
      await axios.post(
        "http://129.121.140.57:5000/api/daily-rates",
        {
          date: toDate,
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
    if (isSubmitting) return;
    if (!formData.customer || !formData.weight || !formData.rate)
      return toast.error("Customer, Weight, and Rate are required");

    setIsSubmitting(true);
    try {
      if (editingId) {
        await axios.put(
          `http://129.121.140.57:5000/api/sales/${editingId}`,
          formData,
          { withCredentials: true },
        );
        toast.success("Sale updated successfully");
      } else {
        await axios.post(
          "http://129.121.140.57:5000/api/sales",
          formData,
          {
            withCredentials: true,
          },
        );
        toast.success("Sale added successfully");
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
        `http://129.121.140.57:5000/api/sales/${deletingId}`,
        {
          withCredentials: true,
        },
      );
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
    const matchFrom = fromDate ? saleDate >= fromDate : true;
    const matchTo = toDate ? saleDate <= toDate : true;

    return matchName && matchFrom && matchTo;
  });

  const enhancedSales = filteredSales.map((sale) => {
    return {
      ...sale,
      displayPaid: Number(sale.paidAmount) || 0,
      displayBalance: Number(sale.balanceDue) || 0,
      entryDateStr: new Date(sale.date).toISOString().split("T")[0],
    };
  });

  const filteredPurchases = purchases.filter((p) => {
    const pDate = new Date(p.date).toISOString().split("T")[0];
    const matchFrom = fromDate ? pDate >= fromDate : true;
    const matchTo = toDate ? pDate <= toDate : true;
    return matchFrom && matchTo;
  });

  const filteredRecoveries = payments.filter((p) => {
    if (p.type !== "receive") return false;
    const pDate = new Date(p.date).toISOString().split("T")[0];
    const matchFrom = fromDate ? pDate >= fromDate : true;
    const matchTo = toDate ? pDate <= toDate : true;
    return matchFrom && matchTo;
  });

  const totalPurchasedWeight = filteredPurchases.reduce(
    (sum, p) => sum + (Number(p.weight) || 0),
    0,
  );
  const totalWeight = enhancedSales.reduce(
    (sum, sale) => sum + (Number(sale.weight) || 0),
    0,
  );
  const totalAmount = enhancedSales.reduce(
    (sum, sale) => sum + (Number(sale.totalAmount) || 0),
    0,
  );

  const salesPaid = filteredSales.reduce(
    (sum, sale) => sum + (Number(sale.paidAmount) || 0),
    0,
  );

  const recoveryPaid = filteredRecoveries.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0,
  );

  const totalPaid = salesPaid + recoveryPaid;
  const netUdhaar = totalAmount - totalPaid;

  const tablePaidAmount = enhancedSales.reduce(
    (sum, sale) => sum + (Number(sale.displayPaid) || 0),
    0,
  );
  const tableOutstanding = enhancedSales.reduce(
    (sum, sale) => sum + (Number(sale.displayBalance) || 0),
    0,
  );

  const shortageWeight = Number(
    (totalPurchasedWeight - totalWeight).toFixed(2),
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 w-full min-w-0 print:bg-white print:m-0 print:p-0 overflow-hidden print:overflow-visible">
      <div className="hidden print:block mb-8 text-center border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-black text-gray-900 uppercase">
          Asia Poultry Business
        </h1>
        <h2 className="text-lg font-bold text-gray-600 mt-1">
          Sales Report:{" "}
          {fromDate ? new Date(fromDate).toLocaleDateString("en-GB") : "Start"}{" "}
          TO {toDate ? new Date(toDate).toLocaleDateString("en-GB") : "End"}
        </h2>

        {toDate && (
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

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 print:hidden">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-blue-600" />
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
              Purchased
            </p>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">
            {totalPurchasedWeight} KG
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={16} className="text-green-600" />
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
              Sold (KG)
            </p>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">
            {totalWeight} KG
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-200 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-red-500" />
            <p className="text-[11px] uppercase tracking-wider text-red-500 font-bold">
              Shortage
            </p>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-red-600">
            {shortageWeight} KG
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-purple-600" />
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
              Sale Amount
            </p>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">
            Rs. {totalAmount.toLocaleString()}
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center relative group cursor-pointer hover:border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-teal-600" />
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
              Total Cash Received
            </p>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">
            Rs. {totalPaid.toLocaleString()}
          </h3>
          <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded hidden group-hover:block whitespace-nowrap z-10 shadow-lg border border-gray-700">
            Sale Cash: Rs. {salesPaid.toLocaleString()} <br /> Payment Recovery:
            Rs. {recoveryPaid.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} className="text-orange-500" />
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
              Net Udhaar
            </p>
          </div>
          <h3
            className={`text-lg sm:text-xl font-bold ${netUdhaar > 0 ? "text-red-600" : "text-green-600"}`}
          >
            Rs. {netUdhaar.toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-gray-100 p-2 rounded-lg flex-1 min-w-[200px] flex items-center gap-2">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search customer..."
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="bg-gray-100 p-2 rounded-lg flex items-center gap-2 border-2 border-transparent focus-within:border-blue-400 transition-colors flex-1 sm:flex-none">
              <span className="text-xs text-gray-500 font-bold">From:</span>
              <input
                type="date"
                className="bg-transparent border-none outline-none text-sm w-full text-gray-700 cursor-pointer font-bold"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="bg-gray-100 p-2 rounded-lg flex items-center gap-2 border-2 border-transparent focus-within:border-blue-400 transition-colors flex-1 sm:flex-none">
              <span className="text-xs text-gray-500 font-bold">To:</span>
              <input
                type="date"
                className="bg-transparent border-none outline-none text-sm w-full text-gray-700 cursor-pointer font-bold"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-100 rounded-lg shrink-0"
                title="Clear Dates"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-4 border-t border-gray-100 pt-4">
          <div className="flex flex-wrap items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 gap-y-2 max-w-full overflow-hidden text-sm">
            <div className="flex items-center">
              <span className="text-xs font-bold text-blue-800 mr-2">
                BWP Rate:
              </span>
              <input
                type="number"
                placeholder="0"
                value={dailyRates.bahawalpurRate}
                onChange={(e) =>
                  setDailyRates({
                    ...dailyRates,
                    bahawalpurRate: e.target.value,
                  })
                }
                className="w-14 sm:w-16 px-1.5 py-1 text-xs sm:text-sm border border-blue-200 rounded outline-none focus:border-blue-500 font-bold text-center"
              />
            </div>

            <div className="w-px h-5 bg-blue-200 mx-2 hidden sm:block"></div>

            <div className="flex items-center">
              <span className="text-xs font-bold text-green-800 mr-2">
                Supply Rate:
              </span>
              <input
                type="number"
                placeholder="0"
                value={dailyRates.supplyRate}
                onChange={(e) =>
                  setDailyRates({ ...dailyRates, supplyRate: e.target.value })
                }
                className="w-14 sm:w-16 px-1.5 py-1 text-xs sm:text-sm border border-green-200 rounded outline-none focus:border-green-500 font-bold text-center"
              />
            </div>

            <button
              onClick={handleSaveRates}
              disabled={savingRates}
              className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded transition-colors ml-2 mr-3"
              title="Save Daily Rates"
            >
              <Save size={16} />
            </button>

            <div className="w-px h-5 bg-blue-200 mx-1 hidden lg:block"></div>

            <div className="flex items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0 px-1 border-t lg:border-none border-blue-200 pt-2 lg:pt-0">
              <span className="text-[11px] sm:text-xs font-bold text-gray-700">
                Purchased:{" "}
                <span className="text-blue-700">{totalPurchasedWeight}</span>
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-gray-700">
                Sold: <span className="text-green-700">{totalWeight}</span>
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-gray-700">
                Shortage:{" "}
                <span className="text-red-600">{shortageWeight} KG</span>
              </span>
            </div>
          </div>

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
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden print:border-none print:shadow-none print:overflow-visible">
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
              ) : enhancedSales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-gray-500">
                    {fromDate || toDate
                      ? "No sales found for selected dates."
                      : "No sales records found."}
                  </td>
                </tr>
              ) : (
                enhancedSales.map((sale) => (
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
                      Rs. {sale.displayPaid.toLocaleString()}
                    </td>
                    <td
                      className={`px-3 py-4 print:py-2 font-bold whitespace-nowrap print:text-black ${sale.displayBalance > 0 ? "text-red-500" : "text-gray-600"}`}
                    >
                      {sale.displayBalance > 0
                        ? `Rs. ${sale.displayBalance.toLocaleString()}`
                        : "Nil"}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap print:hidden">
                      <div className="flex justify-center items-center gap-1.5">
                        {/* 🔥 FIX: Owner ko Edit+Delete dikhega. Staff ko Edit dikhega (agar date aaj ki hai). */}
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
                        ) : sale.entryDateStr === todayDateStr ? (
                          <button
                            onClick={() => openModal(sale)}
                            className="flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2 py-1.5 rounded text-xs font-medium transition-colors"
                          >
                            <Edit size={14} /> Edit
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded font-bold uppercase tracking-wider">
                            Locked
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="table-row-group bg-gray-100 font-bold text-black border-t-2 border-gray-300">
              <tr>
                <td colSpan="2" className="px-3 py-3 text-right">
                  TOTAL (TABLE):
                </td>
                <td className="px-3 py-3">{totalWeight} KG</td>
                <td className="px-3 py-3">-</td>
                <td className="px-3 py-3">
                  Rs. {totalAmount.toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  Rs. {tablePaidAmount.toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  Rs. {tableOutstanding.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="lg:hidden flex flex-col print:hidden">
          {enhancedSales.map((sale, index) => (
            <div
              key={sale._id}
              className={`p-4 flex flex-col gap-4 ${index !== enhancedSales.length - 1 ? "border-b border-gray-100" : ""}`}
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
                      Rs. {sale.displayPaid.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">
                      Outstanding Balance
                    </p>
                    <p
                      className={`font-bold ${sale.displayBalance > 0 ? "text-red-500" : "text-gray-600"}`}
                    >
                      {sale.displayBalance > 0
                        ? `Rs. ${sale.displayBalance.toLocaleString()}`
                        : "Nil"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {/* 🔥 FIX: Mobile view logic */}
                {isOwner ? (
                  <>
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
                  </>
                ) : sale.entryDateStr === todayDateStr ? (
                  <button
                    onClick={() => openModal(sale)}
                    className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors border border-blue-100"
                  >
                    <Edit size={16} /> Edit
                  </button>
                ) : (
                  <div className="flex-1 text-center bg-gray-100 text-gray-500 py-2 rounded-lg text-sm font-bold uppercase tracking-widest border border-gray-200">
                    🔒 Locked (Old Entry)
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

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
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-4 py-2 bg-[#0a5228] text-white rounded-lg hover:bg-green-800 font-medium flex items-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isSubmitting
                  ? "Saving..."
                  : editingId
                    ? "Update Sale"
                    : "Save Sale"}
              </button>
            </div>
          </div>
        </div>
      )}

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
