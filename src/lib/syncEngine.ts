import { query } from "./db";
import { getCurrentSeason } from "./anilist";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export const BULK_SYNC_QUERY = `
  query GetBulkAnime($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        currentPage
        total
        lastPage
      }
      media(type: ANIME, season: $season, seasonYear: $seasonYear, status: $status, sort: $sort) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        description(asHtml: false)
        format
        status
        source
        episodes
        duration
        season
        seasonYear
        averageScore
        popularity
        coverImage {
          extraLarge
          large
          color
        }
        bannerImage
        genres
        tags {
          id
          name
          rank
          category
          isMediaSpoiler
        }
        studios(isMain: true) {
          nodes {
            id
            name
            isAnimationStudio
          }
        }
        trailer {
          id
          site
        }
        nextAiringEpisode {
          episode
          airingAt
        }
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
                english
              }
              format
              status
            }
          }
        }
        staff(perPage: 6) {
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                large
              }
            }
          }
        }
        externalLinks {
          id
          site
          url
          type
        }
        characters(perPage: 12, sort: ROLE) {
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                large
              }
            }
            voiceActors(language: JAPANESE) {
              id
              name {
                full
              }
              image {
                large
              }
            }
          }
        }
      }
    }
  }
`;

function generateSlug(title: string, id: number): string {
  const clean = (title || `anime-${id}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return `${clean}-${id}`;
}

export async function upsertAnimeRecord(media: any) {
  const titleRomaji = media.title?.romaji || media.title?.english || "Unknown Title";
  const titleEnglish = media.title?.english || null;
  const titleNative = media.title?.native || null;
  const slug = generateSlug(titleRomaji, media.id);
  const score = media.averageScore ? Number((media.averageScore / 10).toFixed(1)) : null;

  const nextAiringEp = media.nextAiringEpisode?.episode || null;
  const nextAiringDate = media.nextAiringEpisode?.airingAt
    ? new Date(media.nextAiringEpisode.airingAt * 1000)
    : null;

  const coverUrl = media.coverImage?.extraLarge || media.coverImage?.large || null;
  const bannerUrl = media.bannerImage || null;
  const accentColor = media.coverImage?.color || "#3b82f6";
  const trailerId = media.trailer?.site === "youtube" ? media.trailer.id : null;
  const studiosJson = JSON.stringify(media.studios?.nodes || []);
  const genres = media.genres || [];

  const source = media.source || null;
  const tagsJson = JSON.stringify(media.tags || []);
  const relationsJson = JSON.stringify(media.relations?.edges || []);
  const staffJson = JSON.stringify(media.staff?.edges || []);
  const startDate = media.startDate?.year
    ? `${media.startDate.year}-${String(media.startDate.month || 1).padStart(2, "0")}-${String(media.startDate.day || 1).padStart(2, "0")}`
    : null;
  const endDate = media.endDate?.year
    ? `${media.endDate.year}-${String(media.endDate.month || 1).padStart(2, "0")}-${String(media.endDate.day || 1).padStart(2, "0")}`
    : null;

  // 1. Upsert Anime table
  const animeUpsertSql = `
    INSERT INTO anime (
      anilist_id, mal_id, title_english, title_romaji, title_native, slug,
      synopsis, format, status, season, season_year, episodes_count,
      episode_duration, score, popularity, cover_image_url, banner_image_url,
      accent_color, genres, studios, youtube_trailer_id,
      next_airing_episode, next_airing_at, source, tags, relations, staff,
      start_date, end_date, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, NOW()
    )
    ON CONFLICT (anilist_id) DO UPDATE SET
      title_english = EXCLUDED.title_english,
      title_romaji = EXCLUDED.title_romaji,
      title_native = EXCLUDED.title_native,
      synopsis = EXCLUDED.synopsis,
      format = EXCLUDED.format,
      status = EXCLUDED.status,
      season = EXCLUDED.season,
      season_year = EXCLUDED.season_year,
      episodes_count = EXCLUDED.episodes_count,
      episode_duration = EXCLUDED.episode_duration,
      score = EXCLUDED.score,
      popularity = EXCLUDED.popularity,
      cover_image_url = EXCLUDED.cover_image_url,
      banner_image_url = EXCLUDED.banner_image_url,
      accent_color = EXCLUDED.accent_color,
      genres = EXCLUDED.genres,
      studios = EXCLUDED.studios,
      youtube_trailer_id = EXCLUDED.youtube_trailer_id,
      next_airing_episode = EXCLUDED.next_airing_episode,
      next_airing_at = EXCLUDED.next_airing_at,
      source = EXCLUDED.source,
      tags = EXCLUDED.tags,
      relations = EXCLUDED.relations,
      staff = EXCLUDED.staff,
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      updated_at = NOW()
    RETURNING id;
  `;

  await query(animeUpsertSql, [
    media.id,
    media.idMal || null,
    titleEnglish,
    titleRomaji,
    titleNative,
    slug,
    media.description || null,
    media.format || "TV",
    media.status || "FINISHED",
    media.season || null,
    media.seasonYear || null,
    media.episodes || null,
    media.duration || null,
    score,
    media.popularity || 0,
    coverUrl,
    bannerUrl,
    accentColor,
    genres,
    studiosJson,
    trailerId,
    nextAiringEp,
    nextAiringDate,
    source,
    tagsJson,
    relationsJson,
    staffJson,
    startDate,
    endDate,
  ]);

  // 2. Upsert Characters & Voice Actors
  if (media.characters?.edges && media.characters.edges.length > 0) {
    for (const edge of media.characters.edges) {
      const char = edge.node;
      if (!char || !char.id) continue;

      const charName = char.name?.full || "Unknown";
      const charImage = char.image?.large || null;

      await query(
        `
        INSERT INTO characters (anilist_id, name_full, image_url)
        VALUES ($1, $2, $3)
        ON CONFLICT (anilist_id) DO UPDATE SET
          name_full = EXCLUDED.name_full,
          image_url = EXCLUDED.image_url;
      `,
        [char.id, charName, charImage]
      );

      let vaId: number | null = null;
      if (edge.voiceActors && edge.voiceActors.length > 0) {
        const va = edge.voiceActors[0];
        if (va && va.id) {
          vaId = va.id;
          await query(
            `
            INSERT INTO voice_actors (anilist_id, name_full, image_url, language)
            VALUES ($1, $2, $3, 'Japanese')
            ON CONFLICT (anilist_id) DO UPDATE SET
              name_full = EXCLUDED.name_full,
              image_url = EXCLUDED.image_url;
          `,
            [va.id, va.name?.full || "Unknown", va.image?.large || null]
          );
        }
      }

      await query(
        `
        INSERT INTO anime_characters (anime_id, character_id, voice_actor_id, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (anime_id, character_id) DO UPDATE SET
          voice_actor_id = EXCLUDED.voice_actor_id,
          role = EXCLUDED.role;
      `,
        [media.id, char.id, vaId, edge.role || "MAIN"]
      );
    }
  }

  // 3. Upsert Official Streaming Links
  if (media.externalLinks && media.externalLinks.length > 0) {
    const streamLinks = media.externalLinks.filter((l: any) => l.type === "STREAMING");
    for (const link of streamLinks) {
      await query(
        `
        INSERT INTO streaming_links (anime_id, platform_name, target_url, is_official)
        VALUES ($1, $2, $3, true)
        ON CONFLICT DO NOTHING;
      `,
        [media.id, link.site || "Streaming", link.url]
      );
    }
  }
}

export async function fetchAndSyncBatch(options: {
  action: "test" | "seasonal" | "top" | "page" | "year" | "upcoming";
  page?: number;
  perPage?: number;
  year?: number;
}) {
  const { action, page = 1, perPage = 20, year: inputYear } = options;
  const { season, year: currentYear } = getCurrentSeason();

  let variables: Record<string, unknown> = {
    page,
    perPage,
  };

  if (action === "year" && inputYear) {
    variables = {
      ...variables,
      seasonYear: inputYear,
      sort: ["POPULARITY_DESC"],
    };
  } else if (action === "upcoming") {
    variables = {
      ...variables,
      status: "NOT_YET_RELEASED",
      sort: ["POPULARITY_DESC"],
    };
  } else if (action === "seasonal") {
    variables = {
      ...variables,
      season,
      seasonYear: currentYear,
      sort: ["POPULARITY_DESC"],
    };
  } else if (action === "top") {
    variables = {
      ...variables,
      sort: ["SCORE_DESC"],
    };
  } else if (action === "test") {
    variables = {
      page: 1,
      perPage: 5,
      sort: ["TRENDING_DESC"],
    };
  } else {
    variables = {
      ...variables,
      sort: ["POPULARITY_DESC"],
    };
  }

  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query: BULK_SYNC_QUERY, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AniList API responded with ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const mediaList = json.data?.Page?.media || [];
  const pageInfo = json.data?.Page?.pageInfo || {};

  let processedCount = 0;
  for (const item of mediaList) {
    await upsertAnimeRecord(item);
    processedCount++;
  }

  await query(
    `
    INSERT INTO sync_logs (action, count_processed, status, details)
    VALUES ($1, $2, 'SUCCESS', $3)
  `,
    [
      action,
      processedCount,
      JSON.stringify({
        page,
        perPage,
        pageInfo,
      }),
    ]
  );

  return {
    success: true,
    count: processedCount,
    pageInfo,
    sampleItems: mediaList.slice(0, 5).map((m: any) => ({
      id: m.id,
      title: m.title.english || m.title.romaji,
      format: m.format,
      score: m.averageScore,
      status: m.status,
      episodes: m.episodes,
    })),
  };
}
