// ============================================================================
// mpesa-callback
// ----------------------------------------------------------------------------
// Safaricom calls THIS function automatically once the customer has entered
// their M-Pesa PIN (or cancelled, or the request timed out). We never call
// this function ourselves - it's the CallBackURL we gave Safaricom in
// mpesa-stk-push.
//
// It finds the matching row in mpesa_transactions (by CheckoutRequestID) and
// updates it to "success" or "failed", and marks the linked order as "paid".
//
// Deploy this function, then copy its URL into the MPESA_CALLBACK_URL secret.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const stkCallback = payload?.Body?.stkCallback;

    if (!stkCallback) {
      return new Response(JSON.stringify({ ok: false, error: "Unexpected payload shape" }), { status: 400 });
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode; // 0 = success, anything else = failed/cancelled
    const resultDesc = stkCallback.ResultDesc;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let mpesaReceipt: string | null = null;

    if (resultCode === 0) {
      // On success, Safaricom sends the details as a list of {Name, Value} pairs.
      const items: Array<{ Name: string; Value: unknown }> =
        stkCallback.CallbackMetadata?.Item ?? [];
      const findValue = (name: string) => items.find((i) => i.Name === name)?.Value;
      mpesaReceipt = (findValue("MpesaReceiptNumber") as string) ?? null;
    }

    const { data: txRow, error: updateError } = await supabase
      .from("mpesa_transactions")
      .update({
        status: resultCode === 0 ? "success" : "failed",
        result_desc: resultDesc,
        mpesa_receipt: mpesaReceipt,
        updated_at: new Date().toISOString(),
      })
      .eq("checkout_request_id", checkoutRequestId)
      .select()
      .single();

    if (!updateError && txRow?.order_id && resultCode === 0) {
      await supabase
        .from("orders")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", txRow.order_id);
    }

    // Safaricom just wants a 200 OK acknowledging we received this.
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
