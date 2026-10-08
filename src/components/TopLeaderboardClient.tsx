"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Crown,
  Star,
  Play,
  ExternalLink,
  Search,
  Filter,
  Film,
  Tv,
  Flame,
  LayoutList,
  LayoutGrid,
  AlignJustify,
  Dice5,
  Share2,
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import Navbar from "./Navbar";
import AnimeCard from "./AnimeCard";
import WatchlistButton from "./WatchlistButton";
import TrailerModal from "./TrailerModal";
import Footer from "./Footer";

type TopCategory = "ALL" | "TV" | "MOVIE" | "POPULAR";

interface TopLeaderboardClientProps {
  initialAllTop: AnimeMedia[];
  topTV: AnimeMedia[];
  topMovies: AnimeMedia[];
  topPopular: AnimeMedia[];
}

export default function TopLeaderboardClient({
  initialAllTop,
  topTV,
  topMovies,
  topPopular,
}: TopLeaderboardClientProps) {
  const [activeCategory, setActiveCategory] = useState<TopCategory>("ALL");
  const [viewMode, setViewMode] = useState<"list" | "grid" | "compact">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("ALL");
  const [selectedEra, setSelectedEra] = useState<string>("ALL");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("ALL");
  const [rankRange, setRankRange] = useState<string>("ALL");
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Trailer modal state
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

  // Pick list based on active category
  const rawList = useMemo(() => {
    switch (activeCategory) {
      case "TV":
        return topTV;
      case "MOVIE":
        return topMovies;
      case "POPULAR":
        return topPopular;
      case "ALL":
      default:
        return initialAllTop;
    }
  }, [activeCategory, initialAllTop, topTV, topMovies, topPopular]);

  // Extract top genres from rawList
  const availableGenres = useMemo(() => {
    const counts = new Map<string, number>();
    rawList.forEach((a) => {
      a.genres?.forEach((g) => {
        counts.set(g, (counts.get(g) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([g]) => g);
  }, [rawList]);

  // Filter list by search, genre, era, platform, and rank range
  const filteredListWithRanks = useMemo(() => {
    // Attach absolute rank (1-indexed based on rawList order)
    const listWithRank = rawList.map((anime, idx) => ({
      anime,
      rank: idx + 1,
    }));

    return listWithRank.filter(({ anime, rank }) => {
      // Rank range filter
      if (rankRange === "TOP_25" && rank > 25) return false;
      if (rankRange === "26_50" && (rank <= 25 || rank > 50)) return false;
      if (rankRange === "51_75" && (rank <= 50 || rank > 75)) return false;
      if (rankRange === "76_100" && rank <= 75) return false;

      // Genre filter
      if (selectedGenre !== "ALL" && !anime.genres?.includes(selectedGenre)) {
        return false;
      }

      // Era filter
      if (selectedEra !== "ALL") {
        const year = anime.seasonYear || anime.startDate?.year || 0;
        if (selectedEra === "2020s" && year < 2020) return false;
        if (selectedEra === "2010s" && (year < 2010 || year > 2019)) return false;
        if (selectedEra === "2000s" && (year < 2000 || year > 2009)) return false;
        if (selectedEra === "RETRO" && year >= 2000) return false;
      }

      // Streaming Platform filter
      if (selectedPlatform !== "ALL") {
        const hasPlatform = anime.externalLinks?.some((l) =>
          l.site.toLowerCase().includes(selectedPlatform.toLowerCase())
        );
        if (!hasPlatform) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          anime.title.english?.toLowerCase().includes(q) ||
          anime.title.romaji.toLowerCase().includes(q) ||
          anime.studios?.nodes?.some((s) => s.name.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [rawList, selectedGenre, selectedEra, selectedPlatform, rankRange, searchQuery]);

  // Leaderboard Statistics
  const stats = useMemo(() => {
    if (rawList.length === 0) return null;
    const topScore = rawList[0]?.averageScore
      ? (rawList[0].averageScore / 10).toFixed(1)
      : "9.1";

    const studioCounts = new Map<string, number>();
    rawList.forEach((a) => {
      const s = a.studios?.nodes?.[0]?.name;
      if (s) studioCounts.set(s, (studioCounts.get(s) || 0) + 1);
    });
    const topStudio = Array.from(studioCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      highestScore: topScore,
      topStudioName: topStudio ? topStudio[0] : "Various",
      topStudioCount: topStudio ? topStudio[1] : 0,
      totalRanked: rawList.length,
    };
  }, [rawList]);

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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleRandomPick = () => {
    if (filteredListWithRanks.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredListWithRanks.length);
    const chosen = filteredListWithRanks[randomIndex].anime;
    const stream = chosen.externalLinks?.find(
      (l) => l.type === "STREAMING" || ["Crunchyroll", "Netflix", "Hulu"].includes(l.site)
    );
    if (chosen.trailer?.id) {
      handleWatchTrailer(
        chosen.trailer.id,
        chosen.title.english || chosen.title.romaji,
        stream?.url,
        stream?.site
      );
    } else {
      window.location.href = `/anime/${chosen.id}`;
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedGenre("ALL");
    setSelectedEra("ALL");
    setSelectedPlatform("ALL");
    setRankRange("ALL");
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedGenre !== "ALL" ||
    selectedEra !== "ALL" ||
    selectedPlatform !== "ALL" ||
    rankRange !== "ALL";

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-gray-100 selection:bg-blue-600/30 selection:text-white">
      <Navbar onWatchTrailer={handleWatchTrailer} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Header Hero Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-200">Leaderboard</span>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold mb-2 shadow-sm">
              <Trophy className="w-3.5 h-3.5" />
              <span>Official Anime Leaderboard • 100 Ranked</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Top 100 Highest Rated Anime of All Time
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-3xl">
              Ranked by verified global community ratings. Flat, uncluttered tables with direct official streaming links, trailer previews, and studio records.
            </p>
          </div>
        </div>

        {/* Category Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none border-b border-[#202533] pb-4">
          <button
            type="button"
            onClick={() => {
              setActiveCategory("ALL");
              setSelectedGenre("ALL");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border select-none ${
              activeCategory === "ALL"
                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-950/40"
                : "bg-[#141724] border-[#222736] text-gray-400 hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>All-Time Top Rated</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white font-mono">
              100
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory("TV");
              setSelectedGenre("ALL");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border select-none ${
              activeCategory === "TV"
                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-950/40"
                : "bg-[#141724] border-[#222736] text-gray-400 hover:text-white"
            }`}
          >
            <Tv className="w-4 h-4 text-blue-400" />
            <span>Top TV Series</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white font-mono">
              100
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory("MOVIE");
              setSelectedGenre("ALL");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border select-none ${
              activeCategory === "MOVIE"
                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-950/40"
                : "bg-[#141724] border-[#222736] text-gray-400 hover:text-white"
            }`}
          >
            <Film className="w-4 h-4 text-emerald-400" />
            <span>Top Feature Films</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white font-mono">
              100
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory("POPULAR");
              setSelectedGenre("ALL");
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border select-none ${
              activeCategory === "POPULAR"
                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-950/40"
                : "bg-[#141724] border-[#222736] text-gray-400 hover:text-white"
            }`}
          >
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Most Popular</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white font-mono">
              100
            </span>
          </button>
        </div>

        {/* Unified Toolbar: Search, Selectors, View Modes & Quick Tools */}
        <section className="rounded-2xl bg-[#121522] border border-[#21273a] p-4 sm:p-5 flex flex-col gap-4 shadow-md">
          {/* Row 1: Search, Dropdowns, and View Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="relative lg:col-span-4">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search within leaderboard (title, studio)..."
                className="w-full bg-[#161a28] text-xs text-white placeholder-gray-500 pl-10 pr-8 py-2.5 rounded-xl border border-[#262c3e] focus:border-blue-500 outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Rank Range Filter */}
            <div className="lg:col-span-2">
              <select
                value={rankRange}
                onChange={(e) => setRankRange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#161a28] text-gray-200 border border-[#262c3e] focus:border-blue-500 outline-none cursor-pointer"
              >
                <option value="ALL">All Ranks (#1 - #100)</option>
                <option value="TOP_25">Top 25 (#1 - #25)</option>
                <option value="26_50">Tier 2 (#26 - #50)</option>
                <option value="51_75">Tier 3 (#51 - #75)</option>
                <option value="76_100">Tier 4 (#76 - #100)</option>
              </select>
            </div>

            {/* Era Filter */}
            <div className="lg:col-span-2">
              <select
                value={selectedEra}
                onChange={(e) => setSelectedEra(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#161a28] text-gray-200 border border-[#262c3e] focus:border-blue-500 outline-none cursor-pointer"
              >
                <option value="ALL">All Release Eras</option>
                <option value="2020s">2020s (Modern)</option>
                <option value="2010s">2010s (Golden Era)</option>
                <option value="2000s">2000s (Classics)</option>
                <option value="RETRO">Pre-2000s (Retro)</option>
              </select>
            </div>

            {/* Platform Filter */}
            <div className="lg:col-span-2">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#161a28] text-gray-200 border border-[#262c3e] focus:border-blue-500 outline-none cursor-pointer"
              >
                <option value="ALL">All Platforms</option>
                <option value="Crunchyroll">Crunchyroll</option>
                <option value="Netflix">Netflix</option>
                <option value="Hulu">Hulu</option>
                <option value="Amazon">Prime Video</option>
              </select>
            </div>

            {/* Right: View Switcher & Tool Buttons */}
            <div className="lg:col-span-2 flex items-center justify-end gap-1.5 flex-wrap">
              {/* View Switcher: List | Grid | Compact */}
              <div className="flex items-center gap-0.5 p-1 rounded-xl bg-[#161a28] border border-[#262c3e]">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Ranked List View"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Poster Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("compact")}
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === "compact"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Compact Table View"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>
              </div>

              {/* Random Masterpiece Button */}
              <button
                type="button"
                onClick={handleRandomPick}
                className="p-2 rounded-xl bg-[#161a28] hover:bg-[#1f2438] text-purple-400 hover:text-white border border-[#262c3e] transition-colors"
                title="Random Masterpiece"
              >
                <Dice5 className="w-4 h-4" />
              </button>

              {/* Share Link Button */}
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-xl bg-[#161a28] hover:bg-[#1f2438] text-blue-400 hover:text-white border border-[#262c3e] transition-colors"
                title="Share Leaderboard Link"
              >
                {copiedShare ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Genre Pills */}
          {availableGenres.length > 0 && (
            <div className="pt-3 border-t border-[#1c2233] flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                  <Filter className="w-3 h-3 text-blue-400" /> Genre:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGenre("ALL")}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    selectedGenre === "ALL"
                      ? "bg-blue-600 text-white border-blue-500 font-semibold shadow-sm"
                      : "bg-[#161a28] text-gray-400 border-[#262c3e] hover:text-white"
                  }`}
                >
                  All
                </button>
                {availableGenres.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGenre(g)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      selectedGenre === g
                        ? "bg-blue-600 text-white border-blue-500 font-semibold shadow-sm"
                        : "bg-[#161a28] text-gray-400 border-[#262c3e] hover:text-white"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* Results Counter & Stats Bar */}
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span>
            Showing <strong className="text-white text-sm">{filteredListWithRanks.length}</strong> of{" "}
            {rawList.length} ranked masterpieces
          </span>
          {stats && (
            <div className="hidden sm:flex items-center gap-3 text-gray-400">
              <span>
                Highest Score: <strong className="text-amber-400">{stats.highestScore}</strong>
              </span>
              <span>•</span>
              <span>
                Leading Studio: <strong className="text-white">{stats.topStudioName}</strong> ({stats.topStudioCount} titles)
              </span>
            </div>
          )}
        </div>

        {/* Content View Modes */}
        {filteredListWithRanks.length > 0 ? (
          /* 1. ENHANCED RANKED LIST TABLE */
          viewMode === "list" ? (
            <div className="flex flex-col gap-2.5">
              {filteredListWithRanks.map(({ anime, rank }) => {
                const title = anime.title.english || anime.title.romaji;
                const secondaryTitle = anime.title.english ? anime.title.romaji : anime.title.native;
                const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
                const studio = anime.studios?.nodes?.[0]?.name;
                const streamLinks =
                  anime.externalLinks?.filter(
                    (l) =>
                      l.type === "STREAMING" ||
                      ["Crunchyroll", "Netflix", "Hulu", "Amazon Prime Video", "Bilibili TV"].includes(l.site)
                  ) || [];
                const primaryStream = streamLinks[0];
                const cleanSynopsis = anime.description
                  ? anime.description.replace(/<[^>]*>?/gm, "").slice(0, 140) + "..."
                  : null;

                const isTop1 = rank === 1;
                const isTop2 = rank === 2;
                const isTop3 = rank === 3;

                return (
                  <div
                    key={anime.id}
                    className={`p-3.5 sm:p-4 rounded-2xl bg-[#121522] border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:shadow-xl ${
                      isTop1
                        ? "border-amber-500/40 hover:border-amber-400 bg-gradient-to-r from-amber-950/20 via-[#121522] to-[#121522]"
                        : isTop2
                        ? "border-slate-400/40 hover:border-slate-300"
                        : isTop3
                        ? "border-amber-700/40 hover:border-amber-600"
                        : "border-[#21273a] hover:border-[#323d58] hover:bg-[#151928]"
                    }`}
                  >
                    {/* Left: Rank Badge + Poster + Info */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      {/* Rank Badge */}
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 border shadow-md select-none ${
                          isTop1
                            ? "bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-amber-950/40"
                            : isTop2
                            ? "bg-slate-300/25 text-slate-200 border-slate-300/50"
                            : isTop3
                            ? "bg-amber-700/25 text-amber-300 border-amber-700/50"
                            : "bg-[#161a28] text-gray-400 border-[#262c3e]"
                        }`}
                      >
                        {isTop1 ? (
                          <div className="flex items-center gap-0.5">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>1</span>
                          </div>
                        ) : (
                          `#${rank}`
                        )}
                      </div>

                      {/* Poster Thumbnail */}
                      <Link
                        href={`/anime/${anime.id}`}
                        className="w-16 h-22 sm:w-18 sm:h-24 rounded-xl bg-[#181d2c] overflow-hidden border border-[#282f42] group-hover:border-blue-500/50 flex-shrink-0 transition-colors shadow-md"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            anime.coverImage.extraLarge ||
                            anime.coverImage.large ||
                            anime.coverImage.medium
                          }
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </Link>

                      {/* Title & Metadata */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/anime/${anime.id}`}
                            className="text-sm sm:text-base font-extrabold text-white group-hover:text-blue-400 transition-colors line-clamp-1"
                            title={title}
                          >
                            {title}
                          </Link>
                        </div>

                        {secondaryTitle && (
                          <p className="text-[11px] text-gray-500 truncate" title={secondaryTitle}>
                            {secondaryTitle}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                          {anime.format && (
                            <span className="font-bold text-gray-300 bg-[#181d2a] px-1.5 py-0.2 rounded border border-[#262c3e]">
                              {anime.format.replace("_", " ")}
                            </span>
                          )}
                          {anime.episodes && <span>• {anime.episodes} eps</span>}
                          {studio && (
                            <>
                              <span>•</span>
                              <span className="text-gray-300 font-medium">{studio}</span>
                            </>
                          )}
                          {anime.seasonYear && (
                            <>
                              <span>•</span>
                              <span>{anime.seasonYear}</span>
                            </>
                          )}
                        </div>

                        {/* Synopsis Preview */}
                        {cleanSynopsis && (
                          <p className="hidden md:block text-xs text-gray-400 mt-1 line-clamp-1">
                            {cleanSynopsis}
                          </p>
                        )}

                        {/* Genre Tags */}
                        <div className="hidden sm:flex flex-wrap gap-1 mt-2">
                          {anime.genres?.slice(0, 4).map((g) => (
                            <span
                              key={g}
                              className="text-[10px] text-gray-300 px-2 py-0.5 rounded-md bg-[#161a28] border border-[#242b3d]"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Score Column + Stream & Watchlist Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1c2233]">
                      {/* Score Badge */}
                      <div className="flex flex-col items-start sm:items-end gap-0.5 flex-shrink-0">
                        {score ? (
                          <div className="flex items-center gap-1 text-base sm:text-lg font-black text-amber-400">
                            <Star className="w-4 h-4 fill-amber-400" />
                            <span>{score}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">N/A</span>
                        )}
                        <span className="text-[10px] text-gray-500">Community Score</span>
                      </div>

                      {/* Watchlist Bookmark */}
                      <WatchlistButton anime={anime} compact size="sm" />

                      {/* Stream & Trailer Buttons */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {primaryStream ? (
                          <a
                            href={primaryStream.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <span>{primaryStream.site}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <Link
                            href={`/anime/${anime.id}`}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#181d2a] hover:bg-[#202738] text-gray-300 border border-[#262c3e] transition-colors"
                          >
                            Anime Guide
                          </Link>
                        )}

                        {anime.trailer?.id && (
                          <button
                            type="button"
                            onClick={() =>
                              handleWatchTrailer(
                                anime.trailer!.id,
                                title,
                                primaryStream?.url,
                                primaryStream?.site
                              )
                            }
                            className="text-[11px] font-semibold text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <Play className="w-3 h-3 fill-rose-500 text-rose-500" />
                            <span>Trailer</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === "grid" ? (
            /* 2. POSTER GRID VIEW */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredListWithRanks.map(({ anime, rank }) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  rank={rank}
                  onWatchTrailer={handleWatchTrailer}
                />
              ))}
            </div>
          ) : (
            /* 3. COMPACT TABLE VIEW */
            <div className="rounded-2xl bg-[#121522] border border-[#21273a] overflow-hidden shadow-xl divide-y divide-[#1b2133]">
              {filteredListWithRanks.map(({ anime, rank }) => {
                const title = anime.title.english || anime.title.romaji;
                const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "-";
                const studio = anime.studios?.nodes?.[0]?.name;
                const streamLinks =
                  anime.externalLinks?.filter(
                    (l) => l.type === "STREAMING" || ["Crunchyroll", "Netflix", "Hulu"].includes(l.site)
                  ) || [];
                const primaryStream = streamLinks[0];

                return (
                  <div
                    key={anime.id}
                    className="px-4 py-2.5 flex items-center justify-between gap-4 hover:bg-[#161a28] transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <span
                        className={`text-xs font-mono font-black w-8 text-right flex-shrink-0 ${
                          rank === 1
                            ? "text-amber-400"
                            : rank === 2
                            ? "text-slate-300"
                            : rank === 3
                            ? "text-amber-600"
                            : "text-gray-500"
                        }`}
                      >
                        #{rank}
                      </span>

                      <Link
                        href={`/anime/${anime.id}`}
                        className="w-9 h-12 rounded-lg overflow-hidden bg-[#181d2c] flex-shrink-0 border border-[#262c3e]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={anime.coverImage.medium}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </Link>

                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/anime/${anime.id}`}
                          className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 truncate transition-colors"
                        >
                          {title}
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5 truncate">
                          {anime.format && <span>{anime.format.replace("_", " ")}</span>}
                          {anime.episodes && (
                            <>
                              <span>•</span>
                              <span>{anime.episodes} eps</span>
                            </>
                          )}
                          {studio && (
                            <>
                              <span>•</span>
                              <span className="truncate">{studio}</span>
                            </>
                          )}
                          {anime.seasonYear && (
                            <>
                              <span>•</span>
                              <span>{anime.seasonYear}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1 font-black text-amber-400 text-xs px-2 py-0.5 rounded bg-[#161a28] border border-[#262c3e]">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{score}</span>
                      </div>

                      <WatchlistButton anime={anime} compact size="sm" />

                      {primaryStream ? (
                        <a
                          href={primaryStream.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hidden sm:inline-flex text-[11px] font-bold text-blue-400 hover:text-blue-300 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20"
                        >
                          {primaryStream.site}
                        </a>
                      ) : null}

                      <Link
                        href={`/anime/${anime.id}`}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202738] text-gray-300 border border-[#262c3e]"
                      >
                        Guide
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="py-16 text-center rounded-2xl bg-[#121522] border border-[#21273a] p-8 flex flex-col items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-gray-500" />
            <h3 className="text-base font-bold text-gray-200">
              No anime match this leaderboard filter
            </h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Try resetting your search query, switching eras, or choosing a different rank tier.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
            >
              Reset Leaderboard Filters
            </button>
          </div>
        )}
      </main>

      {/* Comprehensive Modern Footer */}
      <Footer />

      {/* Trailer Modal */}
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
