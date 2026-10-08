import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAnimeDetails } from "@/lib/anilist";
import AnimeDetailClient from "@/components/AnimeDetailClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const anime = await getAnimeDetails(Number(id));

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

  const anime = await getAnimeDetails(animeId);

  if (!anime) {
    notFound();
  }

  return <AnimeDetailClient anime={anime} />;
}
