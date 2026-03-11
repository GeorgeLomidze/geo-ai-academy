import { NextRequest, NextResponse } from "next/server";
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
