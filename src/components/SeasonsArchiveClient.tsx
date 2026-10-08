"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  Filter,
  Tv,
  Film,
  Flame,
  Star,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  ExternalLink,
  Play,
  RotateCcw,
  LayoutGrid,
  List,
  Table as TableIcon,
  X,
  Share2,
  Check,
  Building2,
  Clock,
  Radio,
  Dices,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import Navbar from "./Navbar";
import AnimeCard from "./AnimeCard";
import TrailerModal from "./TrailerModal";
import WatchlistButton from "./WatchlistButton";
import {
  CrunchyrollLogo,
  NetflixLogo,
  HuluLogo,
  PrimeVideoLogo,
  DisneyPlusLogo,
  BilibiliLogo,
} from "./BrandLogos";

type SeasonType = "WINTER" | "SPRING" | "SUMMER" | "FALL";
type ViewMode = "GRID" | "DETAILED" | "COMPACT";

interface SeasonsArchiveClientProps {
  initialSeason: SeasonType;
  initialYear: number;
  initialMedia: AnimeMedia[];
}

interface SeasonConfig {
  key: SeasonType;
  label: string;
  months: string;
  icon: string;
  cardGradient: string;
  activeRing: string;
  activeBg: string;
  badgeBg: string;
  badgeText: string;
  borderHover: string;
  dotColor: string;
}

const SEASON_CONFIGS: SeasonConfig[] = [
  {
    key: "WINTER",
    label: "Winter",
    months: "Jan - Mar",
    icon: "❄️",
    cardGradient: "from-cyan-950/30 via-[#131926] to-[#0c111a]",
    activeRing: "ring-2 ring-cyan-500/50 border-cyan-500/80 shadow-cyan-950/40",
    activeBg: "bg-cyan-950/40",
    badgeBg: "bg-cyan-500/20",
    badgeText: "text-cyan-300",
    borderHover: "hover:border-cyan-500/40",
    dotColor: "bg-cyan-400",
  },
  {
    key: "SPRING",
    label: "Spring",
    months: "Apr - Jun",
    icon: "🌸",
    cardGradient: "from-pink-950/30 via-[#1a1424] to-[#110d18]",
    activeRing: "ring-2 ring-pink-500/50 border-pink-500/80 shadow-pink-950/40",
    activeBg: "bg-pink-950/40",
    badgeBg: "bg-pink-500/20",
    badgeText: "text-pink-300",
    borderHover: "hover:border-pink-500/40",
    dotColor: "bg-pink-400",
  },
  {
    key: "SUMMER",
    label: "Summer",
    months: "Jul - Sep",
    icon: "☀️",
    cardGradient: "from-amber-950/30 via-[#1b1711] to-[#12100a]",
    activeRing: "ring-2 ring-amber-500/50 border-amber-500/80 shadow-amber-950/40",
    activeBg: "bg-amber-950/40",
    badgeBg: "bg-amber-500/20",
    badgeText: "text-amber-300",
    borderHover: "hover:border-amber-500/40",
    dotColor: "bg-amber-400",
  },
  {
    key: "FALL",
    label: "Fall",
    months: "Oct - Dec",
    icon: "🍁",
    cardGradient: "from-orange-950/30 via-[#1d1511] to-[#130e0a]",
    activeRing: "ring-2 ring-orange-500/50 border-orange-500/80 shadow-orange-950/40",
    activeBg: "bg-orange-950/40",
    badgeBg: "bg-orange-500/20",
    badgeText: "text-orange-300",
    borderHover: "hover:border-orange-500/40",
    dotColor: "bg-orange-400",
  },
];

const RECENT_YEARS = [2027, 2026, 2025, 2024, 2023, 2022];

// Past historical archive years for the dedicated archive dropdown
const HISTORICAL_YEARS = Array.from({ length: 2022 - 1970 + 1 }, (_, i) => 2021 - i);

const GENRE_LIST = [
  "ALL",
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Supernatural",
  "Mystery",
  "Psychological",
  "Sports",
];

function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
}

