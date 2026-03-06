import { createHash } from "crypto";

/**
 * Generates a TUS upload URL for direct client-side upload to Bunny Stream.
 * The client uploads directly to Bunny — no file passes through our server.
 *
 * AuthorizationSignature must be SHA256(libraryId + apiKey + expirationTime + videoId)
 * per Bunny Stream TUS upload docs.
 */
export function getTusUploadUrl(videoId: string): {
  uploadUrl: string;
  headers: Record<string, string>;
} {
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;

  if (!apiKey || !libraryId) {
    throw new Error("Bunny Stream კონფიგურაცია არ არის მითითებული");
  }

  const expirationTime = String(Math.floor(Date.now() / 1000) + 3600);
  const signature = createHash("sha256")
    .update(libraryId + apiKey + expirationTime + videoId)
    .digest("hex");

  return {
    uploadUrl: `https://video.bunnycdn.com/tusupload`,
    headers: {
      AuthorizationSignature: signature,
      AuthorizationExpire: expirationTime,
      VideoId: videoId,
      LibraryId: libraryId,
    },
  };
}
