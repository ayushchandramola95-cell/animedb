import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (search.trim()) {
      whereClauses.push(
        `(title_english ILIKE $${paramIndex} OR title_romaji ILIKE $${paramIndex})`
      );
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (status && status !== "ALL") {
      whereClauses.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Count total
    const countRes = await query(
      `SELECT COUNT(*) as total FROM anime ${whereSql}`,
      params
    );
    const total = Number(countRes.rows[0]?.total || 0);

    // Fetch paginated
    const selectSql = `
      SELECT
        id, anilist_id, mal_id, title_english, title_romaji, slug,
        format, status, season, season_year, episodes_count, score, popularity,
        cover_image_url, banner_image_url, accent_color, genres, studios,
        next_airing_episode, next_airing_at, is_published, created_at, updated_at
      FROM anime
      ${whereSql}
      ORDER BY score DESC NULLS LAST, popularity DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const animeRes = await query(selectSql, [...params, limit, offset]);

    return NextResponse.json({
      success: true,
      data: animeRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("Admin Anime API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch anime from database",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { anilist_id, is_published, score, custom_notes } = body;

    if (!anilist_id) {
      return NextResponse.json(
        { success: false, error: "anilist_id is required" },
        { status: 400 }
      );
    }

    await query(
      `
      UPDATE anime
      SET
        is_published = COALESCE($2, is_published),
        score = COALESCE($3, score),
        updated_at = NOW()
      WHERE anilist_id = $1
    `,
      [anilist_id, is_published, score]
    );

    return NextResponse.json({
      success: true,
      message: `Anime #${anilist_id} updated successfully`,
    });
  } catch (error: any) {
    console.error("Admin Anime Update Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update anime" },
      { status: 500 }
    );
  }
}
