import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes are public (accessible without login)
const isPublicRoute = createRouteMatcher([
  "/", // Landing page
  "/api/webhooks/clerk(.*)", // Webhook must be public for Clerk to insert users into Supabase
  "/api/cron/cleanup(.*)" // Must be public so Vercel cron can trigger it (protected by CRON_SECRET)
]);

export default clerkMiddleware((auth, request) => {
  // Protect all routes that are not matched in the isPublicRoute array
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  // Ensure middleware runs on all appropriate routes while skipping static files
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*", // Kept this from your original file just to be safe
  ],
};