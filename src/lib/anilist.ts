import {
  AnimeMedia,
  ScheduleItem,
  CharacterDetail,
  StaffDetail,
  OmniSearchResult,
  GlobalReviewItem,
  AnimeNewsItem,
  FranchiseData,
  FranchiseItem,
} from "./types";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

const MEDIA_FIELDS = `
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
  episodes
  duration
  season
  seasonYear
  averageScore
  popularity
  source
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  genres
  studios {
    nodes {
      id
      name
      isAnimationStudio
    }
    edges {
      id
      isMain
      node {
        id
        name
        isAnimationStudio
      }
    }
  }
  trailer {
    id
    site
  }
  nextAiringEpisode {
    episode
    airingAt
    timeUntilAiring
  }
  externalLinks {
    id
    site
    url
    type
    icon
    color
    language
  }
`;

const queryMemoryCache = new Map<string, { data: any; expiry: number }>();

export async function fetchAniList<T>(
  query: string,
  variables: Record<string, unknown> = {},
  retries = 2
): Promise<T> {
  const cacheKey = JSON.stringify({ query, variables });
  const cached = queryMemoryCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.data as T;
  }

  try {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 3600 }, // Cache on edge for 1 hour
    });

    if (res.status === 429 && retries > 0) {
      const retryAfterHeader = res.headers.get("retry-after");
      const waitMs = retryAfterHeader ? Math.min(parseInt(retryAfterHeader, 10) * 1000, 3000) : 1500;
      console.warn(`[AniList Rate Limit 429: Pausing ${waitMs}ms before retry...]`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return fetchAniList<T>(query, variables, retries - 1);
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error("AniList API Error:", res.status, errorText);
      if (cached) {
        console.warn("Serving stale memory cache due to AniList error");
        return cached.data as T;
      }
      throw new Error(`AniList API responded with status ${res.status}`);
    }

    const json = await res.json();
    if (json.errors) {
      console.error("AniList GraphQL Errors:", json.errors);
      if (cached) return cached.data as T;
      throw new Error(json.errors[0]?.message || "GraphQL error");
    }

    // Cache successful response for 10 minutes in memory
    queryMemoryCache.set(cacheKey, {
      data: json.data,
      expiry: Date.now() + 10 * 60 * 1000,
    });

    return json.data;
  } catch (err) {
    if (cached) {
      console.warn("Serving stale memory cache due to exception:", err);
      return cached.data as T;
    }
    throw err;
  }
}

export function getCurrentSeason(): { season: "WINTER" | "SPRING" | "SUMMER" | "FALL"; year: number } {
  const now = new Date();
  const month = now.getMonth(); // 0 to 11
  const year = now.getFullYear();

  if (month >= 0 && month <= 2) return { season: "WINTER", year };
  if (month >= 3 && month <= 5) return { season: "SPRING", year };
  if (month >= 6 && month <= 8) return { season: "SUMMER", year };
  return { season: "FALL", year };
}

export async function getTrendingAnime(perPage = 12): Promise<AnimeMedia[]> {
  const query = `
    query GetTrending($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await fetchAniList<{ Page: { media: AnimeMedia[] } }>(query, { perPage });
    return data.Page.media;
  } catch (err) {
    console.error("Failed to fetch trending anime:", err);
    return [];
  }
}

export async function getPopularThisSeason(perPage = 12): Promise<AnimeMedia[]> {
  const { season, year } = getCurrentSeason();
  const query = `
    query GetSeasonal($season: MediaSeason, $seasonYear: Int, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await fetchAniList<{ Page: { media: AnimeMedia[] } }>(query, {
      season,
      seasonYear: year,
      perPage,
    });
    return data.Page.media;
  } catch (err) {
    console.error("Failed to fetch seasonal anime:", err);
    return [];
  }
}

export async function getTopRatedAnime(perPage = 12): Promise<AnimeMedia[]> {
  const query = `
    query GetTopRated($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: SCORE_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await fetchAniList<{ Page: { media: AnimeMedia[] } }>(query, { perPage });
    return data.Page.media;
  } catch (err) {
    console.error("Failed to fetch top rated anime:", err);
    return [];
  }
}

export async function getAiringToday(perPage = 30): Promise<AnimeMedia[]> {
  const now = Math.floor(Date.now() / 1000);
  // Look 24 hours back to capture all of today's morning/afternoon broadcasts, and 24 hours ahead
  const start = now - 24 * 3600;
  const end = now + 24 * 3600;
  const query = `
    query GetAiringSchedule($start: Int, $end: Int, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
          id
          episode
          airingAt
          timeUntilAiring
          media {
            ${MEDIA_FIELDS}
          }
        }
      }
    }
  `;
  try {
    interface AiringScheduleItem {
      id: number;
      episode: number;
      airingAt: number;
      timeUntilAiring: number;
      media: AnimeMedia;
    }
    const data = await fetchAniList<{ Page: { airingSchedules: AiringScheduleItem[] } }>(query, {
      start,
      end,
      perPage,
    });
    return data.Page.airingSchedules.map((item) => ({
      ...item.media,
      nextAiringEpisode: {
        episode: item.episode,
        airingAt: item.airingAt,
        timeUntilAiring: item.airingAt - now,
      },
    }));
  } catch (err) {
    console.error("Failed to fetch airing anime:", err);
    return [];
  }
}

export async function getUpcomingAnticipated(perPage = 12): Promise<AnimeMedia[]> {
  const query = `
    query GetUpcomingAnticipated($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await fetchAniList<{ Page: { media: AnimeMedia[] } }>(query, { perPage });
    return data.Page.media;
  } catch (err) {
    console.error("Failed to fetch upcoming anime:", err);
    return [];
  }
}

export async function getGlobalRecentReviews(perPage = 6): Promise<GlobalReviewItem[]> {
  const query = `
    query GetGlobalRecentReviews($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        reviews(mediaType: ANIME, sort: [RATING_DESC]) {
          id
          score
          summary
          rating
          ratingAmount
          createdAt
          user {
            id
            name
            avatar {
              medium
              large
            }
          }
          media {
            id
            title {
              english
              romaji
            }
            coverImage {
              medium
              large
              extraLarge
            }
            bannerImage
            format
            averageScore
          }
        }
      }
    }
  `;
  try {
    const data = await fetchAniList<{ Page: { reviews: GlobalReviewItem[] } }>(query, { perPage });
    return data.Page?.reviews || [];
  } catch (err) {
    console.error("Failed to fetch global reviews:", err);
    return [];
  }
}

