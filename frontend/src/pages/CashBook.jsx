import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Wallet,
  ArrowRightLeft,
  Plus,
  UserPlus,
  X,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  History,
} from "lucide-react";

const CashBook = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Transfer Modal States
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    particulars: "",
  });

  // Add Account Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "owner",
    initialBalance: "",
  });

  // 🔥 NAYA: Ledger History Modal States
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [selectedAccountLedger, setSelectedAccountLedger] = useState({
    accountName: "",
    balance: 0,
    transactions: [],
  });

  const fetchAccounts = async () => {
    try {
      const { data } = await axios.get(
        "https://asia-poultry-api.onrender.com/api/cash/accounts",
        {
          withCredentials: true,
        },
      );
      setAccounts(data);
    } catch (error) {
      toast.error("Failed to load cash accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Naya Account Banane ka function
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.name) return toast.error("Please enter account name");

    try {
      await axios.post(
        "https://asia-poultry-api.onrender.com/api/cash/accounts",
        newAccount,
        {
          withCredentials: true,
        },
      );
      toast.success("Cash Account Created Successfully!");
      setShowAddModal(false);
      setNewAccount({ name: "", type: "owner", initialBalance: "" });
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create account");
    }
  };

  // Transfer Cash Function
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (
      !transferData.fromAccountId ||
      !transferData.toAccountId ||
      !transferData.amount
    ) {
      return toast.error("Please fill all required fields");
    }
    if (transferData.fromAccountId === transferData.toAccountId) {
      return toast.error("Cannot transfer to the same account");
    }

    try {
      await axios.post(
        "https://asia-poultry-api.onrender.com/api/cash/transfer",
        transferData,
        {
          withCredentials: true,
        },
      );
      toast.success("Cash transferred successfully!");
      setShowTransferModal(false);
      setTransferData({
        fromAccountId: "",
        toAccountId: "",
        amount: "",
        particulars: "",
      });
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Transfer failed");
    }
  };

  // 🔥 NAYA: Kisi specific account ki history (Ledger) lana
  const handleOpenLedger = async (account) => {
    setShowLedgerModal(true);
    setLedgerLoading(true);
    setSelectedAccountLedger({
      accountName: account.name,
      balance: account.balance,
      transactions: [],
    });

    try {
      // Backend api call
      const { data } = await axios.get(
        `https://asia-poultry-api.onrender.com/api/cash/ledger/${account._id}`,
        { withCredentials: true },
      );

      // Assume API returns object with transactions array
      if (data.success && data.ledger) {
        setSelectedAccountLedger({
          accountName: account.name,
          balance: account.balance,
          transactions: data.ledger.transactions || [],
        });
      } else {
        // Fallback if data structure is different
        setSelectedAccountLedger({
          accountName: account.name,
          balance: account.balance,
          transactions: data || [],
        });
      }
    } catch (error) {
      toast.error("Failed to load account details");
      setShowLedgerModal(false);
    } finally {
      setLedgerLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Cash Book & Transfers
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage owner cash, shop counter, and staff recoveries
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <UserPlus size={18} /> New Account
          </button>

          <button
            onClick={() => setShowTransferModal(true)}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <ArrowRightLeft size={18} /> Transfer Cash
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-10 text-gray-500">
          Loading accounts...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {accounts.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
              No cash accounts found. Click "New Account" to create one.
            </div>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc._id}
                onClick={() => handleOpenLedger(acc)} // 🔥 FIX: Card par click karne se history khulegi
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
                title="Click to view history"
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-3 rounded-lg ${acc.type === "owner" ? "bg-purple-50 text-purple-600" : acc.type === "staff" ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}
                  >
                    <Wallet size={24} />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-50 px-2 py-1 rounded border border-gray-100">
                    {acc.type}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                  {acc.name}
                </h3>
                <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                  <History size={12} /> View History
                </p>
                <h2
                  className={`text-2xl font-black mt-auto ${acc.balance >= 0 ? "text-blue-700" : "text-red-600"}`}
                >
                  Rs. {acc.balance.toLocaleString()}
                </h2>
              </div>
            ))
          )}
        </div>
      )}

      {/* 🔥 NAYA: LEDGER HISTORY MODAL */}
      {showLedgerModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "90vh" }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="text-blue-600" />{" "}
                  {selectedAccountLedger.accountName}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Transaction History & Details
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-500 font-bold uppercase">
                    Current Balance
                  </p>
                  <p
                    className={`text-lg font-black ${selectedAccountLedger.balance >= 0 ? "text-blue-700" : "text-red-600"}`}
                  >
                    Rs. {selectedAccountLedger.balance.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowLedgerModal(false)}
                  className="bg-white p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body (Transactions List) */}
            <div className="flex-1 overflow-y-auto p-5 bg-white custom-scrollbar">
              {ledgerLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : selectedAccountLedger.transactions.length === 0 ? (
                <div className="text-center p-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <History size={40} className="mx-auto mb-3 text-gray-300" />
                  No transactions found for this account.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedAccountLedger.transactions.map((tx, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 p-2 rounded-lg shrink-0 ${tx.type === "in" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                        >
                          {tx.type === "in" ? (
                            <ArrowDownLeft size={16} />
                          ) : (
                            <ArrowUpRight size={16} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">
                            {tx.particulars || "Transfer / Adjustment"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(tx.date).toLocaleDateString("en-GB")} •{" "}
                            {new Date(tx.date).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right pl-11 sm:pl-0">
                        <p
                          className={`font-black ${tx.type === "in" ? "text-green-600" : "text-red-600"}`}
                        >
                          {tx.type === "in" ? "+" : "-"} Rs.{" "}
                          {tx.amount.toLocaleString()}
                        </p>
                        {tx.balanceAfter !== undefined && (
                          <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">
                            Bal: Rs. {tx.balanceAfter.toLocaleString()}
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

      {/* Add New Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <UserPlus size={18} className="text-green-600" /> Create Cash
                Account
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-red-500"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500"
                  placeholder="e.g. Rana Shabbir, Ali Rider, Shop Counter"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <select
                  value={newAccount.type}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500 bg-white"
                >
                  <option value="owner">Owner (Main Cash)</option>
                  <option value="shop">Shop / Counter</option>
                  <option value="staff">Staff / Rider</option>
                  <option value="bank">Bank Account</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Balance (Rs)
                </label>
                <input
                  type="number"
                  value={newAccount.initialBalance}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      initialBalance: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500"
                  placeholder="e.g. 0"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-blue-600" /> Transfer
                Cash
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-gray-400 hover:text-red-500"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleTransfer} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Account (Sender)
                </label>
                <select
                  value={transferData.fromAccountId}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      fromAccountId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white"
                  required
                >
                  <option value="">-- Select Sender --</option>
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} (Bal: Rs.{a.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Account (Receiver)
                </label>
                <select
                  value={transferData.toAccountId}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      toAccountId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-white"
                  required
                >
                  <option value="">-- Select Receiver --</option>
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (Rs)
                </label>
                <input
                  type="number"
                  value={transferData.amount}
                  onChange={(e) =>
                    setTransferData({ ...transferData, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  placeholder="e.g. 50000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Details / Note
                </label>
                <input
                  type="text"
                  value={transferData.particulars}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      particulars: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  placeholder="e.g. Cash handed over in evening"
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Transfer Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashBook;
