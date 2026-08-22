import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  Truck,
  ShoppingCart,
  Store,
  CreditCard,
  Package,
  Receipt,
  BookOpen,
  BarChart3,
  MessageCircle,
  UserCog,
  Settings,
  X,
  Wallet, // 🔥 FIX: Wallet icon import kar liya Cash Book k liye
} from "lucide-react";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const [liveStock, setLiveStock] = useState(0);

  // 🔥 Live Stock Fetching Logic
  useEffect(() => {
    axios
      .get("https://asia-poultry-api.onrender.com/api/stock", { withCredentials: true })
      .then((res) => setLiveStock(res.data.currentStock))
      .catch((err) =>
        console.log("Failed to fetch live stock for sidebar:", err),
      );
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Customers", icon: Users, path: "/customers" },
    { name: "Suppliers / Brokers", icon: Truck, path: "/suppliers" },
    { name: "Purchases", icon: ShoppingCart, path: "/purchases" },
    { name: "Sales", icon: Store, path: "/sales" },
    { name: "Payments", icon: CreditCard, path: "/payments" },
    { name: "Stock", icon: Package, path: "/stock" },
    { name: "Expenses", icon: Receipt, path: "/expenses" },
    { name: "Ledgers", icon: BookOpen, path: "/ledgers" },
    { name: "Cash Book", icon: Wallet, path: "/cashbook" }, // 🔥 NAYA: Cash Book ka link add kar diya
    { name: "Reports", icon: BarChart3, path: "/reports" },
    { name: "WhatsApp Reminder", icon: MessageCircle, path: "/whatsapp" },
    { name: "Users / Staff", icon: UserCog, path: "/users" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-[#111827] text-gray-300 z-50 transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo Area */}
        <div className="flex items-center justify-between h-16 px-4 bg-[#0f172a] border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full p-1 w-8 h-8 flex items-center justify-center text-xl">
              🐔
            </div>
            <span className="text-white font-bold text-lg tracking-wide">
              Asia Poultry Business
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)} // 🔥 FIX: Mobile par link click hone par sidebar automatically band ho jayega
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-[#0a5228] text-white font-medium"
                        : "hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <item.icon
                      size={20}
                      className={isActive ? "text-white" : "text-gray-400"}
                    />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom Stock Alert (Live Now) */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦆</span>
            <div>
              <p className="text-xs text-gray-400">Current Stock</p>
              <p className="text-sm font-bold text-green-500">
                {liveStock.toLocaleString()}{" "}
                <span className="text-xs text-gray-400">KG</span>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
