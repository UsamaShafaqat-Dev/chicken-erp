import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Package,
  TrendingUp,
  Calendar,
  Scale,
  DollarSign,
  Search,
  X,
  Printer,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";

const Stock = () => {
  const [stockData, setStockData] = useState({
    totalPurchased: 0,
    totalSold: 0,
    currentStock: 0,
    history: [],
  });
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const printRef = useRef(null);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const { data } = await axios.get("https://asia-poultry-api.onrender.com//api/stock", {
          withCredentials: true,
        });
        setStockData(data);
      } catch (error) {
        console.error("Failed to fetch stock", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, []);

  const getPartyName = (record) => {
    if (record.party && typeof record.party === "object")
      return record.party.name;
    if (record.supplier && typeof record.supplier === "object")
      return record.supplier.name;
    if (record.customer && typeof record.customer === "object")
      return record.customer.name;
    return record.party || record.supplier || record.customer || "Unknown";
  };

  const onlyPurchases = stockData.history.filter(
    (record) => record.type === "IN",
  );

  const filteredPurchases = onlyPurchases.filter((record) => {
    const recordDate = new Date(record.date).toISOString().split("T")[0];
    if (startDate && recordDate < startDate) return false;
    if (endDate && recordDate > endDate) return false;
    return true;
  });

  const totalFilteredKG = filteredPurchases.reduce(
    (sum, record) => sum + (Number(record.weight) || 0),
    0,
  );

  const totalFilteredAmount = filteredPurchases.reduce((sum, record) => {
    const rate = record.rate || 0;
    const amount = record.totalAmount || record.weight * rate || 0;
    return sum + amount;
  }, 0);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  // 🔥 NAYA: Print Functionality
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Purchase_Report_${startDate || "Start"}_to_${endDate || "End"}`,
  });

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header & Print Button */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Broker Purchases & Stock
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track your poultry purchases and total investment
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Printer size={18} /> Print / PDF Report
          </button>
        </div>
      </div>

      {/* Date Range Filter Box */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto text-gray-700 font-medium text-sm">
          <Calendar size={18} className="text-blue-500" />
          Filter by Date:
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-gray-500">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-full"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-gray-500">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 w-full"
            />
          </div>
        </div>

        {(startDate || endDate) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors ml-auto w-full sm:w-auto justify-center"
          >
            <X size={16} /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center p-10 text-gray-500">
          Loading purchase details...
        </div>
      ) : (
        /* 🔥 PRINTABLE AREA START (Is div ke andar jo hai wo print hoga) */
        <div
          ref={printRef}
          className="print:p-6 print:bg-white print:w-full space-y-6"
        >
          {/* 🔥 PRINT ONLY HEADER (صرف پرنٹ میں نظر آئے گا) */}
          <div className="hidden print:block text-center mb-8 border-b-2 border-gray-800 pb-4">
            <h1 className="text-3xl font-black text-gray-900 mb-1">
              ASIA POULTRY BUSINESS
            </h1>
            <p className="text-gray-600 text-lg mb-2 font-medium">
              Purchase Stock Report
            </p>
            <p className="text-gray-500 text-sm font-bold bg-gray-100 inline-block px-3 py-1 rounded">
              {startDate || endDate
                ? `Date Range: ${startDate ? new Date(startDate).toLocaleDateString("en-GB") : "Start"} to ${endDate ? new Date(endDate).toLocaleDateString("en-GB") : "End"}`
                : "All Time Purchases"}
            </p>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden print:border-gray-300">
              <p className="text-gray-500 text-sm font-medium mb-1 flex items-center gap-1.5">
                <TrendingUp size={16} className="text-blue-500" /> Total
                Purchased
              </p>
              <h3 className="text-2xl font-bold text-gray-800">
                {totalFilteredKG.toLocaleString()}{" "}
                <span className="text-sm text-gray-500 font-medium">KG</span>
              </h3>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden print:border-gray-300">
              <p className="text-gray-500 text-sm font-medium mb-1 flex items-center gap-1.5">
                <DollarSign size={16} className="text-green-500" /> Total Amount
              </p>
              <h3 className="text-2xl font-bold text-blue-700">
                Rs. {totalFilteredAmount.toLocaleString()}
              </h3>
            </div>

            {/* Print mein available stock hide kar dain takay sirf report pe focus ho */}
            <div className="p-5 rounded-xl shadow-sm border flex flex-col relative overflow-hidden bg-[#0a5228] border-green-800 print:hidden">
              <p className="text-green-50 text-sm font-medium mb-1 flex items-center gap-1.5">
                <Package size={16} /> Current Warehouse Stock
              </p>
              <h3 className="text-3xl font-bold text-white">
                {stockData.currentStock.toLocaleString()}{" "}
                <span className="text-base text-green-100 font-medium">KG</span>
              </h3>
            </div>
          </div>

          {/* PURCHASE HISTORY TABLE */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden print:shadow-none print:border-gray-300">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between print:border-gray-300">
              <div className="flex items-center gap-2">
                <Search size={18} className="text-gray-500 print:hidden" />
                <h3 className="font-bold text-gray-800">
                  Detailed Purchase Records
                </h3>
              </div>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded print:bg-transparent print:text-gray-800 print:p-0">
                Total Records: {filteredPurchases.length}
              </span>
            </div>

            {/* DESKTOP & PRINT TABLE VIEW */}
            <div className="hidden sm:block print:block w-full">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 print:bg-gray-100 print:border-gray-300">
                    <th className="px-4 py-3 font-bold w-32">Date</th>
                    <th className="px-4 py-3 font-bold">
                      Broker Name / Details
                    </th>
                    <th className="px-4 py-3 font-bold text-right w-32">
                      Weight (KG)
                    </th>
                    <th className="px-4 py-3 font-bold text-right w-40">
                      Amount (Rs)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center p-8 text-gray-500 border-b print:border-gray-300"
                      >
                        No purchase records found.
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map((record, index) => {
                      const rate = record.rate || 0;
                      const amount =
                        record.totalAmount || record.weight * rate || 0;

                      return (
                        <tr
                          key={index}
                          className="border-b border-gray-50 hover:bg-gray-50 print:border-gray-200"
                        >
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {new Date(record.date).toLocaleDateString("en-GB")}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">
                            <span className="uppercase font-bold text-blue-900 print:text-gray-900">
                              {getPartyName(record)}
                            </span>
                            <span className="text-gray-500 ml-2 text-xs tracking-wider bg-gray-100 px-2 py-1 rounded print:bg-transparent print:p-0">
                              ({record.weight} KG * Rs. {rate})
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-right text-blue-600 print:text-gray-900">
                            {record.weight} KG
                          </td>
                          <td className="px-4 py-3 font-bold text-right text-gray-800">
                            {amount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS VIEW (Hidden in Print) */}
            <div className="sm:hidden flex flex-col print:hidden">
              {filteredPurchases.length === 0 ? (
                <div className="text-center p-8 text-gray-500 text-sm border-b">
                  No purchase records found.
                </div>
              ) : (
                filteredPurchases.map((record, index) => {
                  const rate = record.rate || 0;
                  const amount =
                    record.totalAmount || record.weight * rate || 0;

                  return (
                    <div
                      key={index}
                      className={`p-4 flex flex-col gap-3 ${index !== filteredPurchases.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-blue-900 uppercase">
                            {getPartyName(record)}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 tracking-wider">
                            ({record.weight} KG * Rs. {rate})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-0.5">
                            {new Date(record.date).toLocaleDateString("en-GB")}
                          </p>
                          <p className="font-bold text-blue-600">
                            {record.weight} KG
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded border border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Total Amount:
                        </span>
                        <span className="font-bold text-gray-800">
                          Rs. {amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 🔥 PRINT ONLY FOOTER (صرف پرنٹ کے صفحے کے آخر میں نظر آئے گا) */}
          <div className="hidden print:flex mt-10 pt-6 border-t border-gray-300 justify-between items-center text-xs text-gray-500">
            <p className="font-bold">Generated by ASIA POULTRY BUSINESS</p>
            <p>Printed on: {new Date().toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;
