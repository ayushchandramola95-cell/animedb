import { Metadata } from "next";
import { getAnimeDetails } from "@/lib/anilist";
import AnimeCompareClient from "@/components/AnimeCompareClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Head-to-Head Anime Comparison Engine | AnimeDB",
  description:
    "Compare anime ratings, global popularity, studios, release schedules, and shared Japanese voice actors (Seiyuu) side-by-side.",
};

interface ComparePageProps {
  searchParams: Promise<{
    a?: string;
    b?: string;
  }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { a, b } = await searchParams;
  const idA = a ? parseInt(a, 10) : 16498; // Default Attack on Titan
  const idB = b ? parseInt(b, 10) : 101922; // Default Demon Slayer

  const [animeA, animeB] = await Promise.all([
    idA ? getAnimeDetails(idA).catch(() => null) : null,
    idB ? getAnimeDetails(idB).catch(() => null) : null,
  ]);

  return <AnimeCompareClient initialAnimeA={animeA} initialAnimeB={animeB} />;
}
