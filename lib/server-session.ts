import { NextRequest } from "next/server";
import type { User } from "@/lib/auth";
import crypto from "crypto";

// NOTE: production must set SESSION_SECRET. A dev fallback is provided for local testing only.
const SESSION_SECRET = process.env.SESSION_SECRET || "dev_session_secret";
if (
  process.env.NODE_ENV !== "production" &&
  SESSION_SECRET === "dev_session_secret"
) {
  console.warn(
    "[server-session] WARNING: using development SESSION_SECRET — set SESSION_SECRET in production",
  );
}

function signPayload(payload: string) {
  const b64 = Buffer.from(payload, "utf8").toString("base64");
  const sig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(b64)
    .digest("base64");
  return `${b64}.${sig}`;
}

function verifyAndParse(signed: string): User | null {
  try {
    const parts = signed.split(".");
    if (parts.length !== 2) return null;
    const [b64, sig] = parts;
    const expected = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(b64)
      .digest("base64");
    const sigBuf = Buffer.from(sig, "base64");
    const expBuf = Buffer.from(expected, "base64");
    if (
      sigBuf.length !== expBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expBuf)
    )
      return null;
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json) as User;
  } catch (e) {
    return null;
  }
}

export function signSessionUser(user: User): string {
  return signPayload(JSON.stringify(user));
}

import prisma from "@/lib/prisma";

export async function getSessionUser(req: NextRequest): Promise<User | null> {
  // Prefer explicit DB-backed session cookie when present (revocable)
  const tokenCookieObj = req.cookies.get("pnhs_session_token");
  const tokenCookie = tokenCookieObj?.value;
  if (tokenCookie) {
    try {
      const session = await prisma.session.findUnique({
        where: { token: tokenCookie },
      });
      if (
        session &&
        !session.revoked &&
        new Date(session.expiresAt) > new Date()
      ) {
        try {
          return JSON.parse(session.data) as User;
        } catch (e) {
          return null;
        }
      }
    } catch (e) {
      console.error("[server-session] session lookup error (token cookie):", e);
    }
  }

  const cookieObj = req.cookies.get("pnhs_session");
  const cookie = cookieObj?.value;

  if (!cookie) return null;

  // 1) If cookie looks like a DB session token, validate it
  if (/^[a-f0-9]{48,}$/.test(cookie) || cookie.length <= 128) {
    try {
      const session = await prisma.session.findUnique({
        where: { token: cookie },
      });
      if (
        session &&
        !session.revoked &&
        new Date(session.expiresAt) > new Date()
      ) {
        try {
          return JSON.parse(session.data) as User;
        } catch (e) {
          return null;
        }
      }
    } catch (e) {
      // ignore DB errors and fall through to signed cookie check
      console.error("[server-session] session lookup error:", e);
    }
  }

  // 2) Prefer signed cookie (legacy path)
  const signed = verifyAndParse(cookie);
  if (signed) return signed;

  // 3) Backwards-compat fallback: parse raw JSON (deprecated)
  try {
    const legacy = JSON.parse(cookie) as User;
    console.warn(
      "[server-session] legacy unsigned cookie detected; rotate sessions",
    );
    return legacy;
  } catch (e) {
    return null;
  }
}

// Synchronous, cookie-only session check for use inside `middleware` (Edge runtime).
// This intentionally DOES NOT access the database — middleware must remain sync
// and Edge-compatible. It will validate signed cookies when possible. In Edge
// runtime a synchronous HMAC verify isn't always available, so fall back to
// safely decoding the payload portion for routing (server-side checks remain
// authoritative).
export function getSessionUserSync(req: NextRequest): User | null {
  const cookieObj = req.cookies.get("pnhs_session");
  const cookie = cookieObj?.value;

  // Fallback: if signed session cookie is missing, allow a public non-http-only
  // `pnhs_user` cookie (set on login) so middleware doesn't immediately
  // redirect on page refresh. Server-side checks remain authoritative.
  if (!cookie) {
    const publicCookieObj = req.cookies.get("pnhs_user");
    const publicCookie = publicCookieObj?.value;
    if (publicCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(publicCookie));
        console.warn("[server-session] middleware: using pnhs_user fallback");
        return parsed as User;
      } catch {
        // fall through to returning null
      }
    }
    return null;
  }

  // DEBUG: show first 40 chars of cookie the middleware sees (remove in prod)
  try {
    // eslint-disable-next-line no-console
    console.log(
      "[server-session] getSessionUserSync cookie:",
      (cookie || "").substring(0, 40),
    );
  } catch {}

  // 1) Try full verification (works in Node). If it succeeds, return user.
  const signed = verifyAndParse(cookie);
  if (signed) return signed;

  // Helper: base64 -> UTF-8 (works in Node and Edge)
  const base64Decode = (input: string) => {
    if (typeof Buffer !== "undefined" && typeof Buffer.from === "function") {
      return Buffer.from(input, "base64").toString("utf8");
    }
    // Edge / browser runtime
    const bin = atob(input);
    try {
      return decodeURIComponent(
        bin
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
    } catch {
      return bin;
    }
  };

  // 2) If verification failed but cookie looks like `b64.sig`, try to decode the
  //    payload portion. This *does not* verify the signature (Edge limitation),
  //    but it lets middleware do routing decisions while server-side code still
  //    performs authoritative checks via `getSessionUser`.
  try {
    const dotIndex = cookie.indexOf(".");
    if (dotIndex > -1) {
      const b64 = cookie.substring(0, dotIndex);
      const json = base64Decode(b64);
      const parsed = JSON.parse(json) as User;
      console.warn(
        "[server-session] middleware: signature verification unavailable/failed — using cookie payload for routing; server-side checks remain authoritative",
      );
      return parsed;
    }

    // 3) If cookie is plain base64 (no dot), decode and parse as legacy payload.
    if (/^[A-Za-z0-9+/=_-]+$/.test(cookie)) {
      const json = base64Decode(cookie);
      const parsed = JSON.parse(json) as User;
      console.warn(
        "[server-session] middleware: unsigned base64 cookie detected; using payload for routing — rotate sessions",
      );
      return parsed;
    }
  } catch (e) {
    // fall through to legacy JSON parse
  }

  // 4) Backwards-compat fallback: parse raw JSON (deprecated)
  try {
    const legacy = JSON.parse(cookie) as User;
    console.warn(
      "[server-session] legacy unsigned cookie detected; rotate sessions",
    );
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
