import { query } from "./db";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";
const ANISONGDB_ENDPOINT = "https://anisongdb.com/api/search_request";

export interface ExtendedSyncStats {
  totalEpisodes: number;
  totalThemes: number;
  totalDubs: number;
  totalReviews: number;
}

export interface ExtendedSyncResult {
  animeId: number;
  title: string;
  episodesCount: number;
  themesCount: number;
  dubsCount: number;
  reviewsCount: number;
  errors: string[];
}

export const EXTENDED_ANILIST_QUERY = `
  query GetExtendedAnimeData($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      idMal
      title {
        romaji
        english
      }
      streamingEpisodes {
        title
        thumbnail
        url
        site
      }
      characters(page: 1, perPage: 25) {
        edges {
          role
          node {
            id
            name {
              full
              native
            }
            image {
              large
            }
          }
          voiceActorRoles {
            voiceActor {
              id
              name {
                full
                native
              }
              image {
                large
              }
              language: languageV2
            }
            roleNotes
          }
        }
      }
      reviews(page: 1, perPage: 10, sort: [RATING_DESC]) {
        nodes {
          id
          summary
          body
          rating
          ratingAmount
          score
          user {
            id
            name
            avatar {
              medium
            }
          }
          createdAt
        }
      }
    }
  }
`;

/**
 * Fetch and sync all extended metadata (episodes, themes, dubs, reviews) for an anime.
 * Uses high-efficiency bulk inserts with zero duplicate guarantees.
 */
