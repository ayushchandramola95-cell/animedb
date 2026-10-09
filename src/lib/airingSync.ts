import { query } from "./db";
import { recordAiringLastSync } from "./settings";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export interface AiringFieldDiff {
  anilist_id: number;
  title: string;
  cover_image_url?: string | null;
  field: "next_airing_episode" | "next_airing_at" | "status" | "episodes_count" | "score";
  label: string;
  oldValue: any;
  newValue: any;
  formattedOld: string;
  formattedNew: string;
}

export interface AiringSyncResult {
  success: boolean;
  status: "UPDATED" | "NO_CHANGE";
  checkedCount: number;
  changedCount: number;
  changes: AiringFieldDiff[];
  executionTimeMs: number;
  timestamp: string;
  trigger: "manual" | "auto_cron";
  error?: string;
}

// In-process lock to prevent overlapping sync executions
let isSyncRunning = false;

const AIRING_MEDIA_QUERY = `
  query GetAiringMedia($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        currentPage
        total
      }
      media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
        id
        title {
          romaji
          english
        }
        status
        episodes
        averageScore
        popularity
        nextAiringEpisode {
          episode
          airingAt
          timeUntilAiring
        }
        coverImage {
          large
        }
      }
    }
  }
`;

const CHECK_ENDED_QUERY = `
  query CheckEndedMedia($ids: [Int]) {
    Page(page: 1, perPage: 50) {
      media(type: ANIME, id_in: $ids) {
        id
        title {
          romaji
          english
        }
        status
        episodes
        averageScore
        nextAiringEpisode {
          episode
          airingAt
        }
        coverImage {
          large
        }
      }
    }
  }
`;

