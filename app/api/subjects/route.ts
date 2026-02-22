import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/server-session-node";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const items = await prisma.subject.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.name)
      return NextResponse.json({ message: "Name required" }, { status: 400 });
    const created = await prisma.subject.create({ data: { name: body.name } });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }
}

export const runtime = "nodejs";
