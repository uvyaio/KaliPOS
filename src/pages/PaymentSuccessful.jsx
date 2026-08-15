import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { supabase } from "../lib/supabaseClient";
import { useCart } from "../context/CartContext";
import { formatKsh } from "../lib/format";

export default function PaymentSuccessful() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [animateIn, setAnimateIn] = useState(false);
  const [transaction, setTransaction] = useState(location.state?.transaction ?? null);

  useEffect(() => {
    setAnimateIn(true);
    // Cart's job is done once we land on the success screen.
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!transaction && orderId) {
      supabase
        .from("mpesa_transactions")
        .select("*")
        .eq("order_id", orderId)
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => setTransaction(data));
    }
  }, [orderId, transaction]);

  return (
    <AppShell searchPlaceholder="Order #, receipt, or phone number...">
      <div className="flex flex-col w-full h-[calc(100vh-4rem)] items-center justify-center p-container-padding bg-surface">
        <div className="relative max-w-md w-full bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/20 to-transparent pointer-events-none"></div>

          <div className="relative px-8 pt-12 pb-8 flex flex-col items-center text-center border-b border-surface-container-high border-dashed">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-primary-container rounded-full animate-ping opacity-20"></div>
              <div
                className={`relative w-full h-full bg-primary-fixed rounded-full flex items-center justify-center shadow-md transform transition-transform duration-500 ease-out ${
                  animateIn ? "scale-100" : "scale-0"
                }`}
              >
                <span className="material-symbols-outlined text-[48px] text-on-primary-fixed">check_circle</span>
              </div>
            </div>
            <h1
              className={`font-display-lg text-headline-lg text-on-surface mb-2 tracking-tight transition-all duration-500 delay-200 ${
                animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Payment Successful!
            </h1>
            <p
              className={`font-body-md text-body-md text-on-surface-variant transition-all duration-500 delay-300 ${
                animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              Transaction completed via M-Pesa
            </p>
          </div>

          <div className="px-8 py-6 bg-surface-container-low/50">
            <div
              className={`space-y-4 transition-all duration-500 delay-[400ms] ${
                animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex justify-between items-center py-2">
                <span className="font-body-md text-body-md text-on-surface-variant">Amount Paid</span>
                <span className="font-headline-md text-headline-md text-primary">{formatKsh(transaction?.amount)}</span>
              </div>
              <div className="h-[1px] w-full bg-outline-variant/30"></div>
              <div className="flex justify-between items-center py-2">
                <span className="font-body-md text-body-md text-on-surface-variant">Transaction ID</span>
                <span className="font-label-sm text-label-sm text-on-surface tracking-widest font-mono">
                  {transaction?.mpesa_receipt ?? "Pending"}
                </span>
              </div>
              {transaction?.customer_name && (
                <>
                  <div className="h-[1px] w-full bg-outline-variant/30"></div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-body-md text-body-md text-on-surface-variant">Customer</span>
                    <span className="font-body-md text-body-md text-on-surface font-semibold">{transaction.customer_name}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div
            className={`px-8 py-6 bg-surface-container-lowest flex gap-4 transition-all duration-500 delay-500 ${
              animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <button className="flex-1 py-3 px-4 bg-secondary-container text-on-secondary-container rounded-lg font-label-sm text-label-sm flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors">
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print Receipt
            </button>
            <button
              onClick={() => navigate("/app/pos")}
              className="flex-1 py-3 px-4 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-colors shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              New Order
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
