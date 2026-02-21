import { NextRequest, NextResponse } from "next/server";
import type { User } from "@/lib/auth";
import { getSessionUserSync } from "@/lib/server-session";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Get user session ONCE (cookie-only, synchronous — middleware runs in Edge runtime)
  const user: User | null = getSessionUserSync(req);

  console.log(
    `[Middleware] ${pathname} - User: ${user?.username || "none"} (${user?.role || "N/A"})`,
  );

  const isAdminPath = pathname.startsWith("/admin");
  const isTeacherPath = pathname.startsWith("/teacher");
  const isStudentPath = pathname.startsWith("/student");

  const needsAuth = isAdminPath || isTeacherPath || isStudentPath;

  // Not authenticated - redirect to login
  if (needsAuth && !user) {
    console.log(`[Middleware] ❌ No user, redirecting to login`);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check role-based access
  if (user) {
    if (isAdminPath && user.role !== "admin") {
      console.log(`[Middleware] ❌ Wrong role (${user.role}), need admin`);
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (isTeacherPath && user.role !== "teacher") {
      console.log(`[Middleware] ❌ Wrong role (${user.role}), need teacher`);
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (isStudentPath && user.role !== "student") {
      console.log(`[Middleware] ❌ Wrong role (${user.role}), need student`);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  console.log(`[Middleware] ✅ Access granted`);
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/student/:path*"],
};
