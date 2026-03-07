import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client for storage operations.
 * Uses the service role key to bypass RLS — server-side only.
 */
export function createStorageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
