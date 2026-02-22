<<<<<<< HEAD
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    }

    const token = await signToken({ userId: user.id, username: user.username, role: user.role, name: user.name })

    const response = NextResponse.json({ success: true, role: user.role, name: user.name })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
=======
import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, type LoginCredentials } from "@/lib/auth";
import { signSessionUser } from "@/lib/server-session-node";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const runtime = "nodejs"

// Note: Rate limiting is handled at Vercel edge or via external service (e.g., Upstash Redis)
// For now, we'll skip rate limiting in serverless - Vercel has built-in DDoS protection

function isBcryptHash(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value)
  );
}

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LoginCredentials;
    const usernameInput = String(body?.username || "").trim();
    const passwordInput = String(body?.password || "");
    const key = usernameInput || "unknown";

    // Skip in-memory rate limiting for serverless - let Vercel handle it
    // In production, use Upstash Redis or Vercel Edge for rate limiting

    // ==============================
    // 1️⃣ DEMO / HARDCODED USERS
    // ==============================
    const result = authenticateUser(body);

    if (result.success && result.user) {
      // loginAttemptStore.delete(key); // Not used anymore
      const user = result.user;

      const res = NextResponse.json({ success: true, user });

      // 🔥 IMPORTANT FIX: clear old session first
      res.cookies.set("pnhs_session", "", { maxAge: 0, path: "/" });
      res.cookies.set("pnhs_session_token", "", { maxAge: 0, path: "/" });

      try {
        const prisma = (await import("@/lib/prisma")).default;
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

        await prisma.session.create({
          data: {
            userId: user.id,
            token,
            data: JSON.stringify(user),
            expiresAt,
          },
        });

        res.cookies.set("pnhs_session_token", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 4 * 60 * 60,
        });

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

        // public, non-http fallback so middleware + refresh can route correctly
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
      } catch (e) {
        console.warn("[login] DB session unavailable, continuing with signed cookie only");
      }

      // Always set signed session + public cookie even if DB session creation fails
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

    // ==============================
    // 2️⃣ DATABASE USERS
    // ==============================
    try {
      const prisma = (await import("@/lib/prisma")).default;

      // ---------- STUDENT ----------
      // allow lookup by username OR email (seed data may have username NULL)
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
        const storedHash = student.password;
        const provided = passwordInput;

        // accept hashed/plain password OR fallback to studentId
        const matched =
          matchesPassword(provided, storedHash) ||
          provided === (student.studentId || "");

        if (matched) {
          // Rate limiting removed for serverless

          const user = {
            id: student.id,
            username: student.username || "",
            email: student.email,
            role: "student" as const,
            fullName: student.name,
            createdAt: new Date().toISOString(),
          };

          const res = NextResponse.json({ success: true, user });

          // 🔥 CLEAR OLD SESSION
          res.cookies.set("pnhs_session", "", { maxAge: 0, path: "/" });
          res.cookies.set("pnhs_session_token", "", { maxAge: 0, path: "/" });

          try {
            const token = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

            await prisma.session.create({
              data: {
                userId: user.id,
                token,
                data: JSON.stringify(user),
                expiresAt,
              },
            });

            res.cookies.set("pnhs_session_token", token, {
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
              maxAge: 4 * 60 * 60,
            });

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

            // public, non-http fallback so middleware + refresh can route correctly
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
          } catch {
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
            // also set public fallback cookie when DB session creation fails
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
          }

          return res;
        }
      }

      // ---------- TEACHER ----------
      // allow lookup by username, full email, or email-local-part (seed teachers may not have username)
      const teacher = await prisma.teacher.findFirst({
        where: {
          OR: [
            { username: usernameInput },
            { email: usernameInput },
            // allow entering 'santos' to match 'santos@pnhs.edu.ph'
            { email: { startsWith: `${usernameInput}@` } },
          ],
        },
      });

      if (teacher) {
        const storedHash = teacher.password;
        const provided = passwordInput;

        // accept hashed/plain password OR fallback to email local-part
        const emailLocal = (teacher.email || "").split("@")[0] || "";
        const matched =
          matchesPassword(provided, storedHash) || provided === emailLocal;

        if (matched) {
          // Rate limiting removed for serverless

          const user = {
            id: teacher.id,
            username: teacher.username || "",
            email: teacher.email,
            role: "teacher" as const,
            fullName: teacher.name,
            createdAt: new Date().toISOString(),
          };

          const res = NextResponse.json({ success: true, user });

          // 🔥 CLEAR OLD SESSION
          res.cookies.set("pnhs_session", "", { maxAge: 0, path: "/" });
          res.cookies.set("pnhs_session_token", "", { maxAge: 0, path: "/" });

          try {
            const token = crypto.randomBytes(32).toString("hex");
            const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

            await prisma.session.create({
              data: {
                userId: user.id,
                token,
                data: JSON.stringify(user),
                expiresAt,
              },
            });

            res.cookies.set("pnhs_session_token", token, {
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
              maxAge: 4 * 60 * 60,
            });

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

            // public, non-http fallback so middleware + refresh can route correctly
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
          } catch {
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
            // also set public fallback cookie when DB session creation fails
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
          }

          return res;
        }
      }
    } catch (e) {
      console.error("Login database error:", e);
    }

    // ==============================
    // ❌ FAILED LOGIN
    // ==============================
    // Rate limiting removed for serverless compatibility
    // In production, implement rate limiting at Vercel edge or use Redis

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
>>>>>>> abd22b2953a867c47a19ce65745932cb9bbe898c
  }
}
