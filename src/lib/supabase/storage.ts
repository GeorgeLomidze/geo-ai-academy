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

const ensuredBuckets = new Set<string>();

/**
 * Ensures a public storage bucket exists, creating it if needed.
 * Caches per-process to avoid repeated API calls.
 */
export async function ensureBucket(
  supabase: ReturnType<typeof createStorageClient>,
  bucketName: string
) {
  if (ensuredBuckets.has(bucketName)) return;

  const { error } = await supabase.storage.createBucket(bucketName, {
    public: true,
  });

  // "already exists" is fine — anything else is a real error
  if (error && !error.message.includes("already exists")) {
    throw new Error(`Failed to create bucket "${bucketName}": ${error.message}`);
  }

  ensuredBuckets.add(bucketName);
}
