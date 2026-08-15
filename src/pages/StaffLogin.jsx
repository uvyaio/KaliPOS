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
    <div className="bg-background font-body-md text-on-surface min-h-screen flex flex-col justify-center items-center">
      <main className="w-full">
        <div className="flex flex-col w-full h-full min-h-screen justify-center items-center bg-background relative overflow-hidden">
          <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col md:flex-row shadow-2xl rounded-2xl overflow-hidden bg-surface-container-lowest">
            {/* Left: branding */}
            <div className="hidden md:flex flex-col w-1/2 relative bg-surface-container p-8 justify-between">
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-[32px]">restaurant_menu</span>
                  <span className="font-headline-md tracking-tight">
                    Kali<span className="font-body-md font-light text-on-surface ml-1">POS</span>
                  </span>
                </div>
              </div>
              <div className="relative z-10 mt-auto pb-12">
                <p className="font-body-lg text-on-surface-variant max-w-sm">
                  Access your shift schedule, table assignments, and real-time performance insights.
                </p>
              </div>
            </div>

            {/* Right: form */}
            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-surface-container-lowest relative">
              <div className="md:hidden flex items-center gap-2 text-primary mb-12">
                <span className="material-symbols-outlined text-[28px]">restaurant_menu</span>
                <span className="font-headline-md tracking-tight">
                  Kali<span className="font-body-md font-light text-on-surface ml-1">POS</span>
                </span>
              </div>
              <div className="max-w-md w-full mx-auto flex flex-col">
                <div className="mb-10 text-center md:text-left">
                  <h1 className="font-headline-lg text-on-surface mb-2 tracking-tight">Staff sign in</h1>
                  <p className="font-body-md text-on-surface-variant">Enter your work phone and 4-digit PIN</p>
                </div>
                <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                  <div className="group">
                    <label className="block font-label-sm text-on-surface mb-2 tracking-wide uppercase text-opacity-80">
                      Phone Number
                    </label>
                    <div className="relative flex items-center h-12 bg-surface-container-lowest rounded-lg border border-outline-variant group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-2 pl-3 pr-2 border-r border-outline-variant bg-surface-container/30 h-full">
                        <svg className="rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.1)]" fill="none" height="16" viewBox="0 0 24 16" width="24" xmlns="http://www.w3.org/2000/svg">
                          <rect fill="#000000" height="16" width="24"></rect>
                          <rect fill="#006600" height="5" width="24" y="11"></rect>
                          <rect fill="#CC0000" height="6" width="24" y="5"></rect>
                          <rect fill="#FFFFFF" height="1" width="24" y="4"></rect>
                          <rect fill="#FFFFFF" height="1" width="24" y="11"></rect>
                        </svg>
                        <span className="font-body-md text-on-surface font-medium">+254</span>
                      </div>
                      <input
                        className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-0 px-4 font-body-lg text-on-surface placeholder:text-outline"
                        placeholder="712 345 678"
                        value={phone}
                        onChange={handlePhoneChange}
                        type="tel"
                      />
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex justify-between items-end mb-2">
                      <label className="block font-label-sm text-on-surface tracking-wide uppercase text-opacity-80">4-Digit PIN</label>
                      <button type="button" className="text-xs font-label-sm text-primary hover:text-primary-container transition-colors">
                        Forgot PIN?
                      </button>
                    </div>
                    <div className="flex gap-4 justify-between">
                      {pin.map((digit, i) => (
                        <input
                          key={i}
                          ref={pinRefs[i]}
                          className="pin-input w-14 h-16 text-center text-2xl font-display-lg bg-surface-container-lowest rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm text-on-surface hover:shadow-md"
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
                    className="mt-4 h-12 w-full bg-primary text-on-primary rounded-lg font-label-sm uppercase tracking-wider hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center relative overflow-hidden shadow-md hover:shadow-lg disabled:opacity-60"
                  >
                    {loading ? "Signing in..." : "Sign in to Shift"}
                  </button>
                </form>
                <div className="mt-8 pt-6 border-t border-surface-container-highest text-center">
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-body-md text-tertiary hover:text-on-surface transition-colors group"
                    to="/login/owner"
                  >
                    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                    Owner / Manager? Use email
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
