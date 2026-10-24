import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Public routes — accessible without authentication.
 * - Marketing landing page and hash anchors
 * - Clerk's own auth routes
 * - Next.js internals + static assets
 */
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
  "/manifest(.*)",
  "/robots.txt",
  "/sitemap.xml",
  "/about(.*)",
  "/pricing(.*)",
  "/features(.*)",
  "/how-it-works(.*)",
  "/blog(.*)",
  "/terms(.*)",
  "/privacy(.*)",
  "/security(.*)",
  "/careers(.*)",
  "/docs(.*)",
  "/legal(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  // Match all routes except static assets and Next internals.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.(?:json|webmanifest)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml)$).*)",
    "/(api|trpc)(.*)",
  ],
};
