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

type EnsureBucketOptions = {
  public?: boolean;
};

/**
 * Ensures a storage bucket exists, creating it if needed.
 * Caches per-process to avoid repeated API calls.
 */
export async function ensureBucket(
  supabase: ReturnType<typeof createStorageClient>,
  bucketName: string,
  options: EnsureBucketOptions = {}
) {
  const isPublic = options.public ?? true;
  const cacheKey = `${bucketName}:${isPublic ? "public" : "private"}`;
  if (ensuredBuckets.has(cacheKey)) return;

  const { data: existingBucket, error: existingBucketError } =
    await supabase.storage.getBucket(bucketName);

  if (existingBucket) {
    if (existingBucket.public !== isPublic) {
      const { error: updateError } = await supabase.storage.updateBucket(
        bucketName,
        { public: isPublic }
      );

      if (updateError) {
        throw new Error(
          `Failed to update bucket "${bucketName}": ${updateError.message}`
        );
      }
    }

    ensuredBuckets.add(cacheKey);
    return;
  }

  if (existingBucketError && existingBucketError.statusCode !== "404") {
    throw new Error(
      `Failed to check bucket "${bucketName}": ${existingBucketError.message}`
    );
  }

  const { error } = await supabase.storage.createBucket(bucketName, {
    public: isPublic,
  });

  // "already exists" is fine — anything else is a real error
  if (error && !error.message.includes("already exists")) {
    throw new Error(`Failed to create bucket "${bucketName}": ${error.message}`);
  }

  ensuredBuckets.add(cacheKey);
}