async function fetchAniListAiringPages(): Promise<Map<number, any>> {
  const anilistMap = new Map<number, any>();
  let page = 1;
  let hasNext = true;

  while (hasNext && page <= 10) {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: AIRING_MEDIA_QUERY,
        variables: { page, perPage: 50 },
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AniList returned status ${res.status}: ${errText}`);
    }

    const json = await res.json();
    const mediaList = json.data?.Page?.media || [];
    const pageInfo = json.data?.Page?.pageInfo;

    for (const item of mediaList) {
      anilistMap.set(item.id, item);
    }

    hasNext = Boolean(pageInfo?.hasNextPage);
    page++;

    // Throttling to respect AniList rate limit (90 req/min)
    if (hasNext) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  return anilistMap;
}

export async function syncAiringAnime(options: {
  trigger?: "manual" | "auto_cron";
} = {}): Promise<AiringSyncResult> {
  const trigger = options.trigger || "manual";

  if (isSyncRunning) {
    throw new Error("Airing schedule sync is already in progress. Please wait for it to finish.");
  }

  isSyncRunning = true;
  const startTime = Date.now();
  const timestampIso = new Date().toISOString();

  try {
    // 1. Fetch all anime currently marked as RELEASING or with an active countdown in PostgreSQL
    const dbRes = await query<{
      anilist_id: number;
      title_romaji: string;
      title_english: string | null;
      status: string;
      episodes_count: number | null;
      next_airing_episode: number | null;
      next_airing_at: string | Date | null;
      score: string | number | null;
      cover_image_url: string | null;
    }>(
      `SELECT anilist_id, title_romaji, title_english, status, episodes_count, 
              next_airing_episode, next_airing_at, score, cover_image_url
       FROM anime
       WHERE status = 'RELEASING' OR next_airing_at IS NOT NULL;`
    );

    const dbAnimeList = dbRes.rows;

    // 2. Fetch live RELEASING titles from AniList
    const anilistMap = await fetchAniListAiringPages();

    // 3. Check for any DB anime that were RELEASING but not present in AniList's RELEASING page
    // (Likely finished airing or cancelled)
    const missingFromAiringIds = dbAnimeList
      .filter((a) => !anilistMap.has(a.anilist_id) && a.status === "RELEASING")
      .map((a) => a.anilist_id);

    if (missingFromAiringIds.length > 0) {
      // Chunk into batches of 40 to check their final status
      for (let i = 0; i < missingFromAiringIds.length; i += 40) {
        const batchIds = missingFromAiringIds.slice(i, i + 40);
        try {
          const res = await fetch(ANILIST_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: CHECK_ENDED_QUERY,
              variables: { ids: batchIds },
            }),
            cache: "no-store",
          });

          if (res.ok) {
            const data = await res.json();
            const endedMedia = data.data?.Page?.media || [];
            for (const item of endedMedia) {
              anilistMap.set(item.id, item);
            }
          }
        } catch (e) {
          console.warn("Could not check ended anime chunk:", e);
        }
      }
    }

    // 4. Compare DB records with AniList and find exact diffs
    const diffs: AiringFieldDiff[] = [];
    const animeToUpdate = new Map<
      number,
      {
        anilist_id: number;
        next_airing_episode: number | null;
        next_airing_at: Date | null;
        status: string;
        episodes_count: number | null;
        score: number | null;
      }
    >();

    for (const dbRecord of dbAnimeList) {
      const anilistItem = anilistMap.get(dbRecord.anilist_id);
      if (!anilistItem) continue;

      const title = dbRecord.title_english || dbRecord.title_romaji || `Anime #${dbRecord.anilist_id}`;
      const cover = dbRecord.cover_image_url || anilistItem.coverImage?.large;

      // Extract AniList values
      const aniNextEp = anilistItem.nextAiringEpisode?.episode || null;
      const aniNextAtSec = anilistItem.nextAiringEpisode?.airingAt || null;
      const aniNextAtDate = aniNextAtSec ? new Date(aniNextAtSec * 1000) : null;
      const aniStatus = anilistItem.status || "FINISHED";
      const aniEpisodes = anilistItem.episodes || null;
      const aniScore = anilistItem.averageScore ? Number((anilistItem.averageScore / 10).toFixed(1)) : null;

      // Extract DB values
      const dbNextEp = dbRecord.next_airing_episode;
      const dbNextAtSec = dbRecord.next_airing_at
        ? Math.floor(new Date(dbRecord.next_airing_at).getTime() / 1000)
        : null;
      const dbStatus = dbRecord.status;
      const dbEpisodes = dbRecord.episodes_count;
      const dbScore = dbRecord.score ? Number(dbRecord.score) : null;

      let hasChanged = false;

      // Check next episode number (e.g. Ep 2 -> Ep 3)
      if (dbNextEp !== aniNextEp) {
        hasChanged = true;
        diffs.push({
          anilist_id: dbRecord.anilist_id,
          title,
          cover_image_url: cover,
          field: "next_airing_episode",
          label: "Next Episode",
          oldValue: dbNextEp,
          newValue: aniNextEp,
          formattedOld: dbNextEp ? `Episode ${dbNextEp}` : "None / Finished",
          formattedNew: aniNextEp ? `Episode ${aniNextEp}` : "None / Finished",
        });
      }

      // Check next airing countdown timestamp
      // Allow +/- 60s tolerance for clock drift
      const timeDiff = Math.abs((dbNextAtSec || 0) - (aniNextAtSec || 0));
      if (
        (dbNextAtSec === null && aniNextAtSec !== null) ||
        (dbNextAtSec !== null && aniNextAtSec === null) ||
        (dbNextAtSec !== null && aniNextAtSec !== null && timeDiff > 60)
      ) {
        hasChanged = true;
        diffs.push({
          anilist_id: dbRecord.anilist_id,
          title,
          cover_image_url: cover,
          field: "next_airing_at",
          label: "Airing Countdown",
          oldValue: dbRecord.next_airing_at ? new Date(dbRecord.next_airing_at).toISOString() : null,
          newValue: aniNextAtDate ? aniNextAtDate.toISOString() : null,
          formattedOld: dbRecord.next_airing_at
            ? new Date(dbRecord.next_airing_at).toLocaleString()
            : "No countdown",
          formattedNew: aniNextAtDate ? aniNextAtDate.toLocaleString() : "No countdown",
        });
      }

      // Check status transition (e.g. RELEASING -> FINISHED)
      if (dbStatus !== aniStatus) {
        hasChanged = true;
        diffs.push({
          anilist_id: dbRecord.anilist_id,
          title,
          cover_image_url: cover,
          field: "status",
          label: "Show Status",
          oldValue: dbStatus,
          newValue: aniStatus,
          formattedOld: dbStatus,
          formattedNew: aniStatus,
        });
      }

      // Check episodes count (if finalized or updated)
      if (aniEpisodes !== null && dbEpisodes !== aniEpisodes) {
        hasChanged = true;
        diffs.push({
          anilist_id: dbRecord.anilist_id,
          title,
          cover_image_url: cover,
          field: "episodes_count",
          label: "Total Episodes",
          oldValue: dbEpisodes,
          newValue: aniEpisodes,
          formattedOld: dbEpisodes ? `${dbEpisodes} eps` : "Unknown",
          formattedNew: `${aniEpisodes} eps`,
        });
      }

      // Check score update (if score shifted by >= 0.2)
      if (aniScore !== null && (dbScore === null || Math.abs(dbScore - aniScore) >= 0.2)) {
        hasChanged = true;
        diffs.push({
          anilist_id: dbRecord.anilist_id,
          title,
          cover_image_url: cover,
          field: "score",
          label: "User Rating",
          oldValue: dbScore,
          newValue: aniScore,
          formattedOld: dbScore ? dbScore.toFixed(1) : "Unrated",
          formattedNew: aniScore.toFixed(1),
        });
      }

      if (hasChanged) {
        animeToUpdate.set(dbRecord.anilist_id, {
          anilist_id: dbRecord.anilist_id,
          next_airing_episode: aniNextEp,
          next_airing_at: aniNextAtDate,
          status: aniStatus,
          episodes_count: aniEpisodes,
          score: aniScore,
        });
      }
    }

    const changedCount = animeToUpdate.size;
    const checkedCount = dbAnimeList.length;

    // 5. If changes exist: Update database rows
    if (changedCount > 0) {
      for (const [id, updateData] of animeToUpdate.entries()) {
        await query(
          `
          UPDATE anime
          SET next_airing_episode = $1,
              next_airing_at = $2,
              status = $3,
              episodes_count = COALESCE($4, episodes_count),
              score = COALESCE($5, score),
              updated_at = NOW()
          WHERE anilist_id = $6;
        `,
          [
            updateData.next_airing_episode,
            updateData.next_airing_at,
            updateData.status,
            updateData.episodes_count,
            updateData.score,
            id,
          ]
        );
      }
    }

    const executionTimeMs = Date.now() - startTime;
    const statusResult: "UPDATED" | "NO_CHANGE" = changedCount > 0 ? "UPDATED" : "NO_CHANGE";

    // 6. Log to sync_logs table (ALWAYS, whether changes occurred or NO changes occurred!)
    const logDetails = {
      checkedCount,
      changedCount,
      trigger,
      executionTimeMs,
      timestamp: timestampIso,
      message:
        changedCount > 0
          ? `Successfully synchronized ${changedCount} airing anime with live AniList broadcast schedules.`
          : `No changes detected across ${checkedCount} tracked airing shows. All schedules, episode numbers, and countdown timers are fully up to date.`,
      changes: diffs.slice(0, 100), // preserve top 100 diff details
    };

    await query(
      `
      INSERT INTO sync_logs (action, count_processed, status, details)
      VALUES ('AIRING_SYNC', $1, $2, $3)
    `,
      [changedCount > 0 ? changedCount : checkedCount, statusResult, JSON.stringify(logDetails)]
    );

    // 7. Update last sync timestamp in system settings
    await recordAiringLastSync(timestampIso);

    return {
      success: true,
      status: statusResult,
      checkedCount,
      changedCount,
      changes: diffs,
      executionTimeMs,
      timestamp: timestampIso,
      trigger,
    };
  } catch (error: any) {
    console.error("Airing Sync Error:", error);
    const executionTimeMs = Date.now() - startTime;

    // Record error in sync_logs
    try {
      await query(
        `
        INSERT INTO sync_logs (action, count_processed, status, details)
        VALUES ('AIRING_SYNC', 0, 'FAILED', $1)
      `,
        [
          JSON.stringify({
            error: error.message || "Unknown error during airing sync",
            trigger,
            executionTimeMs,
            timestamp: timestampIso,
          }),
        ]
      );
    } catch {}

    throw error;
  } finally {
    isSyncRunning = false;
  }
}

export async function getAiringSyncHistory(limit = 20) {
  const res = await query(
    `
    SELECT id, action, count_processed, status, details, created_at
    FROM sync_logs
    WHERE action = 'AIRING_SYNC'
    ORDER BY created_at DESC
    LIMIT $1;
  `,
    [limit]
  );

  return res.rows.map((row) => ({
    id: row.id,
    action: row.action,
    countProcessed: row.count_processed,
    status: row.status as "UPDATED" | "NO_CHANGE" | "FAILED",
    details: typeof row.details === "string" ? JSON.parse(row.details) : row.details,
    createdAt: row.created_at,
  }));
}
