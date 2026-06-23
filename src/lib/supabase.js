import { createClient } from "@supabase/supabase-js";

let _adminClient = null;
let _anonClient = null;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createAdminClient() {
  if (_adminClient) return _adminClient;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  _adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _adminClient;
}

export function createAnonClient() {
  if (_anonClient) return _anonClient;
  if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
  }
  _anonClient = createClient(SUPABASE_URL, ANON_KEY);
  return _anonClient;
}
