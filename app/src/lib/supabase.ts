import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "⚠️ CRITICAL CONFIGURATION ERROR: Supabase environment variables are missing! " +
    "Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment."
  );
}

// Use valid placeholder format to prevent createClient from throwing an error at script load time
export const supabase = createClient(
  supabaseUrl || "https://missing-supabase-url.supabase.co",
  supabaseAnonKey || "missing-supabase-anon-key"
);
