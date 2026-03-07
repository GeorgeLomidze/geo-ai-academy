import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email/send";

type AuthResult =
  | { authenticated: true; userId: string }
  | { authenticated: false; response: NextResponse };

export async function syncAuthUser(user: User) {
  if (!user.email) {
    throw new Error("ანგარიშის მონაცემები არასრულია");
  }

  const providerName =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : null;
  const providerAvatarUrl =
    typeof user.user_metadata?.avatar_url === "string" &&
    user.user_metadata.avatar_url.length > 0
      ? user.user_metadata.avatar_url
      : null;

  const existingUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, name: true, avatarUrl: true },
  });

  const isNewUser = !existingUser;

  const role =
    user.user_metadata?.role === "admin" || existingUser?.role === "ADMIN"
      ? "ADMIN"
      : "STUDENT";

  const persistedName = existingUser ? existingUser.name : providerName;
  const persistedAvatarUrl = existingUser
    ? existingUser.avatarUrl
    : providerAvatarUrl;

  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      name: persistedName,
      avatarUrl: persistedAvatarUrl,
      role,
    },
    create: {
      id: user.id,
      email: user.email,
      name: persistedName,
      avatarUrl: persistedAvatarUrl,
      role,
    },
  });

  if (isNewUser) {
    sendWelcomeEmail(user.email, persistedName ?? "მომხმარებელი").catch(
      (err) => console.error("[Email] Welcome email failed:", err)
    );
  }
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
