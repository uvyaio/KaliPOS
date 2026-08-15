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
    <div className="bg-background font-body-md text-on-surface min-h-screen flex flex-col justify-center items-center">
      <main className="w-full">
        <div className="flex flex-col w-full h-full min-h-screen justify-center items-center bg-background relative overflow-hidden">
          <div className="relative z-10 w-full max-w-md p-container-padding">
            <div className="bg-surface-container-lowest rounded-xl shadow-xl p-8 flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>

              <div className="flex flex-col gap-2 text-center">
                <h1 className="font-headline-lg text-headline-lg text-on-surface">
                  {mode === "signin" ? "Owner / Manager sign in" : "Create your restaurant"}
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {mode === "signin" ? "Use your email and password" : "Set up a new KaliPOS workspace"}
                </p>
              </div>

              {signupSuccess ? (
                <div className="flex flex-col items-center gap-4 text-center py-4">
                  <span className="material-symbols-outlined text-primary text-[48px]">mark_email_read</span>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Check <strong className="text-on-surface">{email}</strong> to confirm your account, then sign in.
                  </p>
                  <button
                    onClick={() => {
                      setMode("signin");
                      setSignupSuccess(false);
                    }}
                    className="h-12 px-6 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm"
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
                        className="h-12 px-4 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Zeki Bistro"
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
                      className="h-12 px-4 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                        className="h-12 w-full px-4 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {mode === "signin" && (
                    <div className="flex justify-between items-center px-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20 bg-surface-container-lowest cursor-pointer accent-primary" type="checkbox" />
                        <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">Remember me</span>
                      </label>
                      <a className="font-label-sm text-label-sm text-primary hover:text-primary-container transition-colors" href="#">Forgot password?</a>
                    </div>
                  )}

                  {error && (
                    <div className="text-error text-label-sm bg-error-container/30 rounded-lg px-4 py-2">{error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="h-12 mt-2 w-full rounded-lg bg-primary text-on-primary font-label-sm text-label-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-all shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 group disabled:opacity-60"
                  >
                    {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
                    {!loading && (
                      <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    )}
                  </button>
                </form>
              )}

              {!signupSuccess && (
                <>
                  <div className="flex items-center gap-4 my-2">
                    <div className="h-px bg-outline-variant/30 flex-1"></div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">or</span>
                    <div className="h-px bg-outline-variant/30 flex-1"></div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/login/staff"
                      className="h-12 w-full rounded-lg bg-secondary-container text-on-secondary-container font-label-sm text-label-sm flex items-center justify-center gap-2 hover:bg-secondary-container/80 transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">dialpad</span>
                      Staff PIN login
                    </Link>
                    <button
                      type="button"
                      onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                      className="h-12 w-full rounded-lg bg-transparent border border-outline-variant/50 text-on-surface font-label-sm text-label-sm flex items-center justify-center gap-2 hover:bg-surface-container-low transition-all"
                    >
                      {mode === "signin" ? "Create restaurant" : "Already have an account? Sign in"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
