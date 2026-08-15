// ============================================================================
// staff-login
// ----------------------------------------------------------------------------
// Waiters and cashiers sign in with their phone number + a 4-digit PIN
// instead of an email/password. We never want the PIN comparison to happen
// in the browser (that would mean sending every staff member's PIN hash to
// anyone who opens the app), so it happens here instead, using the
// "service role" key which only this server-side function has access to.
//
// Input:  { phone: "0712345678", pin: "1234" }
// Output: { staff: { id, full_name, role, branch_name } }  on success
//         { error: "..." }                                  on failure
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { compare } from "https://esm.sh/bcryptjs@2.4.3";

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
    const { phone, pin } = await req.json();
    if (!phone || !pin) {
      return jsonResponse({ error: "phone and pin are required" }, 400);
    }

    const normalizedPhone = normalizePhone(String(phone));
    if (!normalizedPhone) {
      return jsonResponse({ error: "That phone number doesn't look valid." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: staffRow, error } = await supabase
      .from("staff")
      .select("id, full_name, role, branch_name, pin_hash, is_active")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (error || !staffRow || !staffRow.is_active) {
      return jsonResponse({ error: "No active staff account found for that phone number." }, 401);
    }

    if (!staffRow.pin_hash) {
      return jsonResponse({ error: "This account doesn't have a PIN set up yet. Ask your manager." }, 401);
    }

    const pinMatches = await compare(String(pin), staffRow.pin_hash);
    if (!pinMatches) {
      return jsonResponse({ error: "Incorrect PIN." }, 401);
    }

    return jsonResponse({
      staff: {
        id: staffRow.id,
        full_name: staffRow.full_name,
        role: staffRow.role,
        branch_name: staffRow.branch_name,
      },
    });
  } catch (err) {
    return jsonResponse({ error: "Unexpected error", detail: String(err) }, 500);
  }
});
