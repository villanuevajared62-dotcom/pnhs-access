import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, type LoginCredentials } from "@/lib/auth";
import { signSessionUser } from "@/lib/server-session";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ==============================
// Simple in-memory rate limiter
// ==============================
const loginAttemptStore = new Map<
  string,
  { attempts: number; firstAttempt: number; blockedUntil?: number }
>();
const MAX_ATTEMPTS = 6;
const BLOCK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

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

    const state = loginAttemptStore.get(key) || {
      attempts: 0,
      firstAttempt: Date.now(),
    };

    if (state.blockedUntil && Date.now() < state.blockedUntil) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Try again later." },
        { status: 429 },
      );
    }

    // ==============================
    // 1️⃣ DEMO / HARDCODED USERS
    // ==============================
    const result = authenticateUser(body);

    if (result.success && result.user) {
      loginAttemptStore.delete(key);
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

        res.cookies.set("pnhs_session", signSessionUser(user), {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 4 * 60 * 60,
        });

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
        console.error("[login] DB session failed, using signed cookie only", e);
        res.cookies.set("pnhs_session", signSessionUser(user), {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 4 * 60 * 60,
        });
      }

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
          loginAttemptStore.delete(key);

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

            res.cookies.set("pnhs_session", signSessionUser(user), {
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
              maxAge: 4 * 60 * 60,
            });

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
            res.cookies.set("pnhs_session", signSessionUser(user), {
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
              maxAge: 4 * 60 * 60,
            });
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
          loginAttemptStore.delete(key);

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

            res.cookies.set("pnhs_session", signSessionUser(user), {
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
              maxAge: 4 * 60 * 60,
            });

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
            res.cookies.set("pnhs_session", signSessionUser(user), {
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
              maxAge: 4 * 60 * 60,
            });
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
    state.attempts += 1;
    if (state.attempts >= MAX_ATTEMPTS) {
      state.blockedUntil = Date.now() + BLOCK_WINDOW_MS;
    }
    loginAttemptStore.set(key, state);

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
