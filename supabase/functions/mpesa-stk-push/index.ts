// ============================================================================
// mpesa-stk-push
// ----------------------------------------------------------------------------
// What this does, in plain terms:
//   1. The POS app calls this function with { orderId, phone, amount }.
//   2. We ask Safaricom for a temporary access token.
//   3. We ask Safaricom to send an "STK Push" — that's the payment prompt
//      that pops up on the customer's phone asking them to enter their M-Pesa PIN.
//   4. We save a "pending" row in the mpesa_transactions table so the app can
//      poll it and show the waiting screen.
//   5. Safaricom will call our OTHER function (mpesa-callback) later, once the
//      customer has entered their PIN (or the request times out).
//
// This function needs four secrets set in your Supabase project
// (Dashboard -> Edge Functions -> Secrets, or `supabase secrets set`):
//   MPESA_CONSUMER_KEY       - from your Safaricom Daraja app
//   MPESA_CONSUMER_SECRET    - from your Safaricom Daraja app
//   MPESA_SHORTCODE          - your Paybill/Till number (sandbox default: 174379)
//   MPESA_PASSKEY             - from Daraja (sandbox default is the public test passkey)
//   MPESA_ENV                - "sandbox" or "production" (defaults to sandbox)
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SANDBOX_BASE = "https://sandbox.safaricom.co.ke";
const PRODUCTION_BASE = "https://api.safaricom.co.ke";

// This is Safaricom's own published sandbox test passkey - safe to use as a
// fallback while testing, but you should use your real app's passkey for anything
// beyond the shared 174379 sandbox shortcode.
const SANDBOX_TEST_PASSKEY =
  "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

// Turns "0712345678" or "+254712345678" or "712345678" into "254712345678",
// which is the format Safaricom's API requires.
function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1);
  if (digits.length === 9) return "254" + digits;
  return null;
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const { orderId, phone, amount, customerName, accountReference } = await req.json();

    if (!phone || !amount) {
      return jsonResponse({ error: "phone and amount are required" }, 400);
    }

    const normalizedPhone = normalizePhone(String(phone));
    if (!normalizedPhone) {
      return jsonResponse({ error: "That phone number doesn't look valid. Use format 07XXXXXXXX." }, 400);
    }

    const env = Deno.env.get("MPESA_ENV") ?? "sandbox";
    const baseUrl = env === "production" ? PRODUCTION_BASE : SANDBOX_BASE;
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
    const shortcode = Deno.env.get("MPESA_SHORTCODE") ?? "174379";
    const passkey = Deno.env.get("MPESA_PASSKEY") ?? SANDBOX_TEST_PASSKEY;
    const callbackUrl = Deno.env.get("MPESA_CALLBACK_URL"); // set this to your deployed mpesa-callback function URL

    if (!consumerKey || !consumerSecret) {
      return jsonResponse(
        {
          error:
            "M-Pesa isn't configured yet. Add MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET as Supabase Edge Function secrets.",
        },
        500
      );
    }
    if (!callbackUrl) {
      return jsonResponse(
        { error: "MPESA_CALLBACK_URL secret is not set. It should point at your deployed mpesa-callback function." },
        500
      );
    }

    // Step 1: get an OAuth access token from Safaricom.
    const authHeader = "Basic " + btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: authHeader },
    });
    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      return jsonResponse({ error: "Could not authenticate with Safaricom", detail }, 502);
    }
    const { access_token: accessToken } = await tokenRes.json();

    // Step 2: build the STK push request.
    const timestamp = formatTimestamp(new Date());
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    const stkBody = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(Number(amount)),
      PartyA: normalizedPhone,
      PartyB: shortcode,
      PhoneNumber: normalizedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference ?? "KaliPOS",
      TransactionDesc: "KaliPOS order payment",
    };

    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stkBody),
    });

    const stkData = await stkRes.json();

    if (!stkRes.ok || stkData.ResponseCode !== "0") {
      return jsonResponse(
        { error: stkData.errorMessage ?? stkData.ResponseDescription ?? "STK push failed", detail: stkData },
        502
      );
    }

    // Step 3: save a "pending" row so the app has something to poll.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: txRow, error: dbError } = await supabase
      .from("mpesa_transactions")
      .insert({
        order_id: orderId ?? null,
        checkout_request_id: stkData.CheckoutRequestID,
        merchant_request_id: stkData.MerchantRequestID,
        phone: normalizedPhone,
        amount: Number(amount),
        customer_name: customerName ?? null,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) {
      return jsonResponse({ error: "STK push was sent, but saving the transaction failed", detail: dbError }, 500);
    }

    if (orderId) {
      await supabase.from("orders").update({ status: "awaiting_payment" }).eq("id", orderId);
    }

    return jsonResponse({
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
      transactionId: txRow.id,
    });
  } catch (err) {
    return jsonResponse({ error: "Unexpected error", detail: String(err) }, 500);
  }
});
