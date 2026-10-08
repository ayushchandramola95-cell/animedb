import { NextRequest, NextResponse } from "next/server";
import { omniSearch } from "@/lib/anilist";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ results: [], anime: [], characters: [], staff: [] });
  }

  try {
    const data = await omniSearch(q);
    return NextResponse.json({
      ...data,
      results: data.anime, // Backward compatibility
    });
  } catch (err) {
    console.error("Search API Error:", err);
    return NextResponse.json({ error: "Search failed", results: [], anime: [], characters: [], staff: [] }, { status: 500 });
  }
}
