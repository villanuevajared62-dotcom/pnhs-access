import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-session";
import { settingsDB } from "@/lib/db-store";

interface SettingsPayload {
  schoolName?: string;
  schoolYear?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  classNotifications?: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const { ok } = await requireAdmin(req);
    if (!ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(settingsDB);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { ok } = await requireAdmin(req);
    if (!ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as SettingsPayload;

    // Merge with existing settings
    Object.assign(settingsDB, body);

    console.log("[Settings] Updated:", settingsDB);

    return NextResponse.json(settingsDB, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
