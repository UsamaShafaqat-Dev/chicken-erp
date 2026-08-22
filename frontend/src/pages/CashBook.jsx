import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Wallet, ArrowRightLeft, Plus, UserPlus } from "lucide-react";

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

  // 🔥 NAYA: Add Account Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "owner",
    initialBalance: "",
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

  // 🔥 NAYA: Naya Account Banane ka function
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.name) return toast.error("Please enter account name");

    try {
      await axios.post("https://asia-poultry-api.onrender.com/api/cash/accounts", newAccount, {
        withCredentials: true,
      });
      toast.success("Cash Account Created Successfully!");
      setShowAddModal(false);
      setNewAccount({ name: "", type: "owner", initialBalance: "" });
      fetchAccounts(); // List update karega
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create account");
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
          {/* 🔥 NAYA: Add Account Button */}
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
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-3 rounded-lg ${acc.type === "owner" ? "bg-purple-50 text-purple-600" : acc.type === "staff" ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}
                  >
                    <Wallet size={24} />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-50 px-2 py-1 rounded">
                    {acc.type}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">
                  {acc.name}
                </h3>
                <p className="text-xs text-gray-500 mb-3">Current Balance</p>
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

      {/* 🔥 NAYA: Add New Account Modal */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-green-500"
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

      {/* Transfer Modal (Pechla wala same hai) */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
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
