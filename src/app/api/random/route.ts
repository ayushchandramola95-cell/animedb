import { NextResponse } from "next/server";
import { getRandomAnimeId } from "@/lib/anilist";

export async function GET() {
  const id = getRandomAnimeId();
  return NextResponse.json({ id, url: `/anime/${id}` });
}
