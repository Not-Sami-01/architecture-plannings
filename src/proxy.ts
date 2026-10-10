import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * FR-3: clerkMiddleware runs everywhere so `auth()` is available inside
 * layouts, route handlers, and server components.
 *
 * Signed-out visits to the panel prefixes are redirected here (with `?next`
 * preserving the full deep link — this is the only layer that sees the URL).
 * Path checks are deliberately minimal (`/dashboard`, `/admin` prefixes):
 * layouts re-check auth + role server-side, and API routes enforce auth via
 * the `authenticate` + `requireRole` middlewares. Never rely on a single layer.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  if (userId) return;

  const path = req.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  if (!isProtected) return;

  const signInUrl = new URL("/sign-in", req.url);
  signInUrl.searchParams.set("next", `${path}${req.nextUrl.search}`);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: [
    // Skip Next internals and static assets; run everywhere else (API included).
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
