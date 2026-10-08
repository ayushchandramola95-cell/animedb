"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Flame,
  Calendar,
  Star,
  Clock,
  Filter,
  LayoutGrid,
  List,
  Play,
  Tv,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { AnimeMedia, CatalogTab } from "@/lib/types";
import AnimeCard from "./AnimeCard";
import StreamingFilter, { StreamFilterPlatform } from "./StreamingFilter";
import WatchlistButton from "./WatchlistButton";

interface CatalogSectionProps {
  trendingList: AnimeMedia[];
  seasonalList: AnimeMedia[];
  topRatedList: AnimeMedia[];
  airingList: AnimeMedia[];
  currentSeasonName: string;
  onWatchTrailer: (trailerId: string, title: string, streamUrl?: string, streamSite?: string) => void;
}

export default function CatalogSection({
  trendingList,
  seasonalList,
  topRatedList,
  airingList,
  currentSeasonName,
  onWatchTrailer,
}: CatalogSectionProps) {
  const [activeTab, setActiveTab] = useState<CatalogTab>("trending");
  const [platformFilter, setPlatformFilter] = useState<StreamFilterPlatform>("ALL");
  const [selectedGenre, setSelectedGenre] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get active list based on tab
  const rawList = useMemo(() => {
    switch (activeTab) {
      case "seasonal":
        return seasonalList;
      case "top":
        return topRatedList;
      case "airing":
        return airingList;
      case "trending":
      default:
        return trendingList;
    }
  }, [activeTab, trendingList, seasonalList, topRatedList, airingList]);

  // Extract all unique genres from current tab list
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    rawList.forEach((a) => a.genres?.forEach((g) => set.add(g)));
    return Array.from(set).slice(0, 10);
  }, [rawList]);

  // Filter list by selected streaming platform & genre
  const filteredList = useMemo(() => {
    return rawList.filter((anime) => {
      // Platform filter
      if (platformFilter !== "ALL") {
        const hasPlatform = anime.externalLinks?.some(
          (link) => link.site.toLowerCase().includes(platformFilter.toLowerCase())
        );
        if (!hasPlatform) return false;
      }

      // Genre filter
      if (selectedGenre !== "ALL") {
        if (!anime.genres?.includes(selectedGenre)) return false;
      }

      return true;
    });
  }, [rawList, platformFilter, selectedGenre]);

  return (
    <section className="flex flex-col gap-5">
      {/* Category Tabs & View Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#202638] pb-4">
        {/* Tab Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => {
              setActiveTab("trending");
              setSelectedGenre("ALL");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border flex-shrink-0 ${
              activeTab === "trending"
                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/25"
                : "bg-[#131624] border-[#22283a] text-gray-400 hover:text-white hover:bg-[#181d2e]"
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Trending Now</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("seasonal");
              setSelectedGenre("ALL");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border flex-shrink-0 ${
              activeTab === "seasonal"
                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/25"
                : "bg-[#131624] border-[#22283a] text-gray-400 hover:text-white hover:bg-[#181d2e]"
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>{currentSeasonName} Releases</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("top");
              setSelectedGenre("ALL");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border flex-shrink-0 ${
              activeTab === "top"
                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/25"
                : "bg-[#131624] border-[#22283a] text-gray-400 hover:text-white hover:bg-[#181d2e]"
            }`}
          >
            <Star className="w-4 h-4 text-amber-400" />
            <span>All-Time Top Rated</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("airing");
              setSelectedGenre("ALL");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border flex-shrink-0 ${
              activeTab === "airing"
                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/25"
                : "bg-[#131624] border-[#22283a] text-gray-400 hover:text-white hover:bg-[#181d2e]"
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Airing Schedule</span>
          </button>
        </div>

        {/* Right side: Count & View Switcher */}
        <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto">
          <span className="text-xs text-gray-400">
            Showing <strong className="text-white font-bold">{filteredList.length}</strong> of {rawList.length} titles
          </span>

          <div className="flex items-center p-1 rounded-xl bg-[#131624] border border-[#22283a]">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Compact Detailed List View"
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Streaming Filter Bar (Crunchyroll, Netflix, Hulu, Prime Video) */}
      <StreamingFilter
        selectedPlatform={platformFilter}
        onSelectPlatform={setPlatformFilter}
      />

      {/* Genre Filter Pills */}
      {availableGenres.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400 mr-1 flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Genre:</span>
          </span>

          <button
            onClick={() => setSelectedGenre("ALL")}
            className={`text-xs px-3 py-1 rounded-lg transition-all border font-bold ${
              selectedGenre === "ALL"
                ? "bg-white text-gray-900 border-white shadow-xs"
                : "bg-[#131624] text-gray-400 border-[#22283a] hover:text-white hover:bg-[#181d2e]"
            }`}
          >
            All
          </button>

          {availableGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`text-xs px-3 py-1 rounded-lg transition-all border font-medium ${
                selectedGenre === genre
                  ? "bg-blue-600 text-white border-blue-500 font-bold shadow-xs"
                  : "bg-[#131624] text-gray-400 border-[#22283a] hover:text-white hover:bg-[#181d2e]"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Content Rendering: Grid Mode vs Compact List Mode */}
      {filteredList.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredList.map((anime) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                onWatchTrailer={onWatchTrailer}
              />
            ))}
          </div>
        ) : (
          /* High-Density Detailed List View */
          <div className="flex flex-col rounded-2xl border border-[#21273a] bg-[#111422] overflow-hidden shadow-lg divide-y divide-[#1b2132]">
            {filteredList.map((anime, idx) => {
              const title = anime.title.english || anime.title.romaji;
              const studio = anime.studios?.nodes?.[0]?.name;
              const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
              const stream = anime.externalLinks?.find(
                (l) => l.type === "STREAMING" || ["Crunchyroll", "Netflix", "Hulu"].includes(l.site)
              );

              return (
                <div
                  key={anime.id}
                  className="p-3.5 sm:p-4 hover:bg-[#151928] transition-colors flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Rank index */}
                    <span className="w-7 text-center text-xs font-mono font-bold text-gray-500 flex-shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Thumbnail */}
                    <Link
                      href={`/anime/${anime.id}`}
                      className="relative w-12 sm:w-14 h-16 sm:h-20 rounded-xl overflow-hidden bg-[#181d2c] flex-shrink-0 border border-[#262d42]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={anime.coverImage.extraLarge || anime.coverImage.large || anime.coverImage.medium}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Metadata */}
                    <div className="flex flex-col min-w-0">
                      <Link href={`/anime/${anime.id}`}>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                          {title}
                        </h4>
                      </Link>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400 mt-1">
                        {studio && <span className="text-gray-300 font-semibold">{studio}</span>}
                        {studio && <span>•</span>}
                        <span>{anime.format?.replace("_", " ") || "TV"}</span>
                        {anime.episodes && (
                          <>
                            <span>•</span>
                            <span>{anime.episodes} eps</span>
                          </>
                        )}
                        {anime.seasonYear && (
                          <>
                            <span>•</span>
                            <span>{anime.seasonYear}</span>
                          </>
                        )}
                      </div>

                      {/* Genre Tags */}
                      <div className="hidden sm:flex flex-wrap gap-1 mt-1.5">
                        {anime.genres?.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="text-[10px] text-gray-400 px-1.5 py-0.5 rounded bg-[#181d2c] border border-[#252c3f]"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Score & Action buttons */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                    {score && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#161a29] border border-[#272f44] text-xs font-black text-amber-400 shadow-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{score}</span>
                      </div>
                    )}

                    {stream && (
                      <a
                        href={stream.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden md:flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20"
                        title={`Stream on ${stream.site}`}
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>{stream.site}</span>
                      </a>
                    )}

                    {anime.trailer?.id && (
                      <button
                        onClick={() =>
                          onWatchTrailer(anime.trailer!.id, title, stream?.url, stream?.site)
                        }
                        className="p-2 rounded-xl bg-[#161a29] hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 border border-[#272f44] transition-colors"
                        title="Watch Official Trailer"
                      >
                        <Play className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      </button>
                    )}

                    <WatchlistButton anime={anime} size="sm" />

                    <Link
                      href={`/anime/${anime.id}`}
                      className="hidden sm:flex p-2 rounded-xl bg-[#161a29] hover:bg-[#20273a] text-gray-400 hover:text-white border border-[#272f44] transition-colors"
                      title="View Details & Streaming Guide"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="py-16 text-center rounded-2xl bg-[#121522] border border-[#21273a] flex flex-col items-center justify-center p-6 shadow-md">
          <p className="text-gray-200 font-bold text-sm mb-1">
            No anime found for this filter combination.
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Try switching the streaming platform or resetting the genre filter.
          </p>
          <button
            onClick={() => {
              setPlatformFilter("ALL");
              setSelectedGenre("ALL");
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </section>
  );
}
