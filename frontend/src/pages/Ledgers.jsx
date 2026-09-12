import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  Printer,
  FileText,
  User,
  Truck,
  Calendar,
  Phone,
  X,
  Download,
  ChevronDown,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";

const Ledgers = () => {
  const [partyType, setPartyType] = useState("customer");
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔥 NAYA: Searchable Dropdown States
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const printRef = useRef(null);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const endpoint =
          partyType === "customer" ? "/api/customers" : "/api/suppliers";
        const { data } = await axios.get(
          `https://asiapoultrybusiness.com${endpoint}`,
          {
            withCredentials: true,
          },
        );
        setParties(data.filter((p) => p.status !== "inactive"));
        setSelectedParty("");
        setSearchQuery(""); // Clear search when type changes
        setLedgerData(null);
      } catch (error) {
        toast.error("Failed to fetch list");
      }
    };
    fetchParties();
  }, [partyType]);

  // Dropdown ko baahar click karne par band karna
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const generateLedger = async () => {
    if (!selectedParty) return toast.error("Please select a party first");

    try {
      setLoading(true);

      let apiUrl = `https://asiapoultrybusiness.com/api/ledgers?type=${partyType}&id=${selectedParty}`;
      if (fromDate) apiUrl += `&startDate=${fromDate}`;
      if (toDate) apiUrl += `&endDate=${toDate}`;

      const { data } = await axios.get(apiUrl, { withCredentials: true });

      setLedgerData(data);
    } catch (error) {
      toast.error("Failed to generate ledger");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ledger_Statement_${new Date().toISOString().split("T")[0]}`,
  });

  const finalBalance =
    ledgerData?.transactions?.length > 0
      ? ledgerData.transactions[ledgerData.transactions.length - 1].balance
      : ledgerData?.party?.currentBalance || 0;

  const handleExportExcel = () => {
    if (!ledgerData || !ledgerData.transactions) {
      return toast.error("No data available to export");
    }

    let tableHTML = `
      <html xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid black; padding: 5px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header-title { font-size: 20px; font-weight: bold; text-align: center; background-color: #ffffff; }
            .party-name { font-size: 16px; font-weight: bold; text-align: center; background-color: #ffffff; }
            .balance-row { font-weight: bold; background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th colspan="5" class="header-title">ASIA POULTRY BUSINESS - Account Ledger</th>
              </tr>
              <tr>
                <th colspan="5" class="party-name">Party Name: ${ledgerData.party.name}</th>
              </tr>
              <tr>
                <th colspan="5" class="party-name">Report Date: ${new Date().toLocaleDateString("en-GB")}</th>
              </tr>
              <tr>
                <th>Date</th>
                <th>Particulars / Details</th>
                <th>Debit (Dr)</th>
                <th>Credit (Cr)</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
    `;

    ledgerData.transactions.forEach((tx) => {
      const date = new Date(tx.date).toLocaleDateString("en-GB");
      const particulars = tx.particulars || "";
      const debit = tx.debit > 0 ? tx.debit : "-";
      const credit = tx.credit > 0 ? tx.credit : "-";
      const balance = tx.balance;

      tableHTML += `
        <tr>
          <td>${date}</td>
          <td>${particulars}</td>
          <td>${debit}</td>
          <td>${credit}</td>
          <td>${balance}</td>
        </tr>
      `;
    });

    tableHTML += `
            <tr class="balance-row">
              <td colspan="4" style="text-align: right;">Closing Balance:</td>
              <td>${finalBalance}</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>`;

    const blob = new Blob([tableHTML], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${ledgerData.party.name.replace(/\s+/g, "_")}_Khata.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🔥 Filter logic
  const filteredParties = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.area && p.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.mobile && p.mobile.includes(searchQuery)),
  );

  const selectedPartyDetails = parties.find((p) => p._id === selectedParty);

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Filters Section */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileText size={20} /> Account Ledgers (Khata)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {/* Account Type */}
          <div className="w-full">
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Account Type
            </label>
            <div className="flex gap-2">
              <label
                className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border-2 cursor-pointer transition-all ${partyType === "customer" ? "border-green-500 bg-green-50 text-green-700 font-bold" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                <input
                  type="radio"
                  name="partyType"
                  value="customer"
                  checked={partyType === "customer"}
                  onChange={(e) => setPartyType(e.target.value)}
                  className="hidden"
                />
                <User size={16} /> Customer
              </label>
              <label
                className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border-2 cursor-pointer transition-all ${partyType === "supplier" ? "border-orange-500 bg-orange-50 text-orange-700 font-bold" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                <input
                  type="radio"
                  name="partyType"
                  value="supplier"
                  checked={partyType === "supplier"}
                  onChange={(e) => setPartyType(e.target.value)}
                  className="hidden"
                />
                <Truck size={16} /> Supplier
              </label>
            </div>
          </div>

          {/* Party Name (Searchable Dropdown) */}
          <div className="w-full relative" ref={dropdownRef}>
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Select Name
            </label>
            <div
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex justify-between items-center focus:ring-2 focus:ring-green-500"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span
                className={`block truncate ${selectedPartyDetails ? "text-gray-900 font-medium" : "text-gray-500"}`}
              >
                {selectedPartyDetails
                  ? `${selectedPartyDetails.name} (${selectedPartyDetails.area || selectedPartyDetails.mobile})`
                  : "-- Choose from list --"}
              </span>
              <ChevronDown size={16} className="text-gray-500 shrink-0 ml-2" />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                <div className="p-2 border-b border-gray-100 sticky top-0 bg-white rounded-t-lg">
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500 text-sm bg-gray-50"
                      placeholder="Search name, area..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredParties.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 text-center font-medium">
                      No match found
                    </div>
                  ) : (
                    filteredParties.map((p) => (
                      <div
                        key={p._id}
                        className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-green-50 border-b border-gray-50 last:border-0 ${selectedParty === p._id ? "bg-green-50 text-green-700 font-bold" : "text-gray-700 font-medium"}`}
                        onClick={() => {
                          setSelectedParty(p._id);
                          setIsDropdownOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        {p.name}{" "}
                        <span className="text-gray-500 text-xs ml-1 font-normal">
                          ({p.area || p.mobile})
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* From Date */}
          <div className="w-full">
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
            />
          </div>

          {/* To Date */}
          <div className="w-full flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-1 text-sm">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
              />
            </div>
            {/* Clear Dates Button */}
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-100 hover:bg-red-50 rounded-lg shrink-0"
                title="Clear Dates"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Submit Button */}
          <div className="sm:col-span-2 lg:col-span-4 mt-2">
            <button
              onClick={generateLedger}
              disabled={loading}
              className="w-full bg-[#0a5228] hover:bg-green-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Search size={18} />{" "}
              {loading ? "Loading..." : "Generate Statement"}
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Report Section */}
      {ledgerData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
          {/* Action Bar */}
          <div className="bg-gray-50 p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <h3 className="font-bold text-gray-800 text-sm sm:text-base">
              Statement Preview
            </h3>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportExcel}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Download size={16} /> Save as Excel
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer size={16} /> Print / PDF
              </button>
            </div>
          </div>

          {/* Printable Area */}
          <div
            ref={printRef}
            className="p-4 sm:p-8 bg-white print:p-4 print:w-full"
          >
            {/* Print Header */}
            <div className="text-center mb-6 sm:mb-8 border-b-2 border-gray-800 pb-4">
              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 mb-1">
                ASIA POULTRY BUSINESS
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mb-3 font-medium">
                Account Statement (Ledger)
              </p>

              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold text-gray-800">
                <span className="flex items-center gap-1">
                  <Phone size={14} /> 0305-7074775
                </span>
                <span className="hidden sm:inline text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <Phone size={14} /> 0315-4235909
                </span>
                <span className="hidden sm:inline text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <Phone size={14} /> 0309-3464424
                </span>
              </div>
            </div>

            {/* Party Details */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 print:flex-row print:items-end print:gap-0">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1 uppercase font-bold">
                  {partyType === "customer"
                    ? "Customer Details:"
                    : "Supplier Details:"}
                </p>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                  {ledgerData.party.name}
                </h2>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">
                  {ledgerData.party.mobile}{" "}
                  {ledgerData.party.area ? `| ${ledgerData.party.area}` : ""}
                </p>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {ledgerData.party.address}
                </p>
                {(fromDate || toDate) && (
                  <p className="text-blue-700 font-bold text-xs sm:text-sm mt-2 bg-blue-50 inline-block px-2 py-1 rounded">
                    Period:{" "}
                    {fromDate
                      ? new Date(fromDate).toLocaleDateString("en-GB")
                      : "Start"}{" "}
                    To{" "}
                    {toDate
                      ? new Date(toDate).toLocaleDateString("en-GB")
                      : "End"}
                  </p>
                )}
              </div>
              <div className="text-left sm:text-right print:text-right bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg w-full sm:w-auto">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 uppercase font-bold">
                  Closing Balance:
                </p>

                <h2
                  className={`text-xl sm:text-2xl font-black ${finalBalance > 0 ? "text-red-600" : "text-gray-800"}`}
                >
                  Rs. {finalBalance.toLocaleString()}
                </h2>

                <p className="text-gray-500 text-[10px] sm:text-xs uppercase">
                  As of{" "}
                  {toDate
                    ? new Date(toDate).toLocaleDateString("en-GB")
                    : "Today"}
                </p>
              </div>
            </div>

            {/* DESKTOP & PRINT TABLE VIEW */}
            <div className="hidden sm:block print:block w-full">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 border-y-2 border-gray-800 text-gray-800">
                    <th className="px-3 py-3 font-bold w-24 sm:w-32">Date</th>
                    <th className="px-3 py-3 font-bold">
                      Particulars / Details
                    </th>
                    <th className="px-3 py-3 font-bold text-right w-24 sm:w-28">
                      Debit (Dr)
                    </th>
                    <th className="px-3 py-3 font-bold text-right w-24 sm:w-28">
                      Credit (Cr)
                    </th>
                    <th className="px-3 py-3 font-bold text-right w-28 sm:w-32">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerData.transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-6 text-gray-500 font-medium"
                      >
                        No records found for this date range.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.transactions.map((tx, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap text-xs sm:text-sm">
                          <Calendar
                            size={12}
                            className="inline mr-1 text-gray-400"
                          />{" "}
                          {new Date(tx.date).toLocaleDateString("en-GB")}
                        </td>
                        <td className="px-3 py-3 text-gray-800 font-medium text-xs sm:text-sm">
                          {tx.particulars}
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-gray-700 text-xs sm:text-sm">
                          {tx.debit > 0 ? tx.debit.toLocaleString() : "-"}
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-gray-700 text-xs sm:text-sm">
                          {tx.credit > 0 ? tx.credit.toLocaleString() : "-"}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-gray-900 text-xs sm:text-sm">
                          {tx.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS VIEW */}
            <div className="sm:hidden flex flex-col print:hidden">
              <div className="border-y-2 border-gray-800 bg-gray-100 px-3 py-2 text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                Transaction History
              </div>
              {ledgerData.transactions.length === 0 ? (
                <div className="text-center py-6 text-gray-500 font-medium bg-gray-50 rounded-lg mt-2">
                  No records found for this period.
                </div>
              ) : (
                ledgerData.transactions.map((tx, index) => (
                  <div key={index} className="border-b border-gray-200 py-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1 font-medium bg-gray-100 px-2 py-0.5 rounded">
                        <Calendar size={12} />{" "}
                        {new Date(tx.date).toLocaleDateString("en-GB")}
                      </span>
                      <span className="font-bold text-gray-900 text-sm">
                        Bal: {tx.balance.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-800 mb-3">
                      {tx.particulars}
                    </p>
                    <div className="flex gap-2 text-sm">
                      <div className="flex-1 bg-red-50/50 p-2 rounded-lg border border-red-100">
                        <span className="text-[10px] uppercase text-gray-500 block mb-0.5 font-bold">
                          Debit (Dr)
                        </span>
                        <span className="font-bold text-gray-800">
                          {tx.debit > 0 ? tx.debit.toLocaleString() : "-"}
                        </span>
                      </div>
                      <div className="flex-1 bg-green-50/50 p-2 rounded-lg border border-green-100">
                        <span className="text-[10px] uppercase text-gray-500 block mb-0.5 font-bold">
                          Credit (Cr)
                        </span>
                        <span className="font-bold text-gray-800">
                          {tx.credit > 0 ? tx.credit.toLocaleString() : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Print Footer */}
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 text-center text-gray-500 text-[10px] sm:text-xs flex flex-col sm:flex-row justify-between items-center gap-2">
              <p>Generated by ASIA POULTRY BUSINESS</p>
              <p>Date: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ledgers;
