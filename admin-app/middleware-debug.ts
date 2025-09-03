import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("🔍 Middleware executing for:", request.nextUrl.pathname);
  
  // Skip middleware for static files and API routes
  const { pathname } = request.nextUrl;

  // Allow static files, favicon, and public API routes to pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/webhooks") ||
    pathname === "/favicon.ico" ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".ico")
  ) {
    console.log("✅ Allowing static file:", pathname);
    return NextResponse.next();
  }

  // Log environment variables status
  console.log("🔧 Environment check:", {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  });

  // For debugging: allow all requests through for now
  console.log("🚦 Allowing all requests through for debugging:", pathname);
  
  try {
    // Simple response - no Supabase interaction
    return NextResponse.next();
  } catch (error) {
    console.error("❌ Middleware error:", error);
    // Always return a response, never throw
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
