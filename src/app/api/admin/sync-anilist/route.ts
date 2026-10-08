import { NextRequest, NextResponse } from "next/server";
import { getCurrentSeason } from "@/lib/anilist";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

const BULK_SYNC_QUERY = `
  query GetBulkAnime($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
        currentPage
      }
      media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: $sort) {
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
        externalLinks {
          id
          site
          url
          type
        }
      }
    }
  }
`;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "test";
    const page = Number(body.page) || 1;
    const perPage = Math.min(Number(body.perPage) || 20, 50);

    const { season, year } = getCurrentSeason();

    let variables: Record<string, unknown> = {
      page,
      perPage,
    };

    if (action === "seasonal") {
      variables = {
        ...variables,
        season,
        seasonYear: year,
        sort: ["POPULARITY_DESC"],
      };
    } else if (action === "top") {
      variables = {
        ...variables,
        sort: ["SCORE_DESC"],
      };
    } else {
      // Test action: fetch 5 trending
      variables = {
        page: 1,
        perPage: 5,
        sort: ["TRENDING_DESC"],
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
      return NextResponse.json(
        {
          success: false,
          error: `AniList API error (HTTP ${res.status}): ${errText}`,
        },
        { status: 502 }
      );
    }

    const data = await res.json();
    const mediaList = data.data?.Page?.media || [];
    const executionTimeMs = Date.now() - startTime;

    // Check if Supabase keys exist
    const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const hasSupabaseKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const isSupabaseConfigured = hasSupabaseUrl && hasSupabaseKey;

    // Calculate aggregated metrics
    let totalCharacters = 0;
    let totalVoiceActors = 0;
    let totalStreamingLinks = 0;

    mediaList.forEach((m: any) => {
      totalCharacters += m.characters?.edges?.length || 0;
      m.characters?.edges?.forEach((e: any) => {
        totalVoiceActors += e.voiceActors?.length || 0;
      });
      totalStreamingLinks +=
        m.externalLinks?.filter((l: any) => l.type === "STREAMING").length || 0;
    });

    return NextResponse.json({
      success: true,
      action,
      pageInfo: data.data?.Page?.pageInfo,
      count: mediaList.length,
      metrics: {
        totalAnime: mediaList.length,
        totalCharacters,
        totalVoiceActors,
        totalStreamingLinks,
        executionTimeMs,
        rateLimitNotice: "AniList allows up to 90 requests/min (4,500 anime/min)",
      },
      databaseStatus: isSupabaseConfigured ? "connected" : "ready_for_credentials",
      sampleItems: mediaList.slice(0, 5).map((m: any) => ({
        id: m.id,
        title: m.title.english || m.title.romaji,
        format: m.format,
        score: m.averageScore,
        studio: m.studios?.nodes?.[0]?.name || "N/A",
        charactersCount: m.characters?.edges?.length || 0,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to execute AniList sync",
      },
      { status: 500 }
    );
  }
}
