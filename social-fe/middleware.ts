import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

interface AccessTokenPayload {
  sub: string;
  permissions: string[];
  exp: number;
}

const authRoutes = ["/login", "/signup", "/forgot"];

const ADMIN_ROUTE_PERMISSIONS: Record<string, string> = {
  "/admin/users": "user:read",
  "/admin/roles-permissions": "role:read",
  "/admin/reports": "report:read",
  "/admin/moderation": "report:resolve",
  "/admin/rules": "system:update",
  "/admin/keywords": "system:update",
  "/admin/audit-logs": "system:read",
  "/admin/settings": "system:update",
  "/admin/analytics": "system:read",
};

function getRequiredPermission(pathname: string): string | null {
  const match = Object.keys(ADMIN_ROUTE_PERMISSIONS)
    .filter((prefix) => pathname.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];

  return match ? ADMIN_ROUTE_PERMISSIONS[match] : null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;
  const isLoggingOut = Boolean(
    request.cookies.get("konekt-auth-logout-lock")?.value,
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = pathname.startsWith("/admin");

  if (token && !isLoggingOut && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAdminRoute && (!token || isLoggingOut)) {
    if (pathname.startsWith("/admin/login")) {
      return NextResponse.next();
    }

    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && token) {
    try {
      const payload = jwtDecode<AccessTokenPayload>(token);
      const requiredPermission = getRequiredPermission(pathname);

      if (
        requiredPermission &&
        !payload.permissions?.includes(requiredPermission)
      ) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    } catch {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)).*)",
  ],
};
