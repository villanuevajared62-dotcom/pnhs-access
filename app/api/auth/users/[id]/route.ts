import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-session";
import {
  getAuthUserById,
  updateAuthUser,
  deleteAuthUser,
  type ManageUserUpdate,
} from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });
  const user = getAuthUserById(id);
  if (!user)
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });

  try {
    const body = (await req.json()) as ManageUserUpdate;
    const result = updateAuthUser(id, body);
    if (!result.success || !result.user) {
      return NextResponse.json(
        { message: result.message || "Failed to update user" },
        { status: 400 },
      );
    }
    return NextResponse.json(result.user);
  } catch (e) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAdmin(req);
  if (!auth.ok)
    return NextResponse.json({ message: "Admin only" }, { status: 403 });

  const result = deleteAuthUser(id);
  if (!result.success) {
    return NextResponse.json(
      { message: result.message || "Failed to delete user" },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true });
}
