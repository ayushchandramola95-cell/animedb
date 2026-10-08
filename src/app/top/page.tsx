import { Metadata } from "next";
import { getTopLeaderboard } from "@/lib/anilist";
import TopLeaderboardClient from "@/components/TopLeaderboardClient";

export const revalidate = 86400; // Edge ISR cache for 24 hours

export const metadata: Metadata = {
  title: "Top 100 Highest Rated Anime of All Time - Community Leaderboard | AnimeDB",
  description:
    "Explore the top 100 highest rated anime series and movies of all time according to global community scores, with official legal streaming availability and trailers.",
};

export default async function TopPage() {
  const [allTop, topTV, topMovies, topPopular] = await Promise.all([
    getTopLeaderboard(undefined, "SCORE_DESC", 100),
    getTopLeaderboard("TV", "SCORE_DESC", 100),
    getTopLeaderboard("MOVIE", "SCORE_DESC", 100),
    getTopLeaderboard(undefined, "POPULARITY_DESC", 100),
  ]);

  return (
    <TopLeaderboardClient
      initialAllTop={allTop}
      topTV={topTV}
      topMovies={topMovies}
      topPopular={topPopular}
    />
  );
}
