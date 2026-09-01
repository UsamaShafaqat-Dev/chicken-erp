import { useState, useEffect } from "react";
import axios from "axios";
import {
  ShoppingCart,
  TrendingDown,
  Package,
  DollarSign,
  Wallet,
  CreditCard,
  Users,
  Truck,
  TrendingUp,
  Bell,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get("http://129.121.140.57:5000/api/dashboard", {
          withCredentials: true,
        });
        setData(res.data);
      } catch (error) {
        console.error("Dashboard fetch error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading || !data)
    return (
      <div className="flex justify-center items-center h-[70vh] text-gray-500">
        Loading Dashboard...
      </div>
    );

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden pb-6">
      {data.notifications.length > 0 && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="bg-red-100 p-2 rounded-full">
            <Bell size={18} className="text-red-600" />
          </div>
          <div className="flex-1">
            {data.notifications.map((note, idx) => (
              <p key={idx} className="text-sm text-red-800 font-medium">
                • {note.text}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Top 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">
              Chicken Purchased
            </p>
            <h3 className="text-xl font-bold text-gray-800">
              {data.chickenPurchased.weight.toLocaleString()} KG
            </h3>
            <p className="text-xs text-green-600 font-medium mt-0.5">
              Rs. {data.chickenPurchased.amount.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-full text-orange-600">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Chicken Sold</p>
            <h3 className="text-xl font-bold text-gray-800">
              {data.chickenSold.weight.toLocaleString()} KG
            </h3>
            <p className="text-xs text-orange-600 font-medium mt-0.5">
              Rs. {data.chickenSold.amount.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Current Stock</p>
            <h3 className="text-xl font-bold text-gray-800">
              {data.currentStock.weight.toLocaleString()} KG
            </h3>
            <p className="text-xs text-blue-600 font-medium mt-0.5">
              Value: Rs. {Math.round(data.currentStock.amount).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Today's Sales</p>
            <h3 className="text-xl font-bold text-gray-800">
              {data.todaySales.weight.toLocaleString()} KG
            </h3>
            <p className="text-xs text-indigo-600 font-medium mt-0.5">
              Rs. {data.todaySales.amount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 6 Small Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <Wallet size={18} className="text-blue-500 mx-auto mb-2" />
          <p className="text-[11px] text-gray-500">Cash Sales</p>
          <h4 className="font-bold text-gray-800">
            Rs. {data.cashSales.toLocaleString()}
          </h4>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <CreditCard size={18} className="text-purple-500 mx-auto mb-2" />
          <p className="text-[11px] text-gray-500">Credit Sales</p>
          <h4 className="font-bold text-gray-800">
            Rs. {data.creditSales.toLocaleString()}
          </h4>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <DollarSign size={18} className="text-green-500 mx-auto mb-2" />
          <p className="text-[11px] text-gray-500">Payments Received</p>
          <h4 className="font-bold text-gray-800">
            Rs. {data.paymentsReceived.toLocaleString()}
          </h4>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <Users size={18} className="text-indigo-500 mx-auto mb-2" />
          <p className="text-[11px] text-gray-500">Total Customers</p>
          <h4 className="font-bold text-gray-800">{data.totalCustomers}</h4>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <Truck size={18} className="text-teal-500 mx-auto mb-2" />
          <p className="text-[11px] text-gray-500">Total Suppliers</p>
          <h4 className="font-bold text-gray-800">{data.totalSuppliers}</h4>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center border-b-2 border-b-green-500">
          <TrendingUp size={18} className="text-green-600 mx-auto mb-2" />
          <p className="text-[11px] text-gray-500">Approx. Profit</p>
          <h4 className="font-bold text-green-600">
            Rs. {Math.round(data.totalProfit).toLocaleString()}
          </h4>
        </div>
      </div>

      {/* Chart & Recent Transactions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 🔥 LIVE CHART HERE */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">
            Financial Overview (Last 7 Days)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorPurchases"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  dx={-10}
                  tickFormatter={(val) => `Rs.${val}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value) => [`Rs. ${value.toLocaleString()}`, ""]}
                />
                <Area
                  type="monotone"
                  dataKey="Sales"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
                <Area
                  type="monotone"
                  dataKey="Purchases"
                  stroke="#f97316"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPurchases)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {data.recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-500">
                No recent transactions found.
              </p>
            ) : (
              data.recentTransactions.map((tx, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">
                      {tx.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {tx.weight > 0 ? `${tx.weight} KG` : "Payment"}
                    </p>
                  </div>
                  <div className="text-right">
                    <h4
                      className={`font-bold text-sm ${tx.type === "credit" ? "text-gray-800" : "text-green-600"}`}
                    >
                      {tx.type === "cash" ? "+" : ""} Rs.{" "}
                      {tx.amount.toLocaleString()}
                    </h4>
                    <span className="text-[10px] bg-white border text-gray-600 px-2 py-0.5 rounded capitalize">
                      {tx.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
