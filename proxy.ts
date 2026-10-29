import { NextResponse, type NextRequest } from "next/server";

// Must match ADMIN_COOKIE in lib/auth/admin-session.ts.
const ADMIN_COOKIE = "admin_session";

// Runs before every matching request. An "optimistic" first check only: it looks
// for the cookie but doesn't ask the database (the Next.js docs advise against
// database calls here, because proxy runs on every request, even prefetches).
// The real check — is this session in admin_sessions and unexpired? — happens
// in each admin page and API route.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  if (request.cookies.has(ADMIN_COOKIE)) return NextResponse.next();

  // API callers get a status code; people in a browser get the login page.
  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "Admin login required." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
