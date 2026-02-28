import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/server-session-node";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

const toTitle = (s: string) =>
  String(s || "")
    .trim()
    .split(/\s+/)
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1).toLowerCase() : p))
    .join(" ");

const safeName = (s: string) =>
  String(s || "student")
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 80) || "student";

function normalizePeriod(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toUpperCase() : "";
}

function parseGradeLevelNumber(value: string): number | null {
  const m = String(value || "").match(/grade\s*(\d+)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function asNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function avgSafe(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, n) => s + n, 0) / values.length;
}

function computeGeneralAverage(rows: Array<{ final: number | null }>): number | null {
  const vals = rows.map((r) => r.final).filter((n): n is number => Number.isFinite(n as number));
  return avgSafe(vals);
}

async function isApprovedForClassPeriod(classId: string, periodKey: string) {
  const resourceId = `${classId}:${periodKey}`;
  const latest = await prisma.auditLog.findFirst({
    where: { action: "grades_finalized", resource: "grades", resourceId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return !!latest;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "student") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const period = normalizePeriod(url.searchParams.get("period"));
  if (!period) {
    return NextResponse.json({ message: "period is required" }, { status: 400 });
  }

  const settings = await prisma.settings.findFirst().catch(() => null);
  const schoolName = settings?.schoolName || "Pantabangan National High School";
  const schoolYear = settings?.schoolYear || "School Year";

  const student = await prisma.student.findFirst({
    where: { id: user.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      gradeLevel: true,
      section: true,
      strand: true,
      studentId: true,
    },
  });
  if (!student) {
    return NextResponse.json({ message: "Student not found" }, { status: 404 });
  }

  const gradeLevelNum = parseGradeLevelNumber(student.gradeLevel);
  const isSeniorHigh = (gradeLevelNum ?? 0) >= 11;

  // Period rules
  const juniorQuarters = new Set(["Q1", "Q2", "Q3", "Q4"]);
  const seniorSemesters = new Set(["S1", "S2"]);
  if (!isSeniorHigh && !juniorQuarters.has(period)) {
    return NextResponse.json(
      { message: "Invalid quarter. Use Q1-Q4." },
      { status: 400 },
    );
  }
  if (isSeniorHigh && !seniorSemesters.has(period)) {
    return NextResponse.json(
      { message: "Invalid semester. Use S1 or S2." },
      { status: 400 },
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id, class: { deletedAt: null } },
    include: { class: true },
  });
  const classes = enrollments.map((e) => e.class).filter(Boolean);
  if (classes.length === 0) {
    return NextResponse.json(
      { message: "No active enrollments found" },
      { status: 400 },
    );
  }

  // Approval: every enrolled class must be finalized for this quarter/semester.
  const approvals = await Promise.all(
    classes.map(async (c) => ({
      classId: c.id,
      ok: await isApprovedForClassPeriod(c.id, period),
    })),
  );
  const unapproved = approvals.filter((a) => !a.ok);
  if (unapproved.length > 0) {
    return NextResponse.json(
      { message: "Grades not yet finalized" },
      { status: 409 },
    );
  }

  const classIds = classes.map((c) => c.id);
  const gradeRecords = await prisma.grade.findMany({
    where: {
      studentId: student.id,
      classId: { in: classIds },
      ...(isSeniorHigh
        ? { quarter: { in: [`${period}-P1`, `${period}-P2`, `${period}-P3`] } }
        : { quarter: period }),
    } as any,
    orderBy: { createdAt: "desc" },
  });

  const byClassAndQuarter = new Map<string, any[]>();
  for (const g of gradeRecords) {
    const key = `${String(g.classId || "")}:${String(g.quarter || "")}`;
    if (!byClassAndQuarter.has(key)) byClassAndQuarter.set(key, []);
    byClassAndQuarter.get(key)!.push(g);
  }
  const pickGrade = (classId: string, q: string): number | null => {
    const list = byClassAndQuarter.get(`${classId}:${q}`) || [];
    const rec =
      list.find((x) => String(x?.subjectId || "") === "general") || list[0];
    const n = asNumber(rec?.grade);
    return n === null ? null : Math.round(n);
  };

  type RowJunior = { subject: string; grade: number | null; final: number | null };
  type RowSenior = {
    subject: string;
    p1: number | null;
    p2: number | null;
    p3: number | null;
    final: number | null;
  };

  const subjectLabel = (c: any) =>
    String(c?.subject || "").trim() ||
    String(c?.name || "").trim() ||
    "Subject";

  const rows: Array<RowJunior | RowSenior> = isSeniorHigh
    ? classes.map((c) => {
        const p1 = pickGrade(c.id, `${period}-P1`);
        const p2 = pickGrade(c.id, `${period}-P2`);
        const p3 = pickGrade(c.id, `${period}-P3`);
        const values = [p1, p2, p3].filter((n): n is number => n !== null);
        const semAvg = avgSafe(values);
        return {
          subject: subjectLabel(c),
          p1,
          p2,
          p3,
          final: semAvg === null ? null : Math.round(semAvg),
        } satisfies RowSenior;
      })
    : classes.map((c) => {
        const q = pickGrade(c.id, period);
        return { subject: subjectLabel(c), grade: q, final: q } satisfies RowJunior;
      });

  const generalAverage = computeGeneralAverage(
    rows.map((r: any) => ({ final: r.final ?? null })),
  );

  // Build PDF
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const marginX = 50;
  let y = 790;

  const drawCentered = (text: string, size: number, bold = false) => {
    const f = bold ? fontBold : font;
    const width = f.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (595.28 - width) / 2,
      y,
      size,
      font: f,
      color: rgb(0, 0, 0),
    });
    y -= size + 6;
  };

  drawCentered(toTitle(schoolName), 16, true);
  drawCentered("REPORT CARD", 14, true);
  drawCentered(String(schoolYear), 11, false);
  y -= 8;

  const label = (k: string, v: string) => {
    page.drawText(k, { x: marginX, y, size: 10, font: fontBold });
    page.drawText(v, { x: marginX + 120, y, size: 10, font });
    y -= 14;
  };

  label("Student Name:", student.name);
  label("Student ID:", student.studentId || student.id);
  label("Grade / Section:", `${student.gradeLevel} • ${student.section || "-"}`);
  if (isSeniorHigh) {
    label("Strand:", student.strand || "-");
  }
  label(
    "Period:",
    isSeniorHigh ? `Semester ${period === "S1" ? "1" : "2"}` : `Quarter ${period.replace("Q", "")}`,
  );
  y -= 8;

  const tableTopY = y;
  const tableX = marginX;
  const tableW = 595.28 - marginX * 2;
  const rowH = 22;

  const columns = isSeniorHigh
    ? [
        { key: "subject", label: "Subject", w: 250 },
        { key: "p1", label: "P1", w: 60 },
        { key: "p2", label: "P2", w: 60 },
        { key: "p3", label: "P3", w: 60 },
        { key: "final", label: "Sem Avg", w: 80 },
      ]
    : [
        { key: "subject", label: "Subject", w: 350 },
        { key: "final", label: "Grade", w: 80 },
        { key: "remarks", label: "Remarks", w: 110 },
      ];

  const remarkFor = (n: number | null) => {
    if (n === null) return "";
    if (n >= 90) return "Outstanding";
    if (n >= 85) return "Very Satisfactory";
    if (n >= 80) return "Satisfactory";
    if (n >= 75) return "Fairly Satisfactory";
    return "Did Not Meet Expectations";
  };

  // Header background
  page.drawRectangle({
    x: tableX,
    y: tableTopY - rowH,
    width: tableW,
    height: rowH,
    color: rgb(0.92, 0.97, 0.94),
    borderColor: rgb(0.2, 0.6, 0.3),
    borderWidth: 1,
  });

  let cx = tableX;
  for (const col of columns) {
    page.drawText(col.label, {
      x: cx + 6,
      y: tableTopY - 15,
      size: 10,
      font: fontBold,
    });
    cx += col.w;
  }

  // Grid lines + rows
  let currentY = tableTopY - rowH;
  const maxRows = Math.min(rows.length, 18);
  for (let i = 0; i < maxRows; i++) {
    const r: any = rows[i];
    currentY -= rowH;
    // row border
    page.drawRectangle({
      x: tableX,
      y: currentY,
      width: tableW,
      height: rowH,
      borderColor: rgb(0.85, 0.9, 0.88),
      borderWidth: 1,
      color: i % 2 === 0 ? rgb(1, 1, 1) : rgb(0.99, 1, 0.99),
    });
    cx = tableX;
    for (const col of columns) {
      const key = col.key;
      let text = "";
      if (key === "remarks") {
        text = remarkFor(r.final ?? null);
      } else if (key === "subject") {
        text = String(r.subject || "");
      } else {
        const v = r[key];
        text = v === null || typeof v === "undefined" ? "" : String(v);
      }
      page.drawText(text, { x: cx + 6, y: currentY + 7, size: 10, font });
      cx += col.w;
    }
  }

  y = currentY - 18;
  page.drawText("General Average:", { x: tableX, y, size: 11, font: fontBold });
  page.drawText(
    generalAverage === null ? "—" : String(Math.round(generalAverage)),
    { x: tableX + 140, y, size: 11, font },
  );

  // Signatures
  y -= 60;
  const sig = (x: number, title: string) => {
    page.drawLine({
      start: { x, y },
      end: { x: x + 150, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    page.drawText(title, { x, y: y - 14, size: 9, font });
  };
  sig(tableX, "Class Adviser");
  sig(tableX + 200, "School Principal");
  sig(tableX + 400, "Parent / Guardian");

  const pdfBytes = await pdf.save();

  // Download log
  try {
    await prisma.auditLog.create({
      data: {
        actorId: student.id,
        actorRole: "student",
        action: "report_download",
        resource: "reportCard",
        resourceId: `${student.id}:${period}`,
        metadata: JSON.stringify({
          studentId: student.id,
          period,
          downloadedAt: new Date().toISOString(),
        }),
      },
    });
  } catch {
    // don't block download
  }

  const filename = `Report-Card-${safeName(student.name)}-${period}.pdf`;
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
