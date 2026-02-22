import { NextRequest, NextResponse } from "next/server";
import type { User } from "@/lib/auth";
import { getSessionUser } from "@/lib/server-session";

export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Get user session (signed cookie verification when SESSION_SECRET is set)
  const user: User | null = await getSessionUser(req);

  console.log(
    `[Proxy] ${pathname} - User: ${user?.username || "none"} (${user?.role || "N/A"})`,
  );

  const isAdminPath = pathname.startsWith("/admin");
  const isTeacherPath = pathname.startsWith("/teacher");
  const isStudentPath = pathname.startsWith("/student");

  const needsAuth = isAdminPath || isTeacherPath || isStudentPath;

  // Not authenticated - redirect to login
  if (needsAuth && !user) {
    console.log(`[Proxy] ❌ No user, redirecting to login`);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check role-based access
  if (user) {
    if (isAdminPath && user.role !== "admin") {
      console.log(`[Proxy] ❌ Wrong role (${user.role}), need admin`);
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (isTeacherPath && user.role !== "teacher") {
      console.log(`[Proxy] ❌ Wrong role (${user.role}), need teacher`);
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (isStudentPath && user.role !== "student") {
      console.log(`[Proxy] ❌ Wrong role (${user.role}), need student`);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  console.log(`[Proxy] ✅ Access granted`);
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/student/:path*"],
};
