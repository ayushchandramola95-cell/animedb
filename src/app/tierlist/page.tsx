import { Metadata } from "next";
import { getTrendingAnime, getTopRatedAnime } from "@/lib/anilist";
import TierListClient from "@/components/TierListClient";

export const revalidate = 3600; // Edge ISR cache for 1 hour

export const metadata: Metadata = {
  title: "Anime Tier List Maker • S to D Tier Ranking & Image Export | AnimeDB",
  description:
    "Rank your favorite anime into S, A, B, C, D tiers. Add any anime from AniList, customize tier rows, and export your high-resolution tier list graphic to share on social media.",
  openGraph: {
    title: "Anime Tier List Maker | AnimeDB",
    description: "Rank anime from S to D tier and export your custom tier list graphic in 1 click.",
  },
};

export default async function TierListPage() {
  const [trending, topRated] = await Promise.all([
    getTrendingAnime(24),
    getTopRatedAnime(24),
  ]);

  // Combine unique candidates for default pool
  const seen = new Set<number>();
  const initialPool = [...trending, ...topRated].filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  }).slice(0, 48);

  return <TierListClient initialPool={initialPool} />;
}
