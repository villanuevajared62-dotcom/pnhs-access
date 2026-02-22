import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-session-node";
import { listAuthUsers, addAuthUser, type ManageUserCreate } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });
  return NextResponse.json(listAuthUsers());
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });

  try {
    const body = (await req.json()) as ManageUserCreate;
    const result = addAuthUser(body);
    if (!result.success || !result.user) {
      return NextResponse.json(
        { message: result.message || "Failed to create user" },
        { status: 400 },
      );
    }
    return NextResponse.json(result.user, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }
}

export const runtime = "nodejs"