export async function getAnimeNews(limit = 6): Promise<AnimeNewsItem[]> {
  try {
    const res = await fetch("https://www.animenewsnetwork.com/news/rss.xml", {
      headers: { "User-Agent": "AnimeDB-Aggregator/1.0" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) throw new Error(`ANN returned ${res.status}`);
    const xml = await res.text();
    
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items: AnimeNewsItem[] = [];
    let match;
    let idx = 0;
    while ((match = itemRegex.exec(xml)) !== null && idx < limit) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemContent.match(/<description>([\s\S]*?)<\/description>/);
      const categoryMatch = itemContent.match(/<category>([\s\S]*?)<\/category>/);

      const title = titleMatch ? titleMatch[1].trim() : "Breaking Anime News";
      const link = linkMatch ? linkMatch[1].trim() : "https://www.animenewsnetwork.com";
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toUTCString();
      const rawDesc = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "";
      const snippet = rawDesc.length > 150 ? rawDesc.slice(0, 150) + "..." : rawDesc;
      const category = categoryMatch ? categoryMatch[1].trim() : "Industry";

      items.push({
        id: `news-${idx}`,
        title,
        link,
        pubDate,
        category,
        snippet,
      });
      idx++;
    }

    if (items.length > 0) return items;
  } catch (err) {
    console.warn("Falling back to curated anime news:", err);
  }

  return [
    {
      id: "news-fb-1",
      title: "Demon Slayer: Kimetsu no Yaiba 'Infinity Castle' Film Trilogy Confirmed for Worldwide Theatrical Release",
      link: "https://www.crunchyroll.com/news",
      pubDate: "Recently Announced",
      category: "Feature Film",
      snippet: "ufotable and Aniplex unveil the cinematic climax adaptation of the Infinity Castle arc across three major worldwide feature films.",
    },
    {
      id: "news-fb-2",
      title: "Jujutsu Kaisen Season 3: The Culling Game Arc Officially in Production at MAPPA",
      link: "https://www.crunchyroll.com/news",
      pubDate: "Recently Announced",
      category: "TV Anime",
      snippet: "Following the devastating Shibuya Incident, MAPPA confirms the dark, high-stakes battle royale arc is actively in development.",
    },
    {
      id: "news-fb-3",
      title: "Chainsaw Man: The Movie - Reze Arc Key Visual & Official Teaser Trailer Released",
      link: "https://www.crunchyroll.com/news",
      pubDate: "Recently Announced",
      category: "Movie",
      snippet: "Denji meets the enigmatic Reze in the upcoming direct sequel theatrical film following the events of the anime television broadcast.",
    },
    {
      id: "news-fb-4",
      title: "Frieren: Beyond Journey's End Celebrates Record-Breaking Global Viewership & Critical Acclaim",
      link: "https://www.crunchyroll.com/news",
      pubDate: "Recently Announced",
      category: "Spotlight",
      snippet: "Madhouse's masterclass in fantasy storytelling and emotional pacing captures the #1 spot across international anime rating databases.",
    },
    {
      id: "news-fb-5",
      title: "One-Punch Man Season 3 Premieres New Hero Association Character Visuals and Production Details",
      link: "https://www.crunchyroll.com/news",
      pubDate: "Recently Announced",
      category: "Production",
      snippet: "J.C.STAFF reveals brand-new character spotlight visuals as the Monster Association showdown approaches its broadcast debut.",
    },
    {
      id: "news-fb-6",
      title: "Bleach: Thousand-Year Blood War Part 3 - The Conflict Confirms Broadcast Premiere Schedule",
      link: "https://www.crunchyroll.com/news",
      pubDate: "Recently Announced",
      category: "TV Anime",
      snippet: "Studio Pierrot's definitive adaptation continues the fierce battle in the Soul King Palace with cinema-quality original battle sequences.",
    },
  ];
}

export async function searchAnime(search: string, perPage = 10): Promise<AnimeMedia[]> {
  if (!search.trim()) return [];
  const query = `
    query SearchAnime($search: String, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, search: $search, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await fetchAniList<{ Page: { media: AnimeMedia[] } }>(query, { search, perPage });
    return data.Page.media;
  } catch (err) {
    console.error("Failed to search anime:", err);
    return [];
  }
}

export async function getAnimeDetails(id: number): Promise<AnimeMedia | null> {
  const query = `
    query GetAnimeDetails($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FIELDS}
        isAdult
        meanScore
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
        favourites
        countryOfOrigin
        hashtag
        relations {
          edges {
            relationType
            node {
              id
              title {
                english
                romaji
                native
              }
              format
              status
              episodes
              seasonYear
              startDate {
                year
                month
                day
              }
              averageScore
              coverImage {
                extraLarge
                large
                medium
              }
              bannerImage
            }
          }
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
        synonyms
        rankings {
          id
          rank
          type
          allTime
          context
          season
          year
        }
        tags {
          id
          name
          description
          category
          rank
          isMediaSpoiler
        }
        staff(perPage: 8, sort: RELEVANCE) {
          edges {
            role
            node {
              id
              name {
                full
              }
              image {
                large
                medium
              }
            }
          }
        }
        recommendations(sort: RATING_DESC, perPage: 6) {
          nodes {
            rating
            mediaRecommendation {
              ${MEDIA_FIELDS}
            }
          }
        }
        streamingEpisodes {
          title
          thumbnail
          url
          site
        }
        stats {
          scoreDistribution {
            score
            amount
          }
          statusDistribution {
            status
            amount
          }
        }
        reviews(perPage: 3, sort: [RATING_DESC]) {
          nodes {
            id
            summary
            score
            rating
            ratingAmount
            user {
              name
              avatar {
                large
                medium
              }
            }
            body(asHtml: false)
          }
        }
      }
    }
  `;
  try {
    const data = await fetchAniList<{ Media: AnimeMedia }>(query, { id });
    return data.Media;
  } catch (err) {
    console.error(`Failed to fetch anime details for ID ${id}:`, err);
    return null;
  }
}

export async function getFranchiseTimeline(id: number): Promise<FranchiseData | null> {
  const query = `
    query GetFranchiseTimeline($id: Int) {
      Media(id: $id) {
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
        episodes
        duration
        season
        seasonYear
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
        averageScore
        popularity
        coverImage {
          extraLarge
          large
          medium
          color
        }
        bannerImage
        genres
        relations {
          edges {
            relationType
            node {
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
              episodes
              duration
              seasonYear
              startDate {
                year
                month
                day
              }
              averageScore
              coverImage {
                extraLarge
                large
                medium
                color
              }
              bannerImage
              relations {
                edges {
                  relationType
                  node {
                    id
                    idMal
                    title {
                      romaji
                      english
                      native
                    }
                    format
                    status
                    episodes
                    duration
                    seasonYear
                    startDate {
                      year
                      month
                      day
                    }
                    averageScore
                    coverImage {
                      extraLarge
                      large
                      medium
                    }
                    bannerImage
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await fetchAniList<{ Media: any }>(query, { id });
    if (!data?.Media) return null;

    const primary = data.Media;
    const itemsMap = new Map<number, FranchiseItem>();

    // Helper to determine canon tier
    const getTier = (format: string | null, relType: string): FranchiseItem["tier"] => {
      if (format === "MANGA" || format === "NOVEL" || relType === "ADAPTATION") {
        return "ORIGINAL_SOURCE";
      }
      if (relType === "SUMMARY") return "SUMMARY";
      if (relType === "SPIN_OFF" || relType === "ALTERNATIVE") return "SPIN_OFF";
      if (format === "MOVIE") return "CANON_MOVIE";
      if (format === "OVA" || format === "SPECIAL") return "CANON_OVA";
      return "CANON_MAIN";
    };

    // Helper to generate contextual watch tip
    const getWatchTip = (relType: string, format: string | null, isPrimary: boolean): string => {
      if (isPrimary) return "Current Anime Entry. Primary narrative foundation of this franchise.";
      if (relType === "PREQUEL") return "Prequel backstory. Explains critical events leading directly into the main story.";
      if (relType === "SEQUEL") return "Direct narrative continuation following the previous broadcast arc.";
      if (relType === "ADAPTATION" || format === "MANGA" || format === "NOVEL") {
        return "Original source material by the author with unadapted storylines and bonus canon lore.";
      }
      if (format === "MOVIE") return "Theatrical continuation. Watch before subsequent broadcast seasons.";
      if (format === "OVA" || format === "SPECIAL") return "Official side story and OVA bonus episodes.";
      if (relType === "SPIN_OFF") return "Fun alternate universe / parody comedy spin-off.";
      if (relType === "SUMMARY") return "Recap film summarizing broadcast episodes.";
      return "Connected franchise entry.";
    };

    // 1. Add Primary media item
    itemsMap.set(primary.id, {
      id: primary.id,
      title: primary.title,
      description: primary.description,
      format: primary.format,
      status: primary.status,
      episodes: primary.episodes,
      duration: primary.duration,
      seasonYear: primary.seasonYear || primary.startDate?.year,
      startDate: primary.startDate,
      averageScore: primary.averageScore,
      relationType: "PRIMARY",
      isPrimary: true,
      tier: getTier(primary.format, "PRIMARY"),
      watchTip: getWatchTip("PRIMARY", primary.format, true),
      coverImage: primary.coverImage,
      bannerImage: primary.bannerImage,
    });

    // 2. Add 1st-level relations
    const primaryTitleWords = (primary.title.english || primary.title.romaji || "")
      .toLowerCase()
      .split(/\s+/)
      .filter((w: string) => w.length > 2);

    if (primary.relations?.edges) {
      for (const edge of primary.relations.edges) {
        const n = edge.node;
        if (!itemsMap.has(n.id)) {
          itemsMap.set(n.id, {
            id: n.id,
            title: n.title,
            description: n.description,
            format: n.format,
            status: n.status,
            episodes: n.episodes,
            duration: n.duration,
            seasonYear: n.seasonYear || n.startDate?.year,
            startDate: n.startDate,
            averageScore: n.averageScore,
            relationType: edge.relationType,
            isPrimary: false,
            tier: getTier(n.format, edge.relationType),
            watchTip: getWatchTip(edge.relationType, n.format, false),
            coverImage: n.coverImage,
            bannerImage: n.bannerImage,
          });
        }

        // 3. Add 2nd-level chained relations
        if (n.relations?.edges) {
          for (const subEdge of n.relations.edges) {
            const sn = subEdge.node;
            if (!itemsMap.has(sn.id)) {
              // Exclude cross-promotional unrelated IPs (e.g., character crossovers)
              const snTitle = (sn.title.english || sn.title.romaji || "").toLowerCase();
              const isRelevant =
                subEdge.relationType !== "CHARACTER" ||
                primaryTitleWords.some((w: string) => snTitle.includes(w));

              if (isRelevant) {
                const effectiveRel =
                  edge.relationType === "SEQUEL" && subEdge.relationType === "SEQUEL"
                    ? "SEQUEL"
                    : edge.relationType === "PREQUEL" && subEdge.relationType === "PREQUEL"
                    ? "PREQUEL"
                    : subEdge.relationType;

                itemsMap.set(sn.id, {
                  id: sn.id,
                  title: sn.title,
                  format: sn.format,
                  status: sn.status,
                  episodes: sn.episodes,
                  duration: sn.duration,
                  seasonYear: sn.seasonYear || sn.startDate?.year,
                  startDate: sn.startDate,
                  averageScore: sn.averageScore,
                  relationType: effectiveRel,
                  isPrimary: false,
                  tier: getTier(sn.format, effectiveRel),
                  watchTip: getWatchTip(effectiveRel, sn.format, false),
                  coverImage: sn.coverImage,
                  bannerImage: sn.bannerImage,
                });
              }
            }
          }
        }
      }
    }

    const items = Array.from(itemsMap.values());

    // Calculate totals
    const totalEpisodes = items
      .filter((i) => i.format !== "MANGA" && i.format !== "NOVEL")
      .reduce((acc, curr) => acc + (curr.episodes || 0), 0);

    const years = items
      .map((i) => i.seasonYear || i.startDate?.year)
      .filter((y): y is number => typeof y === "number" && y > 1960);

    const earliestYear = years.length > 0 ? Math.min(...years) : null;
    const latestYear = years.length > 0 ? Math.max(...years) : null;

    return {
      primary,
      items,
      totalEpisodes,
      totalWorks: items.length,
      earliestYear,
      latestYear,
    };
  } catch (err) {
    console.error(`Failed to fetch franchise timeline for ID ${id}:`, err);
    return null;
  }
}

export async function getWeeklySchedule(): Promise<ScheduleItem[]> {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday

  // Calculate the start of the current calendar week (Sunday at 00:00:00) with a 24h timezone buffer
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDay);
  startOfWeek.setHours(0, 0, 0, 0);

  // End of current calendar week (through Saturday 23:59:59) with a 24h buffer
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);

  // Buffer by 24h in both directions to guarantee complete coverage across all local timezones (UTC, Tokyo, US, etc.)
  const start = Math.floor(startOfWeek.getTime() / 1000) - 24 * 3600;
  const end = Math.floor(endOfWeek.getTime() / 1000) + 24 * 3600;

  const query = `
    query GetWeeklySchedule($start: Int, $end: Int, $page: Int) {
      Page(page: $page, perPage: 50) {
        pageInfo {
          hasNextPage
        }
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
          id
          episode
          airingAt
          timeUntilAiring
          media {
            ${MEDIA_FIELDS}
          }
        }
      }
    }
  `;

  try {
    // In active anime seasons, a full 7-day broadcast week has 120-170 episodes.
    // Fetch pages 1, 2, 3, and 4 concurrently to capture all days from Sunday to Saturday without truncation
    const pages = [1, 2, 3, 4];
    const results = await Promise.all(
      pages.map((page) =>
        fetchAniList<{
          Page: {
            pageInfo: { hasNextPage: boolean };
            airingSchedules: ScheduleItem[];
          };
        }>(query, { start, end, page })
      )
    );

    const allSchedules: ScheduleItem[] = [];
    const seenIds = new Set<number>();

    results.forEach((res) => {
      const items = res?.Page?.airingSchedules || [];
      items.forEach((item) => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          allSchedules.push(item);
        }
      });
    });

    return allSchedules;
  } catch (err) {
    console.error("Failed to fetch weekly schedule:", err);
    return [];
  }
}

export async function getStreamingCatalog(limit = 60): Promise<AnimeMedia[]> {
  const query = `
    query GetStreamingCatalog($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: [POPULARITY_DESC, SCORE_DESC]) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  try {
    if (limit <= 50) {
      const data = await fetchAniList<{ Page: { media: AnimeMedia[] } }>(query, { page: 1, perPage: limit });
      return data.Page.media;
    }

    const [page1, page2] = await Promise.all([
      fetchAniList<{ Page: { media: AnimeMedia[] } }>(query, { page: 1, perPage: 50 }),
      fetchAniList<{ Page: { media: AnimeMedia[] } }>(query, { page: 2, perPage: Math.min(50, limit - 50) }),
    ]);

    const combined = [...(page1.Page?.media || []), ...(page2.Page?.media || [])];
    const seen = new Set<number>();
    return combined.filter((anime) => {
      if (seen.has(anime.id)) return false;
      seen.add(anime.id);
      return true;
    });
  } catch (err) {
    console.error("Failed to fetch streaming catalog:", err);
    return [];
  }
}


export async function getTopLeaderboard(
  format?: "TV" | "MOVIE",
  sort: "SCORE_DESC" | "POPULARITY_DESC" | "FAVOURITES_DESC" = "SCORE_DESC",
  limit = 100
): Promise<AnimeMedia[]> {
  const query = `
    query GetTopLeaderboard($page: Int, $format: MediaFormat, $sort: [MediaSort], $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, format: $format, sort: $sort) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  try {
    if (limit <= 50) {
      const data = await fetchAniList<{ Page: { media: AnimeMedia[] } }>(query, {
        page: 1,
        format: format || undefined,
        sort: [sort],
        perPage: limit,
      });
      return data.Page.media;
    }

    const [page1, page2] = await Promise.all([
      fetchAniList<{ Page: { media: AnimeMedia[] } }>(query, {
        page: 1,
        format: format || undefined,
        sort: [sort],
        perPage: 50,
      }),
      fetchAniList<{ Page: { media: AnimeMedia[] } }>(query, {
        page: 2,
        format: format || undefined,
        sort: [sort],
        perPage: 50,
      }),
    ]);

    return [...(page1.Page?.media || []), ...(page2.Page?.media || [])];
  } catch (err) {
    console.error("Failed to fetch top leaderboard:", err);
    return [];
  }
}

export interface PremierStudioInfo {
  id: number;
  slug: string;
  name: string;
  jpName: string;
  tagline: string;
  founded: string;
  headquarters: string;
  keyPeople: string[];
  signatureStyle: string;
  category: "action" | "vfx" | "emotion" | "classic" | "stylized";
  accentColor: string;
  bgGradient: string;
  description: string;
  flagshipWorks: string[];
  milestones: Array<{ year: string; title: string; detail: string }>;
}

export const PREMIER_STUDIOS: PremierStudioInfo[] = [
  {
    id: 569,
    slug: "mappa",
    name: "MAPPA",
    jpName: "株式会社MAPPA",
    tagline: "High-Octane Cinematic Action & Uncompromising Sakuga",
    founded: "2011",
    headquarters: "Suginami, Tokyo",
    keyPeople: ["Masao Maruyama (Founder)", "Manabu Otsuka (CEO)", "Sunghoo Park (Director)"],
    signatureStyle: "Visceral combat choreography, intense kinetic camera angles, and raw emotional tension.",
    category: "action",
    accentColor: "#ef4444",
    bgGradient: "from-red-600/25 via-rose-950/20 to-transparent",
    description:
      "Founded by legendary producer Masao Maruyama, MAPPA is celebrated globally for groundbreaking sakuga animation, ambitious multi-franchise adaptations, and setting new benchmarks for blockbuster combat choreography.",
    flagshipWorks: ["Jujutsu Kaisen", "Chainsaw Man", "Attack on Titan: Final Season", "Vinland Saga S2"],
    milestones: [
      { year: "2011", title: "Founding", detail: "Formed by Madhouse co-founder Masao Maruyama to pursue creative auteur freedom." },
      { year: "2016", title: "Global Sensation", detail: "Yuri!!! on ICE gains massive worldwide pop-culture acclaim and international awards." },
      { year: "2020", title: "Blockbuster Era", detail: "Takes the helm of Attack on Titan: Final Season and launches Jujutsu Kaisen." },
      { year: "2022", title: "Production Landmark", detail: "Fully 100% self-finances and releases the Chainsaw Man television anime." },
    ],
  },
  {
    id: 43,
    slug: "ufotable",
    name: "ufotable",
    jpName: "ユーフォーテーブル有限会社",
    tagline: "Unrivaled Digital Hybrid Compositing & Particle VFX",
    founded: "2000",
    headquarters: "Suginami, Tokyo",
    keyPeople: ["Hikaru Kondo (President)", "Haruo Sotozaki (Director)", "Yuichi Terao (Digital Chief)"],
    signatureStyle: "Seamless 3D camera tracking blended with hand-drawn blade combat and volumetric particle illumination.",
    category: "vfx",
    accentColor: "#a855f7",
    bgGradient: "from-purple-600/25 via-indigo-950/20 to-transparent",
    description:
      "Pioneers of the industry's most advanced digital hybrid compositing and internal VFX pipeline, ufotable is internationally revered for transforming Demon Slayer and Fate/stay night into theatrical masterpieces.",
    flagshipWorks: ["Demon Slayer: Kimetsu no Yaiba", "Fate/stay night: Heaven's Feel", "Fate/Zero", "Kara no Kyoukai"],
    milestones: [
      { year: "2000", title: "Studio Formation", detail: "Founded by former Telecom Animation Film production coordinator Hikaru Kondo." },
      { year: "2007", title: "The Garden of Sinners", detail: "Seven-part theatrical landmark Kara no Kyoukai establishes the Type-Moon alliance." },
      { year: "2011", title: "Fate/Zero Benchmark", detail: "Sets an unprecedented benchmark for digital effects, compositing, and television lighting." },
      { year: "2019", title: "Hinokami Phenomenon", detail: "Demon Slayer Episode 19 shatters global streaming records and launches Mugen Train." },
    ],
  },
  {
    id: 2,
    slug: "kyoto-animation",
    name: "Kyoto Animation",
    jpName: "株式会社京都アニメーション (京アニ)",
    tagline: "In-House Artistry, Human Warmth & Emotional Depth",
    founded: "1981",
    headquarters: "Uji, Kyoto",
    keyPeople: ["Yoko Hatta (Co-founder)", "Hideaki Hatta (President)", "Naoko Yamada (Director)", "Taichi Ishidate (Director)"],
    signatureStyle: "Subtle character eye and body micro-acting, warm naturalistic lighting, and peerless painterly backgrounds.",
    category: "emotion",
    accentColor: "#10b981",
    bgGradient: "from-emerald-600/25 via-teal-950/20 to-transparent",
    description:
      "Celebrated worldwide for employing 100% full-time salaried animators and training talent through their dedicated in-house KyoAni School, producing visually breathtaking and emotionally resonant works.",
    flagshipWorks: ["Violet Evergarden", "A Silent Voice", "Hyouka", "Clannad After Story"],
    milestones: [
      { year: "1981", title: "Neighborhood Roots", detail: "Founded as a finishing studio by Yoko Hatta alongside local Kyoto housewives." },
      { year: "2006", title: "Haruhi Cultural Hit", detail: "The Melancholy of Haruhi Suzumiya triggers an unprecedented global otaku wave." },
      { year: "2016", title: "A Silent Voice", detail: "Koe no Katachi receives international critical acclaim for its empathetic portrayal of redemption." },
      { year: "2018", title: "Violet Evergarden", detail: "Sets a world standard for television character draftsmanship, costume detail, and score." },
    ],
  },
  {
    id: 11,
    slug: "madhouse",
    name: "MADHOUSE",
    jpName: "株式会社マッドハウス",
    tagline: "Legendary Pioneer of Generational Anime Masterpieces",
    founded: "1972",
    headquarters: "Honcho, Nakano, Tokyo",
    keyPeople: ["Masao Maruyama (Co-founder)", "Osamu Dezaki (Director)", "Satoshi Kon (Director)", "Keiichiro Saito (Director)"],
    signatureStyle: "Cinematic psychological depth, auteur-driven dark fantasy, and generational storytelling pacing.",
    category: "classic",
    accentColor: "#06b6d4",
    bgGradient: "from-cyan-600/25 via-blue-950/20 to-transparent",
    description:
      "One of the most prolific and historically significant animation studios in world history, responsible for defining multiple golden ages of anime with visionary directors like Satoshi Kon and Yoshiaki Kawajiri.",
    flagshipWorks: ["Frieren: Beyond Journey's End", "Hunter x Hunter (2011)", "Death Note", "One Punch Man S1"],
    milestones: [
      { year: "1972", title: "Mushi Pro Roots", detail: "Founded by veteran animators leaving Osamu Tezuka's Mushi Production." },
      { year: "1997", title: "Satoshi Kon Era", detail: "Produces psychological thriller masterpiece Perfect Blue and subsequent Kon films." },
      { year: "2006", title: "Death Note Sensation", detail: "Tetsuro Araki directs Death Note into an immortal worldwide television phenomenon." },
      { year: "2023", title: "Frieren Triumph", detail: "Frieren: Beyond Journey's End climbs to the #1 ranked anime of all time on global databases." },
    ],
  },
  {
    id: 4,
    slug: "bones",
    name: "Bones",
    jpName: "株式会社ボンズ",
    tagline: "Kinetic Hand-Drawn Sakuga & Shounen Choreography",
    founded: "1998",
    headquarters: "Igusa, Suginami, Tokyo",
    keyPeople: ["Masahiko Minami (President)", "Hiroshi Osaka (Co-founder)", "Yutaka Nakamura (Legendary Key Animator)"],
    signatureStyle: "Iconic 'Yutaka Nakamura' cubic debris impacts, hand-drawn physics, and dynamic character velocity.",
    category: "action",
    accentColor: "#f97316",
    bgGradient: "from-orange-600/25 via-amber-950/20 to-transparent",
    description:
      "Founded by former Sunrise Studio 2 staff, Bones remains the gold standard for purist hand-drawn combat choreography, kinetic impact frames, and character-driven battle shounen.",
    flagshipWorks: ["Fullmetal Alchemist: Brotherhood", "Mob Psycho 100", "My Hero Academia", "Bungo Stray Dogs"],
    milestones: [
      { year: "1998", title: "Sunrise Spin-off", detail: "Established by producer Masahiko Minami after collaborating on Cowboy Bebop." },
      { year: "2009", title: "Brotherhood Legacy", detail: "Releases Fullmetal Alchemist: Brotherhood, reigning atop ratings charts for over a decade." },
      { year: "2016", title: "Mob Psycho Sakuga", detail: "Mob Psycho 100 becomes a showcase for the industry's most daring experimental animators." },
      { year: "2018", title: "MHA Theatrical Surge", detail: "My Hero Academia films dominate box offices across North America and Asia." },
    ],
  },
  {
    id: 858,
    slug: "wit-studio",
    name: "WIT STUDIO",
    jpName: "株式会社ウィットスタジオ",
    tagline: "Visceral Steampunk & Dark World-Building Direction",
    founded: "2012",
    headquarters: "Musashino, Tokyo",
    keyPeople: ["George Wada (President)", "Tetsuro Araki (Director)", "Kyoji Asano (Character Designer)"],
    signatureStyle: "High-contrast thick line art, dynamic 3D physics framing, and gritty atmospheric direction.",
    category: "action",
    accentColor: "#14b8a6",
    bgGradient: "from-teal-600/25 via-emerald-950/20 to-transparent",
    description:
      "A powerhouse spawned from Production I.G, Wit Studio captured global attention by engineering the kinetic, high-velocity aesthetic of Attack on Titan and the brutal historical realism of Vinland Saga.",
    flagshipWorks: ["Attack on Titan S1–3", "Vinland Saga Season 1", "SPY x FAMILY", "Ranking of Kings"],
    milestones: [
      { year: "2012", title: "Studio Inception", detail: "Founded by Production I.G producers George Wada and Tetsuro Araki." },
      { year: "2013", title: "Attack on Titan Shock", detail: "Titan airs worldwide, propelling anime into mainstream global pop culture." },
      { year: "2019", title: "Vinland Historical Epic", detail: "Animates Season 1 of Makoto Yukimura's viking masterpiece with breathtaking depth." },
      { year: "2022", title: "Spy x Family Collab", detail: "Teams up with CloverWorks to bring the Forger family to life in record-breaking fashion." },
    ],
  },
  {
    id: 803,
    slug: "trigger",
    name: "TRIGGER",
    jpName: "株式会社トリガー",
    tagline: "Stylized, Explosive, Hyper-Kinetic Visual Adrenaline",
    founded: "2011",
    headquarters: "Ogikubo, Suginami, Tokyo",
    keyPeople: ["Hiroyuki Imaishi (Director)", "Masahiko Otsuka (President)", "Yoh Yoshinari (Animator)", "Sushio (Designer)"],
    signatureStyle: "Rule-breaking perspective distortion, vibrant neon color palettes, and unfiltered explosive adrenaline.",
    category: "stylized",
    accentColor: "#eab308",
    bgGradient: "from-yellow-600/25 via-amber-950/20 to-transparent",
    description:
      "Founded by GAINAX veterans behind Gurren Lagann, Studio Trigger is celebrated for their unapologetically wild, highly stylized animation and kinetic visual bravado.",
    flagshipWorks: ["Cyberpunk: Edgerunners", "Kill la Kill", "Delicious in Dungeon", "Promare"],
    milestones: [
      { year: "2011", title: "Gainax Exit", detail: "Hiroyuki Imaishi and Masahiko Otsuka leave GAINAX to create their own creator-led haven." },
      { year: "2013", title: "Kill la Kill Arrival", detail: "Kill la Kill captures hearts with insane scale, transformation sequences, and wild comedy." },
      { year: "2019", title: "Promare Color Burst", detail: "First major original feature film Promare sets theaters alight with pastel neon flames." },
      { year: "2022", title: "Cyberpunk Renaissance", detail: "Cyberpunk: Edgerunners wins Anime of the Year, breathing massive new life into the CDPR game." },
    ],
  },
  {
    id: 6222,
    slug: "cloverworks",
    name: "CloverWorks",
    jpName: "株式会社CloverWorks",
    tagline: "Modern Aesthetic Polish & Expressive Character Acting",
    founded: "2018",
    headquarters: "Suginami, Tokyo",
    keyPeople: ["Akira Shimizu (President)", "Kei Fukushima (Producer)", "Noriko Takao (Director)", "Atsushi Nishigori (Director)"],
    signatureStyle: "Vibrant high-contrast modern lighting, relatable character nuances, and crisp digital line art.",
    category: "emotion",
    accentColor: "#ec4899",
    bgGradient: "from-pink-600/25 via-rose-950/20 to-transparent",
    description:
      "Emerging as an independent offshoot from A-1 Pictures, CloverWorks has quickly become the home of modern youth culture hits, delivering impeccable visual character acting and viral musical sensation Bocchi the Rock!.",
    flagshipWorks: ["Bocchi the Rock!", "SPY x FAMILY", "The Promised Neverland", "Horimiya"],
    milestones: [
      { year: "2018", title: "Rebrand to Independence", detail: "Spun off from A-1 Pictures Koenji Studio to establish a specialized boutique studio." },
      { year: "2019", title: "Neverland Suspense", detail: "The Promised Neverland Season 1 captivates viewers with relentless psychological suspense." },
      { year: "2022", title: "Bocchi the Rock! Phenomenon", detail: "Indie rock adaptation of Bocchi becomes a massive viral juggernaut, dominating charts worldwide." },
      { year: "2024", title: "Wind Breaker & Beyond", detail: "Solidifies reputation for high-impact fight choreography and youth character dramas." },
    ],
  },
  {
    id: 561,
    slug: "a1-pictures",
    name: "A-1 Pictures",
    jpName: "株式会社A-1 Pictures",
    tagline: "High-Budget Mainstream Blockbusters & Prestige Adaptations",
    founded: "2005",
    headquarters: "Suginami, Tokyo",
    keyPeople: ["Mikihiro Iwata (Founder)", "Tomonori Ochikoshi (Producer)", "Shunsuke Nakashige (Director)"],
    signatureStyle: "Sleek commercial gloss, razor-sharp digital compositing, and cinematic battle setpieces.",
    category: "action",
    accentColor: "#3b82f6",
    bgGradient: "from-blue-600/25 via-sky-950/20 to-transparent",
    description:
      "As the premier animation arm of Aniplex and Sony Music Japan, A-1 Pictures possesses immense production muscle, bringing global flagship IPs like Solo Leveling, Sword Art Online, and Kaguya-sama to screen.",
    flagshipWorks: ["Solo Leveling", "Kaguya-sama: Love Is War", "86 Eighty-Six", "Sword Art Online"],
    milestones: [
      { year: "2005", title: "Aniplex Backing", detail: "Established by Aniplex to produce high-value domestic and international anime content." },
      { year: "2012", title: "SAO VR Boom", detail: "Sword Art Online popularizes the modern virtual reality / Isekai subgenre across the globe." },
      { year: "2019", title: "Kaguya-sama Comedy", detail: "Masterclass in visual comedy, dynamic cut-ins, and famous viral rotoscoped ED dances." },
      { year: "2024", title: "Solo Leveling Peak", detail: "Adapts the Korean webtoon mega-phenomenon into an explosive worldwide streaming blockbuster." },
    ],
  },
  {
    id: 10,
    slug: "production-ig",
    name: "Production I.G",
    jpName: "株式会社プロダクション・アイジー",
    tagline: "Pioneers of Hard Sci-Fi, Cyberpunk & Sports Realism",
    founded: "1987",
    headquarters: "Musashino, Tokyo",
    keyPeople: ["Mitsuhisa Ishikawa (Founder)", "Mamoru Oshii (Director)", "Kenji Kamiyama (Director)", "Susumu Mitsunaka (Director)"],
    signatureStyle: "Grounded anatomical precision, authentic tactical choreography, and deep philosophical world-building.",
    category: "classic",
    accentColor: "#6366f1",
    bgGradient: "from-indigo-600/25 via-slate-950/20 to-transparent",
    description:
      "A monumental institution in anime history, Production I.G pioneered adult cyberpunk realism with Ghost in the Shell, revolutionized television sci-fi with Psycho-Pass, and defined the sports genre with Haikyuu!!.",
    flagshipWorks: ["Haikyuu!!", "Ghost in the Shell", "Psycho-Pass", "Kuroko's Basketball"],
    milestones: [
      { year: "1987", title: "Tatsunoko Origins", detail: "Founded by Mitsuhisa Ishikawa and Takayuki Goto after leaving legendary Tatsunoko Production." },
      { year: "1995", title: "Ghost in the Shell", detail: "Mamoru Oshii's cyberpunk opus becomes a watershed moment inspiring Hollywood's The Matrix." },
      { year: "2014", title: "Haikyuu!! Evolution", detail: "Sets the gold standard for sports anime with hyper-fluid tactical volleyball motion." },
      { year: "2024", title: "Kaiju No. 8", detail: "Co-produces blockbuster adaptation Kaiju No. 8 with Studio Khara." },
    ],
  },
];

export async function getStudioShowcase(nameOrId: string | number, perPage = 18): Promise<AnimeMedia[]> {
  const isId = typeof nameOrId === "number";
  const query = isId
    ? `
      query GetStudioShowcaseById($id: Int, $perPage: Int) {
        Studio(id: $id) {
          id
          name
          isAnimationStudio
          media(sort: POPULARITY_DESC, perPage: $perPage) {
            nodes {
              ${MEDIA_FIELDS}
            }
          }
        }
      }
    `
    : `
      query GetStudioShowcaseByName($name: String, $perPage: Int) {
        Studio(search: $name) {
          id
          name
          isAnimationStudio
          media(sort: POPULARITY_DESC, perPage: $perPage) {
            nodes {
              ${MEDIA_FIELDS}
            }
          }
        }
      }
    `;

  try {
    interface StudioResponse {
      Studio: {
        id: number;
        name: string;
        media: {
          nodes: AnimeMedia[];
        };
      };
    }
    const variables = isId ? { id: nameOrId, perPage } : { name: nameOrId, perPage };
    const data = await fetchAniList<StudioResponse>(query, variables);
    return data.Studio?.media?.nodes || [];
  } catch (err) {
    console.error(`Failed to fetch studio showcase for ${nameOrId}:`, err);
    return [];
  }
}

export async function getSeasonalArchive(
  season: "WINTER" | "SPRING" | "SUMMER" | "FALL",
  year: number,
  format?: string,
  perPage = 60
): Promise<AnimeMedia[]> {
  const query = `
    query GetSeasonalArchive($page: Int, $season: MediaSeason, $seasonYear: Int, $format: MediaFormat, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, season: $season, seasonYear: $seasonYear, format: $format, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  try {
    const variables1: Record<string, unknown> = {
      page: 1,
      season,
      seasonYear: year,
      perPage: Math.min(perPage, 50),
    };
    if (format && format !== "ALL") {
      variables1.format = format;
    }

    if (perPage <= 50) {
      const data = await fetchAniList<{ Page: { media: AnimeMedia[] } }>(query, variables1);
      return data.Page.media || [];
    }

    const variables2 = { ...variables1, page: 2, perPage: Math.min(perPage - 50, 50) };
    const [p1Res, p2Res] = await Promise.allSettled([
      fetchAniList<{ Page: { media: AnimeMedia[] } }>(query, variables1),
      fetchAniList<{ Page: { media: AnimeMedia[] } }>(query, variables2),
    ]);

    const page1 = p1Res.status === "fulfilled" ? p1Res.value?.Page?.media || [] : [];
    const page2 = p2Res.status === "fulfilled" ? p2Res.value?.Page?.media || [] : [];

    const map = new Map<number, AnimeMedia>();
    [...page1, ...page2].forEach((item) => {
      if (item?.id) map.set(item.id, item);
    });

    return Array.from(map.values()).slice(0, perPage);
  } catch (err) {
    console.error(`Failed to fetch seasonal archive for ${season} ${year}:`, err);
    return [];
  }
}

export interface BrowseFilters {
  genres?: string[];
  format?: string;
  status?: string;
  season?: string;
  year?: number;
  country?: string;
  minScore?: number;
  sort?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export async function getAdvancedBrowseAnime(
  filters: BrowseFilters = {}
): Promise<{ media: AnimeMedia[]; hasNextPage: boolean }> {
  const {
    genres,
    format,
    status,
    season,
    year,
    country,
    minScore,
    sort = "POPULARITY_DESC",
    search,
    page = 1,
    perPage = 36,
  } = filters;

  const varDefs: string[] = ["$page: Int", "$perPage: Int", "$sort: [MediaSort]"];
  const fieldArgs: string[] = ["type: ANIME", "sort: $sort"];
  const variables: Record<string, unknown> = {
    page,
    perPage,
    sort: [sort],
  };

  if (genres && genres.length > 0) {
    varDefs.push("$genres: [String]");
    fieldArgs.push("genre_in: $genres");
    variables.genres = genres;
  }
  if (format && format !== "ALL") {
    varDefs.push("$format: MediaFormat");
    fieldArgs.push("format: $format");
    variables.format = format;
  }
  if (status && status !== "ALL") {
    varDefs.push("$status: MediaStatus");
    fieldArgs.push("status: $status");
    variables.status = status;
  }
  if (season && season !== "ALL") {
    varDefs.push("$season: MediaSeason");
    fieldArgs.push("season: $season");
    variables.season = season;
  }
  if (year) {
    varDefs.push("$seasonYear: Int");
    fieldArgs.push("seasonYear: $seasonYear");
    variables.seasonYear = year;
  }
  if (country && country !== "ALL") {
    varDefs.push("$countryOfOrigin: CountryCode");
    fieldArgs.push("countryOfOrigin: $countryOfOrigin");
    variables.countryOfOrigin = country;
  }
  if (minScore && minScore > 0) {
    varDefs.push("$averageScore_greater: Int");
    fieldArgs.push("averageScore_greater: $averageScore_greater");
    variables.averageScore_greater = minScore;
  }
  if (search && search.trim()) {
    varDefs.push("$search: String");
    fieldArgs.push("search: $search");
    variables.search = search.trim();
  }

  const query = `
    query GetBrowse(${varDefs.join(", ")}) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          currentPage
        }
        media(${fieldArgs.join(", ")}) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  try {
    interface BrowseResponse {
      Page: {
        pageInfo: {
          hasNextPage: boolean;
          currentPage: number;
        };
        media: AnimeMedia[];
      };
    }

    const data = await fetchAniList<BrowseResponse>(query, variables);
    return {
      media: data.Page?.media || [],
      hasNextPage: data.Page?.pageInfo?.hasNextPage || false,
    };
  } catch (err) {
    console.error("Failed to fetch advanced browse anime:", err);
    return { media: [], hasNextPage: false };
  }
}

export async function getCharacterDetails(id: number): Promise<CharacterDetail | null> {
  const query = `
    query GetCharacterDetails($id: Int) {
      Character(id: $id) {
        id
        name {
          full
          native
          alternative
          alternativeSpoiler
        }
        image {
          large
          medium
        }
        description(asHtml: false)
        gender
        dateOfBirth {
          year
          month
          day
        }
        age
        bloodType
        favourites
        media(type: ANIME, sort: POPULARITY_DESC, perPage: 40) {
          edges {
            characterRole
            voiceActors(sort: RELEVANCE) {
              id
              name {
                full
                native
              }
              image {
                large
                medium
              }
              languageV2
            }
            node {
              ${MEDIA_FIELDS}
            }
          }
        }
      }
    }
  `;

  try {
    const data = await fetchAniList<{ Character: CharacterDetail }>(query, { id });
    return data.Character;
  } catch (err) {
    console.error(`Failed to fetch character details for ID ${id}:`, err);
    return null;
  }
}

export async function getStaffDetails(id: number): Promise<StaffDetail | null> {
  const query = `
    query GetStaffDetails($id: Int) {
      Staff(id: $id) {
        id
        name {
          full
          native
          alternative
        }
        image {
          large
          medium
        }
        description(asHtml: false)
        primaryOccupations
        gender
        dateOfBirth {
          year
          month
          day
        }
        dateOfDeath {
          year
          month
          day
        }
        age
        yearsActive
        homeTown
        favourites
        characterMedia(sort: POPULARITY_DESC, perPage: 40) {
          edges {
            characterRole
            characters {
              id
              name {
                full
                native
              }
              image {
                large
                medium
              }
            }
            node {
              ${MEDIA_FIELDS}
            }
          }
        }
        staffMedia(sort: POPULARITY_DESC, perPage: 30) {
          edges {
            staffRole
            node {
              ${MEDIA_FIELDS}
            }
          }
        }
      }
    }
  `;

  try {
    const data = await fetchAniList<{ Staff: StaffDetail }>(query, { id });
    return data.Staff;
  } catch (err) {
    console.error(`Failed to fetch staff details for ID ${id}:`, err);
    return null;
  }
}

export async function getTopCharacters(
  page = 1,
  perPage = 30,
  search?: string
): Promise<{ characters: any[]; hasNextPage: boolean }> {
  const varDefs = ["$page: Int", "$perPage: Int"];
  const fieldArgs = ["sort: FAVOURITES_DESC"];
  const variables: Record<string, unknown> = { page, perPage };

  if (search && search.trim()) {
    varDefs.push("$search: String");
    fieldArgs.push("search: $search");
    variables.search = search.trim();
  }

  const query = `
    query GetTopCharacters(${varDefs.join(", ")}) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          currentPage
        }
        characters(${fieldArgs.join(", ")}) {
          id
          name {
            full
            native
          }
          image {
            large
            medium
          }
          favourites
          media(type: ANIME, sort: POPULARITY_DESC, perPage: 1) {
            edges {
              characterRole
              voiceActors(language: JAPANESE) {
                id
                name {
                  full
                }
              }
              node {
                id
                title {
                  english
                  romaji
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    interface TopCharsResponse {
      Page: {
        pageInfo: {
          hasNextPage: boolean;
        };
        characters: any[];
      };
    }
    const data = await fetchAniList<TopCharsResponse>(query, variables);
    return {
      characters: data.Page?.characters || [],
      hasNextPage: data.Page?.pageInfo?.hasNextPage || false,
    };
  } catch (err) {
    console.error("Failed to fetch top characters:", err);
    return { characters: [], hasNextPage: false };
  }
}

export async function omniSearch(search: string): Promise<OmniSearchResult> {
  if (!search.trim()) {
    return { anime: [], characters: [], staff: [] };
  }
  const query = `
    query OmniSearch($search: String) {
      anime: Page(page: 1, perPage: 6) {
        media(type: ANIME, search: $search, sort: POPULARITY_DESC) {
          ${MEDIA_FIELDS}
        }
      }
      characters: Page(page: 1, perPage: 4) {
        characters(search: $search, sort: FAVOURITES_DESC) {
          id
          name {
            full
            native
          }
          image {
            medium
            large
          }
          favourites
        }
      }
      staff: Page(page: 1, perPage: 4) {
        staff(search: $search, sort: FAVOURITES_DESC) {
          id
          name {
            full
            native
          }
          image {
            medium
            large
          }
          primaryOccupations
          favourites
        }
      }
    }
  `;

  try {
    interface OmniResponse {
      anime: { media: AnimeMedia[] };
      characters: { characters: any[] };
      staff: { staff: any[] };
    }
    const data = await fetchAniList<OmniResponse>(query, { search });
    return {
      anime: data.anime?.media || [],
      characters: data.characters?.characters || [],
      staff: data.staff?.staff || [],
    };
  } catch (err) {
    console.error("OmniSearch failed:", err);
    return { anime: [], characters: [], staff: [] };
  }
}

export async function getTopStaff(
  page = 1,
  perPage = 30,
  search?: string
): Promise<{ staff: any[]; hasNextPage: boolean }> {
  const varDefs = ["$page: Int", "$perPage: Int"];
  const fieldArgs = ["sort: FAVOURITES_DESC"];
  const variables: Record<string, unknown> = { page, perPage };

  if (search && search.trim()) {
    varDefs.push("$search: String");
    fieldArgs.push("search: $search");
    variables.search = search.trim();
  }

  const query = `
    query GetTopStaff(${varDefs.join(", ")}) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          currentPage
        }
        staff(${fieldArgs.join(", ")}) {
          id
          name {
            full
            native
          }
          image {
            large
            medium
          }
          primaryOccupations
          favourites
          characterMedia(sort: POPULARITY_DESC, perPage: 2) {
            edges {
              characterRole
              characters {
                id
                name {
                  full
                }
                image {
                  medium
                }
              }
              node {
                id
                title {
                  english
                  romaji
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    interface TopStaffResponse {
      Page: {
        pageInfo: {
          hasNextPage: boolean;
        };
        staff: any[];
      };
    }
    const data = await fetchAniList<TopStaffResponse>(query, variables);
    return {
      staff: data.Page?.staff || [],
      hasNextPage: data.Page?.pageInfo?.hasNextPage || false,
    };
  } catch (err) {
    console.error("Failed to fetch top staff:", err);
    return { staff: [], hasNextPage: false };
  }
}

export function getRandomAnimeId(): number {
  const popularIds = [
    16498, // Attack on Titan
    113415, // Jujutsu Kaisen
    101922, // Demon Slayer
    154587, // Frieren
    1535, // Death Note
    11061, // Hunter x Hunter (2011)
    21, // One Piece
    9253, // Steins;Gate
    20605, // Tokyo Ghoul
    21459, // My Hero Academia
    101348, // Vinland Saga
    127230, // Chainsaw Man
    21507, // Mob Psycho 100
    20665, // Your lie in April
    21355, // Re:ZERO
    101921, // Kaguya-sama: Love is War
    142329, // Demon Slayer: Swordsmith Village
    136430, // Spy x Family
    140960, // Spy x Family Part 2
    99147, // Attack on Titan Season 3
    104578, // Attack on Titan Season 3 Part 2
    110277, // Attack on Titan Final Season
    146984, // AOT Final Chapters
    108465, // Mushoku Tensei
    145064, // Jujutsu Kaisen Season 2
    117193, // My Hero Academia Season 5
  ];
  const randomIndex = Math.floor(Math.random() * popularIds.length);
  return popularIds[randomIndex];
}



