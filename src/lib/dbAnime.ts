import { query } from "./db";
import { AnimeMedia, OmniSearchResult } from "./types";

/**
 * Transforms a PostgreSQL row into a full AnimeMedia object
 */
export function mapDbRowToAnimeMedia(
  row: any,
  characters: any[] = [],
  streamingLinks: any[] = []
): AnimeMedia {
  const scoreNum = row.score ? Number(row.score) : null;
  const avgScore = scoreNum ? Math.round(scoreNum * 10) : null;

  const studiosNodes = Array.isArray(row.studios)
    ? row.studios.map((s: any) => ({
        id: s.id || 0,
        name: s.name || (typeof s === "string" ? s : "Unknown Studio"),
        isAnimationStudio: s.isAnimationStudio ?? true,
      }))
    : [];

  const charEdges = characters.map((c: any) => ({
    role: c.role || "MAIN",
    node: {
      id: c.character_id || c.id || 0,
      name: { full: c.character_name || c.name_full || "Unknown" },
      image: {
        large: c.character_image || c.image_url || "/placeholder-avatar.png",
      },
    },
    voiceActors: c.voice_actor_id
      ? [
          {
            id: c.voice_actor_id,
            name: { full: c.voice_actor_name || "Unknown Seiyuu" },
            image: {
              large: c.voice_actor_image || "/placeholder-avatar.png",
            },
          },
        ]
      : [],
  }));

  const extLinks = streamingLinks.map((s: any, idx: number) => ({
    id: idx + 1,
    site: s.platform_name || "Streaming",
    url: s.affiliate_url || s.target_url || "#",
    type: "STREAMING",
    icon: null,
    color: null,
  }));

  const nextAiringAtTime = row.next_airing_at ? new Date(row.next_airing_at).getTime() : 0;
  const now = Date.now();

  return {
    id: row.anilist_id,
    idMal: row.mal_id || undefined,
    title: {
      romaji: row.title_romaji || "Unknown Title",
      english: row.title_english || null,
      native: row.title_native || null,
    },
    description: row.synopsis || null,
    format: row.format || "TV",
    status: row.status || "FINISHED",
    episodes: row.episodes_count || null,
    duration: row.episode_duration || null,
    season: row.season || null,
    seasonYear: row.season_year || null,
    averageScore: avgScore,
    meanScore: avgScore,
    popularity: row.popularity || 0,
    source: row.source || null,
    coverImage: {
      extraLarge: row.cover_image_url || "/placeholder-cover.jpg",
      large: row.cover_image_url || "/placeholder-cover.jpg",
      medium: row.cover_image_url || "/placeholder-cover.jpg",
      color: row.accent_color || "#3b82f6",
    },
    bannerImage: row.banner_image_url || null,
    genres: Array.isArray(row.genres) ? row.genres : [],
    studios: {
      nodes: studiosNodes,
    },
    trailer: row.youtube_trailer_id
      ? { id: row.youtube_trailer_id.trim(), site: "youtube" }
      : null,
    nextAiringEpisode: row.next_airing_episode
      ? {
          episode: row.next_airing_episode,
          airingAt: Math.floor(nextAiringAtTime / 1000),
          timeUntilAiring: Math.max(0, Math.floor((nextAiringAtTime - now) / 1000)),
        }
      : null,
    externalLinks: extLinks,
    characters: {
      edges: charEdges,
    },
    relations: {
      edges: Array.isArray(row.relations) ? row.relations : [],
    },
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

/**
 * Fetch full details for a single anime from Cloud SQL
 */
export async function getAnimeDetailsFromDb(id: number): Promise<AnimeMedia | null> {
  const [animeRes, charsRes, streamsRes] = await Promise.all([
    query(
      `
      SELECT
        anilist_id, mal_id, title_english, title_romaji, title_native, slug,
        synopsis, format, status, season, season_year, episodes_count, episode_duration,
        score, popularity, cover_image_url, banner_image_url, accent_color,
        genres, studios, youtube_trailer_id, source, tags, relations, staff,
        start_date, end_date, next_airing_episode, next_airing_at
      FROM anime
      WHERE anilist_id = $1
      LIMIT 1;
    `,
      [id]
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
      [id]
    ),
    query(
      `
      SELECT id, platform_name, target_url, affiliate_url, is_official
      FROM streaming_links
      WHERE anime_id = $1;
    `,
      [id]
    ),
  ]);

  if (animeRes.rows.length === 0) return null;

  return mapDbRowToAnimeMedia(animeRes.rows[0], charsRes.rows, streamsRes.rows);
}

/**
 * Fast full-text search across Cloud SQL anime titles
 */
export async function searchAnimeFromDb(queryStr: string, limit = 10): Promise<AnimeMedia[]> {
  const clean = `%${queryStr.trim()}%`;
  const res = await query(
    `
    SELECT
      anilist_id, mal_id, title_english, title_romaji, title_native, slug,
      synopsis, format, status, season, season_year, episodes_count, episode_duration,
      score, popularity, cover_image_url, banner_image_url, accent_color,
      genres, studios, youtube_trailer_id, next_airing_episode, next_airing_at
    FROM anime
    WHERE title_english ILIKE $1 OR title_romaji ILIKE $1 OR title_native ILIKE $1
    ORDER BY popularity DESC
    LIMIT $2;
  `,
    [clean, limit]
  );

  return res.rows.map((r) => mapDbRowToAnimeMedia(r));
}

/**
 * Omni-search for search modal (Anime + Characters + Staff) from Cloud SQL
 */
export async function omniSearchFromDb(search: string): Promise<OmniSearchResult> {
  const clean = `%${search.trim()}%`;

  const [animeRes, charsRes, vaRes] = await Promise.all([
    query(
      `
      SELECT
        anilist_id, mal_id, title_english, title_romaji, title_native, slug,
        synopsis, format, status, season, season_year, episodes_count, episode_duration,
        score, popularity, cover_image_url, banner_image_url, accent_color,
        genres, studios, youtube_trailer_id, next_airing_episode, next_airing_at
      FROM anime
      WHERE title_english ILIKE $1 OR title_romaji ILIKE $1
      ORDER BY popularity DESC
      LIMIT 6;
    `,
      [clean]
    ),
    query(
      `
      SELECT anilist_id as id, name_full, image_url
      FROM characters
      WHERE name_full ILIKE $1
      LIMIT 4;
    `,
      [clean]
    ),
    query(
      `
      SELECT anilist_id as id, name_full, image_url
      FROM voice_actors
      WHERE name_full ILIKE $1
      LIMIT 4;
    `,
      [clean]
    ),
  ]);

  return {
    anime: animeRes.rows.map((r) => mapDbRowToAnimeMedia(r)),
    characters: charsRes.rows.map((c) => ({
      id: c.id,
      name: { full: c.name_full },
      image: { large: c.image_url, medium: c.image_url },
      favourites: 0,
    })),
    staff: vaRes.rows.map((v) => ({
      id: v.id,
      name: { full: v.name_full },
      image: { large: v.image_url, medium: v.image_url },
      primaryOccupations: ["Voice Actor / Seiyuu"],
      favourites: 0,
    })),
  };
}

/**
 * Browse anime from Cloud SQL with multi-criteria filters
 */
export async function getAdvancedBrowseAnimeFromDb(params: {
  genres?: string[];
  format?: string;
  status?: string;
  season?: string;
  year?: number;
  minScore?: number;
  sort?: string;
  search?: string;
  page?: number;
  perPage?: number;
}): Promise<{ media: AnimeMedia[]; hasNextPage: boolean }> {
  const {
    genres,
    format,
    status,
    season,
    year,
    minScore,
    sort = "POPULARITY_DESC",
    search,
    page = 1,
    perPage = 36,
  } = params;

  let whereClauses: string[] = [];
  let queryParams: any[] = [];
  let idx = 1;

  if (search && search.trim()) {
    whereClauses.push(`(title_english ILIKE $${idx} OR title_romaji ILIKE $${idx})`);
    queryParams.push(`%${search.trim()}%`);
    idx++;
  }

  if (format && format !== "ALL") {
    whereClauses.push(`format = $${idx}`);
    queryParams.push(format);
    idx++;
  }

  if (status && status !== "ALL") {
    whereClauses.push(`status = $${idx}`);
    queryParams.push(status);
    idx++;
  }

  if (season && season !== "ALL") {
    whereClauses.push(`season = $${idx}`);
    queryParams.push(season);
    idx++;
  }

  if (year) {
    whereClauses.push(`season_year = $${idx}`);
    queryParams.push(year);
    idx++;
  }

  if (minScore) {
    whereClauses.push(`score >= $${idx}`);
    queryParams.push(minScore / 10);
    idx++;
  }

  if (genres && genres.length > 0) {
    whereClauses.push(`genres @> $${idx}`);
    queryParams.push(genres);
    idx++;
  }

  let orderBy = "popularity DESC";
  if (sort === "SCORE_DESC") orderBy = "score DESC NULLS LAST, popularity DESC";
  else if (sort === "TRENDING_DESC") orderBy = "popularity DESC";
  else if (sort === "START_DATE_DESC") orderBy = "start_date DESC NULLS LAST";
  else if (sort === "TITLE_ROMAJI") orderBy = "title_romaji ASC";

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const offset = (page - 1) * perPage;

  queryParams.push(perPage + 1);
  const limitParamIdx = idx++;
  queryParams.push(offset);
  const offsetParamIdx = idx++;

  const res = await query(
    `
    SELECT
      anilist_id, mal_id, title_english, title_romaji, title_native, slug,
      synopsis, format, status, season, season_year, episodes_count, episode_duration,
      score, popularity, cover_image_url, banner_image_url, accent_color,
      genres, studios, youtube_trailer_id, next_airing_episode, next_airing_at
    FROM anime
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx};
  `,
    queryParams
  );

  const hasNextPage = res.rows.length > perPage;
  const slicedRows = hasNextPage ? res.rows.slice(0, perPage) : res.rows;

  return {
    media: slicedRows.map((r) => mapDbRowToAnimeMedia(r)),
    hasNextPage,
  };
}

/**
 * Curated lists for Homepage / Discover directly from Cloud SQL
 */
export async function getCuratedAnimeFromDb(
  type: "trending" | "popular" | "top" | "airing" | "upcoming",
  limit = 24
): Promise<AnimeMedia[]> {
  let whereSql = "";
  let orderSql = "popularity DESC";

  if (type === "airing") {
    whereSql = "WHERE status = 'RELEASING'";
    orderSql = "popularity DESC";
  } else if (type === "top") {
    whereSql = "WHERE score IS NOT NULL";
    orderSql = "score DESC, popularity DESC";
  } else if (type === "upcoming") {
    whereSql = "WHERE status = 'NOT_YET_RELEASED'";
    orderSql = "popularity DESC";
  } else if (type === "trending") {
    whereSql = "WHERE season_year >= 2023";
    orderSql = "popularity DESC";
  }

  const res = await query(
    `
    SELECT
      anilist_id, mal_id, title_english, title_romaji, title_native, slug,
      synopsis, format, status, season, season_year, episodes_count, episode_duration,
      score, popularity, cover_image_url, banner_image_url, accent_color,
      genres, studios, youtube_trailer_id, next_airing_episode, next_airing_at
    FROM anime
    ${whereSql}
    ORDER BY ${orderSql}
    LIMIT $1;
  `,
    [limit]
  );

  return res.rows.map((r) => mapDbRowToAnimeMedia(r));
}

/**
 * Custom featured anime for the Homepage Hero Spotlight Carousel
 */
export async function getFeaturedSpotlightAnimeFromDb(limit = 5): Promise<AnimeMedia[]> {
  try {
    const res = await query(
      `
      SELECT
        anilist_id, mal_id, title_english, title_romaji, title_native, slug,
        synopsis, format, status, season, season_year, episodes_count, episode_duration,
        score, popularity, cover_image_url, banner_image_url, accent_color,
        genres, studios, youtube_trailer_id, next_airing_episode, next_airing_at
      FROM anime
      WHERE is_featured = true
      ORDER BY featured_order ASC, updated_at DESC
      LIMIT $1;
    `,
      [limit]
    );
    return res.rows.map((r) => mapDbRowToAnimeMedia(r));
  } catch (err) {
    console.warn("Failed to fetch featured spotlight anime:", err);
    return [];
  }
}
