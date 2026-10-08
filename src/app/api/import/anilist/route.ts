import { NextRequest, NextResponse } from "next/server";
import { fetchAniList } from "@/lib/anilist";
import { AnimeMedia } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username || !username.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const query = `
      query GetUserLists($userName: String) {
        MediaListCollection(userName: $userName, type: ANIME) {
          lists {
            name
            status
            entries {
              status
              media {
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
                season
                seasonYear
                averageScore
                popularity
                coverImage {
                  large
                  medium
                }
                genres
              }
            }
          }
        }
      }
    `;

    interface MediaListEntry {
      status: string;
      media: AnimeMedia;
    }

    interface MediaListCollectionResponse {
      MediaListCollection: {
        lists: Array<{
          name: string;
          status: string;
          entries: MediaListEntry[];
        }>;
      };
    }

    const data = await fetchAniList<MediaListCollectionResponse>(query, {
      userName: username.trim(),
    });

    const entries = data.MediaListCollection?.lists?.flatMap((l) => l.entries) || [];

    // Map AniList statuses to AnimeDB statuses
    const mapped = entries.map((e) => {
      let status: "WATCHING" | "PLAN_TO_WATCH" | "COMPLETED" | "DROPPED" = "PLAN_TO_WATCH";
      if (e.status === "CURRENT") status = "WATCHING";
      else if (e.status === "COMPLETED") status = "COMPLETED";
      else if (e.status === "DROPPED") status = "DROPPED";
      else if (e.status === "PLANNING" || e.status === "PAUSED") status = "PLAN_TO_WATCH";

      return {
        anime: e.media,
        status,
        updatedAt: Date.now(),
      };
    });

    return NextResponse.json({
      success: true,
      username,
      total: mapped.length,
      items: mapped,
    });
  } catch (err: any) {
    console.error("AniList import failed:", err);
    return NextResponse.json(
      { error: "Could not find or import from that AniList username. Please make sure the profile is public." },
      { status: 500 }
    );
  }
}
