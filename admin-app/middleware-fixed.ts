import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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
    return NextResponse.next();
  }

  // Create response object early
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Check if required environment variables are present
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.log(
      "Missing Supabase environment variables, allowing request through"
    );
    return response;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              // Simplified cookie handling
              response.cookies.set(name, value, options);
            } catch (error) {
              // Ignore cookie errors
              console.warn("Cookie set error:", error);
            }
          },
          remove(name: string, options: any) {
            try {
              // Simplified cookie handling
              response.cookies.set(name, "", { ...options, maxAge: 0 });
            } catch (error) {
              // Ignore cookie errors
              console.warn("Cookie remove error:", error);
            }
          },
        },
      }
    );

    // Try to get user, but don't fail if it doesn't work
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.log(
        "Supabase auth error, continuing without auth:",
        authError.message
      );
      return response;
    }

    // Only redirect if user is definitely not logged in and trying to access protected routes
    if (
      !user &&
      (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/organization") ||
        pathname.startsWith("/manage"))
    ) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    console.log("Middleware error, allowing request through:", error);
    // Always allow the request through if there's any error
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
