import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/server-session-node";

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const qStudentId = url.searchParams.get("studentId");
  const qFrom = url.searchParams.get("from");
  const qTo = url.searchParams.get("to");

  // Build where clause with optional date range
  const where: any = {};
  if (qStudentId) where.studentId = qStudentId;
  if (qFrom || qTo) {
    where.date = {};
    if (qFrom) where.date.gte = new Date(qFrom);
    if (qTo) where.date.lte = new Date(qTo);
  }

  // Authorization rules
  if (user.role === "student") {
    // Students may only request their own attendance
    if (qStudentId && qStudentId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    where.studentId = user.id;

    const items = await prisma.attendance.findMany({
      where,
      orderBy: { date: "asc" },
    });
    return NextResponse.json(items);
  }

  if (user.role === "teacher") {
    // Teachers may only see attendance for their classes
    const classes = await prisma.class.findMany({
      where: { teacherId: user.id },
      select: { id: true },
    });
    const classIds = classes.map((c) => c.id);

    // If teacher requested a specific student, ensure we only return rows for classes they teach
    where.classId = { in: classIds };

    const items = await prisma.attendance.findMany({
      where,
      orderBy: { date: "asc" },
    });
    return NextResponse.json(items);
  }

  // Admin — allow optional studentId + date-range filters
  const items = await prisma.attendance.findMany({
    where,
    orderBy: { date: "asc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "teacher" && user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Validate required fields
    if (!body.studentId || !body.classId) {
      return NextResponse.json(
        { message: "Missing required fields: studentId and classId" },
        { status: 400 },
      );
    }

    // Validate status
    const validStatuses = ["present", "late", "absent"];
    const status = (body.status ?? "present").toLowerCase();
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Parse and validate date
    const attendanceDate = body.date ? new Date(body.date) : new Date();
    if (Number.isNaN(attendanceDate.getTime())) {
      return NextResponse.json({ message: "Invalid date value" }, { status: 400 });
    }

    // Prevent future-dated attendance
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (attendanceDate > today) {
      return NextResponse.json(
        { message: "Cannot record attendance for future dates" },
        { status: 400 },
      );
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: body.studentId },
    });
    if (!student) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 },
      );
    }

    // Verify class exists
    const classRecord = await prisma.class.findUnique({
      where: { id: body.classId },
    });
    if (!classRecord) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 });
    }

    // Verify student is enrolled in the class
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: body.studentId,
        classId: body.classId,
      },
    });
    if (!enrollment) {
      return NextResponse.json(
        { message: "Student is not enrolled in this class" },
        { status: 400 },
      );
    }

    // Verify teacher authorization (teacher can only record attendance for their classes)
    if (user.role === "teacher") {
      const teacherClass = await prisma.class.findUnique({
        where: { id: body.classId },
      });
      if (teacherClass?.teacherId !== user.id) {
        return NextResponse.json(
          { message: "You can only record attendance for your own classes" },
          { status: 403 },
        );
      }
    }

    // Check for duplicate attendance on same date (normalize date to start of day)
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: body.studentId,
        classId: body.classId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingAttendance) {
      const updated = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status,
          // Keep attendance daily by normalizing to start of day.
          date: startOfDay,
        },
      });
      return NextResponse.json(
        {
          ...updated,
          updatedExisting: true,
        },
        { status: 200 },
      );
    }

    // Create attendance record
    const newItem = await prisma.attendance.create({
      data: {
        studentId: body.studentId,
        classId: body.classId,
        // Store as daily attendance (normalized day)
        date: startOfDay,
        status: status,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (e) {
    console.error("Attendance POST error:", e);
    return NextResponse.json(
      { message: "Invalid payload or server error" },
      { status: 400 },
    );
  }
}
