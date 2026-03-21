import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requireAuth } from "@/lib/auth";
import { getBalance } from "@/lib/credits/manager";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.authenticated) return auth.response;

    const balance = await getBalance(auth.userId);

    return NextResponse.json({ balance });
  } catch (error) {
    return handleApiError(error, "GET /api/credits/balance failed");
  }
}
