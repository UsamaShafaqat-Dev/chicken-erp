const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Payment = require("../models/Payment");

const getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [sales, purchases, customers, suppliers, payments] =
      await Promise.all([
        Sale.find(),
        Purchase.find(),
        Customer.find(),
        Supplier.find(),
        Payment.find(),
      ]);

    const totalPurchasedWeight = purchases.reduce(
      (sum, p) => sum + (p.weight || 0),
      0,
    );
    const totalPurchasedAmount = purchases.reduce(
      (sum, p) => sum + (p.totalAmount || 0),
      0,
    );
    const totalSoldWeight = sales.reduce((sum, s) => sum + (s.weight || 0), 0);
    const totalSoldAmount = sales.reduce(
      (sum, s) => sum + (s.totalAmount || 0),
      0,
    );

    const currentStockWeight = totalPurchasedWeight - totalSoldWeight;
    const avgPurchasePrice =
      totalPurchasedWeight > 0
        ? totalPurchasedAmount / totalPurchasedWeight
        : 0;
    const currentStockValue = currentStockWeight * avgPurchasePrice;

    const todaySalesList = sales.filter((s) => new Date(s.date) >= today);
    const todaySalesWeight = todaySalesList.reduce(
      (sum, s) => sum + (s.weight || 0),
      0,
    );
    const todaySalesAmount = todaySalesList.reduce(
      (sum, s) => sum + (s.totalAmount || 0),
      0,
    );

    const paymentsReceived = payments
      .filter((p) => p.type === "receive")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const creditSales = customers.reduce(
      (sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0),
      0,
    );
    const cashSales = totalSoldAmount - creditSales;
    const totalProfit = totalSoldAmount - totalSoldWeight * avgPurchasePrice;

    let notifications = [];
    if (currentStockWeight < 500) {
      notifications.push({
        id: 1,
        text: `Low Stock Alert: Only ${currentStockWeight} KG remaining!`,
        type: "warning",
      });
    }
    const defaulters = customers.filter((c) => c.currentBalance > 0).length;
    if (defaulters > 0) {
      notifications.push({
        id: 2,
        text: `${defaulters} customers have pending dues.`,
        type: "alert",
      });
    }

    const recentTransactions = [
      ...sales
        .slice(-3)
        .map((s) => ({
          id: s._id,
          title: `Sale`,
          weight: s.weight,
          amount: s.totalAmount,
          type: "credit",
          date: s.createdAt,
        })),
      ...payments
        .filter((p) => p.type === "receive")
        .slice(-2)
        .map((p) => ({
          id: p._id,
          title: `Payment Received`,
          weight: 0,
          amount: p.amount,
          type: "cash",
          date: p.createdAt,
        })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4);

    // 🔥 NAYA FEATURE: Pichle 7 din ka Chart Data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      chartData.push({
        name: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        dateStr: d.toDateString(),
        Sales: 0,
        Purchases: 0,
      });
    }

    sales.forEach((s) => {
      if (s.date) {
        const sDate = new Date(s.date).toDateString();
        const day = chartData.find((d) => d.dateStr === sDate);
        if (day) day.Sales += s.totalAmount;
      }
    });

    purchases.forEach((p) => {
      if (p.date) {
        const pDate = new Date(p.date).toDateString();
        const day = chartData.find((d) => d.dateStr === pDate);
        if (day) day.Purchases += p.totalAmount;
      }
    });

    res.json({
      chickenPurchased: {
        weight: totalPurchasedWeight,
        amount: totalPurchasedAmount,
      },
      chickenSold: { weight: totalSoldWeight, amount: totalSoldAmount },
      currentStock: { weight: currentStockWeight, amount: currentStockValue },
      todaySales: { weight: todaySalesWeight, amount: todaySalesAmount },
      cashSales: cashSales > 0 ? cashSales : 0,
      creditSales,
      paymentsReceived,
      totalCustomers: customers.length,
      totalSuppliers: suppliers.length,
      totalProfit: totalProfit > 0 ? totalProfit : 0,
      notifications,
      recentTransactions,
      chartData, // 🔥 Chart Data Frontend ko bhej diya
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardData };
