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
import { getCuratedAnimeFromDb, getFeaturedSpotlightAnimeFromDb } from "@/lib/dbAnime";
import { getDataSourceSetting } from "@/lib/settings";
import HomeClientShell from "@/components/HomeClientShell";
import { AnimeMedia } from "@/lib/types";

export const revalidate = 60; // 60 seconds revalidation to pick up toggle changes quickly

export default async function HomePage() {
  const { season, year } = getCurrentSeason();
  const currentSeasonName = `${season.charAt(0) + season.slice(1).toLowerCase()} ${year}`;

  const source = await getDataSourceSetting();

  let trending, seasonal, topRated, airing, upcoming;
  let topCharsRes, topStaffRes, reviews, news;

  if (source === "db") {
    // Blazing-fast DB-First loading with graceful fallback if DB is unreachable during Docker build
    try {
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
    } catch (err) {
      console.warn("DB query failed on HomePage, falling back to AniList:", err);
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

  // Fetch custom admin-featured anime for the Homepage Hero Spotlight Carousel
  let customSpotlight: AnimeMedia[] = [];
  try {
    customSpotlight = await getFeaturedSpotlightAnimeFromDb(5);
  } catch (err) {
    console.warn("Could not load custom spotlight from DB:", err);
  }

  // Prioritize admin-curated spotlight anime, filling up to 5 slots with trending titles
  const spotlightList: AnimeMedia[] = [...customSpotlight];
  const featuredIds = new Set(customSpotlight.map((a) => a.id));

  for (const item of trending) {
    if (spotlightList.length >= 5) break;
    if (!featuredIds.has(item.id) && item.bannerImage && item.trailer?.id) {
      spotlightList.push(item);
      featuredIds.add(item.id);
    }
  }

  // Fallback if no banner/trailer matches found
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