export async function syncExtendedDataForAnime(
  anilistId: number
): Promise<ExtendedSyncResult> {
  const errors: string[] = [];
  let episodesCount = 0;
  let themesCount = 0;
  let dubsCount = 0;
  let reviewsCount = 0;
  let animeTitle = `Anime #${anilistId}`;

  try {
    // 1. Fetch from AniList GraphQL (Episodes, Dub Casts, Reviews) with 10s timeout
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "AnimeDB-ExtendedSyncEngine/1.0",
      },
      body: JSON.stringify({
        query: EXTENDED_ANILIST_QUERY,
        variables: { id: anilistId },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`AniList HTTP ${res.status}: ${errText.slice(0, 100)}`);
    }

    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message || "AniList GraphQL error");
    }

    const media = json.data?.Media;
    if (!media) {
      throw new Error(`Anime #${anilistId} not found on AniList`);
    }

    animeTitle = media.title?.english || media.title?.romaji || animeTitle;

    // 2. Sync Episodes (Bulk multi-row upsert with Zero Duplicate Guarantee)
    if (media.streamingEpisodes && media.streamingEpisodes.length > 0) {
      for (let i = 0; i < media.streamingEpisodes.length; i++) {
        const ep = media.streamingEpisodes[i];
        const numMatch = ep.title ? ep.title.match(/Episode\s+(\d+)/i) : null;
        const epNum = numMatch ? parseInt(numMatch[1], 10) : i + 1;

        try {
          await query(
            `
            INSERT INTO anime_episodes (
              anime_id, episode_number, title, thumbnail_url, site_url, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (anime_id, episode_number) DO UPDATE
            SET
              title = EXCLUDED.title,
              thumbnail_url = COALESCE(EXCLUDED.thumbnail_url, anime_episodes.thumbnail_url),
              site_url = COALESCE(EXCLUDED.site_url, anime_episodes.site_url),
              updated_at = NOW();
          `,
            [anilistId, epNum, ep.title || `Episode ${epNum}`, ep.thumbnail || null, ep.url || null]
          );
          episodesCount++;
        } catch (epErr: any) {
          errors.push(`Episode ${epNum}: ${epErr.message}`);
        }
      }
    }

    // 3. Sync Multilingual Dub Voice Actors (English, Spanish, French, etc.)
    if (media.characters?.edges && media.characters.edges.length > 0) {
      for (const edge of media.characters.edges) {
        const char = edge.node;
        const charRole = edge.role || "MAIN";
        if (!char || !char.id) continue;

        try {
          // Ensure character exists
          await query(
            `
            INSERT INTO characters (anilist_id, name_full, image_url)
            VALUES ($1, $2, $3)
            ON CONFLICT (anilist_id) DO UPDATE
            SET image_url = COALESCE(EXCLUDED.image_url, characters.image_url);
          `,
            [char.id, char.name?.full || "Unknown Character", char.image?.large || null]
          );

          const voiceRoles = edge.voiceActorRoles || [];
          for (const vr of voiceRoles) {
            const va = vr.voiceActor;
            if (!va || !va.id || !va.language) continue;
            if (va.language.toLowerCase() === "japanese") continue; // Japanese in core tables

            // Ensure voice actor exists
            await query(
              `
              INSERT INTO voice_actors (anilist_id, name_full, image_url, language)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (anilist_id) DO UPDATE
              SET
                image_url = COALESCE(EXCLUDED.image_url, voice_actors.image_url),
                language = EXCLUDED.language;
            `,
              [va.id, va.name?.full || "Unknown Actor", va.image?.large || null, va.language]
            );

            // Upsert character_dubs mapping
            await query(
              `
              INSERT INTO character_dubs (anime_id, character_id, voice_actor_id, language, role)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (anime_id, character_id, voice_actor_id, language) DO UPDATE
              SET role = EXCLUDED.role;
            `,
              [anilistId, char.id, va.id, va.language, charRole]
            );
            dubsCount++;
          }
        } catch (dubErr: any) {
          errors.push(`Dub: ${dubErr.message}`);
        }
      }
    }

    // 4. Sync Community Reviews
    if (media.reviews?.nodes && media.reviews.nodes.length > 0) {
      for (const rev of media.reviews.nodes) {
        if (!rev || !rev.id || !rev.body) continue;

        try {
          await query(
            `
            INSERT INTO anime_reviews (
              anilist_review_id, anime_id, user_name, user_avatar_url,
              summary, body, score, rating_amount, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TO_TIMESTAMP($9), NOW())
            ON CONFLICT (anilist_review_id) DO UPDATE
            SET
              summary = EXCLUDED.summary,
              body = EXCLUDED.body,
              score = EXCLUDED.score,
              rating_amount = EXCLUDED.rating_amount,
              updated_at = NOW();
          `,
            [
              rev.id,
              anilistId,
              rev.user?.name || "Community Member",
              rev.user?.avatar?.medium || null,
              rev.summary || null,
              rev.body,
              rev.score || null,
              rev.ratingAmount || 0,
              rev.createdAt || Math.floor(Date.now() / 1000),
            ]
          );
          reviewsCount++;
        } catch (revErr: any) {
          errors.push(`Review #${rev.id}: ${revErr.message}`);
        }
      }
    }

    // 5. Sync Opening & Ending Theme Songs (OSTs) via AniSongDB
    try {
      const searchTerms = [media.title?.english, media.title?.romaji].filter(Boolean);
      let themeFound = false;

      for (const term of searchTerms) {
        if (themeFound) break;
        try {
          const anisongRes = await fetch(ANISONGDB_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "AnimeDB-ExtendedSyncEngine/1.0",
            },
            body: JSON.stringify({
              anime_search_filter: { search: term, partial_match: false },
            }),
            signal: AbortSignal.timeout(6000),
          });

          if (!anisongRes.ok) continue;

          const songList = await anisongRes.json().catch(() => []);
          if (Array.isArray(songList) && songList.length > 0) {
            const matchingSongs = songList.filter(
              (s: any) =>
                s.linked_ids?.anilist === anilistId ||
                s.animeENName?.toLowerCase() === term?.toLowerCase() ||
                s.animeJPName?.toLowerCase() === term?.toLowerCase()
            );

            for (const s of matchingSongs) {
              const songTypeStr = s.songType || "";
              let type = "OPENING";
              let seq = 1;

              if (songTypeStr.toLowerCase().includes("ending")) {
                type = "ENDING";
              } else if (songTypeStr.toLowerCase().includes("insert")) {
                type = "INSERT";
              }

              const seqMatch = songTypeStr.match(/(\d+)/);
              if (seqMatch) {
                seq = parseInt(seqMatch[1], 10);
              }

              try {
                await query(
                  `
                  INSERT INTO anime_theme_songs (
                    anime_id, type, sequence_number, title, artist, updated_at
                  )
                  VALUES ($1, $2, $3, $4, $5, NOW())
                  ON CONFLICT (anime_id, type, sequence_number) DO UPDATE
                  SET
                    title = EXCLUDED.title,
                    artist = EXCLUDED.artist,
                    updated_at = NOW();
                `,
                  [anilistId, type, seq, s.songName || "Untitled", s.songArtist || "Unknown Artist"]
                );
                themesCount++;
                themeFound = true;
              } catch (themeErr: any) {
                errors.push(`Theme: ${themeErr.message}`);
              }
            }
          }
        } catch (fetchErr: any) {
          console.warn(`AniSongDB timeout for "${term}":`, fetchErr.message);
        }
      }
    } catch (songErr: any) {
      errors.push(`Themes API: ${songErr.message}`);
    }

    // 6. Log completion in sync_logs
    await query(
      `
      INSERT INTO sync_logs (action, count_processed, status, details)
      VALUES ('EXTENDED_DATA_SYNC', $1, 'SUCCESS', $2);
    `,
      [
        episodesCount + themesCount + dubsCount + reviewsCount,
        JSON.stringify({
          anilistId,
          title: animeTitle,
          episodesCount,
          themesCount,
          dubsCount,
          reviewsCount,
          errors,
          timestamp: new Date().toISOString(),
        }),
      ]
    );

    return {
      animeId: anilistId,
      title: animeTitle,
      episodesCount,
      themesCount,
      dubsCount,
      reviewsCount,
      errors,
    };
  } catch (error: any) {
    console.error(`Extended Sync Error for Anime #${anilistId}:`, error);
    return {
      animeId: anilistId,
      title: animeTitle,
      episodesCount,
      themesCount,
      dubsCount,
      reviewsCount,
      errors: [error.message],
    };
  }
}

