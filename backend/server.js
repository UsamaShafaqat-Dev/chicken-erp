const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const customerRoutes = require("./src/routes/customerRoutes");
const supplierRoutes = require("./src/routes/supplierRoutes");
const purchaseRoutes = require("./src/routes/purchaseRoutes");
const saleRoutes = require("./src/routes/saleRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const stockRoutes = require("./src/routes/stockRoutes");
const expenseRoutes = require("./src/routes/expenseRoutes");
const ledgerRoutes = require("./src/routes/ledgerRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const userRoutes = require("./src/routes/userRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const cashRoutes = require("./src/routes/cashRoute");
const dailyRateRoutes = require("./src/routes/dailyRateRoutes");
const employeeRoutes = require('./src/routes/employeeRoutes');

// 🔥 FIX: Yahan path mein "src" add kar diya hai
const expenseCategoryRoutes = require("./src/routes/expenseCategoryRoutes");

dotenv.config();
connectDB();

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// 🔥 FIX: CORS updated for Vercel (Live) & Localhost
app.use(
  cors({
    origin: ["http://localhost:5173", "https://chicken-erp.vercel.app"],
    credentials: true,
  }),
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/ledgers", ledgerRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/cash", cashRoutes);
app.use("/api/daily-rates", dailyRateRoutes);

// 🔥 NAYA ROUTE
app.use("/api/expense-categories", expenseCategoryRoutes);
app.use('/api/employees', employeeRoutes);

app.get("/", (req, res) => {
  res.send("🐔 Asia Poultry ERP API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
