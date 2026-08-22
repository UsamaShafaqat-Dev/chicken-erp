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
} from "lucide-react";
import { useReactToPrint } from "react-to-print";

const Ledgers = () => {
  const [partyType, setPartyType] = useState("customer");
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState("");
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);

  const printRef = useRef(null);

  useEffect(() => {
    const fetchParties = async () => {
      try {
        const endpoint =
          partyType === "customer" ? "/api/customers" : "/api/suppliers";
        const { data } = await axios.get(`https://asia-poultry-api.onrender.com/${endpoint}`, {
          withCredentials: true,
        });
        setParties(data.filter((p) => p.status !== "inactive"));
        setSelectedParty("");
        setLedgerData(null);
      } catch (error) {
        toast.error("Failed to fetch list");
      }
    };
    fetchParties();
  }, [partyType]);

  const generateLedger = async () => {
    if (!selectedParty) return toast.error("Please select a party first");

    try {
      setLoading(true);
      const { data } = await axios.get(
        `https://asia-poultry-api.onrender.com//api/ledgers?type=${partyType}&id=${selectedParty}`,
        { withCredentials: true },
      );
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

  // 🔥 NAYA FIX: Table ke aakhri record se pakka balance nikalne ki logic
  const finalBalance =
    ledgerData?.transactions?.length > 0
      ? ledgerData.transactions[ledgerData.transactions.length - 1].balance
      : ledgerData?.party?.currentBalance || 0;

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Filters Section */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileText size={20} /> Account Ledgers (Khata)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Select Account Type
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

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Select Name
            </label>
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
            >
              <option value="">-- Choose from list --</option>
              {parties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.area || p.mobile})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
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
          <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm sm:text-base">
              Statement Preview
            </h3>
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer size={16} /> Print / PDF
            </button>
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
              </div>
              <div className="text-left sm:text-right print:text-right bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg w-full sm:w-auto">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 uppercase font-bold">
                  Current Status:
                </p>

                {/* 🔥 FIX: Yahan ab hum variable 'finalBalance' use kar rahe hain jo table se match karega */}
                <h2
                  className={`text-xl sm:text-2xl font-black ${finalBalance > 0 ? "text-red-600" : "text-gray-800"}`}
                >
                  Rs. {finalBalance.toLocaleString()}
                </h2>

                <p className="text-gray-500 text-[10px] sm:text-xs uppercase">
                  Total Outstanding
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
                  {ledgerData.transactions.map((tx, index) => (
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS VIEW */}
            <div className="sm:hidden flex flex-col print:hidden">
              <div className="border-y-2 border-gray-800 bg-gray-100 px-3 py-2 text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                Transaction History
              </div>
              {ledgerData.transactions.map((tx, index) => (
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
              ))}
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
