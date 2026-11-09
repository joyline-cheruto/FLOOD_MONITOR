import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

// A placeholder URL keeps the app from crashing at import time when the
// env vars are missing; the page shows a setup message instead.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-key"
);
