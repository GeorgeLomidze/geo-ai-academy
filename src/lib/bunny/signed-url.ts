import { createHash } from "node:crypto";

/**
 * Generates a token-authenticated embed/playback URL for a Bunny Stream video.
 * Uses BUNNY_STREAM_TOKEN_AUTH_KEY to create an expiring signed URL.
 */
export function getSignedVideoUrl(
  videoId: string,
  expiryHours = 4
): string {
  const tokenKey = process.env.BUNNY_STREAM_TOKEN_AUTH_KEY;
  const cdnHostname = process.env.BUNNY_STREAM_CDN_HOSTNAME;
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;

  if (!tokenKey || !cdnHostname || !libraryId) {
    throw new Error("Bunny Stream კონფიგურაცია არ არის მითითებული");
  }

  const expires = Math.floor(Date.now() / 1000) + expiryHours * 3600;
  const path = `/${videoId}/playlist.m3u8`;

  // Bunny token auth: SHA256(token_key + path + expires)
  const hashableBase = tokenKey + path + String(expires);
  const token = createHash("sha256")
    .update(hashableBase)
    .digest("hex");

  return `https://${cdnHostname}${path}?token=${token}&expires=${expires}`;
}

/**
 * Generates a thumbnail URL for a Bunny Stream video.
 */
export function getVideoThumbnailUrl(videoId: string): string {
  const cdnHostname = process.env.BUNNY_STREAM_CDN_HOSTNAME;

  if (!cdnHostname) {
    throw new Error("Bunny Stream CDN hostname არ არის მითითებული");
  }

  return `https://${cdnHostname}/${videoId}/thumbnail.jpg`;
}
