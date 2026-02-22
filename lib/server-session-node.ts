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

export function signSessionUser(user: User): string {
  return signPayload(JSON.stringify(user));
}

export async function getSessionUser(req: NextRequest): Promise<User | null> {
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
            return JSON.parse(session.data) as User;
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
            return JSON.parse(session.data) as User;
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
  const signed = verifyAndParse(cookie);
  if (signed) return signed;

  // 3) Backwards-compat fallback: parse raw JSON (deprecated)
  try {
    const legacy = JSON.parse(cookie) as User;
    console.warn("[server-session-node] legacy unsigned cookie detected; rotate sessions");
    return legacy;
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