import {
  getTrendingAnime,
  getPopularThisSeason,
  getTopRatedAnime,
  getAiringToday,
  getCurrentSeason,
  getTopCharacters,
  getTopStaff,
  getUpcomingAnticipated,
  getGlobalRecentReviews,
  getAnimeNews,
} from "@/lib/anilist";
import HomeClientShell from "@/components/HomeClientShell";

export const revalidate = 3600; // Edge ISR cache for 1 hour

export default async function HomePage() {
  const { season, year } = getCurrentSeason();
  const currentSeasonName = `${season.charAt(0) + season.slice(1).toLowerCase()} ${year}`;

  const [
    trending,
    seasonal,
    topRated,
    airing,
    topCharsRes,
    topStaffRes,
    upcoming,
    reviews,
    news,
  ] = await Promise.all([
    getTrendingAnime(24),
    getPopularThisSeason(24),
    getTopRatedAnime(24),
    getAiringToday(30),
    getTopCharacters(1, 8),
    getTopStaff(1, 8),
    getUpcomingAnticipated(12),
    getGlobalRecentReviews(6),
    getAnimeNews(6),
  ]);

  // Pick top 5 spotlight anime with high-res banner and trailer
  const spotlightList = trending
    .filter((a) => a.bannerImage && a.trailer?.id)
    .slice(0, 5);

  if (spotlightList.length === 0 && trending.length > 0) {
    spotlightList.push(trending[0]);
  }

  const spotlightAnime = spotlightList[0] || null;

  return (
    <HomeClientShell
      spotlightAnime={spotlightAnime}
      spotlightList={spotlightList}
      trendingList={trending}
      seasonalList={seasonal}
      topRatedList={topRated}
      airingList={airing}
      upcomingList={upcoming}
      communityReviews={reviews}
      animeNews={news}
      featuredCharacters={topCharsRes?.characters || []}
      featuredStaff={topStaffRes?.staff || []}
      currentSeasonName={currentSeasonName}
    />
  );
}
