import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Safe env var access - handle undefined process in browser
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL') || "https://orbjrmdvaftdttnvxwdx.supabase.co";
const SUPABASE_ANON_KEY = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yYmpybWR2YWZ0ZHR0bnZ4d2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NzY0ODcsImV4cCI6MjA4OTM1MjQ4N30.v4AWpesnDXWwUSVS0HlD8ZXOjtRRxeFg5HO-kzcl1is";

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
