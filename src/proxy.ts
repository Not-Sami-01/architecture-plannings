import { NextResponse, type NextRequest } from "next/server";

import { ROUTES } from "@/config/constants";

/**
 * FR-3: protect /dashboard/* and /admin/*.
 *
 * This is the UX gate only: it checks for an Auth.js session cookie (edge
 * runtime — no DB, no env access here) and redirects to login. Real
 * authorization (role and ownership) is enforced server-side in every admin
 * layout and route handler via withMiddleware; never rely on this alone.
 */
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(req: NextRequest) {
  const isProtected =
    req.nextUrl.pathname.startsWith(ROUTES.dashboard) ||
    req.nextUrl.pathname.startsWith(ROUTES.admin.root);

  if (!isProtected) return NextResponse.next();

  const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL(ROUTES.login, req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
