import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;
  const isLoggingOut = Boolean(
    request.cookies.get("konekt-auth-logout-lock")?.value,
  );

  const authRoutes = ["/login", "/signup", "/forgot"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (token && !isLoggingOut && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)).*)",
  ],
};
