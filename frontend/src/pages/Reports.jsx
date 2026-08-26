import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
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

  const printRef = useRef(null);

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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Business_Report_${getReportDateText().replace(/ /g, "_")}`,
  });

  const netProfit = reportData
    ? reportData.sales.amount -
      reportData.purchases.amount -
      reportData.expenses
    : 0;
  const isProfit = netProfit >= 0;

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden print:bg-white print:m-0 print:p-0">
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
        <div
          ref={printRef}
          className="print:p-6 print:bg-white print:w-full space-y-6"
        >
          {/* PRINT ONLY HEADER */}
          <div className="hidden print:block mb-8 text-center border-b-2 border-gray-800 pb-4">
            <h1 className="text-3xl font-black text-gray-900 uppercase">
              Asia Poultry Business
            </h1>
            <h2 className="text-xl font-bold text-gray-700 mt-2">
              Financial Summary Report
            </h2>
            <p className="text-md font-medium text-gray-500 mt-1 uppercase">
              Period:{" "}
              <span className="text-blue-600">{getReportDateText()}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sales Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden print:border-gray-300">
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

            {/* Purchases Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden print:border-gray-300">
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

            {/* Cash IN */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-b-4 border-b-green-500 print:border-gray-300">
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

            {/* Cash OUT */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-b-4 border-b-red-500 print:border-gray-300">
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

            {/* 🔥 UPDATED: Expenses Card with Breakdown */}
            <div className="bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-700 md:col-span-1 lg:col-span-2 print:border-gray-300 print:bg-white">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gray-700 p-2 rounded-lg text-white print:text-black print:bg-gray-100">
                    <CreditCard size={20} />
                  </div>
                  <h3 className="font-bold text-gray-300 text-lg print:text-gray-800">
                    Total Expenses
                  </h3>
                </div>
                <p className="text-3xl font-black text-white mb-4 print:text-gray-900">
                  Rs. {reportData.expenses.toLocaleString()}
                </p>

                {reportData.expenseDetails ? (
                  Object.keys(reportData.expenseDetails).length > 0 ? (
                    <div className="pt-4 border-t border-gray-700 print:border-gray-300 space-y-2 mt-2">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-2 print:text-gray-600">
                        Category Breakdown:
                      </p>
                      {Object.entries(reportData.expenseDetails).map(
                        ([cat, amt]) => (
                          <div
                            key={cat}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="text-gray-300 print:text-gray-700">
                              {cat}
                            </span>
                            <span className="text-white font-medium print:text-black">
                              Rs. {amt.toLocaleString()}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-gray-700 print:border-gray-300">
                      <p className="text-sm text-gray-400 print:text-gray-500">
                        No specific breakdown found.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-xs text-orange-400 animate-pulse print:hidden">
                      Server is updating... Please wait 2 mins and refresh page.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Net Profit Card */}
            <div
              className={`p-5 rounded-xl shadow-sm border md:col-span-1 lg:col-span-2 print:border-gray-300 ${isProfit ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200 print:bg-white" : "bg-gradient-to-r from-red-50 to-red-100 border-red-200 print:bg-white"}`}
            >
              <div className="flex flex-col justify-center h-full">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`p-2 rounded-lg text-white print:text-black print:bg-gray-100 ${isProfit ? "bg-green-600" : "bg-red-600"}`}
                  >
                    <DollarSign size={20} />
                  </div>
                  <h3
                    className={`font-bold text-lg print:text-gray-800 ${isProfit ? "text-green-800" : "text-red-800"}`}
                  >
                    {isProfit ? "Net Profit" : "Net Loss"}
                  </h3>
                </div>
                <p
                  className={`text-sm mt-1 mb-3 print:text-gray-600 ${isProfit ? "text-green-700" : "text-red-700"}`}
                >
                  (Sales - Purchases - Expenses)
                </p>
                <p
                  className={`text-3xl font-black print:text-gray-900 ${isProfit ? "text-green-700" : "text-red-700"}`}
                >
                  {isProfit ? "+" : "-"} Rs.{" "}
                  {Math.abs(netProfit).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Print Footer */}
          <div className="hidden print:flex mt-20 justify-between items-center border-t border-gray-300 pt-4">
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
      )}
    </div>
  );
};

export default Reports;
