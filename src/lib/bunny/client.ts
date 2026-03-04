const BUNNY_API_BASE = "https://video.bunnycdn.com/library";

function getConfig() {
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;

  if (!apiKey || !libraryId) {
    throw new Error("Bunny Stream კონფიგურაცია არ არის მითითებული");
  }

  return { apiKey, libraryId };
}

async function bunnyFetch(path: string, options: RequestInit = {}) {
  const { apiKey, libraryId } = getConfig();

  const res = await fetch(`${BUNNY_API_BASE}/${libraryId}${path}`, {
    ...options,
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bunny API შეცდომა (${res.status}): ${text}`);
  }

  return res.json();
}

export type BunnyVideo = {
  guid: string;
  title: string;
  length: number;
  status: number;
  storageSize: number;
  thumbnailFileName: string;
  dateUploaded: string;
  encodeProgress: number;
};

type ListVideosResponse = {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  items: BunnyVideo[];
};

export async function listVideos(
  page = 1,
  itemsPerPage = 100
): Promise<ListVideosResponse> {
  return bunnyFetch(`/videos?page=${page}&itemsPerPage=${itemsPerPage}`);
}

export async function getVideo(videoId: string): Promise<BunnyVideo> {
  return bunnyFetch(`/videos/${videoId}`);
}

export async function deleteVideo(videoId: string): Promise<void> {
  const { apiKey, libraryId } = getConfig();

  const res = await fetch(
    `${BUNNY_API_BASE}/${libraryId}/videos/${videoId}`,
    {
      method: "DELETE",
      headers: { AccessKey: apiKey },
    }
  );

  if (!res.ok) {
    throw new Error(`ვიდეოს წაშლა ვერ მოხერხდა (${res.status})`);
  }
}

type CreateVideoResponse = {
  guid: string;
  title: string;
};

export async function createVideo(title: string): Promise<CreateVideoResponse> {
  return bunnyFetch("/videos", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}
