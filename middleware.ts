import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes are public
const isPublicRoute = createRouteMatcher([
  "/", 
  "/api/webhooks/clerk(.*)", 
  "/api/cron/cleanup(.*)",
  "/api/sessions(.*)"
]);

export default clerkMiddleware((auth, request) => {
  // Check if the route is NOT public
  if (!isPublicRoute(request)) {
    // Instead of auth().protect(), use auth.protect() directly
    auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};