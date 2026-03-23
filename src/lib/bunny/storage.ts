const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
let hasLoggedUnauthorizedBunnyWarning = false;

function getStorageConfig() {
  const apiKey = process.env.BUNNY_STORAGE_API_KEY;
  const zone = process.env.BUNNY_STORAGE_ZONE;
  const hostname = process.env.BUNNY_STORAGE_HOSTNAME;
  const cdnUrl = process.env.BUNNY_CDN_URL;

  if (!apiKey || !zone || !hostname || !cdnUrl) {
    throw new Error("Bunny Storage კონფიგურაცია არ არის მითითებული");
  }

  return { apiKey, zone, hostname, cdnUrl };
}

function getStoragePath(
  type: "IMAGE" | "VIDEO" | "AUDIO",
  userId: string,
  generationId: string,
  extension: string
) {
  const folder =
    type === "IMAGE" ? "images" : type === "VIDEO" ? "videos" : "audio";
  return `generations/${folder}/${userId}/${generationId}.${extension}`;
}

function inferFileExtension(sourceUrl: string, contentType: string | null, type: "IMAGE" | "VIDEO" | "AUDIO") {
  const normalizedContentType = (contentType ?? "").toLowerCase();

  if (normalizedContentType.includes("mpeg") || normalizedContentType.includes("mp3")) {
    return "mp3";
  }
  if (normalizedContentType.includes("wav")) {
    return "wav";
  }
  if (normalizedContentType.includes("ogg")) {
    return "ogg";
  }
  if (normalizedContentType.includes("aac")) {
    return "aac";
  }
  if (normalizedContentType.includes("mp4")) {
    return type === "AUDIO" ? "m4a" : "mp4";
  }
  if (normalizedContentType.includes("png")) {
    return "png";
  }
  if (normalizedContentType.includes("jpeg") || normalizedContentType.includes("jpg")) {
    return "jpg";
  }

  try {
    const pathname = new URL(sourceUrl).pathname;
    const match = pathname.match(/\.([a-z0-9]+)$/i);
    if (match?.[1]) {
      return match[1].toLowerCase();
    }
  } catch {
    // Ignore URL parsing errors and fall back to defaults below.
  }

  if (type === "IMAGE") return "png";
  if (type === "VIDEO") return "mp4";
  return "mp3";
}

export function getCdnUrl(path: string) {
  const { cdnUrl } = getStorageConfig();
  return `${cdnUrl}/${path}`;
}

export async function uploadToStorage(
  fileBuffer: ArrayBuffer,
  path: string
): Promise<string> {
  const { apiKey, zone, hostname } = getStorageConfig();

  if (fileBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error(
      `ფაილის ზომა (${Math.round(fileBuffer.byteLength / 1024 / 1024)}MB) აღემატება ლიმიტს (100MB)`
    );
  }

  const url = `https://${hostname}/${zone}/${path}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/octet-stream",
    },
    body: fileBuffer,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bunny Storage ატვირთვის შეცდომა (${res.status}): ${text}`);
  }

  return getCdnUrl(path);
}

export async function deleteFromStorage(path: string): Promise<void> {
  const { apiKey, zone, hostname } = getStorageConfig();
  const url = `https://${hostname}/${zone}/${path}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      AccessKey: apiKey,
    },
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Bunny Storage წაშლის შეცდომა (${res.status}): ${text}`);
  }
}

/**
 * Downloads a file from a temporary Kie.ai URL and uploads it to Bunny Storage.
 * Returns the permanent CDN URL, or null if the upload fails.
 */
export async function persistToBunnyStorage(
  sourceUrl: string,
  type: "IMAGE" | "VIDEO" | "AUDIO",
  userId: string,
  generationId: string
): Promise<string | null> {
  try {
    const response = await fetch(sourceUrl);

    if (!response.ok) {
      console.error(
        `[BunnyStorage] ფაილის ჩამოტვირთვა ვერ მოხერხდა: ${response.status} ${sourceUrl}`
      );
      return null;
    }

    const buffer = await response.arrayBuffer();

    if (buffer.byteLength > MAX_FILE_SIZE) {
      console.error(
        `[BunnyStorage] ფაილი ზედმეტად დიდია: ${Math.round(buffer.byteLength / 1024 / 1024)}MB (${sourceUrl})`
      );
      return null;
    }

    const extension = inferFileExtension(
      sourceUrl,
      response.headers.get("content-type"),
      type
    );
    const path = getStoragePath(type, userId, generationId, extension);
    return await uploadToStorage(buffer, path);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("Bunny Storage ატვირთვის შეცდომა (401)")) {
      if (!hasLoggedUnauthorizedBunnyWarning) {
        hasLoggedUnauthorizedBunnyWarning = true;
        console.warn(
          "[BunnyStorage] ავტორიზაცია ვერ მოხერხდა. გადაამოწმე `BUNNY_STORAGE_API_KEY`, `BUNNY_STORAGE_ZONE` და `BUNNY_STORAGE_HOSTNAME`."
        );
      }
      return null;
    }

    console.error("[BunnyStorage] ატვირთვა ვერ მოხერხდა:", error);
    return null;
  }
}
