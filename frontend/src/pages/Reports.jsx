import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
} from "lucide-react";

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState("today");
  const [customDates, setCustomDates] = useState({
    startDate: "",
    endDate: "",
  });

  const fetchReports = async (start = "", end = "") => {
    try {
      setLoading(true);
      let query = "";
      if (start && end) {
        query = `?startDate=${start}&endDate=${end}`;
      }
      const { data } = await axios.get(
        `https://asia-poultry-api.onrender.com/api/reports${query}`,
        { withCredentials: true },
      );
      setReportData(data);
    } catch (error) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (e) => {
    const value = e.target.value;
    setDateRange(value);

    if (value === "custom") return;

    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (value === "today") {
      start = today;
    } else if (value === "week") {
      start.setDate(today.getDate() - 7);
    } else if (value === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (value === "all") {
      start = "";
      end = "";
    }

    if (start && end) {
      fetchReports(
        start.toISOString().split("T")[0],
        end.toISOString().split("T")[0],
      );
    } else {
      fetchReports();
    }
  };

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (!customDates.startDate || !customDates.endDate)
      return toast.error("Select both dates");
    fetchReports(customDates.startDate, customDates.endDate);
  };

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetchReports(today, today);
  }, []);

  const getReportDateText = () => {
    if (dateRange === "today") return new Date().toLocaleDateString("en-GB");
    if (dateRange === "week") return "Last 7 Days";
    if (dateRange === "month") return "This Month";
    if (dateRange === "all") return "All Time / Lifetime";
    if (dateRange === "custom")
      return `${customDates.startDate || "Start Date"} to ${customDates.endDate || "End Date"}`;
    return "";
  };

  const handlePrint = () => {
    window.print();
  };

  const netProfit = reportData
    ? reportData.sales.amount -
      reportData.purchases.amount -
      reportData.expenses
    : 0;
  const isProfit = netProfit >= 0;

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden print:bg-white print:m-0 print:p-0">
      {/* PRINT HEADER */}
      <div className="hidden print:block mb-6 text-center border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-black text-gray-900 uppercase">
          Asia Poultry Business
        </h1>
        <h2 className="text-xl font-bold text-gray-700 mt-2">
          Financial Summary Report
        </h2>
        <p className="text-md font-medium text-gray-500 mt-1 uppercase">
          Period: <span className="text-blue-600">{getReportDateText()}</span>
        </p>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Activity size={24} className="text-blue-600" /> Business Reports
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Financial summary and analytics
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center w-full xl:w-auto gap-3">
          <select
            value={dateRange}
            onChange={handleDateFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-700 w-full sm:w-auto"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="all">All Time / Lifetime</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {dateRange === "custom" && (
            <form
              onSubmit={handleCustomDateSubmit}
              className="flex gap-2 w-full sm:w-auto"
            >
              <input
                type="date"
                value={customDates.startDate}
                onChange={(e) =>
                  setCustomDates({ ...customDates, startDate: e.target.value })
                }
                className="px-2 py-2 border rounded-lg outline-none text-sm w-full"
              />
              <input
                type="date"
                value={customDates.endDate}
                onChange={(e) =>
                  setCustomDates({ ...customDates, endDate: e.target.value })
                }
                className="px-2 py-2 border rounded-lg outline-none text-sm w-full"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
              >
                Go
              </button>
            </form>
          )}

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={18} /> Print PDF
          </button>
        </div>
      </div>

      {loading || !reportData ? (
        <div className="text-center p-10 text-gray-500">
          Generating report...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5">
                <TrendingUp size={100} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                  <TrendingUp size={20} />
                </div>
                <h3 className="font-bold text-gray-600">Total Sales</h3>
              </div>
              <p className="text-2xl font-black text-gray-800">
                Rs. {reportData.sales.amount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Weight Sold:{" "}
                <span className="text-blue-600">
                  {reportData.sales.weight} KG
                </span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5">
                <TrendingDown size={100} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                  <TrendingDown size={20} />
                </div>
                <h3 className="font-bold text-gray-600">Total Purchases</h3>
              </div>
              <p className="text-2xl font-black text-gray-800">
                Rs. {reportData.purchases.amount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Weight Bought:{" "}
                <span className="text-orange-600">
                  {reportData.purchases.weight} KG
                </span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden border-b-4 border-b-green-500">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-green-50 p-2 rounded-lg text-green-600">
                  <ArrowDownLeft size={20} />
                </div>
                <h3 className="font-bold text-gray-600">Cash Received (IN)</h3>
              </div>
              <p className="text-2xl font-black text-green-600">
                Rs. {reportData.payments.received.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">From Customers</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden border-b-4 border-b-red-500">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-red-50 p-2 rounded-lg text-red-600">
                  <ArrowUpRight size={20} />
                </div>
                <h3 className="font-bold text-gray-600">Cash Paid (OUT)</h3>
              </div>
              <p className="text-2xl font-black text-red-600">
                Rs. {reportData.payments.paid.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                To Suppliers / Brokers
              </p>
            </div>

            {/* 🔥 FIX: Expenses Card with Breakdown */}
            <div className="bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-700 relative overflow-hidden md:col-span-1 lg:col-span-2">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gray-700 p-2 rounded-lg text-white">
                    <CreditCard size={20} />
                  </div>
                  <h3 className="font-bold text-gray-300 text-lg">
                    Total Expenses
                  </h3>
                </div>
                <p className="text-3xl font-black text-white mb-4">
                  Rs. {reportData.expenses.toLocaleString()}
                </p>

                {reportData.expenseDetails &&
                  Object.keys(reportData.expenseDetails).length > 0 && (
                    <div className="mt-auto pt-4 border-t border-gray-700 space-y-2">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-2">
                        Category Breakdown:
                      </p>
                      {Object.entries(reportData.expenseDetails).map(
                        ([cat, amt]) => (
                          <div
                            key={cat}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="text-gray-300">{cat}</span>
                            <span className="text-white font-medium">
                              Rs. {amt.toLocaleString()}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
              </div>
            </div>

            <div
              className={`p-5 rounded-xl shadow-sm border relative overflow-hidden md:col-span-1 lg:col-span-2 ${isProfit ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200" : "bg-gradient-to-r from-red-50 to-red-100 border-red-200"}`}
            >
              <div className="flex flex-col justify-center h-full">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`p-2 rounded-lg text-white ${isProfit ? "bg-green-600" : "bg-red-600"}`}
                  >
                    <DollarSign size={20} />
                  </div>
                  <h3
                    className={`font-bold text-lg ${isProfit ? "text-green-800" : "text-red-800"}`}
                  >
                    {isProfit ? "Net Profit" : "Net Loss"}
                  </h3>
                </div>
                <p
                  className={`text-sm mt-1 mb-3 ${isProfit ? "text-green-700" : "text-red-700"}`}
                >
                  (Sales - Purchases - Expenses)
                </p>
                <p
                  className={`text-3xl font-black ${isProfit ? "text-green-700" : "text-red-700"}`}
                >
                  {isProfit ? "+" : "-"} Rs.{" "}
                  {Math.abs(netProfit).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 2. PRINT VIEW */}
          <div className="hidden print:block w-full">
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr className="border-b-2 border-gray-200">
                  <td className="py-4 px-2 font-bold text-gray-800 text-lg flex items-center gap-2">
                    Total Sales
                  </td>
                  <td className="py-4 px-2 text-gray-600 font-medium">
                    Weight Sold: {reportData.sales.weight} KG
                  </td>
                  <td className="py-4 px-2 font-black text-right text-gray-900 text-xl">
                    Rs. {reportData.sales.amount.toLocaleString()}
                  </td>
                </tr>

                <tr className="border-b-2 border-gray-200">
                  <td className="py-4 px-2 font-bold text-gray-800 text-lg flex items-center gap-2">
                    Total Purchases
                  </td>
                  <td className="py-4 px-2 text-gray-600 font-medium">
                    Weight Bought: {reportData.purchases.weight} KG
                  </td>
                  <td className="py-4 px-2 font-black text-right text-gray-900 text-xl">
                    Rs. {reportData.purchases.amount.toLocaleString()}
                  </td>
                </tr>

                <tr className="border-b-2 border-gray-200">
                  <td className="py-4 px-2 font-bold text-gray-800 text-lg flex items-center gap-2">
                    Cash Received (IN)
                  </td>
                  <td className="py-4 px-2 text-gray-600 font-medium">
                    From Customers
                  </td>
                  <td className="py-4 px-2 font-black text-right text-green-700 text-xl">
                    Rs. {reportData.payments.received.toLocaleString()}
                  </td>
                </tr>

                <tr className="border-b-2 border-gray-200">
                  <td className="py-4 px-2 font-bold text-gray-800 text-lg flex items-center gap-2">
                    Cash Paid (OUT)
                  </td>
                  <td className="py-4 px-2 text-gray-600 font-medium">
                    To Suppliers / Brokers
                  </td>
                  <td className="py-4 px-2 font-black text-right text-red-700 text-xl">
                    Rs. {reportData.payments.paid.toLocaleString()}
                  </td>
                </tr>

                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td className="py-4 px-2 font-bold text-gray-800 text-lg flex items-center gap-2">
                    Total Expenses
                  </td>
                  <td className="py-4 px-2 text-gray-600 font-medium">
                    Utility, Salary, Fuel, etc.
                  </td>
                  <td className="py-4 px-2 font-black text-right text-gray-900 text-xl">
                    Rs. {reportData.expenses.toLocaleString()}
                  </td>
                </tr>

                {/* 🔥 NAYA: Expense Details in Print */}
                {reportData.expenseDetails &&
                  Object.entries(reportData.expenseDetails).map(
                    ([cat, amt]) => (
                      <tr
                        key={cat}
                        className="border-b border-gray-100 bg-gray-50/50"
                      >
                        <td className="py-2 px-2 pl-8 text-gray-600 font-medium text-sm">
                          ↳ {cat}
                        </td>
                        <td className="py-2 px-2 text-gray-500 text-sm">
                          Category Total
                        </td>
                        <td className="py-2 px-2 text-right text-gray-800 font-bold text-sm">
                          Rs. {amt.toLocaleString()}
                        </td>
                      </tr>
                    ),
                  )}

                <tr
                  className={`border-t-4 ${isProfit ? "border-green-600 bg-green-50" : "border-red-600 bg-red-50"}`}
                >
                  <td
                    className={`py-6 px-4 font-bold text-xl flex items-center gap-2 ${isProfit ? "text-green-800" : "text-red-800"}`}
                  >
                    {isProfit ? "NET PROFIT" : "NET LOSS"}
                  </td>
                  <td
                    className={`py-6 px-4 font-medium ${isProfit ? "text-green-700" : "text-red-700"}`}
                  >
                    (Sales - Purchases - Expenses)
                  </td>
                  <td
                    className={`py-6 px-4 font-black text-right text-2xl ${isProfit ? "text-green-700" : "text-red-700"}`}
                  >
                    {isProfit ? "+" : "-"} Rs.{" "}
                    {Math.abs(netProfit).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-20 flex justify-between items-center border-t border-gray-300 pt-4">
              <p className="text-gray-500 text-sm">
                System Generated Report - Asia Poultry Business
              </p>
              <div className="text-center w-48">
                <div className="border-b border-gray-800 pb-8"></div>
                <p className="text-gray-800 font-bold mt-2">
                  Authorized Signature
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
