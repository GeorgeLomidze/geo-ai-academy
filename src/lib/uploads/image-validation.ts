const IMAGE_SIGNATURES = {
  jpeg: { mime: "image/jpeg", startsWith: [0xff, 0xd8, 0xff] },
  png: { mime: "image/png", startsWith: [0x89, 0x50, 0x4e, 0x47] },
  gif87a: { mime: "image/gif", ascii: "GIF87a" },
  gif89a: { mime: "image/gif", ascii: "GIF89a" },
  webp: { mime: "image/webp", riff: "RIFF", webp: "WEBP" },
  avif: { mime: "image/avif", avif: "ftypavif" },
} as const;

function startsWithBytes(buffer: Uint8Array, expected: readonly number[]) {
  if (buffer.length < expected.length) {
    return false;
  }

  return expected.every((byte, index) => buffer[index] === byte);
}

function matchesAscii(buffer: Uint8Array, expected: string, offset = 0) {
  if (buffer.length < offset + expected.length) {
    return false;
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (buffer[offset + index] !== expected.charCodeAt(index)) {
      return false;
    }
  }

  return true;
}

export function detectImageMime(buffer: Uint8Array) {
  if (startsWithBytes(buffer, IMAGE_SIGNATURES.jpeg.startsWith)) {
    return IMAGE_SIGNATURES.jpeg.mime;
  }

  if (startsWithBytes(buffer, IMAGE_SIGNATURES.png.startsWith)) {
    return IMAGE_SIGNATURES.png.mime;
  }

  if (
    matchesAscii(buffer, IMAGE_SIGNATURES.gif87a.ascii) ||
    matchesAscii(buffer, IMAGE_SIGNATURES.gif89a.ascii)
  ) {
    return IMAGE_SIGNATURES.gif87a.mime;
  }

  if (
    matchesAscii(buffer, IMAGE_SIGNATURES.webp.riff, 0) &&
    matchesAscii(buffer, IMAGE_SIGNATURES.webp.webp, 8)
  ) {
    return IMAGE_SIGNATURES.webp.mime;
  }

  if (matchesAscii(buffer, IMAGE_SIGNATURES.avif.avif, 4)) {
    return IMAGE_SIGNATURES.avif.mime;
  }

  return null;
}
