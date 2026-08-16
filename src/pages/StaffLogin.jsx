import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function StaffLogin() {
  const navigate = useNavigate();
  const { signInStaff } = useAuth();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pinRefs = [useRef(), useRef(), useRef(), useRef()];

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 9);
    if (val.length > 6) val = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`;
    else if (val.length > 3) val = `${val.slice(0, 3)} ${val.slice(3)}`;
    setPhone(val);
  };

  const handlePinChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    if (digit && index < 3) pinRefs[index + 1].current?.focus();
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const rawPhone = phone.replace(/\s/g, "");
    const fullPin = pin.join("");
    if (rawPhone.length !== 9) {
      setError("Enter your full 9-digit phone number.");
      return;
    }
    if (fullPin.length !== 4) {
      setError("Enter your 4-digit PIN.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("staff-login", {
        body: { phone: "254" + rawPhone, pin: fullPin },
      });
      if (fnError || data?.error) {
        throw new Error(data?.error || fnError.message);
      }
      signInStaff(data.staff);
      navigate("/app/pos");
    } catch (err) {
      setError(err.message || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-body-md">
      {/* Left: dark green branding panel, matches Landing */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-ink to-brand-ink-light text-white flex-col justify-between px-16 py-16">
        <Link to="/" className="flex items-center gap-3 w-fit">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined">storefront</span>
          </div>
          <span className="font-headline-md text-headline-md">KaliPOS</span>
        </Link>
        <div className="max-w-md">
          <h1 className="font-display-lg text-[36px] leading-tight font-bold mb-4">Clock in and get selling.</h1>
          <p className="text-white/70 text-body-lg leading-relaxed">
            Your phone and PIN get you straight to the POS — no email, no hassle.
          </p>
        </div>
        <p className="text-white/50 text-label-sm">Trusted by 1,200+ shops across Kenya 🇰🇪</p>
      </div>

      {/* Right: form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center px-8 py-16 lg:px-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2 text-brand-green mb-10 w-fit">
            <span className="material-symbols-outlined">storefront</span>
            <span className="font-headline-md text-headline-md">KaliPOS</span>
          </Link>

          <h2 className="font-display-lg text-[28px] font-bold text-on-surface mb-1">Staff sign in</h2>
          <p className="text-on-surface-variant text-body-md mb-8">Enter your work phone and 4-digit PIN</p>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface mb-2">Phone Number</label>
              <div className="flex items-center h-14 bg-surface-container-low rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-green/20 transition-all">
                <div className="flex items-center gap-2 pl-4 pr-3 border-r border-outline-variant/30 h-full text-on-surface font-medium">
                  +254
                </div>
                <input
                  className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-0 px-4 text-body-lg text-on-surface placeholder:text-outline"
                  placeholder="712 345 678"
                  value={phone}
                  onChange={handlePhoneChange}
                  type="tel"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block font-label-sm text-label-sm text-on-surface">4-Digit PIN</label>
                <button type="button" className="text-xs font-label-sm text-brand-green hover:underline">
                  Forgot PIN?
                </button>
              </div>
              <div className="flex gap-4 justify-between">
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={pinRefs[i]}
                    className="w-14 h-16 text-center text-2xl font-display-lg bg-surface-container-low rounded-xl border border-transparent focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all text-on-surface"
                    maxLength={1}
                    type="password"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                  />
                ))}
              </div>
            </div>

            {error && <div className="text-error text-label-sm bg-error-container/30 rounded-lg px-4 py-2">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-14 w-full bg-brand-green text-white rounded-xl font-label-sm text-body-md hover:bg-brand-green/90 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in to Shift"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-surface-container-high text-center">
            <Link
              className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-brand-green transition-colors"
              to="/login/owner"
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              Owner / Manager? Use email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
