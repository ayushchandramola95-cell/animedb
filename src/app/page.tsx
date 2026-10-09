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
import { getCuratedAnimeFromDb } from "@/lib/dbAnime";
import { getDataSourceSetting } from "@/lib/settings";
import HomeClientShell from "@/components/HomeClientShell";

export const revalidate = 60; // 60 seconds revalidation to pick up toggle changes quickly

export default async function HomePage() {
  const { season, year } = getCurrentSeason();
  const currentSeasonName = `${season.charAt(0) + season.slice(1).toLowerCase()} ${year}`;

  const source = await getDataSourceSetting();

  let trending, seasonal, topRated, airing, upcoming;
  let topCharsRes, topStaffRes, reviews, news;

  if (source === "db") {
    // Blazing-fast DB-First loading
    [trending, seasonal, topRated, airing, upcoming, topCharsRes, topStaffRes, reviews, news] =
      await Promise.all([
        getCuratedAnimeFromDb("trending", 24),
        getCuratedAnimeFromDb("popular", 24),
        getCuratedAnimeFromDb("top", 24),
        getCuratedAnimeFromDb("airing", 30),
        getCuratedAnimeFromDb("upcoming", 12),
        getTopCharacters(1, 8),
        getTopStaff(1, 8),
        getGlobalRecentReviews(6),
        getAnimeNews(6),
      ]);
  } else {
    // Live AniList API proxy
    [trending, seasonal, topRated, airing, topCharsRes, topStaffRes, upcoming, reviews, news] =
      await Promise.all([
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
  }

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
