const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

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
  type: "IMAGE" | "VIDEO",
  userId: string,
  generationId: string
) {
  const folder = type === "IMAGE" ? "images" : "videos";
  const ext = type === "IMAGE" ? "png" : "mp4";
  return `generations/${folder}/${userId}/${generationId}.${ext}`;
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
  type: "IMAGE" | "VIDEO",
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

    const path = getStoragePath(type, userId, generationId);
    return await uploadToStorage(buffer, path);
  } catch (error) {
    console.error("[BunnyStorage] ატვირთვა ვერ მოხერხდა:", error);
    return null;
  }
}
