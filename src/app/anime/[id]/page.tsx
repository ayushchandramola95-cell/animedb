import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAnimeDetails } from "@/lib/anilist";
import { getAnimeDetailsFromDb } from "@/lib/dbAnime";
import { getDataSourceSetting } from "@/lib/settings";
import AnimeDetailClient from "@/components/AnimeDetailClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function resolveAnime(id: number) {
  const source = await getDataSourceSetting();
  if (source === "db") {
    const dbAnime = await getAnimeDetailsFromDb(id);
    if (dbAnime) return dbAnime;
  }
  return getAnimeDetails(id);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const animeId = Number(id);
  if (isNaN(animeId)) return { title: "Anime Not Found - AnimeDB" };

  const anime = await resolveAnime(animeId);

  if (!anime) {
    return {
      title: "Anime Not Found - AnimeDB",
    };
  }

  const title = anime.title.english || anime.title.romaji;
  const desc = anime.description
    ? anime.description.replace(/<[^>]*>?/gm, "").slice(0, 160) + "..."
    : `Find official streaming sources, trailers, and voice actors for ${title}.`;

  return {
    title: `${title} - Where to Watch & Anime Guide | AnimeDB`,
    description: desc,
    openGraph: {
      title: `${title} - AnimeDB`,
      description: desc,
      images: anime.coverImage.extraLarge ? [anime.coverImage.extraLarge] : [],
    },
  };
}

export default async function AnimePage({ params }: PageProps) {
  const { id } = await params;
  const animeId = Number(id);

  if (isNaN(animeId)) {
    notFound();
  }

  const anime = await resolveAnime(animeId);

  if (!anime) {
    notFound();
  }

  return <AnimeDetailClient anime={anime} />;
}

