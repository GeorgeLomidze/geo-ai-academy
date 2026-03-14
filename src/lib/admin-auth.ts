import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  forbiddenResponse,
  unauthorizedResponse,
} from "@/lib/api-error";

type AdminAuthResult =
  | { authorized: true; userId: string }
  | { authorized: false; response: NextResponse };

export async function requireAdmin(request?: NextRequest): Promise<AdminAuthResult> {
  void request;
  const supabase = await createClient();
  const authHeader = request?.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const {
    data: { user },
  } = accessToken
    ? await supabase.auth.getUser(accessToken)
    : await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false,
      response: unauthorizedResponse(),
    };
  }

  if (user.user_metadata?.role === "admin") {
    return { authorized: true, userId: user.id };
  }

  // Fallback: check Supabase users table
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN") {
    return {
      authorized: false,
      response: forbiddenResponse(),
    };
  }

  return { authorized: true, userId: user.id };
}
