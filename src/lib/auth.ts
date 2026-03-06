import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type AuthResult =
  | { authenticated: true; userId: string }
  | { authenticated: false; response: NextResponse };

export async function syncAuthUser(user: User) {
  if (!user.email) {
    throw new Error("ანგარიშის მონაცემები არასრულია");
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const role =
    user.user_metadata?.role === "admin" || existingUser?.role === "ADMIN"
      ? "ADMIN"
      : "STUDENT";

  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      name:
        typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null,
      avatarUrl:
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null,
      role,
    },
    create: {
      id: user.id,
      email: user.email,
      name:
        typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null,
      avatarUrl:
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null,
      role,
    },
  });
}

export async function requireAuth(request?: NextRequest): Promise<AuthResult> {
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
      authenticated: false,
      response: NextResponse.json(
        { error: "ავტორიზაცია აუცილებელია" },
        { status: 401 }
      ),
    };
  }

  if (!user.email) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "ანგარიშის მონაცემები არასრულია" },
        { status: 400 }
      ),
    };
  }

  await syncAuthUser(user);

  return { authenticated: true, userId: user.id };
}