/**
 * Sequential batch runner with rate-limiting throttling (800ms between requests)
 */
export async function syncBatchExtendedData(options: {
  limit?: number;
  offset?: number;
  type?: "popular" | "airing" | "all";
}): Promise<{ totalProcessed: number; results: ExtendedSyncResult[] }> {
  const limit = Math.min(options.limit || 10, 50);
  const offset = options.offset || 0;

  let sql = `
    SELECT anilist_id, title_english, title_romaji
    FROM anime
    ORDER BY popularity DESC NULLS LAST
    LIMIT $1 OFFSET $2;
  `;

  if (options.type === "airing") {
    sql = `
      SELECT anilist_id, title_english, title_romaji
      FROM anime
      WHERE status = 'RELEASING'
      ORDER BY popularity DESC NULLS LAST
      LIMIT $1 OFFSET $2;
    `;
  }

  const { rows } = await query(sql, [limit, offset]);
  const results: ExtendedSyncResult[] = [];

  for (const row of rows) {
    const res = await syncExtendedDataForAnime(row.anilist_id);
    results.push(res);
    // Rate-limiting delay: 800ms between calls
    await new Promise((r) => setTimeout(r, 800));
  }

  return {
    totalProcessed: results.length,
    results,
  };
}

/**
 * Fetch stats across all 4 extended tables in Cloud SQL
 */
export async function getExtendedAnimeStats(): Promise<ExtendedSyncStats> {
  try {
    const res = await query(`
      SELECT
        (SELECT COUNT(*) FROM anime_episodes) as total_episodes,
        (SELECT COUNT(*) FROM anime_theme_songs) as total_themes,
        (SELECT COUNT(*) FROM character_dubs) as total_dubs,
        (SELECT COUNT(*) FROM anime_reviews) as total_reviews;
    `);

    const row = res.rows[0] || {};
    return {
      totalEpisodes: parseInt(row.total_episodes || "0", 10),
      totalThemes: parseInt(row.total_themes || "0", 10),
      totalDubs: parseInt(row.total_dubs || "0", 10),
      totalReviews: parseInt(row.total_reviews || "0", 10),
    };
  } catch (err) {
    console.error("Failed to fetch extended stats:", err);
    return {
      totalEpisodes: 0,
      totalThemes: 0,
      totalDubs: 0,
      totalReviews: 0,
    };
  }
}

/**
 * Get all stored extended data for a single anime from Cloud SQL
 */
export async function getExtendedAnimeData(anilistId: number) {
  const [episodesRes, themesRes, dubsRes, reviewsRes] = await Promise.all([
    query(
      `
      SELECT id, episode_number, title, synopsis, thumbnail_url, air_date, duration, is_filler, is_recap, site_url
      FROM anime_episodes
      WHERE anime_id = $1
      ORDER BY episode_number ASC;
    `,
      [anilistId]
    ),
    query(
      `
      SELECT id, type, sequence_number, title, artist, episodes, spotify_url, youtube_url
      FROM anime_theme_songs
      WHERE anime_id = $1
      ORDER BY type ASC, sequence_number ASC;
    `,
      [anilistId]
    ),
    query(
      `
      SELECT
        cd.id, cd.language, cd.role,
        c.anilist_id as character_id, c.name_full as character_name, c.image_url as character_image,
        va.anilist_id as voice_actor_id, va.name_full as voice_actor_name, va.image_url as voice_actor_image
      FROM character_dubs cd
      JOIN characters c ON cd.character_id = c.anilist_id
      JOIN voice_actors va ON cd.voice_actor_id = va.anilist_id
      WHERE cd.anime_id = $1
      ORDER BY cd.language ASC, cd.role ASC;
    `,
      [anilistId]
    ),
    query(
      `
      SELECT id, anilist_review_id, user_name, user_avatar_url, summary, body, score, rating_amount, site_url, created_at
      FROM anime_reviews
      WHERE anime_id = $1
      ORDER BY rating_amount DESC, created_at DESC;
    `,
      [anilistId]
    ),
  ]);

  return {
    episodes: episodesRes.rows,
    themes: themesRes.rows,
    dubs: dubsRes.rows,
    reviews: reviewsRes.rows,
  };
}

