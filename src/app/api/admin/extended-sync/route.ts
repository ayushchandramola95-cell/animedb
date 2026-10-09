import { NextRequest, NextResponse } from "next/server";
import {
  syncExtendedDataForAnime,
  syncBatchExtendedData,
  getExtendedAnimeStats,
  getExtendedAnimeData,
  getCrawlBatchSummary,
  runCrawlBatchStep,
} from "@/lib/extendedSyncEngine";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statsOnly = searchParams.get("stats") === "true";
    const animeIdStr = searchParams.get("animeId");

    // Return global stats across the 4 extended tables
    if (statsOnly) {
      const stats = await getExtendedAnimeStats();
      return NextResponse.json({ success: true, stats });
    }

    // Return crawl summary (counts, remaining) for automated crawler
    if (searchParams.get("crawlSummary") === "true") {
      const mode = (searchParams.get("mode") || "airing_upcoming_then_years") as any;
      const yearStr = searchParams.get("year");
      const year = yearStr ? parseInt(yearStr, 10) : undefined;
      const skipAlreadySynced = searchParams.get("skipSynced") !== "false";

      const summary = await getCrawlBatchSummary({ mode, year, skipAlreadySynced });
      return NextResponse.json({ success: true, summary });
    }

    // Return extended data for a specific anime
    if (animeIdStr) {
      const animeId = parseInt(animeIdStr, 10);
      if (isNaN(animeId)) {
        return NextResponse.json({ success: false, error: "Invalid animeId" }, { status: 400 });
      }

      const data = await getExtendedAnimeData(animeId);
      return NextResponse.json({ success: true, data });
    }

    // Default: Return stats and recent extended sync logs
    const [stats, recentLogs] = await Promise.all([
      getExtendedAnimeStats(),
      query(`
        SELECT id, action, count_processed, status, details, created_at
        FROM sync_logs
        WHERE action = 'EXTENDED_DATA_SYNC'
        ORDER BY created_at DESC
        LIMIT 10;
      `),
    ]);

    return NextResponse.json({
      success: true,
      stats,
      recentLogs: recentLogs.rows,
    });
  } catch (error: any) {
    console.error("GET /api/admin/extended-sync Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch extended data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = "sync_anime", animeId, limit = 10, offset = 0, type = "popular" } = body;

    // Single Anime Sync
    if (action === "sync_anime") {
      if (!animeId) {
        return NextResponse.json(
          { success: false, error: "Missing required parameter: animeId" },
          { status: 400 }
        );
      }

      const result = await syncExtendedDataForAnime(Number(animeId));
      const stats = await getExtendedAnimeStats();

      return NextResponse.json({
        success: true,
        action: "sync_anime",
        result,
        stats,
      });
    }

    // Batch Sync (legacy limit)
    if (action === "batch_sync") {
      const batchResult = await syncBatchExtendedData({
        limit: Number(limit) || 10,
        offset: Number(offset) || 0,
        type: type as any,
      });

      const stats = await getExtendedAnimeStats();

      return NextResponse.json({
        success: true,
        action: "batch_sync",
        ...batchResult,
        stats,
      });
    }

    // Automated Catalog Extras Crawler Step
    if (action === "crawl_batch_step") {
      const {
        mode = "airing_upcoming_then_years",
        year,
        skipAlreadySynced = true,
        limit = 5,
        offset = 0,
      } = body;

      const crawlStepResult = await runCrawlBatchStep({
        mode,
        year: year ? Number(year) : undefined,
        skipAlreadySynced: Boolean(skipAlreadySynced),
        limit: Number(limit) || 5,
        offset: Number(offset) || 0,
      });

      const stats = await getExtendedAnimeStats();

      return NextResponse.json({
        success: true,
        action: "crawl_batch_step",
        ...crawlStepResult,
        stats,
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("POST /api/admin/extended-sync Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Extended sync failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { delete_type, id } = body;

    if (!delete_type || !id) {
      return NextResponse.json(
        { success: false, error: "Missing delete_type or id" },
        { status: 400 }
      );
    }

    if (delete_type === "episode") {
      await query(`DELETE FROM anime_episodes WHERE id = $1;`, [id]);
    } else if (delete_type === "theme") {
      await query(`DELETE FROM anime_theme_songs WHERE id = $1;`, [id]);
    } else if (delete_type === "dub") {
      await query(`DELETE FROM character_dubs WHERE id = $1;`, [id]);
    } else if (delete_type === "review") {
      await query(`DELETE FROM anime_reviews WHERE id = $1;`, [id]);
    } else {
      return NextResponse.json({ success: false, error: "Invalid delete_type" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${delete_type} #${id}`,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/extended-sync Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete record" },
      { status: 500 }
    );
  }
}
