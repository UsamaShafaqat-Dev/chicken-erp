import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  MessageCircle,
  Search,
  AlertCircle,
  Send,
  Edit3,
  User,
  Map,
} from "lucide-react";

const WhatsAppReminder = () => {
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Default Message Template
  const [messageTemplate, setMessageTemplate] = useState(
    "Assalam o Alaikum {name} bhai,\nAap ka Oxege Poultry par pichla baqaya bill Rs. {balance} hai.\nBarae meharbani jald az jald clear kar dein. Shukriya!",
  );

  const fetchDefaulters = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("https://asia-poultry-api.onrender.com/api/customers", {
        withCredentials: true,
      });
      // Sirf un customers ko filter karein jin ka balance 0 se zyada hai
      const pendingCustomers = data.filter(
        (c) => c.currentBalance > 0 && c.status !== "inactive",
      );
      // Balance ke hisaab se sort karein (Sab se zyada udhaar wala oopar aayega)
      pendingCustomers.sort((a, b) => b.currentBalance - a.currentBalance);
      setDefaulters(pendingCustomers);
    } catch (error) {
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaulters();
  }, []);

  const handleSendMessage = (customer) => {
    const phone = customer.whatsapp || customer.mobile;
    if (!phone) {
      return toast.error("No phone number available for this customer");
    }

    // Replace placeholders with actual data
    let finalMessage = messageTemplate
      .replace(/{name}/g, customer.name)
      .replace(/{balance}/g, customer.currentBalance.toLocaleString());

    // Clean and format phone number for WhatsApp
    let cleanNumber = phone.replace(/[^0-9]/g, "");
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "92" + cleanNumber.substring(1);
    }

    // Encode message for URL
    const encodedMessage = encodeURIComponent(finalMessage);
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    // Open WhatsApp Web / App
    window.open(whatsappUrl, "_blank");
  };

  const filteredDefaulters = defaulters.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.area && c.area.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header & Template Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-green-100 p-2 rounded-lg text-green-600">
              <Edit3 size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">
              Message Template
            </h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            You can edit this message. Use{" "}
            <strong className="text-blue-600">{`{name}`}</strong> and{" "}
            <strong className="text-blue-600">{`{balance}`}</strong> as
            auto-filling tags.
          </p>
          <textarea
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-gray-50 resize-none"
          ></textarea>
        </div>

        <div className="lg:col-span-2 bg-gradient-to-br from-[#0a5228] to-green-800 p-6 rounded-xl shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <MessageCircle size={150} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            WhatsApp Recovery
          </h2>
          <p className="text-green-100 text-sm max-w-md">
            Send automated payment reminders to customers with outstanding
            balances. The list below only shows customers who owe you money,
            sorted by highest balance.
          </p>
          <div className="mt-4 flex gap-4">
            <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20 text-white backdrop-blur-sm">
              <p className="text-xs text-green-200">Pending Recoveries</p>
              <h3 className="text-2xl font-bold">
                {defaulters.length}{" "}
                <span className="text-sm font-medium">Customers</span>
              </h3>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20 text-white backdrop-blur-sm">
              <p className="text-xs text-green-200">Total Market Outstanding</p>
              <h3 className="text-2xl font-bold">
                Rs.{" "}
                {defaulters
                  .reduce((acc, curr) => acc + curr.currentBalance, 0)
                  .toLocaleString()}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
        <Search size={18} className="text-gray-400 ml-2" />
        <input
          type="text"
          placeholder="Search customer by name or area..."
          className="bg-transparent border-none outline-none text-sm w-full py-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Defaulters List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
          <AlertCircle size={18} className="text-red-500" />
          <h3 className="font-bold text-gray-800">Pending Payments List</h3>
        </div>

        {loading ? (
          <div className="text-center p-10 text-gray-500">Loading list...</div>
        ) : filteredDefaulters.length === 0 ? (
          <div className="text-center p-10 text-gray-500">
            No pending recoveries found!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            {filteredDefaulters.map((customer, index) => (
              <div
                key={customer._id}
                className={`p-4 flex flex-col justify-between border-b border-gray-100 ${index % 2 !== 0 ? "bg-gray-50/50" : "bg-white"} md:border-r`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
                      <User size={16} className="text-gray-400" />{" "}
                      {customer.name}
                    </h3>
                    {customer.area && (
                      <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                        <Map size={12} /> {customer.area}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">
                      Due Balance
                    </p>
                    <p className="text-lg font-black text-red-600">
                      Rs. {customer.currentBalance.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {customer.whatsapp || customer.mobile}
                  </span>
                  <button
                    onClick={() => handleSendMessage(customer)}
                    className="flex items-center justify-center gap-1.5 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm"
                  >
                    <Send size={14} /> Send Reminder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppReminder;
