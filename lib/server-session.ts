import type { NextRequest } from "next/server";
import type { User } from "@/lib/auth";

// Edge-safe session helpers: prefer signed cookie verification using Web Crypto when available
// Fallback to raw JSON for local development when the cookie is not signed.

function parseJsonCookie(cookie: string | undefined): User | null {
  if (!cookie) return null;
  try {
    return JSON.parse(cookie) as User;
  } catch {
    return null;
  }
}

// Edge-safe base64 helpers (avoid Node Buffer)
function abToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function verifySignedCookie(cookie: string, secret: string): Promise<User | null> {
  try {
    const parts = cookie.split(".");
    if (parts.length !== 2) return null;
    const [b64, sig] = parts;

    const enc = new TextEncoder();
    const keyData = enc.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const data = enc.encode(b64);
    const computed = await crypto.subtle.sign("HMAC", key, data);
    const computedB64 = abToBase64(computed);

    if (computedB64 !== sig) return null;
    const json = base64ToUtf8(b64);
    return JSON.parse(json) as User;
  } catch {
    return null;
  }
}

export function getSessionUserSync(req: NextRequest): User | null {
  // Dev-only: raw JSON parse for unsigned cookies
  const cookie = req.cookies.get("pnhs_session")?.value;
  return parseJsonCookie(cookie);
}

export async function getSessionUser(req: NextRequest): Promise<User | null> {
  const cookie = req.cookies.get("pnhs_session")?.value;
  if (!cookie) return null;

  // Prefer signed cookie verification when SESSION_SECRET is set
  const secret = process.env.SESSION_SECRET || "";
  if (secret && cookie.includes(".")) {
    const verified = await verifySignedCookie(cookie, secret);
    if (verified) return verified;
  }

  // Fallback: raw JSON (legacy/dev)
  return parseJsonCookie(cookie);
}

export async function requireAdmin(
  req: NextRequest,
): Promise<{ ok: boolean; user?: User }> {
  const user = await getSessionUser(req);
  if (!user || user.role !== "admin") return { ok: false };
  return { ok: true, user };
}
