import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/server-session-node";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ message: "Admin only" }, { status: 403 });
  }

  try {
    const deletedClasses = await prisma.class.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true },
    });

    let submissionsDeleted = 0;
    let assignmentsDeleted = 0;
    let attendanceDeleted = 0;
    let gradesDeleted = 0;
    let enrollmentsDeleted = 0;

    for (const cls of deletedClasses) {
      const assignmentIds = (
        await prisma.assignment.findMany({
          where: { classId: cls.id },
          select: { id: true },
        })
      ).map((a) => a.id);

      if (assignmentIds.length > 0) {
        const subRes = await prisma.submission.deleteMany({
          where: { assignmentId: { in: assignmentIds } },
        });
        submissionsDeleted += subRes.count;
      }

      const aRes = await prisma.assignment.deleteMany({
        where: { classId: cls.id },
      });
      assignmentsDeleted += aRes.count;

      const attRes = await prisma.attendance.deleteMany({
        where: { classId: cls.id },
      });
      attendanceDeleted += attRes.count;

      const gRes = await prisma.grade.deleteMany({ where: { classId: cls.id } });
      gradesDeleted += gRes.count;

      const eRes = await prisma.enrollment.deleteMany({
        where: { classId: cls.id },
      });
      enrollmentsDeleted += eRes.count;
    }

    await prisma.auditLog.create({
      data: {
        actorId: auth.user?.id || null,
        actorRole: auth.user?.role || null,
        action: "purge",
        resource: "DeletedClassData",
        resourceId: null,
        metadata: JSON.stringify({
          deletedClasses: deletedClasses.length,
          submissionsDeleted,
          assignmentsDeleted,
          attendanceDeleted,
          gradesDeleted,
          enrollmentsDeleted,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      deletedClasses: deletedClasses.length,
      submissionsDeleted,
      assignmentsDeleted,
      attendanceDeleted,
      gradesDeleted,
      enrollmentsDeleted,
    });
  } catch (e) {
    console.error("[purge-deleted-classes] failed:", e);
    return NextResponse.json({ message: "Failed to purge" }, { status: 500 });
  }
}

