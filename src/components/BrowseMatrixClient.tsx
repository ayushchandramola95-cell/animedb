"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Search,
  Filter,
  X,
  RotateCcw,
  Sparkles,
  Star,
  Tv,
  Calendar,
  Shield,
  ExternalLink,
  ChevronDown,
  Loader2,
  Check,
  LayoutGrid,
  List,
  AlignJustify,
  Dice5,
  Share2,
  Play,
  Clock,
  Compass,
  Layers,
  Globe2,
  Flame,
  Trophy,
  Film,
  Heart,
  Info,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import Navbar from "./Navbar";
import AnimeCard, { formatTimeUntilAiring } from "./AnimeCard";
import TrailerModal from "./TrailerModal";
import WatchlistButton from "./WatchlistButton";
import Footer from "./Footer";

const ALL_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];

const FORMAT_OPTIONS = [
  { id: "ALL", label: "All Formats" },
  { id: "TV", label: "TV Series" },
  { id: "MOVIE", label: "Movies" },
  { id: "TV_SHORT", label: "Shorts" },
  { id: "OVA", label: "OVA / Specials" },
];

const STATUS_OPTIONS = [
  { id: "ALL", label: "All Statuses" },
  { id: "RELEASING", label: "Currently Airing" },
  { id: "FINISHED", label: "Completed" },
  { id: "NOT_YET_RELEASED", label: "Upcoming" },
];

const SEASON_OPTIONS = [
  { id: "ALL", label: "All Seasons" },
  { id: "WINTER", label: "Winter ❄️" },
  { id: "SPRING", label: "Spring 🌸" },
  { id: "SUMMER", label: "Summer ☀️" },
  { id: "FALL", label: "Fall 🍂" },
];

const SCORE_OPTIONS = [
  { value: 0, label: "Any Rating" },
  { value: 70, label: "70%+ (Good)" },
  { value: 75, label: "75%+ (Great)" },
  { value: 80, label: "80%+ (Acclaimed)" },
  { value: 85, label: "85%+ (Masterpiece)" },
  { value: 90, label: "90%+ (Legendary)" },
];

const SORT_OPTIONS = [
  { id: "POPULARITY_DESC", label: "Most Popular" },
  { id: "SCORE_DESC", label: "Highest Rated" },
  { id: "TRENDING_DESC", label: "Trending Today" },
  { id: "FAVOURITES_DESC", label: "Most Favorited" },
  { id: "START_DATE_DESC", label: "Newest Release" },
  { id: "START_DATE", label: "Oldest Classic" },
  { id: "TITLE_ROMAJI", label: "Title (A-Z)" },
];

const STREAMING_PROVIDERS = [
  { id: "ALL", label: "All Platforms" },
  { id: "Crunchyroll", label: "Crunchyroll" },
  { id: "Netflix", label: "Netflix" },
  { id: "Hulu", label: "Hulu" },
  { id: "Amazon Prime", label: "Prime Video" },
  { id: "HIDIVE", label: "HIDIVE" },
];

const COUNTRY_OPTIONS = [
  { id: "ALL", label: "All Origins" },
  { id: "JP", label: "Japan (Anime)" },
  { id: "KR", label: "Korea (Aeni / Manhwa)" },
  { id: "CN", label: "China (Donghua)" },
];

