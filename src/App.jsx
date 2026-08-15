// We use HashRouter (URLs like /#/app/dashboard) instead of BrowserRouter here
// because GitHub Pages can't run server-side code — it just serves static
// files. With BrowserRouter, refreshing a page like /app/dashboard would 404,
// since there's no server to redirect that URL back to index.html. HashRouter
// sidesteps the problem entirely: everything after the # is handled by React
// in the browser, so GitHub Pages only ever needs to serve index.html.
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import OwnerLogin from "./pages/OwnerLogin";
import StaffLogin from "./pages/StaffLogin";
import Dashboard from "./pages/Dashboard";
import MenuManagement from "./pages/MenuManagement";
import POSCheckout from "./pages/POSCheckout";
import MpesaPaymentInitiation from "./pages/MpesaPaymentInitiation";
import WaitingForMpesaPayment from "./pages/WaitingForMpesaPayment";
import PaymentSuccessful from "./pages/PaymentSuccessful";
import MpesaTransactions from "./pages/MpesaTransactions";
import InventoryDetail from "./pages/InventoryDetail";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <HashRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login/owner" element={<OwnerLogin />} />
            <Route path="/login/staff" element={<StaffLogin />} />

            {/* Protected - owner or staff */}
            <Route path="/app/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/app/menu" element={<ProtectedRoute><MenuManagement /></ProtectedRoute>} />
            <Route path="/app/pos" element={<ProtectedRoute><POSCheckout /></ProtectedRoute>} />
            <Route path="/app/checkout/:orderId/mpesa" element={<ProtectedRoute><MpesaPaymentInitiation /></ProtectedRoute>} />
            <Route path="/app/checkout/:orderId/waiting" element={<ProtectedRoute><WaitingForMpesaPayment /></ProtectedRoute>} />
            <Route path="/app/checkout/:orderId/success" element={<ProtectedRoute><PaymentSuccessful /></ProtectedRoute>} />
            <Route path="/app/transactions" element={<ProtectedRoute><MpesaTransactions /></ProtectedRoute>} />
            <Route path="/app/inventory/:itemId" element={<ProtectedRoute><InventoryDetail /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Landing />} />
          </Routes>
        </HashRouter>
      </CartProvider>
    </AuthProvider>
  );
}
