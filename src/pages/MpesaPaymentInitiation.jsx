import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { supabase } from "../lib/supabaseClient";
import { initiateStkPush } from "../lib/mpesa";
import { useCart } from "../context/CartContext";
import { formatKsh } from "../lib/format";

export default function MpesaPaymentInitiation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { items, totals, orderNumber } = useCart();

  const [order, setOrder] = useState(null);
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (orderId) {
      supabase.from("orders").select("*").eq("id", orderId).single().then(({ data }) => setOrder(data));
    }
  }, [orderId]);

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 9);
    if (val.length > 6) val = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
    else if (val.length > 3) val = `${val.slice(0, 3)} ${val.slice(3)}`;
    setPhone(val);
  };

  const isValidPhone = phone.replace(/\s/g, "").length === 9;

  async function handleSend() {
    if (!isValidPhone) {
      setError("Enter a valid 9-digit phone number.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const amount = order?.total ?? totals.total;
      const { transactionId } = await initiateStkPush({
        orderId,
        phone: "254" + phone.replace(/\s/g, ""),
        amount,
        customerName: customerName || null,
        accountReference: order?.order_number ?? orderNumber ?? "KaliPOS",
      });
      navigate(`/app/checkout/${orderId}/waiting`, { state: { transactionId } });
    } catch (err) {
      setError(err.message || "Could not send the payment request.");
    } finally {
      setSending(false);
    }
  }

  const displayTotal = order?.total ?? totals.total;
  const displayItems = items.length > 0 ? items : null;

  return (
    <AppShell searchPlaceholder="Order #, receipt, or phone number...">
      <div className="px-container-padding py-8 max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-background mb-2">Checkout</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              Order #{order?.order_number ?? orderNumber ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-card-gap flex-1 items-start">
          {/* Order summary */}
          <div className="w-full lg:w-[400px] flex-shrink-0 bg-surface-container-lowest rounded-2xl shadow-sm p-6 relative overflow-hidden">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2 relative z-10">
              <span className="material-symbols-outlined text-primary">shopping_bag</span>
              Order Summary
            </h2>
            {displayItems && (
              <div className="space-y-4 mb-6 relative z-10">
                {displayItems.map((i) => (
                  <div className="flex items-start justify-between" key={i.menuItemId}>
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant/50">restaurant</span>
                      </div>
                      <div>
                        <p className="font-body-md text-body-md text-on-surface font-semibold">
                          {i.quantity}× {i.name}
                        </p>
                      </div>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface text-right font-medium">
                      {formatKsh(i.unitPrice * i.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="h-[1px] w-full bg-outline-variant/30 mb-6 relative z-10"></div>
            <div className="p-4 bg-surface-container-low rounded-xl flex justify-between items-center relative z-10">
              <span className="font-headline-md text-headline-md text-on-surface">Total</span>
              <span className="font-headline-lg text-headline-lg text-primary tracking-tight">{formatKsh(displayTotal)}</span>
            </div>
          </div>

          {/* Payment panel */}
          <div className="flex-1 bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden flex flex-col relative w-full min-h-[500px]">
            <div className="bg-gradient-to-r from-[#4CAf50] to-[#2E7D32] p-8 relative overflow-hidden">
              <div className="relative z-10 flex justify-between items-end text-white">
                <div>
                  <p className="font-label-sm text-label-sm uppercase tracking-wider mb-1 opacity-90">Payment Method</p>
                  <h2 className="font-display-lg text-display-lg font-bold tracking-tighter">M-Pesa STK</h2>
                </div>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-[32px] text-[#2E7D32]">phone_iphone</span>
                </div>
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-container/20 text-primary mb-4">
                    <span className="material-symbols-outlined text-[24px]">contactless</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Send Payment Request</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    A push notification (STK Push) will be sent to the customer's phone to enter their PIN.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 ml-1">Customer Name (optional)</label>
                  <input
                    className="w-full h-12 px-4 rounded-lg bg-surface border border-outline-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="James Kinyua"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="mb-6">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 ml-1">Customer Phone Number</label>
                  <div className="relative flex items-center h-12 rounded-lg border border-outline-variant/50 overflow-hidden">
                    <div className="flex items-center gap-2 pl-4 pr-3 border-r border-outline-variant/40 h-full text-on-surface font-medium bg-surface-container/30">
                      +254
                    </div>
                    <input
                      className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-0 px-4 font-body-lg text-on-surface"
                      placeholder="712 345 678"
                      value={phone}
                      onChange={handlePhoneChange}
                      type="tel"
                    />
                    {isValidPhone && (
                      <span className="material-symbols-outlined text-primary pr-4">check_circle</span>
                    )}
                  </div>
                </div>

                {error && <div className="text-error text-label-sm bg-error-container/30 rounded-lg px-4 py-2 mb-4">{error}</div>}

                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full h-14 rounded-xl bg-[#00633c] hover:bg-[#007f4e] text-white font-headline-md text-headline-md flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending request...
                    </>
                  ) : (
                    "Send Payment Request"
                  )}
                </button>
              </div>
            </div>
            <div className="bg-surface-container-high py-3 px-6 flex justify-between items-center text-label-sm font-label-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4CAf50] animate-pulse"></span>
                M-Pesa Sandbox Connected
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
