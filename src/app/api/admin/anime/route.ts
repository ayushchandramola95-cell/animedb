import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const spotlightOnly = searchParams.get("spotlight") === "true";

    // If requesting all featured Spotlight anime
    if (spotlightOnly) {
      const spotlightRes = await query(`
        SELECT
          id, anilist_id, mal_id, title_english, title_romaji, slug,
          synopsis, format, status, score, popularity, cover_image_url,
          banner_image_url, accent_color, youtube_trailer_id,
          is_featured, featured_order, custom_notes, updated_at
        FROM anime
        WHERE is_featured = true
        ORDER BY featured_order ASC, updated_at DESC;
      `);
      return NextResponse.json({
        success: true,
        data: spotlightRes.rows,
      });
    }

    // If requesting full details for a single anime
    if (id) {
      const animeId = Number(id);
      const [animeRes, charsRes, streamsRes] = await Promise.all([
        query(
          `
          SELECT
            id, anilist_id, mal_id, title_english, title_romaji, title_native, slug,
            synopsis, format, status, season, season_year, episodes_count, episode_duration,
            score, popularity, cover_image_url, banner_image_url, accent_color,
            genres, studios, youtube_trailer_id, source, tags, relations, staff,
            start_date, end_date, next_airing_episode, next_airing_at,
            is_published, is_featured, featured_order, custom_notes,
            created_at, updated_at
          FROM anime
          WHERE anilist_id = $1
          LIMIT 1;
        `,
          [animeId]
        ),
        query(
          `
          SELECT
            c.anilist_id as character_id,
            c.name_full as character_name,
            c.image_url as character_image,
            va.anilist_id as voice_actor_id,
            va.name_full as voice_actor_name,
            va.image_url as voice_actor_image,
            ac.role
          FROM anime_characters ac
          JOIN characters c ON ac.character_id = c.anilist_id
          LEFT JOIN voice_actors va ON ac.voice_actor_id = va.anilist_id
          WHERE ac.anime_id = $1
          ORDER BY ac.role ASC;
        `,
          [animeId]
        ),
        query(
          `
          SELECT id, platform_name, target_url, affiliate_url, is_official, region
          FROM streaming_links
          WHERE anime_id = $1
          ORDER BY is_official DESC, created_at ASC;
        `,
          [animeId]
        ),
      ]);

      if (animeRes.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Anime not found in database" },
          { status: 404 }
        );
      }

      const anime = animeRes.rows[0];
      return NextResponse.json({
        success: true,
        data: {
          ...anime,
          characters: charsRes.rows,
          streaming_links: streamsRes.rows,
        },
      });
    }

    // List query
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
      if (status === "SPOTLIGHT") {
        whereClauses.push("is_featured = true");
      } else {
        whereClauses.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countRes = await query(
      `SELECT COUNT(*) as total FROM anime ${whereSql}`,
      params
    );
    const total = Number(countRes.rows[0]?.total || 0);

    const selectSql = `
      SELECT
        id, anilist_id, mal_id, title_english, title_romaji, title_native, slug,
        synopsis, format, status, season, season_year, episodes_count, episode_duration,
        score, popularity, cover_image_url, banner_image_url, accent_color,
        genres, studios, youtube_trailer_id, source, tags, relations, staff,
        start_date, end_date, next_airing_episode, next_airing_at,
        is_published, is_featured, featured_order, custom_notes,
        created_at, updated_at
      FROM anime
      ${whereSql}
      ORDER BY is_featured DESC, featured_order ASC, score DESC NULLS LAST, popularity DESC
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
    const {
      anilist_id,
      title_english,
      title_romaji,
      synopsis,
      accent_color,
      custom_notes,
      is_featured,
      featured_order,
      youtube_trailer_id,
      score,
      status,
      episodes_count,
      is_published,
      new_streaming_link,
      delete_streaming_link_id,
    } = body;

    if (!anilist_id) {
      return NextResponse.json(
        { success: false, error: "anilist_id is required" },
        { status: 400 }
      );
    }

    // 1. Update Core Anime Fields
    const updateClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fields: Record<string, any> = {
      title_english,
      title_romaji,
      synopsis,
      accent_color,
      custom_notes,
      is_featured,
      featured_order,
      youtube_trailer_id,
      score,
      status,
      episodes_count,
      is_published,
    };

    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) {
        updateClauses.push(`${key} = $${paramIndex}`);
        values.push(val);
        paramIndex++;
      }
    }

    if (updateClauses.length > 0) {
      updateClauses.push("updated_at = NOW()");
      values.push(anilist_id);
      const sql = `
        UPDATE anime
        SET ${updateClauses.join(", ")}
        WHERE anilist_id = $${paramIndex};
      `;
      await query(sql, values);
    }

    // 2. Add Custom Legal Streaming Link
    if (new_streaming_link && new_streaming_link.target_url) {
      await query(
        `
        INSERT INTO streaming_links (anime_id, platform_name, target_url, affiliate_url, is_official)
        VALUES ($1, $2, $3, $4, $5);
      `,
        [
          anilist_id,
          new_streaming_link.platform_name || "Official Streaming",
          new_streaming_link.target_url,
          new_streaming_link.affiliate_url || null,
          new_streaming_link.is_official ?? true,
        ]
      );
    }

    // 3. Delete Streaming Link
    if (delete_streaming_link_id) {
      await query(
        `DELETE FROM streaming_links WHERE id = $1 AND anime_id = $2;`,
        [delete_streaming_link_id, anilist_id]
      );
    }

    // 4. Log Action in sync_logs
    await query(
      `
      INSERT INTO sync_logs (action, count_processed, status, details)
      VALUES ('ADMIN_MANUAL_EDIT', 1, 'SUCCESS', $1);
    `,
      [
        JSON.stringify({
          anilist_id,
          updatedFields: Object.keys(fields).filter((k) => fields[k] !== undefined),
          hasNewLink: Boolean(new_streaming_link),
          hasDeletedLink: Boolean(delete_streaming_link_id),
          timestamp: new Date().toISOString(),
        }),
      ]
    );

    // Fetch updated anime record
    const updatedRes = await query(
      `SELECT * FROM anime WHERE anilist_id = $1 LIMIT 1;`,
      [anilist_id]
    );

    const streamsRes = await query(
      `SELECT * FROM streaming_links WHERE anime_id = $1 ORDER BY is_official DESC, created_at ASC;`,
      [anilist_id]
    );

    return NextResponse.json({
      success: true,
      message: `Anime #${anilist_id} updated successfully`,
      data: {
        ...updatedRes.rows[0],
        streaming_links: streamsRes.rows,
      },
    });
  } catch (error: any) {
    console.error("Admin Anime Update Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update anime" },
      { status: 500 }
    );
  }
}
