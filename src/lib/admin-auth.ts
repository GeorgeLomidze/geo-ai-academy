import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@/lib/supabase/server";

type AdminAuthResult =
  | { authorized: true; userId: string }
  | { authorized: false; response: NextResponse };

export async function requireAdmin(request?: NextRequest): Promise<AdminAuthResult> {
  const supabase = request
    ? createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {
              // Route Handlers can't set cookies on the request;
              // the proxy already handles session refresh.
            },
          },
        }
      )
    : await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "ავტორიზაცია აუცილებელია" },
        { status: 401 }
      ),
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
      response: NextResponse.json(
        { error: "წვდომა აკრძალულია" },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, userId: user.id };
}
