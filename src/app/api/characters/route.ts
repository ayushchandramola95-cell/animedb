import { NextRequest, NextResponse } from "next/server";
import { getTopCharacters } from "@/lib/anilist";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const perPage = parseInt(searchParams.get("perPage") || "30", 10);
  const search = searchParams.get("search") || undefined;

  try {
    const data = await getTopCharacters(page, perPage, search);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Characters API Error:", err);
    return NextResponse.json({ error: "Failed to fetch characters", characters: [], hasNextPage: false }, { status: 500 });
  }
}
