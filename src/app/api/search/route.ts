import { NextRequest, NextResponse } from "next/server";
import { omniSearch } from "@/lib/anilist";
import { omniSearchFromDb } from "@/lib/dbAnime";
import { getDataSourceSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ results: [], anime: [], characters: [], staff: [] });
  }

  try {
    const source = await getDataSourceSetting();
    let data;

    if (source === "db") {
      data = await omniSearchFromDb(q);
      // If DB has 0 results for a rare query, fallback to AniList
      if (!data.anime || data.anime.length === 0) {
        data = await omniSearch(q);
      }
    } else {
      data = await omniSearch(q);
    }

    return NextResponse.json({
      ...data,
      results: data.anime, // Backward compatibility
    });
  } catch (err) {
    console.error("Search API Error:", err);
    return NextResponse.json({ error: "Search failed", results: [], anime: [], characters: [], staff: [] }, { status: 500 });
  }
}

