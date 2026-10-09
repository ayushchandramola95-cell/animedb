import { NextRequest, NextResponse } from "next/server";
import { getDataSourceSetting, setDataSourceSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dataSource = await getDataSourceSetting();
    return NextResponse.json({
      success: true,
      dataSource,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { dataSource } = body;

    if (dataSource !== "db" && dataSource !== "anilist") {
      return NextResponse.json(
        { success: false, error: "Invalid dataSource. Must be 'db' or 'anilist'." },
        { status: 400 }
      );
    }

    const ok = await setDataSourceSetting(dataSource);
    if (!ok) {
      throw new Error("Failed to save setting to database");
    }

    return NextResponse.json({
      success: true,
      dataSource,
      message:
        dataSource === "db"
          ? "Switched public site to Google Cloud SQL (14,883+ titles, fast & no rate limits)."
          : "Switched public site to live AniList GraphQL API proxy.",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
