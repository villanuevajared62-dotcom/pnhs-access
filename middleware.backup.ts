import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/api/auth/login",
  "/api/auth/session",
  "/api/announcements",
];

// Routes that require specific roles
const roleBasedRoutes = {
  "/admin": "admin",
  "/teacher": "teacher",
  "/student": "student",
};

function getUserFromCookie(
  req: NextRequest,
): { role: string; id: string } | null {
  // Try to get user from pnhs_user cookie (public, non-httpOnly)
  const userCookie = req.cookies.get("pnhs_user")?.value;
  if (userCookie) {
    try {
      const decoded = decodeURIComponent(userCookie);
      const user = JSON.parse(decoded);
      if (user && user.role) {
        return { role: user.role, id: user.id };
      }
    } catch {
      // Invalid cookie, continue to try other methods
    }
  }

  // Try to get user from pnhs_session cookie (httpOnly signed)
  const sessionCookie = req.cookies.get("pnhs_session")?.value;
  if (sessionCookie) {
    // If it's a signed cookie (contains "."), it might be valid
    // For now, we'll trust that if the cookie exists and has data, user is authenticated
    if (sessionCookie.includes("{") || sessionCookie.includes(".")) {
      try {
        // Try to parse if it's JSON
        const user = JSON.parse(sessionCookie);
        if (user && user.role) {
          return { role: user.role, id: user.id };
        }
      } catch {
        // Not JSON, might be signed - trust the cookie exists for now
        // The API will do proper verification
        return { role: "authenticated", id: "" };
      }
    }
  }

  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + "/"),
    )
  ) {
    return NextResponse.next();
  }

  // Check for authentication
  const user = getUserFromCookie(req);

  // If no user found, redirect to login
  if (!user) {
    // For API routes, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    // For page routes, redirect to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access for pages
  if (pathname.startsWith("/admin") && user.role !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/teacher") && user.role !== "teacher") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/student") && user.role !== "student") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Allow the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
