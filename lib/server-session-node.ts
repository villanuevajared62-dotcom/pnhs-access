import { NextRequest } from "next/server";
import type { User } from "@/lib/auth";
import crypto from "crypto";

// Lazy-load Prisma to avoid initialization errors when DB is not configured
let prismaSingleton: any | null = null;
async function loadPrisma() {
  if (prismaSingleton) return prismaSingleton;
  try {
    const mod = await import("@/lib/prisma");
    prismaSingleton = mod.default;
    return prismaSingleton;
  } catch (e) {
    console.error("[server-session-node] prisma unavailable:", e);
    return null;
  }
}

// NOTE: production must set SESSION_SECRET. A dev fallback is provided for local testing only.
const SESSION_SECRET = process.env.SESSION_SECRET || "dev_session_secret";
if (
  process.env.NODE_ENV !== "production" &&
  SESSION_SECRET === "dev_session_secret"
) {
  console.warn(
    "[server-session-node] WARNING: using development SESSION_SECRET — set SESSION_SECRET in production",
  );
}

function signPayload(payload: string) {
  const b64 = Buffer.from(payload, "utf8").toString("base64");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(b64).digest("base64");
  return `${b64}.${sig}`;
}

function verifyAndParse(signed: string): User | null {
  try {
    const parts = signed.split(".");
    if (parts.length !== 2) return null;
    const [b64, sig] = parts;
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(b64).digest("base64");
    const sigBuf = Buffer.from(sig, "base64");
    const expBuf = Buffer.from(expected, "base64");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json) as User;
  } catch {
    return null;
  }
}

function normalizeUser(candidate: any): User | null {
  if (!candidate || typeof candidate !== "object") return null;
  const roleRaw = (candidate as any).role;
  const role =
    typeof roleRaw === "string" ? roleRaw.trim().toLowerCase() : roleRaw;
  if (role === "admin" || role === "teacher" || role === "student") {
    return { ...(candidate as any), role } as User;
  }
  return candidate as User;
}

export function signSessionUser(user: User): string {
  return signPayload(JSON.stringify(user));
}

export async function getSessionUser(req: NextRequest): Promise<User | null> {
  const ensureActiveUser = async (candidate: User | null): Promise<User | null> => {
    if (!candidate) return null;
    const role = candidate.role;
    if (role !== "student" && role !== "teacher") return candidate;

    const prisma = await loadPrisma();
    if (!prisma) return candidate; // best-effort; allow local dev without DB

    try {
      if (role === "student") {
        const s = await prisma.student.findFirst({
          where: { id: candidate.id, deletedAt: null },
          select: { id: true },
        });
        return s ? candidate : null;
      }

      const t = await prisma.teacher.findFirst({
        where: { id: candidate.id, deletedAt: null },
        select: { id: true },
      });
      return t ? candidate : null;
    } catch (e) {
      console.error("[server-session-node] ensureActiveUser error:", e);
      return null;
    }
  };

  // Prefer explicit DB-backed session cookie when present (revocable)
  const tokenCookieObj = req.cookies.get("pnhs_session_token");
  const tokenCookie = tokenCookieObj?.value;
  if (tokenCookie) {
    try {
      const prisma = await loadPrisma();
      if (prisma) {
        const session = await prisma.session.findUnique({ where: { token: tokenCookie } });
        if (session && !session.revoked && new Date(session.expiresAt) > new Date()) {
          try {
            const parsed = normalizeUser(JSON.parse(session.data)) as User | null;
            const active = await ensureActiveUser(parsed);
            if (!active) {
              try {
                await prisma.session.updateMany({
                  where: { token: tokenCookie },
                  data: { revoked: true },
                });
              } catch (e) {
                console.error("[server-session-node] failed to revoke deleted-user session:", e);
              }
            }
            return active;
          } catch {
            return null;
          }
        }
      }
    } catch (e) {
      console.error("[server-session-node] session lookup error (token cookie):", e);
    }
  }

  const cookieObj = req.cookies.get("pnhs_session");
  const cookie = cookieObj?.value;
  if (!cookie) return null;

  // 1) If cookie looks like a DB session token, validate it
  if (/^[a-f0-9]{48,}$/.test(cookie) || cookie.length <= 128) {
    try {
      const prisma = await loadPrisma();
      if (prisma) {
        const session = await prisma.session.findUnique({ where: { token: cookie } });
        if (session && !session.revoked && new Date(session.expiresAt) > new Date()) {
          try {
            const parsed = normalizeUser(JSON.parse(session.data)) as User | null;
            const active = await ensureActiveUser(parsed);
            if (!active) {
              try {
                await prisma.session.updateMany({
                  where: { token: cookie },
                  data: { revoked: true },
                });
              } catch (e) {
                console.error("[server-session-node] failed to revoke deleted-user session:", e);
              }
            }
            return active;
          } catch {
            return null;
          }
        }
      }
    } catch (e) {
      // ignore DB errors and fall through to signed cookie check
      console.error("[server-session-node] session lookup error:", e);
    }
  }

  // 2) Prefer signed cookie (legacy path)
  const signed = normalizeUser(verifyAndParse(cookie));
  if (signed) return ensureActiveUser(signed);

  // 3) Backwards-compat fallback: parse raw JSON (deprecated)
  try {
    const legacy = normalizeUser(JSON.parse(cookie));
    console.warn("[server-session-node] legacy unsigned cookie detected; rotate sessions");
    return ensureActiveUser(legacy);
  } catch {
    return null;
  }
}

export async function requireAdmin(
  req: NextRequest,
): Promise<{ ok: boolean; user?: User }> {
  const user = await getSessionUser(req);
  if (!user || user.role !== "admin") return { ok: false };
  return { ok: true, user };
}
