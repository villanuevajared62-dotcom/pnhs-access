import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-session-node";
import { tasksDB, getNextTaskId } from "@/lib/db-store";

interface TaskPayload {
  task: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  class: string;
  description?: string;
  teacherId?: string;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Filter tasks by teacher if it's a teacher
    if (user.role === "teacher") {
      const myTasks = tasksDB.filter(
        (t) => !t.teacherId || t.teacherId === user.id,
      );
      return NextResponse.json(myTasks);
    }

    // Admin can see all tasks
    return NextResponse.json(tasksDB);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can create tasks" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as TaskPayload;

    if (!body.task || !body.deadline) {
      return NextResponse.json(
        { error: "Task and deadline are required" },
        { status: 400 },
      );
    }

    const newTask = {
      id: getNextTaskId(),
      ...body,
      teacherId: user.id,
      completed: false,
    };

    tasksDB.push(newTask);

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";
