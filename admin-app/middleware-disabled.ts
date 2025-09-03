import { NextResponse } from "next/server";

export function middleware() {
  // Absolutely minimal middleware - just pass everything through
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
