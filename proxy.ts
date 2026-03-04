import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedRoutes = ["/dashboard", "/profile"];
const adminRoutes = ["/admin"];
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route));
  const isAuth = authRoutes.some((route) => pathname.startsWith(route));

  const { user, response } = await updateSession(request);

  // Redirect authenticated users away from auth pages
  if (isAuth && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login
  if ((isProtected || isAdmin) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin role
  if (isAdmin && user) {
    const role = user.user_metadata?.role as string | undefined;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/profile/:path*", "/login", "/register"],
};
