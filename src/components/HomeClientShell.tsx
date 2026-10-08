"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimeMedia, GlobalReviewItem, AnimeNewsItem } from "@/lib/types";
import Navbar from "./Navbar";
import HeroSpotlight from "./HeroSpotlight";
import PersonalizedWatchlistShelf from "./PersonalizedWatchlistShelf";
import AiringAndTrendingSplit from "./AiringAndTrendingSplit";
import UpcomingAnticipatedSection from "./UpcomingAnticipatedSection";
import CatalogSection from "./CatalogSection";
import WeeklyCommunityPollSection from "./WeeklyCommunityPollSection";
import CuratedCollectionsSection from "./CuratedCollectionsSection";
import ThemeMusicJukeboxSection from "./ThemeMusicJukeboxSection";
import SeiyuuAndCharactersShowcase from "./SeiyuuAndCharactersShowcase";
import StudiosShowcaseSection from "./StudiosShowcaseSection";
import CommunityReviewsSection from "./CommunityReviewsSection";
import AnimeNewsTickerSection from "./AnimeNewsTickerSection";
import InteractiveDiscoveryLaunchpad from "./InteractiveDiscoveryLaunchpad";
import CommunityPulseBanner from "./CommunityPulseBanner";
import TrailerModal from "./TrailerModal";
import Footer from "./Footer";

interface HomeClientShellProps {
  spotlightAnime: AnimeMedia | null;
  spotlightList?: AnimeMedia[];
  trendingList: AnimeMedia[];
  seasonalList: AnimeMedia[];
  topRatedList: AnimeMedia[];
  airingList: AnimeMedia[];
  upcomingList?: AnimeMedia[];
  communityReviews?: GlobalReviewItem[];
  animeNews?: AnimeNewsItem[];
  featuredCharacters?: any[];
  featuredStaff?: any[];
  currentSeasonName: string;
}

export default function HomeClientShell({
  spotlightAnime,
  spotlightList,
  trendingList,
  seasonalList,
  topRatedList,
  airingList,
  upcomingList = [],
  communityReviews = [],
  animeNews = [],
  featuredCharacters = [],
  featuredStaff = [],
  currentSeasonName,
}: HomeClientShellProps) {
  // Modal state
  const [trailerModal, setTrailerModal] = useState<{
    isOpen: boolean;
    trailerId: string | null;
    title: string;
    streamUrl?: string | null;
    streamSite?: string | null;
  }>({
    isOpen: false,
    trailerId: null,
    title: "",
    streamUrl: null,
    streamSite: null,
  });

  const handleWatchTrailer = (
    trailerId: string,
    title: string,
    streamUrl?: string | null,
    streamSite?: string | null
  ) => {
    setTrailerModal({
      isOpen: true,
      trailerId,
      title,
      streamUrl: streamUrl || null,
      streamSite: streamSite || null,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-gray-100">
      {/* 1. Global Responsive Header & Grouped Navigation */}
      <Navbar onWatchTrailer={handleWatchTrailer} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-12 sm:gap-14 pb-24 md:pb-12">
        {/* 1. Cinematic Hero Spotlight Carousel */}
        <HeroSpotlight
          anime={spotlightAnime}
          spotlightList={spotlightList}
          onWatchTrailer={handleWatchTrailer}
        />

        {/* 2. Live Airing Simulcast Schedule & Top 10 Trending Leaderboard (Split 2-Column) */}
        <div id="airing">
          <AiringAndTrendingSplit
            airingList={airingList}
            trendingList={trendingList}
            onWatchTrailer={handleWatchTrailer}
          />
        </div>

        {/* 3. Deep Catalog Matrix with Dual-View (Grid & Detailed Compact List) */}
        <div id="catalog">
          <CatalogSection
            trendingList={trendingList}
            seasonalList={seasonalList}
            topRatedList={topRatedList}
            airingList={airingList}
            currentSeasonName={currentSeasonName}
            onWatchTrailer={handleWatchTrailer}
          />
        </div>

        {/* 4. Personalized Watchlist Quick Access Shelf */}
        <PersonalizedWatchlistShelf />

        {/* 5. Most Anticipated Next Season & Upcoming Hype */}
        <UpcomingAnticipatedSection
          upcomingList={upcomingList}
          onWatchTrailer={handleWatchTrailer}
        />

        {/* 7. Weekly Community Poll: Anime of the Week */}
        <WeeklyCommunityPollSection candidates={trendingList} />

        {/* 8. Curated Thematic Taste Collections (Letterboxd-style Binge Shelves) */}
        <CuratedCollectionsSection
          onWatchTrailer={(trailerId, title) => handleWatchTrailer(trailerId, title)}
        />

        {/* 9. Viral Opening & Ending (OP/ED) Theme Music Jukebox */}
        <ThemeMusicJukeboxSection
          onPlayTheme={(youtubeId, title) => handleWatchTrailer(youtubeId, title)}
        />

        {/* 10. Iconic Characters & Legendary Japanese Voice Cast (Seiyuu) Showcase */}
        <SeiyuuAndCharactersShowcase
          characters={featuredCharacters}
          staff={featuredStaff}
        />

        {/* 11. Premier Animation Studios Directory (MAPPA, ufotable, WIT, KyoAni, Bones) */}
        <StudiosShowcaseSection />

        {/* 12. Top Community Reviews & Critiques */}
        <CommunityReviewsSection reviews={communityReviews} />

        {/* 13. Anime Industry News & Broadcast Dispatches */}
        <AnimeNewsTickerSection news={animeNews} />

        {/* 14. Interactive Platform Discovery Launchpad (Compare, Quiz, Importer, Dice) */}
        <InteractiveDiscoveryLaunchpad />

        {/* 15. Open Anime Web & Speed/Privacy Trust Banner */}
        <CommunityPulseBanner />
      </main>

      {/* 12. Universal Multi-Column Footer */}
      <Footer />

      {/* 13. Cinema Trailer Modal */}
      <TrailerModal
        isOpen={trailerModal.isOpen}
        onClose={() => setTrailerModal((prev) => ({ ...prev, isOpen: false }))}
        trailerId={trailerModal.trailerId}
        title={trailerModal.title}
        streamUrl={trailerModal.streamUrl}
        streamSite={trailerModal.streamSite}
      />
    </div>
  );
}
