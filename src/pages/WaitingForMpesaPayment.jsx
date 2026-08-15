import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { supabase } from "../lib/supabaseClient";
import { fetchTransactionStatus } from "../lib/mpesa";
import { useCart } from "../context/CartContext";
import { formatKsh } from "../lib/format";

const TOTAL_SECONDS = 60;

export default function WaitingForMpesaPayment() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { items, totals, orderNumber } = useCart();

  const [order, setOrder] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [timedOut, setTimedOut] = useState(false);
  const pollRef = useRef(null);
  const transactionId = location.state?.transactionId;

  useEffect(() => {
    if (orderId) {
      supabase.from("orders").select("*").eq("id", orderId).single().then(({ data }) => setOrder(data));
    }
  }, [orderId]);

  useEffect(() => {
    if (!transactionId) return;

    // Poll every 3 seconds to see if the mpesa-callback function has updated the status.
    pollRef.current = setInterval(async () => {
      try {
        const tx = await fetchTransactionStatus(transactionId);
        if (tx.status === "success") {
          clearInterval(pollRef.current);
          navigate(`/app/checkout/${orderId}/success`, { state: { transaction: tx } });
        } else if (tx.status === "failed") {
          clearInterval(pollRef.current);
          setTimedOut(true);
        }
      } catch {
        // Ignore transient errors and keep polling.
      }
    }, 3000);

    return () => clearInterval(pollRef.current);
  }, [transactionId, orderId, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          setTimedOut(true);
          if (pollRef.current) clearInterval(pollRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalDashArray = 283;
  const offset = totalDashArray - (secondsLeft / TOTAL_SECONDS) * totalDashArray;
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  const displayTotal = order?.total ?? totals.total;
  const itemsSummary = items.length > 0 ? items : null;

  function handleCancel() {
    if (pollRef.current) clearInterval(pollRef.current);
    navigate("/app/pos");
  }

  return (
    <AppShell searchPlaceholder="Order #, receipt, or phone number...">
      <div className="flex flex-col w-full px-container-padding pb-10 space-y-8">
        <div className="grid grid-cols-12 gap-gutter mt-8">
          {/* Order summary */}
          <div className="col-span-12 lg:col-span-4 flex flex-col space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl shadow-md overflow-hidden relative">
              <div className="p-6 bg-surface-container-low flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-on-primary">receipt_long</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Order #{order?.order_number ?? orderNumber ?? "—"}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">Dine In</p>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {itemsSummary && (
                  <div className="space-y-4">
                    {itemsSummary.map((i) => (
                      <div className="flex items-center justify-between" key={i.menuItemId}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center font-label-sm text-label-sm text-on-surface-variant">
                            {i.quantity}x
                          </div>
                          <p className="font-body-md text-body-md text-on-surface">{i.name}</p>
                        </div>
                        <span className="font-body-md text-body-md text-on-surface">{formatKsh(i.unitPrice * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pt-4 flex flex-col space-y-2 relative">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-outline-variant to-transparent"></div>
                  <div className="flex justify-between items-center mt-2 pt-2">
                    <span className="font-headline-md text-headline-md text-on-surface">Total</span>
                    <span className="font-headline-md text-headline-md text-primary">{formatKsh(displayTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Waiting state */}
          <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl shadow-xl flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden min-h-[500px]">
              <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full">
                {!timedOut ? (
                  <>
                    <div className="relative w-48 h-48 mb-8">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-surface-container-high" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="4"></circle>
                        <circle
                          className="text-primary transition-all duration-1000 ease-linear"
                          cx="50"
                          cy="50"
                          fill="none"
                          r="45"
                          stroke="currentColor"
                          strokeDasharray={totalDashArray}
                          strokeDashoffset={offset}
                          strokeWidth="4"
                        ></circle>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 bg-primary rounded-full flex flex-col items-center justify-center shadow-lg animate-pulse">
                          <span className="material-symbols-outlined text-on-primary text-5xl">smartphone</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-secondary-container/50 px-4 py-2 rounded-full mb-6 inline-flex items-center gap-2">
                      <span className="material-symbols-outlined text-on-secondary-container text-sm">schedule</span>
                      <span className="font-label-sm text-label-sm text-on-secondary-container tracking-wider uppercase">Awaiting Payment</span>
                    </div>
                    <h1 className="font-display-lg text-display-lg text-on-surface mb-4 leading-tight">Check Customer Phone</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-md">
                      Waiting for customer to enter their M-Pesa PIN to authorize{" "}
                      <strong className="text-on-surface font-semibold">{formatKsh(displayTotal)}</strong>.
                    </p>
                    <div className="bg-surface-container-high px-8 py-4 rounded-xl shadow-inner mb-8 w-full max-w-sm">
                      <div className="flex flex-col items-center">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-1">Time Remaining</span>
                        <span className="font-headline-lg text-headline-lg text-on-surface font-mono">{minutes}:{secs}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleCancel}
                      className="bg-error/10 hover:bg-error/20 text-error font-body-md text-body-md px-8 py-4 rounded-xl transition-colors duration-200 flex items-center gap-2 font-medium"
                    >
                      <span className="material-symbols-outlined">cancel</span>
                      Cancel Payment
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full bg-error-container flex items-center justify-center mb-6">
                      <span className="material-symbols-outlined text-error text-[48px]">error</span>
                    </div>
                    <h1 className="font-display-lg text-headline-lg text-on-surface mb-4">Payment Not Completed</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-md">
                      The customer didn't confirm the payment in time, or it was declined. You can try sending the request again.
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => navigate(`/app/checkout/${orderId}/mpesa`)}
                        className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-sm text-label-sm hover:bg-primary-container transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-surface-container-high text-on-surface px-6 py-3 rounded-xl font-label-sm text-label-sm hover:bg-surface-variant transition-colors"
                      >
                        Back to POS
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
