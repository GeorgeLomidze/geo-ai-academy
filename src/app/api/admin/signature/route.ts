import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import {
  handleApiError,
  parseJsonBody,
  validationErrorResponse,
} from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrisma } from "@/lib/prisma";
import { invalidateSignatureCache } from "@/lib/email/signature";
import { sanitizeEmailSignatureHtml } from "@/lib/email/signature-sanitizer";
import { Prisma } from "@prisma/client";

const signatureSchema = z.object({
  html: z.string().max(50000, "ხელმოწერა ძალიან გრძელია"),
});

type SignatureRow = { id: string; html: string };

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const db = getPrisma();
    const rows = await db.$queryRaw<SignatureRow[]>(
      Prisma.sql`SELECT id, html FROM email_signatures ORDER BY "updatedAt" DESC LIMIT 1`
    );

    return NextResponse.json({
      html: sanitizeEmailSignatureHtml(rows[0]?.html ?? ""),
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/signature failed");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) return auth.response;

    const body = await parseJsonBody(request);
    const parsed = signatureSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse({
        html: parsed.error.issues[0]?.message ?? "არასწორი მონაცემები",
      });
    }

    const sanitizedHtml = sanitizeEmailSignatureHtml(parsed.data.html);
    const db = getPrisma();
    const rows = await db.$queryRaw<SignatureRow[]>(
      Prisma.sql`SELECT id FROM email_signatures LIMIT 1`
    );

    if (rows[0]) {
      await db.$executeRaw(
        Prisma.sql`UPDATE email_signatures SET html = ${sanitizedHtml}, "updatedAt" = NOW() WHERE id = ${rows[0].id}`
      );
    } else {
      await db.$executeRaw(
        Prisma.sql`INSERT INTO email_signatures (id, html, "createdAt", "updatedAt") VALUES (gen_random_uuid(), ${sanitizedHtml}, NOW(), NOW())`
      );
    }

    invalidateSignatureCache();

    return NextResponse.json({ success: true, html: sanitizedHtml });
  } catch (error) {
    return handleApiError(error, "PUT /api/admin/signature failed");
  }
}
