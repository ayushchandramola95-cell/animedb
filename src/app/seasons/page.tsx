import { Metadata } from "next";
import { getCurrentSeason, getSeasonalArchive } from "@/lib/anilist";
import SeasonsArchiveClient from "@/components/SeasonsArchiveClient";

export const revalidate = 3600; // Cache 1 hour

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; year?: string }>;
}): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const current = getCurrentSeason();
  const season = (resolvedParams.season || current.season).toUpperCase();
  const year = resolvedParams.year ? parseInt(resolvedParams.year, 10) : current.year;

  return {
    title: `${season} ${year} Anime Season • Schedule & Streaming Catalog | AnimeDB`,
    description: `Discover all anime broadcasting in the ${season} ${year} season. Filter by TV series, movies, Crunchyroll, Netflix, and official streaming platforms.`,
  };
}

export default async function SeasonsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; year?: string; format?: string }>;
}) {
  const resolvedParams = await searchParams;
  const current = getCurrentSeason();

  const season = (
    resolvedParams.season ? resolvedParams.season.toUpperCase() : current.season
  ) as "WINTER" | "SPRING" | "SUMMER" | "FALL";

  const year = resolvedParams.year ? parseInt(resolvedParams.year, 10) : current.year;
  const format = resolvedParams.format || undefined;

  const initialMedia = await getSeasonalArchive(season, year, format, 60);

  return (
    <SeasonsArchiveClient
      initialSeason={season}
      initialYear={year}
      initialMedia={initialMedia}
    />
  );
}