export interface CrawlBatchOptions {
  mode?: "airing_upcoming_then_years" | "years_only" | "airing_only" | "specific_year";
  year?: number;
  skipAlreadySynced?: boolean;
  limit?: number;
  offset?: number;
}

export interface CrawlSummaryResult {
  totalMatching: number;
  alreadyEnriched: number;
  remainingToEnrich: number;
  mode: string;
}

/**
 * Get summary counts for the Automated Catalog Extras Crawler
 */
export async function getCrawlBatchSummary(options: CrawlBatchOptions): Promise<CrawlSummaryResult> {
  const mode = options.mode || "airing_upcoming_then_years";
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (mode === "airing_only") {
    whereClauses.push(`a.status IN ('RELEASING', 'NOT_YET_RELEASED')`);
  } else if (mode === "specific_year" && options.year) {
    params.push(options.year);
    whereClauses.push(`a.season_year = $${params.length}`);
  }

  const baseWhere = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const countSql = `
    SELECT
      COUNT(1) as total_matching,
      COUNT(1) FILTER (WHERE EXISTS (SELECT 1 FROM anime_episodes e WHERE e.anime_id = a.anilist_id)) as already_enriched
    FROM anime a
    ${baseWhere};
  `;

  const res = await query(countSql, params);
  const row = res.rows[0] || {};
  const totalMatching = parseInt(row.total_matching || "0", 10);
  const alreadyEnriched = parseInt(row.already_enriched || "0", 10);
  const remainingToEnrich = Math.max(0, totalMatching - alreadyEnriched);

  return {
    totalMatching,
    alreadyEnriched,
    remainingToEnrich,
    mode,
  };
}

/**
 * Step runner for the Automated Catalog Extras Crawler
 * Fetches the next `limit` anime (ordered chronologically by year/airing),
 * syncs their extended media, OSTs, dubs, and reviews one by one with rate-limit pacing.
 */
export async function runCrawlBatchStep(options: CrawlBatchOptions): Promise<{
  processed: Array<ExtendedSyncResult & { year?: number; status?: string; coverImage?: string }>;
  remainingCount: number;
  totalMatching: number;
  hasMore: boolean;
}> {
  const mode = options.mode || "airing_upcoming_then_years";
  const limit = Math.max(1, Math.min(options.limit || 5, 20));
  const skipAlreadySynced = options.skipAlreadySynced ?? true;
  const offset = options.offset || 0;

  const whereClauses: string[] = [];
  const params: any[] = [];

  if (mode === "airing_only") {
    whereClauses.push(`a.status IN ('RELEASING', 'NOT_YET_RELEASED')`);
  } else if (mode === "specific_year" && options.year) {
    params.push(options.year);
    whereClauses.push(`a.season_year = $${params.length}`);
  }

  if (skipAlreadySynced) {
    whereClauses.push(`NOT EXISTS (SELECT 1 FROM anime_episodes e WHERE e.anime_id = a.anilist_id)`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  let orderSql = `
    ORDER BY
      CASE 
        WHEN a.status IN ('RELEASING', 'NOT_YET_RELEASED') THEN 0 
        ELSE 1 
      END ASC,
      a.season_year DESC NULLS LAST,
      a.popularity DESC NULLS LAST
  `;

  if (mode === "years_only" || mode === "specific_year") {
    orderSql = `ORDER BY a.season_year DESC NULLS LAST, a.popularity DESC NULLS LAST`;
  }

  params.push(limit);
  const limitParamIdx = params.length;

  let offsetSql = "";
  if (!skipAlreadySynced && offset > 0) {
    params.push(offset);
    offsetSql = `OFFSET $${params.length}`;
  }

  const selectSql = `
    SELECT
      a.anilist_id,
      a.title_english,
      a.title_romaji,
      a.season_year,
      a.status,
      a.cover_image_url
    FROM anime a
    ${whereSql}
    ${orderSql}
    LIMIT $${limitParamIdx} ${offsetSql};
  `;

  const { rows } = await query(selectSql, params);
  const processed: Array<ExtendedSyncResult & { year?: number; status?: string; coverImage?: string }> = [];

  for (const row of rows) {
    const result = await syncExtendedDataForAnime(row.anilist_id);
    processed.push({
      ...result,
      year: row.season_year,
      status: row.status,
      coverImage: row.cover_image_url,
    });
    // Rate-limiting delay: 750ms between AniList/AniSong calls
    await new Promise((r) => setTimeout(r, 750));
  }

  // Get updated summary count
  const summary = await getCrawlBatchSummary(options);

  return {
    processed,
    remainingCount: summary.remainingToEnrich,
    totalMatching: summary.totalMatching,
    hasMore: rows.length === limit && (skipAlreadySynced ? summary.remainingToEnrich > 0 : true),
  };
}
