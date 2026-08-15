// This file creates a "context" - a way to share the logged-in user's info
// with every page in the app, without passing it down manually through props.
//
// We support two kinds of sessions:
//   1. "owner" sessions use real Supabase Auth (email + password).
//   2. "staff" sessions are lighter-weight: after a successful PIN check
//      (via the staff-login Edge Function) we just remember the staff
//      member's details in localStorage. There's no Supabase Auth session
//      for them, since they don't have a login email.
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

const STAFF_STORAGE_KEY = "kalipos_staff_session";

export function AuthProvider({ children }) {
  const [ownerSession, setOwnerSession] = useState(null);
  const [staffSession, setStaffSession] = useState(() => {
    const saved = localStorage.getItem(STAFF_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setOwnerSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setOwnerSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signInOwner = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUpOwner = async (email, password, restaurantName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { restaurant_name: restaurantName } },
    });
    if (error) throw error;
    return data;
  };

  const signInStaff = (staff) => {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staff));
    setStaffSession(staff);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(STAFF_STORAGE_KEY);
    setStaffSession(null);
    setOwnerSession(null);
  };

  const value = {
    ownerSession,
    staffSession,
    isOwner: !!ownerSession,
    isStaff: !!staffSession,
    isAuthenticated: !!ownerSession || !!staffSession,
    loading,
    signInOwner,
    signUpOwner,
    signInStaff,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
