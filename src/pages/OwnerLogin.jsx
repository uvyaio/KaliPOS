import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OwnerLogin() {
  const navigate = useNavigate();
  const { signInOwner, signUpOwner } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") === "signup" ? "signup" : "signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signin") {
        await signInOwner(email, password);
        navigate("/app/dashboard");
      } else {
        await signUpOwner(email, password, restaurantName);
        setSignupSuccess(true);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
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
          <h1 className="font-display-lg text-[36px] leading-tight font-bold mb-4">
            {mode === "signin" ? "Welcome back, owner." : "Set up your restaurant."}
          </h1>
          <p className="text-white/70 text-body-lg leading-relaxed">
            {mode === "signin"
              ? "Sign in to see today's sales, manage your menu, and keep an eye on M-Pesa payments in real time."
              : "It only takes a minute — you'll be taking your first order today."}
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

          <h2 className="font-display-lg text-[28px] font-bold text-on-surface mb-1">
            {mode === "signin" ? "Owner / Manager sign in" : "Create your restaurant"}
          </h2>
          <p className="text-on-surface-variant text-body-md mb-8">
            {mode === "signin" ? "Use your email and password" : "Set up a new KaliPOS workspace"}
          </p>

          {signupSuccess ? (
            <div className="flex flex-col items-center gap-4 text-center py-8">
              <span className="material-symbols-outlined text-brand-green text-[48px]">mark_email_read</span>
              <p className="text-on-surface-variant text-body-md">
                Check <strong className="text-on-surface">{email}</strong> to confirm your account, then sign in.
              </p>
              <button
                onClick={() => {
                  setMode("signin");
                  setSignupSuccess(false);
                }}
                className="h-12 px-6 rounded-xl bg-brand-green text-white font-label-sm text-label-sm"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-sm text-label-sm text-on-surface" htmlFor="restaurantName">
                    Restaurant name
                  </label>
                  <input
                    id="restaurantName"
                    className="h-14 px-4 rounded-xl bg-surface-container-low border border-transparent text-on-surface focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                    placeholder="Kato's Kitchen"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="h-14 px-4 rounded-xl bg-surface-container-low border border-transparent text-on-surface focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                  placeholder="owner@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="h-14 w-full px-4 rounded-xl bg-surface-container-low border border-transparent text-on-surface focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-brand-green transition-colors flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              {error && <div className="text-error text-label-sm bg-error-container/30 rounded-lg px-4 py-2">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="h-14 mt-2 w-full rounded-xl bg-brand-green text-white font-label-sm text-body-md flex items-center justify-center gap-2 hover:bg-brand-green/90 transition-all shadow-sm disabled:opacity-60"
              >
                {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          )}

          {!signupSuccess && (
            <div className="flex flex-col gap-3 mt-6">
              <Link
                to="/login/staff"
                className="h-14 w-full rounded-xl bg-surface-container-low text-on-surface font-label-sm text-body-md flex items-center justify-center gap-2 hover:bg-surface-container transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">key</span>
                Staff PIN login
              </Link>
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-center text-label-sm text-brand-green font-semibold hover:underline py-2"
              >
                {mode === "signin" ? "New restaurant? Create an account" : "Already have an account? Sign in"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
