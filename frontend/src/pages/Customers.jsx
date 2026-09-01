import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
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
  Map,
  History,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  FileText,
} from "lucide-react";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [globalFromDate, setGlobalFromDate] = useState("");
  const [globalToDate, setGlobalToDate] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerStartDate, setLedgerStartDate] = useState("");
  const [ledgerEndDate, setLedgerEndDate] = useState("");

  const printRef = useRef(null);
  const mainPrintRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    whatsapp: "",
    area: "",
    address: "",
    openingBalance: 0,
    notes: "",
  });

  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const isOwner = userInfo?.role === "owner";

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const [custRes, salesRes, payRes] = await Promise.all([
        axios.get("https://asiapoultrybusiness.com/api/customers", {
          withCredentials: true,
        }),
        axios.get("https://asiapoultrybusiness.com/api/sales", {
          withCredentials: true,
        }),
        axios.get("https://asiapoultrybusiness.com/api/payments", {
          withCredentials: true,
        }),
      ]);
      setCustomers(custRes.data);
      setAllSales(salesRes.data);
      setAllPayments(payRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const openModal = (customer = null) => {
    if (customer) {
      setFormData({
        name: customer.name,
        mobile: customer.mobile || "",
        whatsapp: customer.whatsapp || "",
        area: customer.area || "",
        address: customer.address || "",
        openingBalance: customer.openingBalance,
        notes: customer.notes || "",
      });
      setEditingId(customer._id);
    } else {
      setFormData({
        name: "",
        mobile: "",
        whatsapp: "",
        area: "",
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
    if (isSubmitting) return;

    if (!formData.name || !formData.area) {
      return toast.error("Name and Area are required");
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await axios.put(
          `https://asiapoultrybusiness.com/api/customers/${editingId}`,
          formData,
          { withCredentials: true },
        );
        toast.success("Customer updated successfully");
      } else {
        await axios.post(
          "https://asiapoultrybusiness.com/api/customers",
          formData,
          { withCredentials: true },
        );
        toast.success("Customer added successfully");
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `https://asiapoultrybusiness.com/api/customers/${deletingId}`,
        { withCredentials: true },
      );
      toast.success("Customer deleted successfully");
      setIsDeleteModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete customer");
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

  const openLedger = async (customer) => {
    setSelectedCustomer(customer);
    setLedgerStartDate("");
    setLedgerEndDate("");
    setIsLedgerModalOpen(true);
    setLedgerLoading(true);
    try {
      const cSales = allSales
        .filter((s) => (s.customer?._id || s.customer) === customer._id)
        .map((s) => ({ ...s, isSale: true, ledgerDate: s.date }));

      const cPayments = allPayments
        .filter(
          (p) =>
            p.type === "receive" &&
            (p.customer?._id || p.customer) === customer._id,
        )
        .map((p) => ({ ...p, isPayment: true, ledgerDate: p.date }));

      let combined = [...cSales, ...cPayments].sort(
        (a, b) => new Date(b.ledgerDate) - new Date(a.ledgerDate),
      );
      setLedgerData(combined);
    } catch (err) {
      toast.error("Failed to load customer ledger");
      setIsLedgerModalOpen(false);
    } finally {
      setLedgerLoading(false);
    }
  };

  // 🔥 FIX: Recalculate accurately to avoid any Double Counting in Database!
  const processedCustomers = customers.map((customer) => {
    const cSales = allSales.filter(
      (s) => (s.customer?._id || s.customer) === customer._id,
    );
    const cPayments = allPayments.filter(
      (p) =>
        p.type === "receive" &&
        (p.customer?._id || p.customer) === customer._id,
    );

    let displayPurchases = cSales.reduce(
      (sum, s) => sum + (Number(s.totalAmount) || 0),
      0,
    );
    let displayPaid = cPayments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0,
    ); // 🔥 FIX: Sirf Payments uthayen, bill ki paid amount nahi

    if (globalFromDate || globalToDate) {
      const filteredSales = cSales.filter((s) => {
        const sDate = new Date(s.date).toISOString().split("T")[0];
        if (globalFromDate && sDate < globalFromDate) return false;
        if (globalToDate && sDate > globalToDate) return false;
        return true;
      });

      const filteredPayments = cPayments.filter((p) => {
        const pDate = new Date(p.date).toISOString().split("T")[0];
        if (globalFromDate && pDate < globalFromDate) return false;
        if (globalToDate && pDate > globalToDate) return false;
        return true;
      });

      displayPurchases = filteredSales.reduce(
        (sum, s) => sum + (Number(s.totalAmount) || 0),
        0,
      );
      displayPaid = filteredPayments.reduce(
        (sum, p) => sum + (Number(p.amount) || 0),
        0,
      ); // 🔥 FIX
    }

    let displayBalance = displayPurchases - displayPaid;

    return {
      ...customer,
      displayPurchases,
      displayPaid,
      displayBalance,
    };
  });

  const filteredCustomers = processedCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.mobile && c.mobile.includes(searchQuery)) ||
      (c.area && c.area.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const marketTotalPurchases = filteredCustomers.reduce(
    (sum, c) => sum + c.displayPurchases,
    0,
  );
  const marketTotalPaid = filteredCustomers.reduce(
    (sum, c) => sum + c.displayPaid,
    0,
  );
  const marketTotalBalance = filteredCustomers.reduce(
    (sum, c) => sum + c.displayBalance,
    0,
  );

  const filteredLedger = ledgerData.filter((item) => {
    try {
      const dateStr = new Date(item.ledgerDate || Date.now())
        .toISOString()
        .split("T")[0];
      if (ledgerStartDate && dateStr < ledgerStartDate) return false;
      if (ledgerEndDate && dateStr > ledgerEndDate) return false;
      return true;
    } catch (e) {
      return true;
    }
  });

  const periodSales = filteredLedger
    .filter((x) => x.isSale)
    .reduce((sum, x) => sum + (Number(x.totalAmount) || 0), 0);
  // 🔥 FIX: Khata mein bhi double count khatam kiya
  const periodRecoveries = filteredLedger
    .filter((x) => x.isPayment)
    .reduce((sum, x) => sum + (Number(x.amount) || 0), 0);

  const totalPeriodPaid = periodRecoveries;
  const periodRemaining = periodSales - totalPeriodPaid;

  const handlePrintLedger = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Customer_Ledger_${selectedCustomer?.name}_${new Date().toISOString().split("T")[0]}`,
  });

  const handleMainPrint = useReactToPrint({
    contentRef: mainPrintRef,
    documentTitle: `Market_Summary_${new Date().toISOString().split("T")[0]}`,
  });

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 print:hidden">
        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 w-full xl:w-auto">
          <div className="bg-gray-100 p-2 rounded-lg flex-1 sm:w-64 flex items-center gap-2 w-full xl:w-auto">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, area..."
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100 w-full sm:w-auto">
            <Calendar size={18} className="text-blue-600 shrink-0" />
            <input
              type="date"
              value={globalFromDate}
              onChange={(e) => setGlobalFromDate(e.target.value)}
              className="bg-transparent text-sm text-blue-800 outline-none w-full sm:w-auto font-medium cursor-pointer"
            />
            <span className="text-blue-300">-</span>
            <input
              type="date"
              value={globalToDate}
              onChange={(e) => setGlobalToDate(e.target.value)}
              className="bg-transparent text-sm text-blue-800 outline-none w-full sm:w-auto font-medium cursor-pointer"
            />
            {(globalFromDate || globalToDate) && (
              <button
                onClick={() => {
                  setGlobalFromDate("");
                  setGlobalToDate("");
                }}
                className="text-red-500 ml-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button
            onClick={handleMainPrint}
            className="flex-1 sm:flex-none w-full sm:w-auto bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <Printer size={18} /> Print
          </button>
          <button
            onClick={() => openModal()}
            className="flex-1 sm:flex-none w-full sm:w-auto bg-[#0a5228] hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <Plus size={18} /> Add Customer
          </button>
        </div>
      </div>

      <div
        ref={mainPrintRef}
        className="print:p-6 print:bg-white print:w-full space-y-6"
      >
        <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 mb-4">
          <h1 className="text-3xl font-black text-gray-900 uppercase">
            Asia Poultry Business
          </h1>
          <h2 className="text-xl font-bold text-gray-700 mt-2">
            Market Summary & Customer Balances
          </h2>
          {globalFromDate || globalToDate ? (
            <p className="text-md font-medium text-gray-600 mt-1 uppercase bg-gray-100 inline-block px-3 py-1 rounded">
              Period:{" "}
              <span className="text-blue-700 font-bold">
                {globalFromDate
                  ? new Date(globalFromDate).toLocaleDateString("en-GB")
                  : "Start"}
              </span>{" "}
              TO{" "}
              <span className="text-blue-700 font-bold">
                {globalToDate
                  ? new Date(globalToDate).toLocaleDateString("en-GB")
                  : "End"}
              </span>
            </p>
          ) : (
            <p className="text-md font-bold text-gray-500 mt-1 uppercase bg-gray-100 inline-block px-3 py-1 rounded">
              All Time / Lifetime Balances
            </p>
          )}
        </div>

        {(globalFromDate || globalToDate) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-900 print:bg-gray-100 p-4 rounded-xl shadow-lg border border-gray-800 print:border-gray-300 text-center animate-pulse print:animate-none">
            <div>
              <p className="text-xs text-gray-400 print:text-gray-600 font-bold uppercase tracking-widest mb-1">
                Market Sales (Period)
              </p>
              <h3 className="text-xl font-black text-blue-400 print:text-blue-700">
                Rs. {marketTotalPurchases.toLocaleString()}
              </h3>
            </div>
            <div className="sm:border-l sm:border-r border-gray-700 print:border-gray-300">
              <p className="text-xs text-gray-400 print:text-gray-600 font-bold uppercase tracking-widest mb-1">
                Market Vasooli (Period)
              </p>
              <h3 className="text-xl font-black text-green-400 print:text-green-700">
                Rs. {marketTotalPaid.toLocaleString()}
              </h3>
            </div>
            <div>
              <p className="text-xs text-gray-400 print:text-gray-600 font-bold uppercase tracking-widest mb-1">
                Net Balance (Period)
              </p>
              <h3
                className={`text-xl font-black ${marketTotalBalance > 0 ? "text-red-400 print:text-red-600" : "text-gray-300 print:text-gray-800"}`}
              >
                Rs. {marketTotalBalance.toLocaleString()}
              </h3>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden print:border-none print:shadow-none">
          <div className="hidden lg:block print:block w-full">
            <table className="w-full text-left border-collapse text-xs table-auto print:text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 print:bg-gray-200 print:text-black">
                <tr>
                  <th className="px-1.5 py-3 print:py-2 font-medium">Name</th>
                  <th className="px-1.5 py-3 print:py-2 font-medium">Mobile</th>
                  <th className="px-1.5 py-3 print:py-2 font-medium">Area</th>
                  <th className="px-1.5 py-3 print:py-2 font-medium">
                    Purchases (Maal)
                  </th>
                  <th className="px-1.5 py-3 print:py-2 font-medium">
                    Paid (Vasooli)
                  </th>
                  <th className="px-1.5 py-3 print:py-2 font-medium">
                    Outstanding
                  </th>
                  <th className="px-1.5 py-3 font-medium text-center print:hidden">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center p-8 text-gray-500 text-sm"
                    >
                      Loading customers...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center p-8 text-gray-500 text-sm"
                    >
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer._id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors print:border-b print:border-gray-300"
                    >
                      <td className="px-1.5 py-3 print:py-2 font-bold text-gray-800 break-words max-w-[120px] print:max-w-none">
                        {customer.name}
                      </td>
                      <td className="px-1.5 py-3 print:py-2 text-gray-800 whitespace-nowrap">
                        {customer.mobile || "-"}
                      </td>
                      <td className="px-1.5 py-3 print:py-2 break-words max-w-[100px] print:max-w-none">
                        <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-1 rounded-md text-[10px] print:text-sm print:bg-transparent print:border-none print:p-0 font-bold">
                          <Map size={10} className="print:hidden" />{" "}
                          {customer.area || "-"}
                        </span>
                      </td>

                      <td className="px-1.5 py-3 print:py-2 text-blue-600 font-medium whitespace-nowrap">
                        Rs. {customer.displayPurchases.toLocaleString() || 0}
                      </td>
                      <td className="px-1.5 py-3 print:py-2 text-green-600 font-medium whitespace-nowrap">
                        Rs. {customer.displayPaid.toLocaleString() || 0}
                      </td>
                      <td
                        className={`px-1.5 py-3 print:py-2 font-bold whitespace-nowrap ${customer.displayBalance > 0 ? "text-red-500" : "text-gray-600"}`}
                      >
                        {customer.displayBalance > 0
                          ? `Rs. ${customer.displayBalance.toLocaleString()}`
                          : "Nil"}
                      </td>

                      <td className="px-1.5 py-3 flex justify-center items-center gap-1 whitespace-nowrap print:hidden">
                        <button
                          onClick={() => openLedger(customer)}
                          className="flex items-center gap-1 text-teal-600 bg-teal-50 hover:bg-teal-100 border border-teal-100 px-1.5 py-1 rounded text-[11px] font-medium transition-colors"
                          title="View Khata"
                        >
                          <History size={12} /> Khata
                        </button>
                        <button
                          onClick={() =>
                            handleWhatsAppClick(
                              customer.whatsapp || customer.mobile,
                            )
                          }
                          className="flex items-center gap-1 text-green-600 bg-green-50 hover:bg-green-100 border border-green-100 px-1.5 py-1 rounded text-[11px] font-medium transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle size={12} /> WA
                        </button>
                        {isOwner && (
                          <>
                            <button
                              onClick={() => openModal(customer)}
                              className="flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-1.5 py-1 rounded text-[11px] font-medium transition-colors"
                              title="Edit"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => {
                                setDeletingId(customer._id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="flex items-center gap-1 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-1.5 py-1 rounded text-[11px] font-medium transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="table-row-group bg-gray-100 print:bg-gray-200 font-bold text-black border-t-2 border-gray-300">
                <tr>
                  <td colSpan="3" className="px-1.5 py-3 text-right">
                    TOTAL MARKET:
                  </td>
                  <td className="px-1.5 py-3 text-blue-700">
                    Rs. {marketTotalPurchases.toLocaleString()}
                  </td>
                  <td className="px-1.5 py-3 text-green-700">
                    Rs. {marketTotalPaid.toLocaleString()}
                  </td>
                  <td className="px-1.5 py-3 text-red-600">
                    Rs. {marketTotalBalance.toLocaleString()}
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="lg:hidden flex flex-col print:hidden">
            {filteredCustomers.map((customer, index) => (
              <div
                key={customer._id}
                className={`p-4 flex flex-col gap-4 ${index !== filteredCustomers.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-800 text-lg">
                      {customer.name}
                    </h3>
                    <span className="flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      <Map size={12} /> {customer.area || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mt-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />{" "}
                      <span className="font-medium text-gray-700">
                        {customer.mobile || "N/A"}
                      </span>
                    </p>
                    {customer.whatsapp && (
                      <p className="flex items-center gap-2 text-green-600">
                        <MessageCircle size={14} />{" "}
                        <span className="font-medium">{customer.whatsapp}</span>
                      </p>
                    )}
                    {customer.address && (
                      <p className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />{" "}
                        {customer.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">
                      Purchases (Maal)
                    </p>
                    <p className="font-medium text-blue-600">
                      Rs. {customer.displayPurchases.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Paid (Vasooli)</p>
                    <p className="font-medium text-green-600">
                      Rs. {customer.displayPaid.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-gray-200">
                    <p className="text-gray-500 text-xs mb-1">
                      Outstanding Balance
                    </p>
                    <p
                      className={`text-base font-bold ${customer.displayBalance > 0 ? "text-red-500" : "text-gray-600"}`}
                    >
                      {customer.displayBalance > 0
                        ? `Rs. ${customer.displayBalance.toLocaleString()}`
                        : "Nil"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openLedger(customer)}
                    className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-2 rounded-lg font-medium transition-colors border border-teal-100"
                  >
                    <History size={16} /> Khata
                  </button>
                  <button
                    onClick={() =>
                      handleWhatsAppClick(customer.whatsapp || customer.mobile)
                    }
                    className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg font-medium transition-colors border border-green-100"
                  >
                    <MessageCircle size={16} /> WA
                  </button>
                  {isOwner && (
                    <>
                      <button
                        onClick={() => openModal(customer)}
                        className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium transition-colors border border-blue-100"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingId(customer._id);
                          setIsDeleteModalOpen(true);
                        }}
                        className="flex-1 flex justify-center items-center gap-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg font-medium transition-colors border border-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden print:flex mt-20 justify-between items-center border-t border-gray-300 pt-4">
          <p className="text-gray-500 text-sm">
            System Generated Report - Asia Poultry Business
          </p>
          <div className="text-center w-48">
            <div className="border-b border-gray-800 pb-8"></div>
            <p className="text-gray-800 font-bold mt-2">Authorized Signature</p>
          </div>
        </div>
      </div>

      {isLedgerModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div
            className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "90vh" }}
          >
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="text-blue-600" /> {selectedCustomer.name}{" "}
                  - Khata
                </h2>
                <p className="text-sm text-gray-500 mt-1 print:hidden">
                  View detailed sales and payments
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrintLedger}
                  disabled={ledgerLoading}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors flex items-center gap-1.5 font-bold text-sm shadow-sm"
                  title="Print Khata"
                >
                  <Printer size={18} />{" "}
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  onClick={() => setIsLedgerModalOpen(false)}
                  className="bg-white p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="bg-white px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row items-center gap-3 shrink-0 print:hidden">
              <div className="flex items-center gap-2 text-gray-600 font-medium text-xs">
                <Calendar size={14} className="text-blue-500" /> Filter Dates:
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">From</span>
                <input
                  type="date"
                  value={ledgerStartDate}
                  onChange={(e) => setLedgerStartDate(e.target.value)}
                  className="px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">To</span>
                <input
                  type="date"
                  value={ledgerEndDate}
                  onChange={(e) => setLedgerEndDate(e.target.value)}
                  className="px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-blue-400"
                />
              </div>
              {(ledgerStartDate || ledgerEndDate) && (
                <button
                  onClick={() => {
                    setLedgerStartDate("");
                    setLedgerEndDate("");
                  }}
                  className="flex items-center gap-1 text-red-500 hover:bg-red-50 px-2 py-1.5 rounded text-xs font-medium transition-colors ml-auto"
                >
                  <X size={14} /> Clear
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100 text-center shrink-0">
              <div className="bg-white p-2 rounded border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-bold">
                  Period Sales
                </p>
                <p className="text-sm font-black text-blue-600">
                  Rs. {periodSales.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-bold">
                  Period Paid
                </p>
                <p className="text-sm font-black text-green-600">
                  Rs. {totalPeriodPaid.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200">
                <p className="text-[10px] text-gray-500 uppercase font-bold">
                  Period Balance
                </p>
                <p
                  className={`text-sm font-black ${periodRemaining > 0 ? "text-red-500" : "text-gray-600"}`}
                >
                  Rs. {periodRemaining.toLocaleString()}
                </p>
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
                <p className="text-gray-600 font-bold mb-6">Customer Ledger</p>
                <div className="flex justify-between items-end text-left mt-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                      Customer Name:
                    </p>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedCustomer.name}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Printed On: {new Date().toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                      Period Balance:
                    </p>
                    <h2
                      className={`text-2xl font-black ${periodRemaining > 0 ? "text-red-600" : "text-gray-800"}`}
                    >
                      Rs. {periodRemaining.toLocaleString()}
                    </h2>
                  </div>
                </div>
              </div>

              {ledgerLoading ? (
                <div className="flex justify-center items-center h-40 print:hidden">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredLedger.length === 0 ? (
                <div className="text-center p-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200 print:border-none print:bg-white">
                  No records found for the selected period.
                </div>
              ) : (
                <div className="space-y-3 print:space-y-0 print:border-t print:border-gray-200">
                  {filteredLedger.map((tx, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:border-0 print:border-b print:border-gray-200 print:shadow-none print:rounded-none print:py-3 print:px-1"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 p-2 rounded-lg shrink-0 print:border ${tx.isPayment ? "bg-green-100 text-green-600 print:border-green-600 print:bg-white" : "bg-blue-100 text-blue-600 print:border-blue-600 print:bg-white"}`}
                        >
                          {tx.isPayment ? (
                            <ArrowDownLeft size={16} />
                          ) : (
                            <ArrowUpRight size={16} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm print:text-base">
                            {tx.isPayment
                              ? "Cash Received"
                              : "Maal Diya (Sale)"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(
                              tx.ledgerDate || Date.now(),
                            ).toLocaleDateString("en-GB")}
                            {tx.isSale && (
                              <span className="ml-2 font-bold text-gray-600">
                                ({tx.weight} KG)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right pl-11 sm:pl-0">
                        {tx.isSale ? (
                          <>
                            <p className="font-black text-blue-600 print:text-base">
                              Rs.{" "}
                              {(Number(tx.totalAmount) || 0).toLocaleString()}
                            </p>
                            {/* 🔥 FIX: UI se Paid amount nikaal di taake client double confuse na ho */}
                          </>
                        ) : (
                          <p className="font-black text-green-600 print:text-base">
                            + Rs. {(Number(tx.amount) || 0).toLocaleString()}
                          </p>
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

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col"
            style={{ maxHeight: "90vh" }}
          >
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? "Edit Customer" : "Add New Customer"}
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
              className="p-5 space-y-4 text-sm overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="e.g. Al-Rehman Chicken"
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
                    placeholder="Optional"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Area (City/Town) *
                  </label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="e.g. Rajanpur"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Detailed Address
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
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
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
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-[#0a5228] text-white rounded-lg font-medium transition-colors ${isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-green-800"}`}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId
                      ? "Update Customer"
                      : "Save Customer"}
                </button>
              </div>
            </form>
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
              Delete Customer?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete this customer? This action cannot
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

export default Customers;
