import { NextRequest, NextResponse } from "next/server";
import { fetchAndSyncBatch } from "@/lib/syncEngine";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "test";
    const page = Number(body.page) || 1;
    const perPage = Math.min(Number(body.perPage) || 20, 50);

    const result = await fetchAndSyncBatch({ action, page, perPage });
    const executionTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      action,
      count: result.count,
      pageInfo: result.pageInfo,
      sampleItems: result.sampleItems,
      metrics: {
        executionTimeMs,
        rateLimitNotice: "AniList allows up to 90 requests/minute",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute AniList sync into PostgreSQL",
      },
      { status: 500 }
    );
  }
}
