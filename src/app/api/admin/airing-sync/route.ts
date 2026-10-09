import { NextRequest, NextResponse } from "next/server";
import { syncAiringAnime, getAiringSyncHistory } from "@/lib/airingSync";
import { getAiringSyncSettings, setAiringAutoSync } from "@/lib/settings";
import "@/lib/airingCron";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [settings, history] = await Promise.all([
      getAiringSyncSettings(),
      getAiringSyncHistory(20),
    ]);

    return NextResponse.json({
      success: true,
      settings,
      history,
    });
  } catch (error: any) {
    console.error("GET /api/admin/airing-sync error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch airing sync data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // If request is to toggle autoSync setting
    if (body.action === "toggle_auto_sync" && typeof body.enabled === "boolean") {
      await setAiringAutoSync(body.enabled);
      const settings = await getAiringSyncSettings();
      return NextResponse.json({
        success: true,
        message: `Airing 30-min auto-sync ${body.enabled ? "enabled" : "disabled"}.`,
        settings,
      });
    }

    // Otherwise, execute manual airing sync
    const trigger = body.trigger || "manual";
    const result = await syncAiringAnime({ trigger });
    const history = await getAiringSyncHistory(20);
    const settings = await getAiringSyncSettings();

    return NextResponse.json({
      success: true,
      result,
      history,
      settings,
    });
  } catch (error: any) {
    console.error("POST /api/admin/airing-sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute airing anime synchronization",
      },
      { status: 500 }
    );
  }
}
