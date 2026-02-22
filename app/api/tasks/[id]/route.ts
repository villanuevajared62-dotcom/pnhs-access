import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-session-node";
import { tasksDB } from "@/lib/db-store";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user || user.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can update tasks" },
        { status: 403 },
      );
    }

    const body = await req.json();

    const taskIndex = tasksDB.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    tasksDB[taskIndex] = { ...tasksDB[taskIndex], ...body };

    return NextResponse.json(tasksDB[taskIndex]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user || user.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can delete tasks" },
        { status: 403 },
      );
    }
    const taskIndex = tasksDB.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    tasksDB.splice(taskIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs"
