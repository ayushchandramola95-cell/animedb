import { NextRequest, NextResponse } from "next/server";
import { getSeasonalArchive } from "@/lib/anilist";

export const revalidate = 3600; // Cache 1 hour

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const season = (searchParams.get("season") || "SPRING").toUpperCase() as
    | "WINTER"
    | "SPRING"
    | "SUMMER"
    | "FALL";
  const year = parseInt(searchParams.get("year") || "2025", 10);
  const format = searchParams.get("format") || undefined;
  const perPage = parseInt(searchParams.get("perPage") || "60", 10);

  try {
    const list = await getSeasonalArchive(season, year, format, perPage);
    return NextResponse.json({
      season,
      year,
      count: list.length,
      media: list,
    });
  } catch (error) {
    console.error("API Seasons Error:", error);
    return NextResponse.json({ error: "Failed to fetch seasonal catalog" }, { status: 500 });
  }
}
