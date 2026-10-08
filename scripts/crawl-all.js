// scripts/crawl-all.js
/**
 * AnimeDB Full Catalog Automated Crawler
 * Crawls up to 20,000+ anime titles from AniList GraphQL directly into Google Cloud SQL PostgreSQL.
 *
 * Features:
 * - Rate-limit compliant (1.2s delay = ~45 req/min, safely under AniList's 90 req/min limit)
 * - Auto 429 backoff & retry (waits 60s if throttled, then resumes automatically)
 * - Persistent checkpoint (resumes from where it left off if interrupted)
 * - Zero duplicates (PostgreSQL UPSERT on conflict)
 */

const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  });
}

const pool = new Pool({
  host: process.env.DB_HOST || "35.194.28.236",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "postgres",
  max: 10,
  idleTimeoutMillis: 30000,
});

const ANILIST_ENDPOINT = "https://graphql.anilist.co";
const CHECKPOINT_FILE = path.resolve(__dirname, "../crawler_checkpoint.json");

// Optimal batch size & delay to guarantee fast responses and zero rate limit blocks
const PER_PAGE = 25;
const DELAY_MS = 1200; // 1.2s between pages
const TARGET_MAX_PAGES = 800; // 800 pages * 25 = 20,000 anime

const CRAWL_QUERY = `
  query GetBulkAnime($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        currentPage
        total
        lastPage
      }
      media(type: ANIME, sort: POPULARITY_DESC) {
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
        externalLinks {
          id
          site
          url
          type
        }
        characters(perPage: 6, sort: ROLE) {
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

function generateSlug(title, id) {
  const clean = (title || `anime-${id}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return `${clean}-${id}`;
}

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"));
    } catch {
      return { lastPage: 0, totalProcessed: 0 };
    }
  }
  return { lastPage: 0, totalProcessed: 0 };
}

function saveCheckpoint(page, total) {
  fs.writeFileSync(
    CHECKPOINT_FILE,
    JSON.stringify(
      {
        lastPage: page,
        totalProcessed: total,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
}

async function upsertAnime(client, media) {
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
  const startDate = media.startDate?.year
    ? `${media.startDate.year}-${String(media.startDate.month || 1).padStart(2, "0")}-${String(media.startDate.day || 1).padStart(2, "0")}`
    : null;
  const endDate = media.endDate?.year
    ? `${media.endDate.year}-${String(media.endDate.month || 1).padStart(2, "0")}-${String(media.endDate.day || 1).padStart(2, "0")}`
    : null;

  // Upsert Anime
  await client.query(
    `
    INSERT INTO anime (
      anilist_id, mal_id, title_english, title_romaji, title_native, slug,
      synopsis, format, status, season, season_year, episodes_count,
      episode_duration, score, popularity, cover_image_url, banner_image_url,
      accent_color, genres, studios, youtube_trailer_id,
      next_airing_episode, next_airing_at, source,
      start_date, end_date, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, NOW()
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
      start_date = EXCLUDED.start_date,
      end_date = EXCLUDED.end_date,
      updated_at = NOW();
  `,
    [
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
      startDate,
      endDate,
    ]
  );

  // Characters & Voice Actors
  if (media.characters?.edges && media.characters.edges.length > 0) {
    for (const edge of media.characters.edges) {
      const char = edge.node;
      if (!char || !char.id) continue;

      await client.query(
        `
        INSERT INTO characters (anilist_id, name_full, image_url)
        VALUES ($1, $2, $3)
        ON CONFLICT (anilist_id) DO UPDATE SET
          name_full = EXCLUDED.name_full,
          image_url = EXCLUDED.image_url;
      `,
        [char.id, char.name?.full || "Unknown", char.image?.large || null]
      );

      let vaId = null;
      if (edge.voiceActors && edge.voiceActors.length > 0) {
        const va = edge.voiceActors[0];
        if (va && va.id) {
          vaId = va.id;
          await client.query(
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

      await client.query(
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

  // Streaming Links
  if (media.externalLinks && media.externalLinks.length > 0) {
    const streamLinks = media.externalLinks.filter((l) => l.type === "STREAMING");
    for (const link of streamLinks) {
      await client.query(
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

async function fetchPageWithRetry(page, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(ANILIST_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: CRAWL_QUERY,
          variables: { page, perPage: PER_PAGE },
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("Retry-After")) || 60;
        console.warn(`\n[AniList 429 Rate Limit Hit] Pausing for ${retryAfter}s before retrying page ${page}...`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        throw new Error(`GraphQL Error: ${JSON.stringify(json.errors)}`);
      }

      return json.data?.Page;
    } catch (err) {
      console.warn(`[Attempt ${attempt}/${maxRetries} failed for page ${page}]: ${err.message}`);
      if (attempt === maxRetries) throw err;
      await new Promise((resolve) => setTimeout(resolve, 4000 * attempt));
    }
  }
}

async function runFullCrawler() {
  console.log("=================================================================");
  console.log("  🚀 AnimeDB Full Catalog Automated Ingestion Engine");
  console.log("  Target: Google Cloud SQL PostgreSQL (35.194.28.236)");
  console.log("  Batch: 25 titles/page | Rate: ~1,250 titles/hour");
  console.log("=================================================================\n");

  const checkpoint = loadCheckpoint();
  let startPage = checkpoint.lastPage + 1;
  let totalProcessed = checkpoint.totalProcessed || 0;

  console.log(`Checkpoint loaded: Resuming from Page ${startPage} (${totalProcessed} anime processed so far).\n`);

  const client = await pool.connect();
  const startTime = Date.now();

  try {
    let currentPage = startPage;
    let hasMore = true;

    while (hasMore && currentPage <= TARGET_MAX_PAGES) {
      const pageStart = Date.now();
      process.stdout.write(`[Page ${currentPage}/${TARGET_MAX_PAGES}] Ingesting from AniList... `);

      const pageData = await fetchPageWithRetry(currentPage);
      if (!pageData || !pageData.media || pageData.media.length === 0) {
        console.log("No more media found. Crawl complete!");
        break;
      }

      const mediaList = pageData.media;
      hasMore = pageData.pageInfo?.hasNextPage;

      await client.query("BEGIN");
      try {
        for (const item of mediaList) {
          await upsertAnime(client, item);
        }
        await client.query("COMMIT");
      } catch (insertErr) {
        await client.query("ROLLBACK");
        throw insertErr;
      }

      totalProcessed += mediaList.length;
      saveCheckpoint(currentPage, totalProcessed);

      const pageTime = Date.now() - pageStart;
      const elapsedMins = ((Date.now() - startTime) / 60000).toFixed(1);
      const percent = ((currentPage / TARGET_MAX_PAGES) * 100).toFixed(1);

      console.log(
        `✓ +${mediaList.length} anime saved (${pageTime}ms) | Total in DB: ${totalProcessed} (${percent}%) | Time: ${elapsedMins}m`
      );

      currentPage++;

      if (hasMore && currentPage <= TARGET_MAX_PAGES) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    console.log("\n=================================================================");
    console.log(`🎉 Ingestion Job Finished! Total Anime Processed: ${totalProcessed}`);
    console.log("=================================================================\n");
  } catch (err) {
    console.error("\n❌ Ingestion interrupted with error:", err.message);
    console.log("Checkpoint is saved! You can rerun this script anytime to resume exactly where it stopped.");
  } finally {
    client.release();
    await pool.end();
  }
}

runFullCrawler();
