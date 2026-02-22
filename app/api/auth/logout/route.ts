import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Revoke DB-backed session token (if present)
  const token = req.cookies.get("pnhs_session_token")?.value;
  if (token) {
    try {
      const prisma = (await import("@/lib/prisma")).default;
      await prisma.session.updateMany({
        where: { token },
        data: { revoked: true },
      });
    } catch (e) {
      console.error("[logout] failed to revoke session", e);
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("pnhs_session_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("pnhs_session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  // clear public fallback cookie as well
  res.cookies.set("pnhs_user", "", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export const runtime = "nodejs"
