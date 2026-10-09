import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * FR-3: clerkMiddleware runs everywhere so `auth()` is available inside
 * layouts, route handlers, and server components.
 *
 * Path-based `auth.protect()` checks are intentionally NOT used here (Clerk v7
 * deprecates `createRouteMatcher` — middleware path matching can diverge from
 * how Next.js routes requests). Resource checks live where the data lives:
 * - `(client)/layout` and `(admin)/admin/layout` redirect signed-out visitors
 *   (the admin layout also re-checks the DB role).
 * - API routes enforce auth via the `authenticate` + `requireRole` middlewares.
 * Never rely on a single layer.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals and static assets; run everywhere else (API included).
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
