import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;

  const authRoutes = ["/login", "/signup", "/forgot"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  const publicRoutes = ["/"];
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!token && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)).*)",
  ],
};
