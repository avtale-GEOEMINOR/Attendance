import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ADMIN_COOKIE = "admin_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect every /admin PAGE except the login page itself — that needs to
  // stay reachable so the password can be entered in the first place.
  // /api/admin/* routes handle their own cookie check internally (they're
  // POSTed to via fetch, not navigated to, so a redirect wouldn't help there).
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE)?.value;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || sessionCookie !== adminPassword) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
