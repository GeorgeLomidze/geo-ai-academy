import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { fetchKieBalance } from "@/lib/kie/balance";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const balance = await fetchKieBalance();
    return NextResponse.json(balance);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/kie-balance failed");
  }
}
