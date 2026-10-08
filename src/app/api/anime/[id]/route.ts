import { NextRequest, NextResponse } from "next/server";
import { getAnimeDetails } from "@/lib/anilist";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const animeId = parseInt(id, 10);

    if (isNaN(animeId) || animeId <= 0) {
      return NextResponse.json({ error: "Invalid anime ID" }, { status: 400 });
    }

    const anime = await getAnimeDetails(animeId);
    if (!anime) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    return NextResponse.json(anime);
  } catch (err) {
    console.error("Failed to fetch anime details:", err);
    return NextResponse.json(
      { error: "Internal server error fetching anime" },
      { status: 500 }
    );
  }
}
