import { query } from "./db";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export interface CatalogDiffItem {
  diffId: string;
  anilistId: number;
  title: string;
  titleEnglish?: string | null;
  coverImageUrl?: string | null;
  format: string;
  seasonYear?: number | null;
  field: "score" | "episodes_count" | "status" | "popularity" | "youtube_trailer_id";
  label: string;
  oldValue: any;
  newValue: any;
  formattedOld: string;
  formattedNew: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
}

export interface CatalogAuditPageResult {
  page: number;
  perPage: number;
  totalAvailable: number;
  hasNextPage: boolean;
  checkedCount: number;
  diffsFound: number;
  diffs: CatalogDiffItem[];
  executionTimeMs: number;
}

const AUDIT_QUERY = `
  query GetCatalogAuditBatch($page: Int, $perPage: Int, $sort: [MediaSort], $seasonYear: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        currentPage
        total
        lastPage
      }
      media(type: ANIME, sort: $sort, seasonYear: $seasonYear) {
        id
        title {
          romaji
          english
        }
        format
        status
        episodes
        averageScore
        popularity
        seasonYear
        trailer {
          id
          site
        }
        coverImage {
          large
        }
      }
    }
  }
`;

export async function auditCatalogPage(options: {
  page?: number;
  perPage?: number;
  scope?: "popular" | "recent" | "all";
  year?: number;
}): Promise<CatalogAuditPageResult> {
  const startTime = Date.now();
  const page = options.page || 1;
  const perPage = Math.min(options.perPage || 50, 50);
  const scope = options.scope || "popular";

  let variables: Record<string, unknown> = {
    page,
    perPage,
  };

  if (scope === "popular") {
    variables.sort = ["POPULARITY_DESC"];
  } else if (scope === "recent") {
    variables.sort = ["START_DATE_DESC"];
    if (options.year) {
      variables.seasonYear = options.year;
    }
  } else {
    // "all" - by ID/popularity
    variables.sort = ["POPULARITY_DESC"];
  }

  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: AUDIT_QUERY,
      variables,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AniList returned status ${res.status}: ${errText}`);
  }

  const json = await res.json();
  const mediaList = json.data?.Page?.media || [];
  const pageInfo = json.data?.Page?.pageInfo || {};

  if (mediaList.length === 0) {
    return {
      page,
      perPage,
      totalAvailable: pageInfo.total || 0,
      hasNextPage: false,
      checkedCount: 0,
      diffsFound: 0,
      diffs: [],
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Fetch corresponding records from Cloud SQL PostgreSQL
  const ids = mediaList.map((m: any) => m.id);
  const dbRes = await query<{
    anilist_id: number;
    title_romaji: string;
    title_english: string | null;
    status: string;
    episodes_count: number | null;
    score: string | number | null;
    popularity: number;
    youtube_trailer_id: string | null;
    format: string;
    season_year: number | null;
    cover_image_url: string | null;
  }>(
    `SELECT anilist_id, title_romaji, title_english, status, episodes_count, score, 
            popularity, youtube_trailer_id, format, season_year, cover_image_url
     FROM anime
     WHERE anilist_id = ANY($1::int[]);`,
    [ids]
  );

  const dbMap = new Map<number, any>();
  for (const row of dbRes.rows) {
    dbMap.set(row.anilist_id, row);
  }

  const diffs: CatalogDiffItem[] = [];

  for (const item of mediaList) {
    const dbRecord = dbMap.get(item.id);
    if (!dbRecord) continue; // Only diff anime already existing in local DB

    const title = dbRecord.title_english || dbRecord.title_romaji || item.title?.english || item.title?.romaji;
    const cover = dbRecord.cover_image_url || item.coverImage?.large;

    // 1. Score Diff (>= 0.1 difference or newly rated)
    const aniScore = item.averageScore ? Number((item.averageScore / 10).toFixed(1)) : null;
    const dbScore = dbRecord.score ? Number(dbRecord.score) : null;
    if (aniScore !== null && (dbScore === null || Math.abs(dbScore - aniScore) >= 0.1)) {
      diffs.push({
        diffId: `${item.id}-score`,
        anilistId: item.id,
        title,
        titleEnglish: dbRecord.title_english,
        coverImageUrl: cover,
        format: dbRecord.format,
        seasonYear: dbRecord.season_year,
        field: "score",
        label: "User Rating",
        oldValue: dbScore,
        newValue: aniScore,
        formattedOld: dbScore ? `⭐ ${dbScore.toFixed(1)}` : "Unrated",
        formattedNew: `⭐ ${aniScore.toFixed(1)}`,
        impact: "MEDIUM",
      });
    }

    // 2. Episodes Count Diff (newly announced or updated)
    const aniEpisodes = item.episodes || null;
    const dbEpisodes = dbRecord.episodes_count;
    if (aniEpisodes !== null && dbEpisodes !== aniEpisodes) {
      diffs.push({
        diffId: `${item.id}-episodes_count`,
        anilistId: item.id,
        title,
        titleEnglish: dbRecord.title_english,
        coverImageUrl: cover,
        format: dbRecord.format,
        seasonYear: dbRecord.season_year,
        field: "episodes_count",
        label: "Episode Count",
        oldValue: dbEpisodes,
        newValue: aniEpisodes,
        formattedOld: dbEpisodes ? `${dbEpisodes} eps` : "Unknown / TBD",
        formattedNew: `${aniEpisodes} eps`,
        impact: "HIGH",
      });
    }

    // 3. Status Diff (e.g. NOT_YET_RELEASED -> RELEASING, or RELEASING -> FINISHED)
    const aniStatus = item.status || "FINISHED";
    const dbStatus = dbRecord.status;
    if (aniStatus && dbStatus !== aniStatus) {
      diffs.push({
        diffId: `${item.id}-status`,
        anilistId: item.id,
        title,
        titleEnglish: dbRecord.title_english,
        coverImageUrl: cover,
        format: dbRecord.format,
        seasonYear: dbRecord.season_year,
        field: "status",
        label: "Release Status",
        oldValue: dbStatus,
        newValue: aniStatus,
        formattedOld: dbStatus,
        formattedNew: aniStatus,
        impact: "HIGH",
      });
    }

    // 4. Trailer ID Diff (Trailer added on AniList)
    const aniTrailer = item.trailer?.site === "youtube" ? item.trailer.id : null;
    const dbTrailer = dbRecord.youtube_trailer_id;
    if (aniTrailer && (!dbTrailer || dbTrailer !== aniTrailer)) {
      diffs.push({
        diffId: `${item.id}-youtube_trailer_id`,
        anilistId: item.id,
        title,
        titleEnglish: dbRecord.title_english,
        coverImageUrl: cover,
        format: dbRecord.format,
        seasonYear: dbRecord.season_year,
        field: "youtube_trailer_id",
        label: "Official Trailer",
        oldValue: dbTrailer,
        newValue: aniTrailer,
        formattedOld: dbTrailer ? `YouTube (${dbTrailer})` : "None",
        formattedNew: `YouTube (${aniTrailer})`,
        impact: "LOW",
      });
    }

    // 5. Popularity Diff (major ranking shift > 1000)
    const aniPop = item.popularity || 0;
    const dbPop = dbRecord.popularity || 0;
    if (aniPop > 0 && Math.abs(aniPop - dbPop) > 1000) {
      diffs.push({
        diffId: `${item.id}-popularity`,
        anilistId: item.id,
        title,
        titleEnglish: dbRecord.title_english,
        coverImageUrl: cover,
        format: dbRecord.format,
        seasonYear: dbRecord.season_year,
        field: "popularity",
        label: "Popularity Rank",
        oldValue: dbPop,
        newValue: aniPop,
        formattedOld: dbPop.toLocaleString(),
        formattedNew: aniPop.toLocaleString(),
        impact: "LOW",
      });
    }
  }

  return {
    page,
    perPage,
    totalAvailable: pageInfo.total || 0,
    hasNextPage: Boolean(pageInfo.hasNextPage),
    checkedCount: dbRes.rows.length,
    diffsFound: diffs.length,
    diffs,
    executionTimeMs: Date.now() - startTime,
  };
}

export interface ApprovedChange {
  anilistId: number;
  field: "score" | "episodes_count" | "status" | "popularity" | "youtube_trailer_id";
  value: any;
}

export async function applyApprovedCatalogChanges(approvedChanges: ApprovedChange[]) {
  if (!approvedChanges || approvedChanges.length === 0) {
    return { count: 0, appliedCount: 0 };
  }

  const startTime = Date.now();

  // Group approved changes by anilistId
  const groupedByAnime = new Map<number, Record<string, any>>();
  for (const item of approvedChanges) {
    if (!groupedByAnime.has(item.anilistId)) {
      groupedByAnime.set(item.anilistId, {});
    }
    groupedByAnime.get(item.anilistId)![item.field] = item.value;
  }

  let appliedCount = 0;
  for (const [anilistId, fields] of groupedByAnime.entries()) {
    const updateClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [field, value] of Object.entries(fields)) {
      updateClauses.push(`${field} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    if (updateClauses.length > 0) {
      updateClauses.push("updated_at = NOW()");
      values.push(anilistId);
      const sql = `
        UPDATE anime
        SET ${updateClauses.join(", ")}
        WHERE anilist_id = $${paramIndex};
      `;
      await query(sql, values);
      appliedCount++;
    }
  }

  // Audit log
  await query(
    `
    INSERT INTO sync_logs (action, count_processed, status, details)
    VALUES ('CATALOG_AUDIT_APPLY', $1, 'SUCCESS', $2)
  `,
    [
      appliedCount,
      JSON.stringify({
        totalApprovedFieldChanges: approvedChanges.length,
        animesUpdated: appliedCount,
        executionTimeMs: Date.now() - startTime,
        sampleApplied: approvedChanges.slice(0, 10),
      }),
    ]
  );

  return {
    count: approvedChanges.length,
    appliedCount,
    executionTimeMs: Date.now() - startTime,
  };
}
