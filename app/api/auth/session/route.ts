import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-session-node";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    const res = NextResponse.json({ authenticated: false }, { status: 401 });
    // Clear cookies so deleted/invalid users don't keep getting routed by stale auth state.
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
    res.cookies.set("pnhs_user", "", {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  }
  return NextResponse.json({ authenticated: true, user });
}

export const runtime = "nodejs"
