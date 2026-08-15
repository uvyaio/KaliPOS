// This file creates one shared connection to our Supabase backend.
// Every other file that needs to talk to the database imports `supabase` from here.
//
// The actual URL and key come from environment variables (see `.env.example`).
// Never hard-code real keys into source files that get committed to GitHub.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This warning shows up in the browser console if you forget to set up your .env file.
  console.warn(
    "Supabase environment variables are missing. Copy .env.example to .env and fill in your project's URL and anon key."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
