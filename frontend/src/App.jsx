import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import Payments from "./pages/Payments";
import Stock from "./pages/Stock";
import Expenses from "./pages/Expenses";
import Ledgers from "./pages/Ledgers";
import Reports from "./pages/Reports";
import WhatsAppReminder from "./pages/WhatsAppReminder";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import CashBook from "./pages/CashBook";
import Salaries from "./pages/Salaries";
import DailyReport from "./pages/DailyReport";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("userInfo");
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("userInfo");
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Protected Routes wrapped in Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <Layout>
                <Suppliers />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/purchases"
          element={
            <ProtectedRoute>
              <Layout>
                <Purchases />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Layout>
                <Sales />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Layout>
                <Payments />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/stock"
          element={
            <ProtectedRoute>
              <Layout>
                <Stock />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Layout>
                <Expenses />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ledgers"
          element={
            <ProtectedRoute>
              <Layout>
                <Ledgers />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cashbook"
          element={
            <ProtectedRoute>
              <Layout>
                <CashBook />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 🔥 FIX: Daily Report ko Layout aur ProtectedRoute mein wrap kar diya */}
        <Route
          path="/daily-report"
          element={
            <ProtectedRoute>
              <Layout>
                <DailyReport />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/whatsapp"
          element={
            <ProtectedRoute>
              <Layout>
                <WhatsAppReminder />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/salaries"
          element={
            <ProtectedRoute>
              <Layout>
                <Salaries />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
