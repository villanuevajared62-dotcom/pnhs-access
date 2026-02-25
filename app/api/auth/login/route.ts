import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, type LoginCredentials } from "@/lib/auth";
import { signSessionUser } from "@/lib/server-session-node";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const runtime = "nodejs";

// Helper function to check if a string is a bcrypt hash
function isBcryptHash(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value)
  );
}

// Helper function to compare passwords
function matchesPassword(provided: string, stored: unknown): boolean {
  if (typeof stored !== "string" || stored.length === 0) return false;
  if (isBcryptHash(stored)) {
    try {
      return bcrypt.compareSync(provided, stored);
    } catch {
      return false;
    }
  }
  // Backward compatibility: allow legacy plaintext passwords in DB
  return provided === stored;
}

// Helper function to create session and set cookies
async function createUserSession(
  user: {
    id: string;
    username: string;
    email: string;
    role: "admin" | "teacher" | "student";
    fullName: string;
    createdAt: string;
  },
  res: NextResponse,
): Promise<NextResponse> {
  // Clear old session cookies first
  res.cookies.set("pnhs_session", "", { maxAge: 0, path: "/" });
  res.cookies.set("pnhs_session_token", "", { maxAge: 0, path: "/" });

  try {
    const prisma = (await import("@/lib/prisma")).default;
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        data: JSON.stringify(user),
        expiresAt,
      },
    });

    // Set httpOnly session token cookie
    res.cookies.set("pnhs_session_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 4 * 60 * 60,
    });
  } catch (e) {
    console.warn(
      "[login] DB session unavailable, continuing with signed cookie only",
    );
  }

  // Set signed session cookie
  res.cookies.set(
    "pnhs_session",
    process.env.SESSION_SECRET ? signSessionUser(user) : JSON.stringify(user),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 4 * 60 * 60,
    },
  );

  // Set public fallback cookie for middleware/client routing
  res.cookies.set(
    "pnhs_user",
    encodeURIComponent(
      JSON.stringify({
        id: user.id,
        username: user.username || "",
        role: user.role,
        fullName: user.fullName || "",
        createdAt: user.createdAt,
      }),
    ),
    {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 4 * 60 * 60,
    },
  );

  return res;
}

// Helper function to authenticate from database (student or teacher)
async function authenticateFromDatabase(
  usernameInput: string,
  passwordInput: string,
): Promise<{
  success: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    role: "admin" | "teacher" | "student";
    fullName: string;
    createdAt: string;
  };
  message?: string;
}> {
  const prisma = (await import("@/lib/prisma")).default;

  // Try to find student first
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { username: usernameInput },
        { email: usernameInput },
        { studentId: usernameInput },
      ],
    },
  });

  if (student) {
    // Check if student has been deleted (soft-delete)
    if (student.deletedAt) {
      return {
        success: false,
        message: "Account has been deleted. Please contact administrator.",
      };
    }

    const storedHash = student.password;
    const provided = passwordInput;

    // Accept hashed/plain password OR fallback to studentId
    const matched =
      matchesPassword(provided, storedHash) ||
      provided === (student.studentId || "");

    if (matched) {
      return {
        success: true,
        user: {
          id: student.id,
          username: student.username || "",
          email: student.email,
          role: "student" as const,
          fullName: student.name,
          createdAt: new Date().toISOString(),
        },
      };
    }
  }

  // Try to find teacher
  const teacher = await prisma.teacher.findFirst({
    where: {
      OR: [
        { username: usernameInput },
        { email: usernameInput },
        { email: { startsWith: `${usernameInput}@` } },
      ],
    },
  });

  if (teacher) {
    // Check if teacher has been deleted (soft-delete)
    if (teacher.deletedAt) {
      return {
        success: false,
        message: "Account has been deleted. Please contact administrator.",
      };
    }

    const storedHash = teacher.password;
    const provided = passwordInput;

    // Accept hashed/plain password OR fallback to email local-part
    const emailLocal = (teacher.email || "").split("@")[0] || "";
    const matched =
      matchesPassword(provided, storedHash) || provided === emailLocal;

    if (matched) {
      return {
        success: true,
        user: {
          id: teacher.id,
          username: teacher.username || "",
          email: teacher.email,
          role: "teacher" as const,
          fullName: teacher.name,
          createdAt: new Date().toISOString(),
        },
      };
    }
  }

  return { success: false, message: "Invalid username or password" };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LoginCredentials;
    const usernameInput = String(body?.username || "").trim();
    const passwordInput = String(body?.password || "");

    if (!usernameInput || !passwordInput) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 },
      );
    }

    // First try: Demo/Hardcoded users (from lib/auth.ts)
    const demoResult = authenticateUser(body);

    if (demoResult.success && demoResult.user) {
      const res = NextResponse.json({ success: true, user: demoResult.user });
      return createUserSession(demoResult.user, res);
    }

    // Second try: Database users (students and teachers)
    try {
      const dbResult = await authenticateFromDatabase(
        usernameInput,
        passwordInput,
      );

      if (dbResult.success && dbResult.user) {
        const res = NextResponse.json({ success: true, user: dbResult.user });
        return createUserSession(dbResult.user, res);
      }

      if (dbResult.message) {
        return NextResponse.json(
          { success: false, message: dbResult.message },
          { status: 401 },
        );
      }
    } catch (e) {
      console.error("Login database error:", e);
    }

    // Failed login
    return NextResponse.json(
      { success: false, message: "Invalid username or password" },
      { status: 401 },
    );
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, message: "Unexpected error" },
      { status: 500 },
    );
  }
}
