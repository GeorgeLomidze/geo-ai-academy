import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const STALE_SESSION_ERROR_CODES = new Set([
  "refresh_token_not_found",
  "refresh_token_already_used",
  "session_not_found",
  "session_expired",
]);

function isStaleSessionError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "__isAuthError" in error &&
    "code" in error &&
    typeof error.code === "string" &&
    STALE_SESSION_ERROR_CODES.has(error.code)
  );
}

function getAuthCookieBaseName() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  try {
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    return `sb-${projectRef}-auth-token`;
  } catch {
    return null;
  }
}

function clearAuthCookies(request: NextRequest, response: NextResponse) {
  const authCookieBaseName = getAuthCookieBaseName();

  if (!authCookieBaseName) {
    return;
  }

  const authCookieNames = request.cookies
    .getAll()
    .map(({ name }) => name)
    .filter(
      (name) =>
        (name === authCookieBaseName ||
          name.startsWith(`${authCookieBaseName}.`) ||
          name.startsWith(`${authCookieBaseName}-`)) &&
        !name.endsWith("-code-verifier")
    );

  for (const name of authCookieNames) {
    request.cookies.set(name, "");
    response.cookies.set(name, "", { maxAge: 0, path: "/" });
  }
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (isStaleSessionError(error)) {
      clearAuthCookies(request, response);
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
      return { user: null, response };
    }

    return { user, response };
  } catch (error) {
    if (isStaleSessionError(error)) {
      clearAuthCookies(request, response);
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
      return { user: null, response };
    }

    throw error;
  }
}
