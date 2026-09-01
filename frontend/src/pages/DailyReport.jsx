import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import {
  FileText,
  Printer,
  CheckSquare,
  Square,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";

const DailyReport = () => {
  const [reportData, setReportData] = useState({
    sales: { amount: 0, weight: 0 },
    purchases: { amount: 0, weight: 0 },
    expenseDetails: {},
  });

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(false);

  // 🔥 Client ki requirement ke mutabiq Expense Checkboxes ki state
  const [selectedExpenses, setSelectedExpenses] = useState({});

  const printRef = useRef(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "http://129.121.140.57:5000/api/reports",
        {
          params: { startDate, endDate },
          withCredentials: true,
        },
      );
      setReportData(data);

      // Auto-select all expenses by default when data loads
      const defaultSelections = {};
      if (data.expenseDetails) {
        Object.keys(data.expenseDetails).forEach((key) => {
          defaultSelections[key] = true;
        });
      }
      setSelectedExpenses(defaultSelections);
    } catch (error) {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const handleExpenseToggle = (category) => {
    setSelectedExpenses((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Calculations for Net Profit
  const totalSaleAmount = reportData.sales.amount || 0;
  const totalPurchaseAmount = reportData.purchases.amount || 0;

  const totalSelectedExpenseAmount = Object.keys(
    reportData.expenseDetails || {},
  ).reduce((sum, key) => {
    if (selectedExpenses[key]) {
      return sum + reportData.expenseDetails[key];
    }
    return sum;
  }, 0);

  const netProfit =
    totalSaleAmount - totalPurchaseAmount - totalSelectedExpenseAmount;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Daily_Report_${startDate}_to_${endDate}`,
  });

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto overflow-hidden">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-blue-600" /> Daily Profit & Loss Report
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Filter your daily sales, purchases, and custom expenses.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
        >
          <Printer size={18} /> Print Report
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-gray-600">Start:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-50 border border-gray-200 p-2 rounded-lg outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-gray-600">End:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-50 border border-gray-200 p-2 rounded-lg outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center p-10 text-gray-500 bg-white rounded-xl shadow-sm">
          Loading report...
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT SIDE: Checkboxes for Expenses (Client's specific requirement) */}
          <div className="w-full lg:w-1/3 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 text-lg">
              Include Expenses
            </h3>

            {Object.keys(reportData.expenseDetails || {}).length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">
                No expenses found for these dates.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(reportData.expenseDetails).map(
                  ([category, amount]) => (
                    <label
                      key={category}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {selectedExpenses[category] ? (
                          <CheckSquare className="text-blue-600" size={20} />
                        ) : (
                          <Square className="text-gray-300" size={20} />
                        )}
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedExpenses[category] || false}
                          onChange={() => handleExpenseToggle(category)}
                        />
                        <span className="font-medium text-gray-700 text-sm">
                          {category}
                        </span>
                      </div>
                      <span className="font-bold text-red-500 text-sm">
                        Rs. {amount.toLocaleString()}
                      </span>
                    </label>
                  ),
                )}
              </div>
            )}

            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100 flex justify-between items-center">
              <span className="text-sm font-bold text-red-700">
                Total Deducted:
              </span>
              <span className="text-lg font-black text-red-600">
                Rs. {totalSelectedExpenseAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: Printable Report Paper */}
          <div
            className="w-full lg:w-2/3 bg-white p-6 sm:p-10 rounded-xl shadow-sm border border-gray-100"
            ref={printRef}
          >
            <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
              <h1 className="text-3xl font-black text-gray-900 mb-1">
                ASIA POULTRY BUSINESS
              </h1>
              <p className="text-gray-600 font-bold uppercase tracking-wider text-sm">
                Summary & Profit Report
              </p>
              <p className="text-blue-600 font-bold mt-2 text-sm bg-blue-50 inline-block px-3 py-1 rounded-full">
                {startDate} <span className="text-gray-400">TO</span> {endDate}
              </p>
            </div>

            <div className="space-y-6">
              {/* Sales Section */}
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg text-green-600">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-bold uppercase">
                      Total Sales
                    </p>
                    <p className="text-xs text-green-700 font-medium">
                      Weight: {reportData.sales.weight} KG
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-green-700">
                    Rs. {totalSaleAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Purchases Section */}
              <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <TrendingDown size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-bold uppercase">
                      Total Purchases
                    </p>
                    <p className="text-xs text-orange-700 font-medium">
                      Weight: {reportData.purchases.weight} KG
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-orange-700">
                    - Rs. {totalPurchaseAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Selected Expenses Section */}
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-lg text-red-600">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-bold uppercase">
                      Selected Expenses
                    </p>
                    <p className="text-xs text-red-700 font-medium">
                      Checkboxes selected:{" "}
                      {Object.values(selectedExpenses).filter(Boolean).length}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-red-600">
                    - Rs. {totalSelectedExpenseAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* NET PROFIT SECTION */}
              <div
                className={`mt-8 p-6 rounded-2xl border-2 flex justify-between items-center ${netProfit >= 0 ? "bg-green-600 border-green-700" : "bg-red-600 border-red-700"}`}
              >
                <div>
                  <p className="text-white/80 font-bold uppercase tracking-wider text-sm">
                    Net Profit / Loss
                  </p>
                  <p className="text-white/90 text-xs mt-1">
                    Sale - (Purchase + Expenses)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-white">
                    Rs. {netProfit.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center text-xs text-gray-400 font-medium border-t border-gray-100 pt-4 hidden print:block">
              Software Developed by Oxege Technologies - Printed on{" "}
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReport;