const YEAR_OPTIONS = [
  { value: "", label: "All Years" },
  { value: "2026", label: "2026" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2021", label: "2021" },
  { value: "2020", label: "2020" },
  { value: "2018", label: "2018" },
  { value: "2015", label: "2015" },
  { value: "2010", label: "2010" },
  { value: "2000", label: "2000s Classic" },
  { value: "1990", label: "1990s Retro" },
];

// Curated Taste Presets for Instant Discovery
interface TastePreset {
  id: string;
  name: string;
  icon: string;
  badge?: string;
  apply: () => void;
}

interface BrowseMatrixClientProps {
  initialMedia: AnimeMedia[];
  initialHasNextPage: boolean;
  initialFilters?: {
    genres?: string[];
    format?: string;
    status?: string;
    season?: string;
    year?: string;
    country?: string;
    minScore?: number;
    sort?: string;
    provider?: string;
    search?: string;
  };
}

export default function BrowseMatrixClient({
  initialMedia,
  initialHasNextPage,
  initialFilters,
}: BrowseMatrixClientProps) {
  // Filter States initialized from initialFilters or defaults
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    initialFilters?.genres || []
  );
  const [genreMatchMode, setGenreMatchMode] = useState<"OR" | "AND">("OR");
  const [selectedFormat, setSelectedFormat] = useState<string>(
    initialFilters?.format || "ALL"
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(
    initialFilters?.status || "ALL"
  );
  const [selectedSeason, setSelectedSeason] = useState<string>(
    initialFilters?.season || "ALL"
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    initialFilters?.year || ""
  );
  const [selectedCountry, setSelectedCountry] = useState<string>(
    initialFilters?.country || "ALL"
  );
  const [selectedMinScore, setSelectedMinScore] = useState<number>(
    initialFilters?.minScore || 0
  );
  const [selectedSort, setSelectedSort] = useState<string>(
    initialFilters?.sort || "POPULARITY_DESC"
  );
  const [selectedProvider, setSelectedProvider] = useState<string>(
    initialFilters?.provider || "ALL"
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    initialFilters?.search || ""
  );
  const [debouncedSearch, setDebouncedSearch] = useState<string>(
    initialFilters?.search || ""
  );

  // View Mode: grid | detailed | compact
  const [viewMode, setViewMode] = useState<"grid" | "detailed" | "compact">("grid");

  // Data & Pagination
  const [mediaList, setMediaList] = useState<AnimeMedia[]>(initialMedia);
  const [page, setPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(initialHasNextPage);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Random pick spotlight modal
  const [randomSpotlight, setRandomSpotlight] = useState<AnimeMedia | null>(null);

  // Share notification
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // NordVPN Banner minimize toggle
  const [vpnBannerVisible, setVpnBannerVisible] = useState<boolean>(true);

  // Trailer modal state
  const [trailerModal, setTrailerModal] = useState<{
    isOpen: boolean;
    trailerId: string | null;
    title: string;
    streamUrl?: string;
    streamSite?: string;
  }>({
    isOpen: false,
    trailerId: null,
    title: "",
  });

  const handleOpenTrailer = (
    trailerId: string,
    title: string,
    streamUrl?: string,
    streamSite?: string
  ) => {
    setTrailerModal({
      isOpen: true,
      trailerId,
      title,
      streamUrl,
      streamSite,
    });
  };

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync state to URL search parameters for clean bookmarking & sharing
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();
    if (selectedGenres.length > 0) params.set("genres", selectedGenres.join(","));
    if (selectedFormat !== "ALL") params.set("format", selectedFormat);
    if (selectedStatus !== "ALL") params.set("status", selectedStatus);
    if (selectedSeason !== "ALL") params.set("season", selectedSeason);
    if (selectedYear) params.set("year", selectedYear);
    if (selectedCountry !== "ALL") params.set("country", selectedCountry);
    if (selectedMinScore > 0) params.set("minScore", selectedMinScore.toString());
    if (selectedSort !== "POPULARITY_DESC") params.set("sort", selectedSort);
    if (selectedProvider !== "ALL") params.set("provider", selectedProvider);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [
    selectedGenres,
    selectedFormat,
    selectedStatus,
    selectedSeason,
    selectedYear,
    selectedCountry,
    selectedMinScore,
    selectedSort,
    selectedProvider,
    debouncedSearch,
  ]);

  // Fetch filter results
  const fetchFilteredAnime = useCallback(
    async (targetPage = 1, append = false) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (selectedGenres.length > 0) {
          params.set("genres", selectedGenres.join(","));
        }
        if (selectedFormat !== "ALL") {
          params.set("format", selectedFormat);
        }
        if (selectedStatus !== "ALL") {
          params.set("status", selectedStatus);
        }
        if (selectedSeason !== "ALL") {
          params.set("season", selectedSeason);
        }
        if (selectedYear) {
          params.set("year", selectedYear);
        }
        if (selectedCountry !== "ALL") {
          params.set("country", selectedCountry);
        }
        if (selectedMinScore > 0) {
          params.set("minScore", selectedMinScore.toString());
        }
        if (selectedSort) {
          params.set("sort", selectedSort);
        }
        if (selectedProvider !== "ALL") {
          params.set("provider", selectedProvider);
        }
        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }
        params.set("page", targetPage.toString());
        params.set("perPage", "36");

        const res = await fetch(`/api/browse?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          let items: AnimeMedia[] = json.media || [];

          // If Strict AND genre matching is enabled, verify all genres are present
          if (genreMatchMode === "AND" && selectedGenres.length > 1) {
            items = items.filter((anime) =>
              selectedGenres.every((g) => anime.genres?.includes(g))
            );
          }

          if (append) {
            setMediaList((prev) => [...prev, ...items]);
          } else {
            setMediaList(items);
          }
          setHasNextPage(json.hasNextPage || false);
          setPage(targetPage);
        }
      } catch (err) {
        console.error("Browse query failed:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      selectedGenres,
      genreMatchMode,
      selectedFormat,
      selectedStatus,
      selectedSeason,
      selectedYear,
      selectedCountry,
      selectedMinScore,
      selectedSort,
      selectedProvider,
      debouncedSearch,
    ]
  );

  // Trigger query on filter change
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      return;
    }
    fetchFilteredAnime(1, false);
  }, [
    fetchFilteredAnime,
    selectedGenres,
    genreMatchMode,
    selectedFormat,
    selectedStatus,
    selectedSeason,
    selectedYear,
    selectedCountry,
    selectedMinScore,
    selectedSort,
    selectedProvider,
    debouncedSearch,
    mounted,
  ]);

  // Toggle genre in selection
  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  // Reset all filters
  const resetAllFilters = () => {
    setSelectedGenres([]);
    setGenreMatchMode("OR");
    setSelectedFormat("ALL");
    setSelectedStatus("ALL");
    setSelectedSeason("ALL");
    setSelectedYear("");
    setSelectedCountry("ALL");
    setSelectedMinScore(0);
    setSelectedSort("POPULARITY_DESC");
    setSelectedProvider("ALL");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedGenres.length > 0 ||
    selectedFormat !== "ALL" ||
    selectedStatus !== "ALL" ||
    selectedSeason !== "ALL" ||
    selectedYear !== "" ||
    selectedCountry !== "ALL" ||
    selectedMinScore > 0 ||
    selectedSort !== "POPULARITY_DESC" ||
    selectedProvider !== "ALL" ||
    searchQuery.trim().length > 0;

  // Handle Share filter link
  const handleShareFilter = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Handle Surprise Pick
  const handleSurprisePick = () => {
    if (mediaList.length === 0) return;
    const randomIndex = Math.floor(Math.random() * mediaList.length);
    setRandomSpotlight(mediaList[randomIndex]);
  };

  // Curated taste presets
  const tastePresets: TastePreset[] = [
    {
      id: "trending",
      name: "Trending Hits",
      icon: "🔥",
      badge: "Live",
      apply: () => {
        resetAllFilters();
        setSelectedStatus("RELEASING");
        setSelectedSort("TRENDING_DESC");
      },
    },
    {
      id: "masterpieces",
      name: "All-Time Masterpieces",
      icon: "👑",
      badge: "85%+",
      apply: () => {
        resetAllFilters();
        setSelectedMinScore(85);
        setSelectedSort("SCORE_DESC");
      },
    },
    {
      id: "movies",
      name: "Award-Winning Movies",
      icon: "🎬",
      badge: "Cinema",
      apply: () => {
        resetAllFilters();
        setSelectedFormat("MOVIE");
        setSelectedMinScore(80);
        setSelectedSort("SCORE_DESC");
      },
    },
    {
      id: "shonen",
      name: "High-Octane Shonen",
      icon: "⚔️",
      apply: () => {
        resetAllFilters();
        setSelectedGenres(["Action", "Adventure"]);
        setSelectedSort("POPULARITY_DESC");
      },
    },
    {
      id: "romance",
      name: "Emotional Romance",
      icon: "🌸",
      apply: () => {
        resetAllFilters();
        setSelectedGenres(["Romance", "Drama"]);
        setSelectedMinScore(75);
        setSelectedSort("SCORE_DESC");
      },
    },
    {
      id: "psychological",
      name: "Mind-Bending Thrillers",
      icon: "🧠",
      apply: () => {
        resetAllFilters();
        setSelectedGenres(["Psychological", "Mystery"]);
        setSelectedSort("SCORE_DESC");
      },
    },
    {
      id: "scifi",
      name: "Sci-Fi & Cyberpunk",
      icon: "🚀",
      apply: () => {
        resetAllFilters();
        setSelectedGenres(["Sci-Fi"]);
        setSelectedSort("POPULARITY_DESC");
      },
    },
    {
      id: "sol",
      name: "Cozy Slice of Life",
      icon: "☕",
      apply: () => {
        resetAllFilters();
        setSelectedGenres(["Slice of Life"]);
        setSelectedSort("POPULARITY_DESC");
      },
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-gray-100 selection:bg-blue-600/30 selection:text-white">
      <Navbar onWatchTrailer={handleOpenTrailer} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Header Breadcrumbs / Title Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-200">Discovery Matrix</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  Advanced Anime Discovery Matrix
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  15,000+ Titles Indexed
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-3xl">
                Filter across anime titles using multi-genre intersections, rating thresholds, seasons, formats, and verified legal streaming services.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
              <button
                type="button"
                onClick={handleSurprisePick}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                title="Randomly pick a title from currently filtered list"
              >
                <Dice5 className="w-4 h-4 text-purple-400" />
                <span>Surprise Pick</span>
              </button>

              <button
                type="button"
                onClick={handleShareFilter}
                className="px-3.5 py-2 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-gray-300 hover:text-white border border-[#222736] text-xs font-semibold transition-all flex items-center gap-1.5"
                title="Copy shareable link with current filters"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-blue-400" />
                    <span>Share Matrix</span>
                  </>
                )}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Taste Presets Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 flex-shrink-0 mr-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Presets:
            </span>
            {tastePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={preset.apply}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1c2233] border border-[#222736] hover:border-gray-500 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 group shadow-sm"
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
                {preset.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold uppercase">
                    {preset.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls Box */}
        <section className="rounded-2xl bg-[#121522]/90 border border-[#21273a] p-5 sm:p-6 flex flex-col gap-5 shadow-xl backdrop-blur-md">
          {/* Row 1: Search, Sort, and Streaming Platform */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-6">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anime title, studio, or keyword..."
                className="w-full bg-[#161a28] text-xs text-white placeholder-gray-500 pl-10 pr-9 py-2.5 rounded-xl border border-[#262c3e] focus:border-blue-500 focus:bg-[#1a2032] outline-none transition-all shadow-inner"
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

            {/* Sort Dropdown */}
            <div className="relative md:col-span-3">
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                aria-label="Sort by"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#161a28] text-gray-200 border border-[#262c3e] focus:border-blue-500 outline-none cursor-pointer appearance-none transition-colors"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-[#131622] text-gray-200">
                    Sort: {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Streaming Provider Dropdown */}
            <div className="relative md:col-span-3">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                aria-label="Streaming Platform"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#161a28] text-gray-200 border border-[#262c3e] focus:border-blue-500 outline-none cursor-pointer appearance-none transition-colors"
              >
                {STREAMING_PROVIDERS.map((prov) => (
                  <option key={prov.id} value={prov.id} className="bg-[#131622] text-gray-200">
                    Platform: {prov.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Row 2: Secondary Dropdowns (Format, Status, Season, Year, Score, Origin) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-[#1c2233]">
            {/* Format */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400">Format</label>
              <div className="relative">
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-[#161a28] text-gray-200 border border-[#262c3e] focus:border-blue-500 outline-none cursor-pointer appearance-none"
                >
                  {FORMAT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id} className="bg-[#131622]">
                      {f.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400">Airing Status</label>
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-[#161a28] text-gray-200 border border-[#262c3e] focus:border-blue-500 outline-none cursor-pointer appearance-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#131622]">
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Season */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400">Airing Season</label>
              <div className="relative">
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-[#161a28] text-gray-200 border border-[#262c3e] focus:border-blue-500 outline-none cursor-pointer appearance-none"
                >
                  {SEASON_OPTIONS.map((sn) => (
                    <option key={sn.id} value={sn.id} className="bg-[#131622]">
                      {sn.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Release Year */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400">Release Year</label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-[#161a28] text-gray-200 border border-[#262c3e] focus:border-blue-500 outline-none cursor-pointer appearance-none"
                >
                  {YEAR_OPTIONS.map((yr) => (
                    <option key={yr.value} value={yr.value} className="bg-[#131622]">
                      {yr.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Minimum Score */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400">Minimum Score</label>
              <div className="relative">
                <select
                  value={selectedMinScore}
                  onChange={(e) => setSelectedMinScore(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-[#161a28] text-gray-200 border border-[#262c3e] focus:border-blue-500 outline-none cursor-pointer appearance-none"
                >
                  {SCORE_OPTIONS.map((sc) => (
                    <option key={sc.value} value={sc.value} className="bg-[#131622]">
                      {sc.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Country of Origin */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400">Country / Origin</label>
              <div className="relative">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-[#161a28] text-gray-200 border border-[#262c3e] focus:border-blue-500 outline-none cursor-pointer appearance-none"
                >
                  {COUNTRY_OPTIONS.map((cnt) => (
                    <option key={cnt.id} value={cnt.id} className="bg-[#131622]">
                      {cnt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 3: Multi-Genre Tag Cloud with Logic Match Mode */}
          <div className="pt-4 border-t border-[#1c2233] flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>Genre Intersections</span>
                  {selectedGenres.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                      {selectedGenres.length} selected
                    </span>
                  )}
                </span>

                {/* Logic Match Toggle: ANY (OR) vs ALL (AND) */}
                {selectedGenres.length > 1 && (
                  <div className="inline-flex items-center gap-1 bg-[#161a28] p-0.5 rounded-lg border border-[#262c3e] text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setGenreMatchMode("OR")}
                      className={`px-2 py-0.5 rounded transition-all ${
                        genreMatchMode === "OR"
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                      title="Matches titles containing ANY of the selected genres"
                    >
                      Match ANY (OR)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenreMatchMode("AND")}
                      className={`px-2 py-0.5 rounded transition-all ${
                        genreMatchMode === "AND"
                          ? "bg-purple-600 text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                      title="Strictly matches titles containing ALL of the selected genres"
                    >
                      Match ALL (AND)
                    </button>
                  </div>
                )}
              </div>

              {selectedGenres.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedGenres([])}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold self-start sm:self-auto transition-colors"
                >
                  Clear All Genres ({selectedGenres.length})
                </button>
              )}
            </div>

            {/* Genre Pills Grid */}
            <div className="flex flex-wrap gap-2">
              {ALL_GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 select-none ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/40 scale-[1.02]"
                        : "bg-[#161a28] hover:bg-[#1e2336] text-gray-300 border-[#262c3e] hover:border-gray-600"
                    }`}
                  >
                    <span>{genre}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Active Filter Badges */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-[#1c2233] flex items-center gap-2 flex-wrap text-xs">
              <span className="text-gray-400 font-semibold">Active:</span>
              {selectedGenres.map((g) => (
                <span
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                  title="Click to remove"
                >
                  <span>{g}</span>
                  <X className="w-3 h-3" />
                </span>
              ))}

              {selectedFormat !== "ALL" && (
                <span
                  onClick={() => setSelectedFormat("ALL")}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                >
                  <span>Format: {selectedFormat}</span>
                  <X className="w-3 h-3" />
                </span>
              )}

              {selectedStatus !== "ALL" && (
                <span
                  onClick={() => setSelectedStatus("ALL")}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                >
                  <span>Status: {selectedStatus}</span>
                  <X className="w-3 h-3" />
                </span>
              )}

              {selectedSeason !== "ALL" && (
                <span
                  onClick={() => setSelectedSeason("ALL")}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                >
                  <span>Season: {selectedSeason}</span>
                  <X className="w-3 h-3" />
                </span>
              )}

              {selectedYear && (
                <span
                  onClick={() => setSelectedYear("")}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                >
                  <span>Year: {selectedYear}</span>
                  <X className="w-3 h-3" />
                </span>
              )}

              {selectedCountry !== "ALL" && (
                <span
                  onClick={() => setSelectedCountry("ALL")}
                  className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                >
                  <span>Origin: {selectedCountry}</span>
                  <X className="w-3 h-3" />
                </span>
              )}

              {selectedMinScore > 0 && (
                <span
                  onClick={() => setSelectedMinScore(0)}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                >
                  <span>Score: {selectedMinScore}%+</span>
                  <X className="w-3 h-3" />
                </span>
              )}

              {selectedProvider !== "ALL" && (
                <span
                  onClick={() => setSelectedProvider("ALL")}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                >
                  <span>Platform: {selectedProvider}</span>
                  <X className="w-3 h-3" />
                </span>
              )}
            </div>
          )}
        </section>

        {/* NordVPN Streaming Bypass Affiliate Strip (High-Converting & Sleek) */}
        {vpnBannerVisible && (
          <div className="relative rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#131728] to-indigo-950/40 border border-blue-500/30 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-md overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3.5 z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 text-blue-400 shadow-md">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    Unlock Global Anime Catalogs on Netflix Japan, Crunchyroll & Hulu
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider animate-pulse">
                    🔥 74% OFF + 3 Free Months
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
                  Many catalog titles are region-exclusive. NordVPN effortlessly changes your IP address to Tokyo, Los Angeles, or London with high-speed 10Gbps streaming servers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 z-10 w-full md:w-auto justify-end">
              <a
                href="https://nordvpn.com"
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2 flex-shrink-0"
              >
                <span>Claim NordVPN Deal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setVpnBannerVisible(false)}
                className="text-gray-500 hover:text-gray-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Results Counter Bar & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400 px-1 border-b border-[#1c2233] pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Found <strong className="text-white text-sm">{mediaList.length}</strong> titles matching your criteria
            </span>
            {genreMatchMode === "AND" && selectedGenres.length > 1 && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                Strict AND Intersection Active
              </span>
            )}
            {isLoading && (
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold ml-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Refreshing catalog...</span>
              </div>
            )}
          </div>

          {/* View Mode Toggle: Grid | Detailed | Compact */}
          <div className="flex items-center gap-1 bg-[#141824] p-1 rounded-xl border border-[#222736] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
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
              onClick={() => setViewMode("detailed")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "detailed"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Detailed Cards View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("compact")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "compact"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Compact Row View"
            >
              <AlignJustify className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Anime Results Display */}
        {isLoading && mediaList.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-2xl bg-[#141724] border border-[#222736]"
              />
            ))}
          </div>
        ) : mediaList.length > 0 ? (
          <div className="flex flex-col gap-8">
            {/* 1. GRID VIEW */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {mediaList.map((anime) => (
                  <AnimeCard
                    key={anime.id}
                    anime={anime}
                    onWatchTrailer={handleOpenTrailer}
                  />
                ))}
              </div>
            )}

            {/* 2. DETAILED VIEW */}
            {viewMode === "detailed" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaList.map((anime) => {
                  const displayTitle = anime.title.english || anime.title.romaji;
                  const studio = anime.studios?.nodes?.[0]?.name;
                  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
                  const cleanSynopsis = anime.description
                    ? anime.description.replace(/<[^>]*>?/gm, "").slice(0, 150) + "..."
                    : "No synopsis available.";

                  return (
                    <div
                      key={anime.id}
                      className="rounded-2xl bg-[#121522] border border-[#21273a] hover:border-[#323d58] p-4 flex flex-col justify-between gap-3.5 transition-all duration-200 hover:shadow-xl group"
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Poster */}
                        <Link
                          href={`/anime/${anime.id}`}
                          className="w-20 h-28 rounded-xl overflow-hidden bg-[#181d2c] flex-shrink-0 border border-[#262c3e] group-hover:border-blue-500/50 transition-colors"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={anime.coverImage.extraLarge || anime.coverImage.large}
                            alt={displayTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </Link>

                        {/* Title, Badges & Synopsis */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {score && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#0e111a] text-amber-400 border border-[#2b334a] flex items-center gap-0.5 shadow-sm">
                                <Star className="w-2.5 h-2.5 fill-amber-400" />
                                <span>{score}</span>
                              </span>
                            )}
                            {anime.format && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#181d2a] text-gray-300 border border-[#262c3e]">
                                {anime.format.replace("_", " ")}
                              </span>
                            )}
                            <div className="ml-auto">
                              <WatchlistButton anime={anime} compact size="sm" />
                            </div>
                          </div>

                          <Link
                            href={`/anime/${anime.id}`}
                            className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 mt-1.5"
                          >
                            {displayTitle}
                          </Link>

                          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                            {anime.seasonYear && <span>{anime.seasonYear}</span>}
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
                          </div>

                          <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                            {cleanSynopsis}
                          </p>
                        </div>
                      </div>

                      {/* Genres & Actions Bottom Bar */}
                      <div className="pt-2.5 border-t border-[#1c2233] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 overflow-hidden">
                          {anime.genres?.slice(0, 3).map((g) => (
                            <span
                              key={g}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-[#161a28] text-gray-300 border border-[#242b3d] whitespace-nowrap"
                            >
                              {g}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {anime.trailer?.id && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenTrailer(anime.trailer!.id, displayTitle)
                              }
                              className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30 transition-colors flex items-center gap-1"
                            >
                              <Play className="w-3 h-3 fill-blue-400" />
                              <span>Trailer</span>
                            </button>
                          )}
                          <Link
                            href={`/anime/${anime.id}`}
                            className="px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202738] text-gray-200 text-xs font-semibold border border-[#262c3e] transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. COMPACT TABLE / ROW VIEW */}
            {viewMode === "compact" && (
              <div className="rounded-2xl bg-[#121522] border border-[#21273a] overflow-hidden shadow-lg divide-y divide-[#1b2133]">
                {mediaList.map((anime, idx) => {
                  const displayTitle = anime.title.english || anime.title.romaji;
                  const studio = anime.studios?.nodes?.[0]?.name;
                  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "-";

                  return (
                    <div
                      key={anime.id}
                      className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-[#161a28] transition-colors group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <span className="text-xs font-mono font-bold text-gray-400 w-6 text-right flex-shrink-0">
                          #{idx + 1}
                        </span>

                        <Link
                          href={`/anime/${anime.id}`}
                          className="w-10 h-14 rounded-lg overflow-hidden bg-[#181d2c] flex-shrink-0 border border-[#262c3e]"
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
                            {displayTitle}
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5 truncate">
                            {anime.format && <span>{anime.format.replace("_", " ")}</span>}
                            {anime.seasonYear && (
                              <>
                                <span>•</span>
                                <span>{anime.seasonYear}</span>
                              </>
                            )}
                            {studio && (
                              <>
                                <span>•</span>
                                <span className="truncate">{studio}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Meta & Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1 font-bold text-amber-400 text-xs px-2 py-0.5 rounded bg-[#161a28] border border-[#262c3e]">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{score}</span>
                        </div>

                        <div className="hidden sm:flex items-center gap-1">
                          {anime.genres?.slice(0, 2).map((g) => (
                            <span
                              key={g}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#161a28] text-gray-400 border border-[#242b3d]"
                            >
                              {g}
                            </span>
                          ))}
                        </div>

                        <WatchlistButton anime={anime} compact size="sm" />

                        <Link
                          href={`/anime/${anime.id}`}
                          className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202738] text-gray-200 border border-[#262c3e] transition-colors"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination / Load More */}
            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => fetchFilteredAnime(page + 1, true)}
                  disabled={isLoadingMore}
                  className="px-6 py-3 rounded-xl bg-[#141724] hover:bg-[#1b2030] text-white border border-[#262c3d] hover:border-gray-500 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 disabled:opacity-50 shadow-md"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Loading More Titles...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Titles</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#121522] border border-[#21273a] p-12 text-center flex flex-col items-center justify-center gap-3">
            <Filter className="w-10 h-10 text-gray-500" />
            <h3 className="text-base font-bold text-gray-200">
              No anime matched this exact filter combination
            </h3>
            <p className="text-xs text-gray-400 max-w-md leading-relaxed">
              Try removing some genre constraints, switching the genre logic toggle to &quot;Match ANY (OR)&quot;, or lowering the minimum score threshold.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-md"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </main>

      {/* Random Spotlight Modal */}
      {randomSpotlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#131622] border border-[#283146] shadow-2xl overflow-hidden flex flex-col">
            {/* Ambient Backdrop */}
            <div className="relative h-44 bg-[#181d2c] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  randomSpotlight.bannerImage ||
                  randomSpotlight.coverImage.extraLarge ||
                  randomSpotlight.coverImage.large
                }
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131622] via-[#131622]/60 to-transparent" />

              <button
                type="button"
                onClick={() => setRandomSpotlight(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-purple-600/90 text-white flex items-center gap-1.5 shadow">
                  <Dice5 className="w-3.5 h-3.5" />
                  <span>Surprise Pick Result</span>
                </span>

                {randomSpotlight.averageScore && (
                  <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{(randomSpotlight.averageScore / 10).toFixed(1)}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-3">
              <h3 className="text-lg font-extrabold text-white">
                {randomSpotlight.title.english || randomSpotlight.title.romaji}
              </h3>

              <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                {randomSpotlight.format && <span>{randomSpotlight.format.replace("_", " ")}</span>}
                {randomSpotlight.seasonYear && (
                  <>
                    <span>•</span>
                    <span>{randomSpotlight.seasonYear}</span>
                  </>
                )}
                {randomSpotlight.episodes && (
                  <>
                    <span>•</span>
                    <span>{randomSpotlight.episodes} episodes</span>
                  </>
                )}
              </div>

              <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                {randomSpotlight.description
                  ? randomSpotlight.description.replace(/<[^>]*>?/gm, "")
                  : "No description available."}
              </p>

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {randomSpotlight.genres?.slice(0, 4).map((g) => (
                  <span
                    key={g}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#181d2a] text-gray-300 border border-[#262c3e]"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-[#1c2233] mt-2">
                <Link
                  href={`/anime/${randomSpotlight.id}`}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold text-center transition-colors shadow-md"
                >
                  View Anime Guide
                </Link>

                {randomSpotlight.trailer?.id && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = randomSpotlight.id;
                      const title = randomSpotlight.title.english || randomSpotlight.title.romaji;
                      const trailerId = randomSpotlight.trailer!.id;
                      setRandomSpotlight(null);
                      handleOpenTrailer(trailerId, title);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#181d2a] hover:bg-[#202738] text-white text-xs font-semibold border border-[#262c3e] transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Trailer</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSurprisePick}
                  className="px-3 py-2.5 rounded-xl bg-[#181d2a] hover:bg-[#202738] text-purple-400 hover:text-white border border-[#262c3e] transition-colors"
                  title="Spin again!"
                >
                  <Dice5 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Modern Footer */}
      <Footer />

      {/* Trailer Cinema Modal */}
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
