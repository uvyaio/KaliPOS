// Small wrapper functions around our Supabase Edge Functions, so the React
// components don't need to know the request/response shape.
import { supabase } from "./supabaseClient";

// Kicks off an STK Push - sends a payment prompt to the customer's phone.
// Returns { checkoutRequestId, transactionId } on success.
export async function initiateStkPush({ orderId, phone, amount, customerName, accountReference }) {
  const { data, error } = await supabase.functions.invoke("mpesa-stk-push", {
    body: { orderId, phone, amount, customerName, accountReference },
  });
  if (error) {
    // supabase-js wraps non-2xx responses in `error`; try to surface the real message.
    const message = data?.error || error.message || "Could not start the M-Pesa payment.";
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

// Polls the mpesa_transactions table directly (no Edge Function needed —
// this is just a normal read, which the anon key is allowed to do).
export async function fetchTransactionStatus(transactionId) {
  const { data, error } = await supabase
    .from("mpesa_transactions")
    .select("*")
    .eq("id", transactionId)
    .single();
  if (error) throw error;
  return data;
}
