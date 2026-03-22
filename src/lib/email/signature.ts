import { getPrisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sanitizeEmailSignatureHtml } from "@/lib/email/signature-sanitizer";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let cachedHtml: string | null = null;
let cacheTimestamp = 0;

export function invalidateSignatureCache() {
  cachedHtml = null;
  cacheTimestamp = 0;
}

type SignatureRow = { html: string };

export async function getSignatureHtml(): Promise<string> {
  if (cachedHtml !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedHtml;
  }

  try {
    const db = getPrisma();
    const rows = await db.$queryRaw<SignatureRow[]>(
      Prisma.sql`SELECT html FROM email_signatures ORDER BY "updatedAt" DESC LIMIT 1`
    );

    cachedHtml = sanitizeEmailSignatureHtml(rows[0]?.html ?? "");
    cacheTimestamp = Date.now();
    return cachedHtml;
  } catch {
    // If DB query fails, return empty rather than breaking email sends
    return cachedHtml ?? "";
  }
}

export function buildSignatureBlock(signatureHtml: string): string {
  const safeHtml = sanitizeEmailSignatureHtml(signatureHtml);
  if (!safeHtml.trim()) return "";

  return `<hr style="border:none;border-top:1px solid #333;margin:24px 0;" />${safeHtml}`;
}
