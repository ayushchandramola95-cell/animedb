import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      animeRes,
      airingRes,
      charRes,
      vaRes,
      linksRes,
      logsRes,
      recentAnimeRes,
    ] = await Promise.all([
      query("SELECT COUNT(*) as count FROM anime;"),
      query("SELECT COUNT(*) as count FROM anime WHERE status = 'RELEASING';"),
      query("SELECT COUNT(*) as count FROM characters;"),
      query("SELECT COUNT(*) as count FROM voice_actors;"),
      query("SELECT COUNT(*) as count FROM streaming_links;"),
      query("SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 8;"),
      query(`
        SELECT anilist_id, title_english, title_romaji, format, status, score, episodes_count, cover_image_url, updated_at
        FROM anime
        ORDER BY updated_at DESC
        LIMIT 6;
      `),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalAnime: Number(animeRes.rows[0]?.count || 0),
        airingCount: Number(airingRes.rows[0]?.count || 0),
        totalCharacters: Number(charRes.rows[0]?.count || 0),
        totalVoiceActors: Number(vaRes.rows[0]?.count || 0),
        totalStreamingLinks: Number(linksRes.rows[0]?.count || 0),
      },
      recentLogs: logsRes.rows || [],
      recentAnime: recentAnimeRes.rows || [],
      dbStatus: "Connected",
      dbEngine: "Google Cloud SQL (PostgreSQL 16)",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to query database statistics",
        dbStatus: "Disconnected",
      },
      { status: 500 }
    );
  }
}
