import { NextRequest, NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { getSessionUser } from "@/lib/server-session-node";
import { getUploadMaxBytes } from "@/lib/upload-limits";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function isAllowedPathnameForUser(
  pathname: string,
  user: { id: string; role: string },
) {
  const clean = String(pathname || "").replace(/^\/+/, "");
  if (!clean) return false;

  if (user.role === "student") {
    return clean.startsWith(`submissions/${user.id}/`);
  }
  if (user.role === "teacher" || user.role === "admin") {
    return (
      clean.startsWith(`assignments/${user.id}/`) ||
      clean.startsWith(`submissions/${user.id}/`)
    );
  }
  return false;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return jsonError("Unauthorized", 401);

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return jsonError(
      "Upload storage not configured. Please contact admin (missing BLOB_READ_WRITE_TOKEN).",
      503,
    );
  }

  try {
    const maxBytes = getUploadMaxBytes();
    const maximumSizeInBytes = Number.isFinite(maxBytes) ? maxBytes : undefined;

    const result = await handleUpload({
      request: req,
      body,
      token,
      onBeforeGenerateToken: async (
        pathname: string,
        clientPayload: unknown,
      ) => {
        if (!isAllowedPathnameForUser(String(pathname || ""), user)) {
          throw new Error("Forbidden upload path");
        }

        return {
          access: "public",
          tokenPayload: clientPayload,
          ...(maximumSizeInBytes !== undefined
            ? { maximumSizeInBytes }
            : {}),
        } as any;
      },
    });

    return NextResponse.json(result);
  } catch (e: any) {
    const msg = String(e?.message || e || "Upload error");
    const status =
      msg.toLowerCase().includes("forbidden") ||
      msg.toLowerCase().includes("unauthorized")
        ? 403
        : 400;
    return jsonError(msg, status);
  }
}
