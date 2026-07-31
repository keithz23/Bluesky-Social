import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";

interface AccessTokenPayload extends JWTPayload {
  sub: string;
  permissions: string[];
}

const authRoutes = ["/login", "/signup", "/forgot"];
const userRoutePrefixes = [
  "/chat",
  "/notifications",
  "/settings",
  "/saved",
  "/lists",
  "/feeds",
];

const ADMIN_ROUTE_PERMISSIONS: Record<string, string> = {
  "/admin/dashboard": "system:read",
  "/admin/users": "user:read",
  "/admin/posts": "post:read",
  "/admin/roles-permissions": "role:read",
  "/admin/reports": "report:read",
  "/admin/moderation": "report:resolve",
  "/admin/rules": "rule:read",
  "/admin/keywords": "keyword:read",
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

async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(secret),
    { algorithms: ["HS256"] },
  );

  if (
    typeof payload.sub !== "string" ||
    !Array.isArray(payload.permissions) ||
    !payload.permissions.every((permission) => typeof permission === "string")
  ) {
    throw new Error("Invalid access token payload");
  }

  return payload as AccessTokenPayload;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;
  const isLoggingOut = Boolean(
    request.cookies.get("konekt-auth-logout-lock")?.value,
  );

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedUserRoute = userRoutePrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  let payload: AccessTokenPayload | null = null;
  if (token && !isLoggingOut) {
    try {
      payload = await verifyAccessToken(token);
    } catch {
      payload = null;
    }
  }

  if (payload && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Avoid leaving an authenticated administrator on the login page when a
  // stale client-side auth check briefly navigates there after sign-in.
  if (pathname === "/admin/login" && payload) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (isAdminRoute && !pathname.startsWith("/admin/login") && !payload) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtectedUserRoute && !payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && payload) {
    const requiredPermission = getRequiredPermission(pathname);
    if (requiredPermission && !payload.permissions.includes(requiredPermission)) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)).*)",
  ],
};
