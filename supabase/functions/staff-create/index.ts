// ============================================================================
// staff-create
// ----------------------------------------------------------------------------
// Used by the owner/manager dashboard to add a new waiter or cashier. Hashes
// the chosen 4-digit PIN before storing it, so it's never saved in plain text.
//
// Input:  { fullName, phone, pin, role, branchName }
// Output: { staff: { id, full_name, role } }
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { hash } from "https://esm.sh/bcryptjs@2.4.3";

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

function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1);
  if (digits.length === 9) return "254" + digits;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const { fullName, phone, pin, role, branchName } = await req.json();

    if (!fullName || !phone || !pin) {
      return jsonResponse({ error: "fullName, phone, and pin are required" }, 400);
    }
    if (!/^\d{4}$/.test(String(pin))) {
      return jsonResponse({ error: "PIN must be exactly 4 digits" }, 400);
    }

    const normalizedPhone = normalizePhone(String(phone));
    if (!normalizedPhone) {
      return jsonResponse({ error: "That phone number doesn't look valid." }, 400);
    }

    const pinHash = await hash(String(pin), 10);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("staff")
      .insert({
        full_name: fullName,
        phone: normalizedPhone,
        pin_hash: pinHash,
        role: role ?? "cashier",
        branch_name: branchName ?? "Main Branch",
      })
      .select("id, full_name, role")
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ staff: data });
  } catch (err) {
    return jsonResponse({ error: "Unexpected error", detail: String(err) }, 500);
  }
});
