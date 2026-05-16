import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Lazy-initialized anon Supabase client.
 * Safe to import at build time — won't throw until first actual use.
 */
let _anonClient = null;
export function getSupabase() {
  if (!_anonClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diset.",
      );
    }
    _anonClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _anonClient;
}

/**
 * Named export `supabase` for backward compat.
 * Delegates every call to the lazily-created client.
 */
export const supabase = {
  get from() { return getSupabase().from.bind(getSupabase()); },
  get auth() { return getSupabase().auth; },
  get storage() { return getSupabase().storage; },
  get channel() { return getSupabase().channel.bind(getSupabase()); },
  get rpc() { return getSupabase().rpc.bind(getSupabase()); },
  get fromQuery() { return getSupabase().fromQuery?.bind(getSupabase()); },
};

export function createAdminClient() {
  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL wajib diset untuk operasi server.",
    );
  }
  if (!supabaseServiceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY wajib diset untuk operasi server.",
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}
