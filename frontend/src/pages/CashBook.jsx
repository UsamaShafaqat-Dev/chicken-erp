import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
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
  Printer,
  Edit,
  Trash2,
  AlertTriangle,
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

  // Add/Edit Account Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccId, setEditingAccId] = useState(null);
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "owner",
    initialBalance: "",
  });

  // Delete Account Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Ledger History Modal States
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [selectedAccountLedger, setSelectedAccountLedger] = useState({
    accountName: "",
    balance: 0,
    transactions: [],
  });

  const printRef = useRef(null);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const isOwner = userInfo?.role === "owner";

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "https://asia-poultry-api.onrender.com/api/cash/accounts",
        { withCredentials: true },
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

  // 🔥 NAYA: Edit Account Modal Open Function
  const openAddEditModal = (acc = null) => {
    if (acc) {
      setNewAccount({
        name: acc.name,
        type: acc.type,
        initialBalance: acc.balance, // Editing balance directly
      });
      setEditingAccId(acc._id);
    } else {
      setNewAccount({ name: "", type: "owner", initialBalance: "" });
      setEditingAccId(null);
    }
    setShowAddModal(true);
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.name) return toast.error("Please enter account name");

    try {
      if (editingAccId) {
        await axios.put(
          `https://asia-poultry-api.onrender.com/api/cash/accounts/${editingAccId}`,
          newAccount,
          { withCredentials: true },
        );
        toast.success("Cash Account Updated!");
      } else {
        await axios.post(
          "https://asia-poultry-api.onrender.com/api/cash/accounts",
          newAccount,
          { withCredentials: true },
        );
        toast.success("Cash Account Created!");
      }
      setShowAddModal(false);
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save account");
    }
  };

  // 🔥 NAYA: Delete Account Function
  const confirmDelete = async () => {
    try {
      await axios.delete(
        `https://asia-poultry-api.onrender.com/api/cash/accounts/${deletingId}`,
        { withCredentials: true },
      );
      toast.success("Account deleted successfully!");
      setIsDeleteModalOpen(false);
      fetchAccounts();
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

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
        { withCredentials: true },
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

  const handleOpenLedger = async (account) => {
    setShowLedgerModal(true);
    setLedgerLoading(true);
    setSelectedAccountLedger({
      accountName: account.name,
      balance: account.balance,
      transactions: [],
    });

    try {
      const { data } = await axios.get(
        `https://asia-poultry-api.onrender.com/api/cash/ledger/${account._id}`,
        { withCredentials: true },
      );
      if (data.success && data.ledger) {
        setSelectedAccountLedger({
          accountName: account.name,
          balance: account.balance,
          transactions: data.ledger.transactions || [],
        });
      }
    } catch (error) {
      toast.error("Failed to load account details");
      setShowLedgerModal(false);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Cash_Ledger_${selectedAccountLedger.accountName}_${new Date().toISOString().split("T")[0]}`,
  });

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
            onClick={() => openAddEditModal()}
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
                onClick={() => handleOpenLedger(acc)}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1"
                title="Click to view history"
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-3 rounded-lg ${acc.type === "owner" ? "bg-purple-50 text-purple-600" : acc.type === "staff" ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}
                  >
                    <Wallet size={24} />
                  </div>
                  {/* 🔥 NAYA: Edit aur Delete button (sirf owner k liye) */}
                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <div
                        className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openAddEditModal(acc)}
                          className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-1.5 rounded"
                          title="Edit Khata"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(acc._id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded"
                          title="Delete Khata"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      {acc.type}
                    </span>
                  </div>
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

      {/* LEDGER HISTORY MODAL */}
      {showLedgerModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "90vh" }}
          >
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="text-blue-600" />{" "}
                  {selectedAccountLedger.accountName}
                </h2>
                <p className="text-sm text-gray-500 mt-1 print:hidden">
                  Transaction History & Details
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block print:hidden">
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
                  onClick={handlePrint}
                  disabled={ledgerLoading}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors flex items-center gap-1.5 font-bold text-sm shadow-sm"
                  title="Print Ledger"
                >
                  <Printer size={18} />{" "}
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  onClick={() => setShowLedgerModal(false)}
                  className="bg-white p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-gray-200"
                >
                  <X size={20} />
                </button>
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
                <p className="text-gray-600 font-bold mb-6">
                  Cash Account Ledger
                </p>
                <div className="flex justify-between items-end text-left mt-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                      Account Name:
                    </p>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedAccountLedger.accountName}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Printed On: {new Date().toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                      Current Balance:
                    </p>
                    <h2
                      className={`text-2xl font-black ${selectedAccountLedger.balance >= 0 ? "text-blue-700" : "text-red-600"}`}
                    >
                      Rs. {selectedAccountLedger.balance.toLocaleString()}
                    </h2>
                  </div>
                </div>
              </div>

              {ledgerLoading ? (
                <div className="flex justify-center items-center h-40 print:hidden">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : selectedAccountLedger.transactions.length === 0 ? (
                <div className="text-center p-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200 print:border-none print:bg-white">
                  <History
                    size={40}
                    className="mx-auto mb-3 text-gray-300 print:hidden"
                  />
                  No transactions found for this account.
                </div>
              ) : (
                <div className="space-y-3 print:space-y-0 print:border-t print:border-gray-200">
                  {selectedAccountLedger.transactions.map((tx, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:border-0 print:border-b print:border-gray-200 print:shadow-none print:rounded-none print:py-3 print:px-1"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 p-2 rounded-lg shrink-0 print:border ${tx.type === "in" ? "bg-green-100 text-green-600 print:border-green-600 print:bg-white" : "bg-red-100 text-red-600 print:border-red-600 print:bg-white"}`}
                        >
                          {tx.type === "in" ? (
                            <ArrowDownLeft size={16} />
                          ) : (
                            <ArrowUpRight size={16} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm print:text-base">
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
                          className={`font-black print:text-base ${tx.type === "in" ? "text-green-600" : "text-red-600"}`}
                        >
                          {tx.type === "in" ? "+" : "-"} Rs.{" "}
                          {tx.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <UserPlus size={18} className="text-green-600" />{" "}
                {editingAccId ? "Edit Cash Account" : "Create Cash Account"}
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
                  placeholder="e.g. Shop Counter"
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
                  Opening / Current Balance (Rs)
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
                  {editingAccId ? "Update Account" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Khata Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Delete Khata?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure? This will permanently delete this account and all
              its transaction history!
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