function formatAiringCountdown(seconds: number): string {
  if (seconds <= 0) return "Airing now";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

export default function SeasonsArchiveClient({
  initialSeason,
  initialYear,
  initialMedia,
}: SeasonsArchiveClientProps) {
  const [selectedSeason, setSelectedSeason] = useState<SeasonType>(initialSeason);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [mediaList, setMediaList] = useState<AnimeMedia[]>(initialMedia);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string>("ALL");
  const [selectedGenre, setSelectedGenre] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"POPULARITY" | "SCORE" | "TITLE" | "EPISODES">("POPULARITY");
  const [providerFilter, setProviderFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("GRID");
  const [vpnBannerDismissed, setVpnBannerDismissed] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Trailer cinema modal state
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

  // Sync URL query parameters and fetch season data
  const handleSeasonChange = async (season: SeasonType, year: number) => {
    setSelectedSeason(season);
    setSelectedYear(year);

    // Update browser URL query string without page reload
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("season", season.toLowerCase());
      url.searchParams.set("year", year.toString());
      window.history.pushState({}, "", url.toString());
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/seasons?season=${season}&year=${year}&perPage=60`);
      if (res.ok) {
        const json = await res.json();
        setMediaList(json.media || []);
      }
    } catch (err) {
      console.error("Failed to load season data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearStep = (direction: -1 | 1) => {
    const nextYear = selectedYear + direction;
    if (nextYear >= 1970 && nextYear <= 2028) {
      handleSeasonChange(selectedSeason, nextYear);
    }
  };

  const handleShareSeason = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleRandomPick = () => {
    if (filteredList.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredList.length);
    const chosen = filteredList[randomIndex];
    const stream = chosen.externalLinks?.find(
      (l) => l.type === "STREAMING" || ["Crunchyroll", "Netflix", "Hulu"].includes(l.site)
    );
    if (chosen.trailer?.id) {
      handleOpenTrailer(
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
    setSelectedFormat("ALL");
    setSelectedGenre("ALL");
    setProviderFilter("ALL");
    setSortBy("POPULARITY");
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedFormat !== "ALL" ||
    selectedGenre !== "ALL" ||
    providerFilter !== "ALL" ||
    sortBy !== "POPULARITY";

  // Filtered and sorted anime
  const filteredList = useMemo(() => {
    let result = [...mediaList];

    // Format filter
    if (selectedFormat !== "ALL") {
      result = result.filter((item) => item.format === selectedFormat);
    }

    // Genre filter
    if (selectedGenre !== "ALL") {
      result = result.filter((item) => item.genres?.includes(selectedGenre));
    }

    // Provider filter
    if (providerFilter !== "ALL") {
      result = result.filter((item) =>
        item.externalLinks?.some((l) =>
          l.site.toLowerCase().includes(providerFilter.toLowerCase())
        )
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const titleEn = (item.title.english || "").toLowerCase();
        const titleRo = (item.title.romaji || "").toLowerCase();
        const studio = (item.studios?.nodes?.[0]?.name || "").toLowerCase();
        const genres = (item.genres || []).map((g) => g.toLowerCase());
        return (
          titleEn.includes(q) ||
          titleRo.includes(q) ||
          studio.includes(q) ||
          genres.some((g) => g.includes(q))
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "SCORE") {
        return (b.averageScore || 0) - (a.averageScore || 0);
      }
      if (sortBy === "TITLE") {
        const titleA = a.title.english || a.title.romaji || "";
        const titleB = b.title.english || b.title.romaji || "";
        return titleA.localeCompare(titleB);
      }
      if (sortBy === "EPISODES") {
        return (b.episodes || 0) - (a.episodes || 0);
      }
      // POPULARITY
      return (b.popularity || 0) - (a.popularity || 0);
    });

    return result;
  }, [mediaList, selectedFormat, selectedGenre, providerFilter, searchQuery, sortBy]);

  // Seasonal Insights & Metrics
  const seasonStats = useMemo(() => {
    if (mediaList.length === 0) return null;

    const studiosMap = new Map<string, number>();
    mediaList.forEach((item) => {
      const studioName = item.studios?.nodes?.[0]?.name;
      if (studioName) {
        studiosMap.set(studioName, (studiosMap.get(studioName) || 0) + 1);
      }
    });

    let topStudio = "Various";
    let topStudioCount = 0;
    studiosMap.forEach((count, name) => {
      if (count > topStudioCount) {
        topStudioCount = count;
        topStudio = name;
      }
    });

    // Highest rated anime in this season
    const scoredList = [...mediaList].filter((a) => (a.averageScore || 0) > 0);
    scoredList.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
    const highestRated = scoredList[0] || null;

    // Most popular premiere
    const mostPopular = mediaList[0] || null;

    return {
      total: mediaList.length,
      topStudio,
      topStudioCount,
      highestRated,
      mostPopular,
    };
  }, [mediaList]);

  // Current real-world season check
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentRealSeason =
    currentMonth >= 0 && currentMonth <= 2
      ? "WINTER"
      : currentMonth >= 3 && currentMonth <= 5
      ? "SPRING"
      : currentMonth >= 6 && currentMonth <= 8
      ? "SUMMER"
      : "FALL";

  const isCurrentSeason = selectedSeason === currentRealSeason && selectedYear === currentYear;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d13] text-gray-100 selection:bg-blue-600/30 selection:text-white">
      <Navbar onWatchTrailer={handleOpenTrailer} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Header Breadcrumbs / Title & Year Stepper */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-400">Seasonal Archive</span>
            <span>/</span>
            <span className="text-blue-400 font-bold capitalize">
              {selectedSeason.toLowerCase()} {selectedYear}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Anime Broadcast Schedule</span>
                </span>
                {isCurrentSeason && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Active Broadcast Season</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <span>
                  {selectedSeason.charAt(0) + selectedSeason.slice(1).toLowerCase()} {selectedYear} Anime Season
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
                Explore verified premiering TV series, movies, streaming licenses, and broadcast timetables across all seasonal studios.
              </p>
            </div>

            {/* Clean Year Navigator Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-[#131722] p-1 rounded-xl border border-[#22283a] shadow-inner">
                {/* Year Step Left */}
                <button
                  type="button"
                  onClick={() => handleYearStep(-1)}
                  disabled={selectedYear <= 1970}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1b2132] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Previous Year"
                  aria-label="Previous Year"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Recent Year Pills */}
                <div className="flex items-center gap-1 px-1">
                  {RECENT_YEARS.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => handleSeasonChange(selectedSeason, yr)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedYear === yr
                          ? "bg-blue-600 text-white shadow-md shadow-blue-950/40"
                          : "text-gray-400 hover:text-white hover:bg-[#1b2132]"
                      }`}
                    >
                      {yr}
                    </button>
                  ))}

                  {/* Active Indicator if Selected Year is an older historical archive */}
                  {!RECENT_YEARS.includes(selectedYear) && (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-md shadow-blue-950/40 flex items-center gap-1">
                      <span>{selectedYear}</span>
                    </span>
                  )}
                </div>

                {/* Year Step Right */}
                <button
                  type="button"
                  onClick={() => handleYearStep(1)}
                  disabled={selectedYear >= 2028}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1b2132] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Next Year"
                  aria-label="Next Year"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Historical Archive Dropdown */}
              <div className="relative inline-block">
                <select
                  value={RECENT_YEARS.includes(selectedYear) ? "" : selectedYear}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val) handleSeasonChange(selectedSeason, val);
                  }}
                  aria-label="Select Historical Archive Year"
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-[#131722] text-gray-300 border border-[#22283a] hover:border-[#30384f] focus:outline-none cursor-pointer shadow-sm"
                >
                  <option value="" disabled>
                    More Archives (1970–2021) ▾
                  </option>
                  {HISTORICAL_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr} Archive
                    </option>
                  ))}
                </select>
              </div>

              {/* Utility Action Buttons: Random Pick & Share */}
              <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={handleRandomPick}
                  title="Random Seasonal Pick"
                  aria-label="Random Seasonal Pick"
                  className="p-2 rounded-xl bg-[#131722] border border-[#22283a] hover:border-purple-500/50 hover:bg-purple-950/20 text-gray-400 hover:text-purple-300 transition-colors shadow-sm"
                >
                  <Dices className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleShareSeason}
                  title="Share Season Link"
                  aria-label="Share Season Link"
                  className="p-2 rounded-xl bg-[#131722] border border-[#22283a] hover:border-blue-500/50 hover:bg-blue-950/20 text-gray-400 hover:text-blue-300 transition-colors shadow-sm"
                >
                  {copiedShare ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Season Selector Thematic Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {SEASON_CONFIGS.map((s) => {
            const isActive = selectedSeason === s.key;
            const isLiveNow = s.key === currentRealSeason && selectedYear === currentYear;

            return (
              <button
                key={s.key}
                type="button"
                onClick={() => handleSeasonChange(s.key, selectedYear)}
                className={`relative rounded-2xl border p-4 sm:p-5 text-left flex flex-col justify-between gap-3 transition-all duration-200 select-none bg-gradient-to-br ${
                  s.cardGradient
                } ${
                  isActive
                    ? `${s.activeRing} ${s.activeBg}`
                    : `border-[#212738] ${s.borderHover} hover:bg-[#151926]/70`
                }`}
              >
                {/* Top Row: Icon + Months Badge */}
                <div className="flex items-center justify-between">
                  <div className="text-2xl sm:text-3xl filter drop-shadow">{s.icon}</div>
                  <span
                    className={`text-[11px] font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                      isActive
                        ? `${s.badgeBg} ${s.badgeText} border-current/20`
                        : "bg-[#181d2a] text-gray-400 border-[#262e42]"
                    }`}
                  >
                    {s.months}
                  </span>
                </div>

                {/* Season Label & Dynamic Subtitle */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-extrabold text-white">
                      {s.label} Season
                    </span>
                    {isLiveNow && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {s.label} {selectedYear} Premieres
                  </div>
                </div>

                {/* Active Indicator Underline */}
                {isActive && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-current opacity-80" />
                )}
              </button>
            );
          })}
        </div>

        {/* Season Snapshot & Timetable Strip */}
        {seasonStats && (
          <div className="rounded-2xl bg-[#111420] border border-[#202636] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 divide-x-0 md:divide-x divide-[#202636]">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Total Seasonal Lineup
                </span>
                <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 flex items-center gap-1.5">
                  <Tv className="w-4 h-4 text-blue-400" />
                  <span>{filteredList.length} Anime</span>
                  {selectedFormat !== "ALL" && (
                    <span className="text-xs font-normal text-gray-400">({selectedFormat})</span>
                  )}
                </span>
              </div>

              <div className="flex flex-col md:pl-4">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Top Production Studio
                </span>
                <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 flex items-center gap-1.5 truncate">
                  <Building2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="truncate">{seasonStats.topStudio}</span>
                  <span className="text-xs text-gray-400 font-normal">
                    ({seasonStats.topStudioCount} shows)
                  </span>
                </span>
              </div>

              {seasonStats.highestRated && (
                <div className="col-span-2 md:col-span-1 flex flex-col md:pl-4">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Highest Rated Premiere
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-white mt-0.5 flex items-center gap-1.5 truncate">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400 flex-shrink-0" />
                    <span className="truncate">
                      {seasonStats.highestRated.title.english ||
                        seasonStats.highestRated.title.romaji}
                    </span>
                    <span className="text-xs text-amber-300 font-bold">
                      {((seasonStats.highestRated.averageScore || 0) / 10).toFixed(1)}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Jump to Weekly Airing Timetable */}
            <Link
              href="/schedule"
              className="px-4 py-2.5 rounded-xl bg-[#171c2b] hover:bg-[#1f263a] border border-[#262f44] text-xs font-bold text-gray-200 hover:text-white transition-all flex items-center justify-center gap-2 flex-shrink-0 shadow-sm"
            >
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Weekly Broadcast Timetable</span>
              <span className="text-blue-400 font-mono">→</span>
            </Link>
          </div>
        )}

        {/* High-Impact Regional Bypass Affiliate Banner */}
        {!vpnBannerDismissed && (
          <div className="relative rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#131929] to-[#121624] border border-blue-500/30 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-blue-950/20">
            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setVpnBannerDismissed(true)}
              className="absolute top-3 right-3 p-1 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
              aria-label="Dismiss banner"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start sm:items-center gap-3.5 pr-8">
              <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-extrabold text-white">
                    Unlock Geo-Locked {selectedSeason.toLowerCase()} anime without restrictions
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
                    ⚡ 70% OFF + 3 Months Free
                  </span>
                </div>
                <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
                  Certain broadcasts are exclusive to Tokyo or US regions. Connect to high-speed servers to stream unfiltered Japanese TV on ABEMA, Netflix JP & Hulu.
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-gray-300 font-semibold">
                    🇯🇵 Tokyo 10Gbps
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-gray-300 font-semibold">
                    🇺🇸 US Ultra-Fast
                  </span>
                  <span>•</span>
                  <span>ABEMA, Netflix JP, Hulu, Disney+ JP</span>
                </div>
              </div>
            </div>

            <a
              href="https://nordvpn.com"
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-2 flex-shrink-0 shadow-md shadow-blue-950/50 hover:scale-[1.02]"
            >
              <span>Unlock Regional Catalogs</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Filter Controls & View Mode Bar */}
        <div className="rounded-2xl bg-[#111420] border border-[#202636] p-4 flex flex-col gap-4 shadow-sm">
          {/* Row 1: Search, Format Pills, Provider, Sort, and View Modes */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${selectedSeason.toLowerCase()} ${selectedYear} anime, studio, genre...`}
                className="w-full bg-[#161a27] text-xs sm:text-sm text-gray-200 placeholder-gray-500 pl-9 pr-9 py-2.5 rounded-xl border border-[#262e42] focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Format Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              {[
                { id: "ALL", label: "All Formats" },
                { id: "TV", label: "TV Series" },
                { id: "MOVIE", label: "Movies" },
                { id: "TV_SHORT", label: "Shorts" },
                { id: "OVA", label: "OVA / Special" },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${
                    selectedFormat === fmt.id
                      ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                      : "bg-[#161a27] hover:bg-[#1e2334] text-gray-400 hover:text-white border-[#262e42]"
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>

            {/* Streaming Provider & Sort Dropdowns + View Mode Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Platform Selector */}
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                aria-label="Filter by Streaming Platform"
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#161a27] text-gray-300 border border-[#262e42] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Platforms</option>
                <option value="Crunchyroll">Crunchyroll</option>
                <option value="Netflix">Netflix</option>
                <option value="Hulu">Hulu</option>
                <option value="Amazon Prime">Prime Video</option>
                <option value="HIDIVE">HIDIVE</option>
                <option value="Disney Plus">Disney+</option>
              </select>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort Anime List"
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#161a27] text-gray-300 border border-[#262e42] focus:outline-none cursor-pointer"
              >
                <option value="POPULARITY">🔥 Most Popular</option>
                <option value="SCORE">★ Highest Score</option>
                <option value="TITLE">🔤 Title (A–Z)</option>
                <option value="EPISODES">📺 Episode Count</option>
              </select>

              {/* View Switcher: Grid vs Detailed vs Compact Table */}
              <div className="flex items-center bg-[#161a27] p-1 rounded-xl border border-[#262e42]">
                <button
                  type="button"
                  onClick={() => setViewMode("GRID")}
                  title="Poster Grid View"
                  aria-label="Poster Grid View"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "GRID"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("DETAILED")}
                  title="Detailed Cards View"
                  aria-label="Detailed Cards View"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "DETAILED"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("COMPACT")}
                  title="Compact Schedule Table"
                  aria-label="Compact Schedule Table"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "COMPACT"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Genre Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 border-t border-[#1a202e]">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1 flex items-center gap-1 flex-shrink-0">
              <Filter className="w-3 h-3" />
              <span>Genre:</span>
            </span>
            {GENRE_LIST.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedGenre === genre
                    ? "bg-blue-600/25 text-blue-300 border border-blue-500/50"
                    : "bg-[#151926] hover:bg-[#1d2234] text-gray-400 hover:text-gray-200 border border-[#23293c]"
                }`}
              >
                {genre === "ALL" ? "All Genres" : genre}
              </button>
            ))}
          </div>

          {/* Results Summary Count & Reset */}
          <div className="flex items-center justify-between text-xs text-gray-400 border-t border-[#1a202e] pt-3">
            <span>
              Showing <strong className="text-white">{filteredList.length}</strong> anime for{" "}
              <span className="text-blue-400 font-bold capitalize">
                {selectedSeason.toLowerCase()} {selectedYear}
              </span>
              {selectedFormat !== "ALL" ? ` • ${selectedFormat}` : ""}
              {selectedGenre !== "ALL" ? ` • ${selectedGenre}` : ""}
              {providerFilter !== "ALL" ? ` • ${providerFilter}` : ""}
            </span>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Anime Display Layout */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-2xl bg-[#141825] border border-[#212738]"
              />
            ))}
          </div>
        ) : filteredList.length > 0 ? (
          <>
            {/* View Mode 1: Poster Grid */}
            {viewMode === "GRID" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredList.map((anime, idx) => (
                  <AnimeCard
                    key={anime.id}
                    anime={anime}
                    rank={sortBy === "POPULARITY" ? idx + 1 : undefined}
                    onWatchTrailer={handleOpenTrailer}
                  />
                ))}
              </div>
            )}

            {/* View Mode 2: Detailed Cards */}
            {viewMode === "DETAILED" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredList.map((anime, idx) => {
                  const displayTitle = anime.title.english || anime.title.romaji;
                  const score = anime.averageScore
                    ? (anime.averageScore / 10).toFixed(1)
                    : null;
                  const studio = anime.studios?.nodes?.[0]?.name;
                  const cleanDesc = stripHtml(anime.description);

                  // Extract streaming links
                  const streamLinks =
                    anime.externalLinks?.filter(
                      (l) =>
                        l.type === "STREAMING" ||
                        ["Crunchyroll", "Netflix", "Hulu", "Bilibili", "Disney Plus", "HIDIVE"].includes(
                          l.site
                        )
                    ) || [];
                  const primaryStream = streamLinks[0];

                  return (
                    <div
                      key={anime.id}
                      className="group rounded-2xl bg-[#121522] border border-[#21283c] hover:border-[#333d59] p-4 flex flex-col sm:flex-row gap-4 transition-all duration-200 hover:shadow-xl hover:bg-[#151928]"
                    >
                      {/* Left: Poster Image */}
                      <div className="relative w-full sm:w-36 aspect-[3/4] sm:aspect-auto rounded-xl overflow-hidden bg-[#181d2c] border border-[#262e44] flex-shrink-0">
                        <Link href={`/anime/${anime.id}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              anime.coverImage.extraLarge ||
                              anime.coverImage.large ||
                              anime.coverImage.medium
                            }
                            alt={displayTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </Link>
                        {score && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-white text-xs font-black border border-white/10 flex items-center gap-1 shadow">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{score}</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <WatchlistButton anime={anime} compact size="sm" />
                        </div>
                      </div>

                      {/* Right: Rich Details */}
                      <div className="flex-1 flex flex-col justify-between gap-2.5 min-w-0">
                        <div>
                          {/* Top Badges */}
                          <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold text-gray-400 mb-1">
                            {anime.format && (
                              <span className="px-2 py-0.5 rounded-md bg-[#191f2e] text-blue-300 border border-[#29324a] uppercase">
                                {anime.format.replace("_", " ")}
                              </span>
                            )}
                            {anime.episodes && (
                              <span>• {anime.episodes} episodes</span>
                            )}
                            {studio && (
                              <span className="text-gray-300 font-semibold">• {studio}</span>
                            )}
                          </div>

                          {/* Title */}
                          <Link
                            href={`/anime/${anime.id}`}
                            className="text-base sm:text-lg font-extrabold text-white group-hover:text-blue-400 transition-colors line-clamp-1"
                            title={displayTitle}
                          >
                            {displayTitle}
                          </Link>

                          {anime.title.romaji && anime.title.english && (
                            <p className="text-xs text-gray-400 line-clamp-1">
                              {anime.title.romaji}
                            </p>
                          )}

                          {/* Airing countdown or status */}
                          {anime.nextAiringEpisode ? (
                            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                              <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                              <span>
                                Ep {anime.nextAiringEpisode.episode}{" "}
                                {formatAiringCountdown(anime.nextAiringEpisode.timeUntilAiring)}
                              </span>
                            </div>
                          ) : anime.status ? (
                            <div className="mt-1.5 text-[11px] text-gray-400 font-semibold">
                              Status:{" "}
                              <span className="text-gray-300 capitalize">
                                {anime.status.toLowerCase().replace("_", " ")}
                              </span>
                            </div>
                          ) : null}

                          {/* Synopsis preview */}
                          <p className="text-xs text-gray-400 line-clamp-2 mt-2 leading-relaxed">
                            {cleanDesc || "No synopsis available for this title."}
                          </p>
                        </div>

                        {/* Bottom Row: Genres & Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#1d2334]">
                          {/* Genre tags */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(anime.genres || []).slice(0, 3).map((g) => (
                              <span
                                key={g}
                                className="text-[10px] px-2 py-0.5 rounded bg-[#181d2c] text-gray-400 border border-[#242c3f]"
                              >
                                {g}
                              </span>
                            ))}
                          </div>

                          {/* Direct Actions */}
                          <div className="flex items-center gap-2">
                            {primaryStream && (
                              <a
                                href={primaryStream.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
                              >
                                {primaryStream.site.includes("Crunchyroll") ? (
                                  <CrunchyrollLogo size={14} className="w-3.5 h-3.5" />
                                ) : primaryStream.site.includes("Netflix") ? (
                                  <NetflixLogo size={14} className="w-3.5 h-3.5" />
                                ) : (
                                  <ExternalLink className="w-3.5 h-3.5" />
                                )}
                                <span>{primaryStream.site}</span>
                              </a>
                            )}

                            {anime.trailer?.id && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenTrailer(
                                    anime.trailer!.id,
                                    displayTitle,
                                    primaryStream?.url,
                                    primaryStream?.site
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg bg-[#1a2030] hover:bg-[#222a3f] text-gray-300 hover:text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-[#2b354d]"
                              >
                                <Play className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                                <span>Trailer</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View Mode 3: Compact Schedule Table */}
            {viewMode === "COMPACT" && (
              <div className="rounded-2xl bg-[#111420] border border-[#202636] overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#202636] bg-[#141825] text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Anime Title</th>
                      <th className="py-3 px-4">Format</th>
                      <th className="py-3 px-4">Studio</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Airing / Episodes</th>
                      <th className="py-3 px-4">Streaming</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#191f2e]">
                    {filteredList.map((anime, idx) => {
                      const displayTitle = anime.title.english || anime.title.romaji;
                      const score = anime.averageScore
                        ? (anime.averageScore / 10).toFixed(1)
                        : "-";
                      const studio = anime.studios?.nodes?.[0]?.name || "-";
                      const stream = anime.externalLinks?.find(
                        (l) =>
                          l.type === "STREAMING" ||
                          ["Crunchyroll", "Netflix", "Hulu", "Bilibili"].includes(l.site)
                      );

                      return (
                        <tr
                          key={anime.id}
                          className="hover:bg-[#161b2a] transition-colors group"
                        >
                          <td className="py-3 px-4 text-center font-mono font-bold text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/anime/${anime.id}`}
                                className="w-10 h-14 rounded-lg bg-[#181d2c] overflow-hidden flex-shrink-0 border border-[#262e42]"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={anime.coverImage.medium || anime.coverImage.large}
                                  alt={displayTitle}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  loading="lazy"
                                />
                              </Link>
                              <div className="min-w-0">
                                <Link
                                  href={`/anime/${anime.id}`}
                                  className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1"
                                >
                                  {displayTitle}
                                </Link>
                                <span className="text-[11px] text-gray-400 truncate block">
                                  {anime.title.romaji}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-[#181d2c] text-blue-300 font-semibold border border-[#262e42] uppercase text-[10px]">
                              {anime.format?.replace("_", " ") || "TV"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-300 font-semibold whitespace-nowrap">
                            {studio}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-bold text-white">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{score}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-gray-400">
                            {anime.nextAiringEpisode ? (
                              <span className="text-emerald-400 font-semibold">
                                Ep {anime.nextAiringEpisode.episode}{" "}
                                {formatAiringCountdown(anime.nextAiringEpisode.timeUntilAiring)}
                              </span>
                            ) : (
                              <span>{anime.episodes ? `${anime.episodes} eps` : "TBA"}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {stream ? (
                              <a
                                href={stream.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 hover:underline font-semibold inline-flex items-center gap-1"
                              >
                                <span>{stream.site}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              {anime.trailer?.id && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenTrailer(
                                      anime.trailer!.id,
                                      displayTitle,
                                      stream?.url,
                                      stream?.site
                                    )
                                  }
                                  className="p-1.5 rounded-lg bg-[#181d2c] text-rose-400 hover:bg-rose-950/30 border border-[#273045] transition-colors"
                                  title="Watch Trailer"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                </button>
                              )}
                              <WatchlistButton anime={anime} compact size="sm" />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl bg-[#111420] border border-[#202636] p-12 text-center flex flex-col items-center justify-center gap-3">
            <Filter className="w-8 h-8 text-gray-500" />
            <div className="text-sm font-bold text-gray-200">
              No anime matched your current filter criteria
            </div>
            <p className="text-xs text-gray-500 max-w-sm">
              Try adjusting your format or platform filter, or clear your search term to see all titles from this season.
            </p>
            <button
              onClick={resetFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-[#1c2233] hover:bg-[#252d43] text-xs font-bold text-white border border-[#2d3752] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#1c2232] bg-[#0c0e15] py-8 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-300">AnimeDB</span>
            <span>•</span>
            <span>Seasonal Broadcast Directory & Archive</span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <span>Powered by AniList API</span>
            <span>•</span>
            <span>Updated Every Hour</span>
          </div>
        </div>
      </footer>

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
