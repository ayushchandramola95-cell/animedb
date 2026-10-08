"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Bookmark,
  CheckCircle2,
  Clock,
  PlayCircle,
  XCircle,
  Download,
  Upload,
  Trash2,
  Tv,
  Globe,
  BarChart2,
  Search,
  X,
  Plus,
  Minus,
  Check,
  ExternalLink,
  Play,
  Star,
  Sparkles,
  ChevronRight,
  CalendarPlus,
  LayoutGrid,
  List,
  ArrowUpDown,
  Radio,
  Trophy,
} from "lucide-react";
import { useWatchlist, WatchStatus, saveStoredWatchlist, WatchlistItem } from "@/lib/watchlist";
import Navbar from "./Navbar";
import TrailerModal from "./TrailerModal";
import WatchlistStatsModal from "./WatchlistStatsModal";
import WatchlistAddModal from "./WatchlistAddModal";
import Footer from "./Footer";
import { StreamingBrandLogo } from "./BrandLogos";
import { getGoogleCalendarUrl } from "@/lib/calendarExport";
import { AnimeMedia } from "@/lib/types";

const STATUS_CONFIG: Record<
  WatchStatus,
  { label: string; color: string; bg: string; border: string; icon: typeof PlayCircle }
> = {
  WATCHING: {
    label: "Watching",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    icon: PlayCircle,
  },
  PLAN_TO_WATCH: {
    label: "Plan to Watch",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    icon: Clock,
  },
  COMPLETED: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
  },
  DROPPED: {
    label: "Dropped",
    color: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
    icon: XCircle,
  },
};

const STARTER_RECOMMENDATIONS = [
  {
    id: 16498,
    title: { english: "Attack on Titan", romaji: "Shingeki no Kyojin" },
    coverImage: {
      large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx16498-buvcRTBx4NSm.jpg",
      medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx16498-buvcRTBx4NSm.jpg",
    },
    format: "TV",
    episodes: 25,
    averageScore: 85,
  },
  {
    id: 101922,
    title: { english: "Demon Slayer: Kimetsu no Yaiba", romaji: "Kimetsu no Yaiba" },
    coverImage: {
      large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx101922-WBsBl0ClmgYL.jpg",
      medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx101922-WBsBl0ClmgYL.jpg",
    },
    format: "TV",
    episodes: 26,
    averageScore: 82,
  },
  {
    id: 113415,
    title: { english: "JUJUTSU KAISEN", romaji: "Jujutsu Kaisen" },
    coverImage: {
      large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx113415-LHBAeoZDIsnF.jpg",
      medium: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx113415-LHBAeoZDIsnF.jpg",
    },
    format: "TV",
    episodes: 24,
    averageScore: 84,
  },
];

export default function WatchlistClient() {
  const { watchlist, isLoaded, setItemStatus, updateProgress, updateUserScore, removeItem } =
    useWatchlist();

  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedFormat, setSelectedFormat] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"UPDATED" | "SCORE" | "TITLE" | "PROGRESS" | "AIRING">(
    "UPDATED"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => Object.values(watchlist), [watchlist]);

  // Overall Statistics Breakdown
  const stats = useMemo(() => {
    let watchingCount = 0;
    let planCount = 0;
    let completedCount = 0;
    let droppedCount = 0;
    let totalEpisodesWatched = 0;
    let totalScoreSum = 0;
    let scoredItems = 0;
    let airingNowCount = 0;

    items.forEach((it) => {
      const anime = it.anime;
      if (it.status === "WATCHING") watchingCount++;
      else if (it.status === "PLAN_TO_WATCH") planCount++;
      else if (it.status === "COMPLETED") completedCount++;
      else if (it.status === "DROPPED") droppedCount++;

      // Progress count
      const prog = it.progress ?? (it.status === "COMPLETED" ? anime.episodes || 0 : 0);
      totalEpisodesWatched += prog;

      if (anime.averageScore) {
        totalScoreSum += anime.averageScore / 10;
        scoredItems++;
      }

      if (anime.nextAiringEpisode) {
        airingNowCount++;
      }
    });

    const meanScore = scoredItems > 0 ? (totalScoreSum / scoredItems).toFixed(1) : "—";
    const estimatedHours = Math.round((totalEpisodesWatched * 24) / 60);

    return {
      total: items.length,
      watching: watchingCount,
      plan: planCount,
      completed: completedCount,
      dropped: droppedCount,
      totalEpisodesWatched,
      estimatedHours,
      meanScore,
      airingNowCount,
    };
  }, [items]);

  // Filtered & Sorted Items
  const filteredItems = useMemo(() => {
    let list = [...items];

    // Status filter
    if (selectedStatus === "AIRING") {
      list = list.filter((i) => Boolean(i.anime.nextAiringEpisode));
    } else if (selectedStatus !== "ALL") {
      list = list.filter((i) => i.status === selectedStatus);
    }

    // Format filter
    if (selectedFormat !== "ALL") {
      list = list.filter((i) => {
        const fmt = i.anime.format || "";
        if (selectedFormat === "TV") return fmt.includes("TV");
        if (selectedFormat === "MOVIE") return fmt === "MOVIE";
        if (selectedFormat === "ONA_OVA") return fmt === "ONA" || fmt === "OVA" || fmt === "SPECIAL";
        return true;
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => {
        const titleEn = i.anime.title?.english || "";
        const titleRo = i.anime.title?.romaji || "";
        const studio = i.anime.studios?.nodes?.[0]?.name || "";
        const genres = i.anime.genres || [];
        return (
          titleEn.toLowerCase().includes(q) ||
          titleRo.toLowerCase().includes(q) ||
          studio.toLowerCase().includes(q) ||
          genres.some((g) => g.toLowerCase().includes(q))
        );
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "SCORE") {
        return (b.anime.averageScore || 0) - (a.anime.averageScore || 0);
      }
      if (sortBy === "TITLE") {
        const titleA = a.anime.title?.english || a.anime.title?.romaji || "";
        const titleB = b.anime.title?.english || b.anime.title?.romaji || "";
        return titleA.localeCompare(titleB);
      }
      if (sortBy === "PROGRESS") {
        const progA = a.progress ?? (a.status === "COMPLETED" ? a.anime.episodes || 0 : 0);
        const progB = b.progress ?? (b.status === "COMPLETED" ? b.anime.episodes || 0 : 0);
        return progB - progA;
      }
      if (sortBy === "AIRING") {
        const timeA = a.anime.nextAiringEpisode?.airingAt || Infinity;
        const timeB = b.anime.nextAiringEpisode?.airingAt || Infinity;
        return timeA - timeB;
      }
      // Default: UPDATED (recently modified first)
      return b.updatedAt - a.updatedAt;
    });

    return list;
  }, [items, selectedStatus, selectedFormat, searchQuery, sortBy]);

  // Handle Export JSON
  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(watchlist, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `animedb_watchlist_backup_${new Date().toISOString().split("T")[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && typeof parsed === "object") {
            saveStoredWatchlist(parsed);
          }
        } catch {
          alert("Invalid watchlist JSON backup file.");
        }
      };
    }
  };

  // Handle Clear
  const handleClearAll = () => {
    saveStoredWatchlist({});
    setClearConfirmOpen(false);
  };

  const handleOpenTrailer = (
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

  const STATUS_TABS = [
    { id: "ALL", label: "All Titles", count: stats.total, icon: Bookmark, color: "text-gray-300" },
    {
      id: "WATCHING",
      label: "Watching",
      count: stats.watching,
      icon: PlayCircle,
      color: "text-blue-400",
    },
    {
      id: "PLAN_TO_WATCH",
      label: "Plan to Watch",
      count: stats.plan,
      icon: Clock,
      color: "text-amber-400",
    },
    {
      id: "COMPLETED",
      label: "Completed",
      count: stats.completed,
      icon: CheckCircle2,
      color: "text-emerald-400",
    },
    {
      id: "DROPPED",
      label: "Dropped",
      count: stats.dropped,
      icon: XCircle,
      color: "text-rose-400",
    },
    {
      id: "AIRING",
      label: "Airing Simulcast",
      count: stats.airingNowCount,
      icon: Radio,
      color: "text-indigo-400",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d13] text-gray-100 selection:bg-blue-600/30">
      <Navbar onWatchTrailer={handleOpenTrailer} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-gray-400 font-medium"
        >
          <Link href="/" className="hover:text-blue-400 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-gray-300">Library</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-blue-400 font-semibold">Personal Anime Watchlist</span>
        </nav>

        {/* Hero Banner with Stats & Integrated Tool Suite */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#121626] via-[#101422] to-[#0c0f18] border border-[#20273a] p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold tracking-wide">
                <Bookmark className="w-3.5 h-3.5 text-blue-400 fill-blue-400/30" />
                <span>PRIVACY-FIRST ANIME TRACKER • Stored Securely in Browser</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Personal Anime Watchlist & TV Tracker
              </h1>

              <p className="text-sm text-gray-300 leading-relaxed">
                Log currently watching series, update episode progress, track weekly simulcast drops,
                and export your library to AniList, MyAnimeList, or JSON backups.
              </p>

              {/* Stat Highlights Bar */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161a29] border border-[#252c40] text-xs font-semibold text-gray-300">
                  <Bookmark className="w-3.5 h-3.5 text-blue-400" />
                  <span>{stats.total} Titles Tracked</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-300">
                  <PlayCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>{stats.watching} Watching</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161a29] border border-[#252c40] text-xs font-semibold text-gray-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>~{stats.estimatedHours} Hours Watched</span>
                </div>
                {stats.meanScore !== "—" && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161a29] border border-[#252c40] text-xs font-semibold text-gray-300">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{stats.meanScore} Mean Score</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Tools Suite */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 min-w-[260px]">
              {/* Primary Add Button */}
              <button
                onClick={() => setAddModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg hover:shadow-blue-600/30 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Anime to Watchlist</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/import"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#171b2c] hover:bg-[#20273e] text-blue-300 hover:text-white border border-[#26304a] text-xs font-semibold transition-all"
                  title="Import from AniList or MyAnimeList"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Import MAL</span>
                </Link>

                <button
                  onClick={() => setStatsModalOpen(true)}
                  disabled={items.length === 0}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none"
                  title="Generate shareable stats passport card"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Passport</span>
                </button>
              </div>

              {/* Backup & Management Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportJson}
                  disabled={items.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#141826] hover:bg-[#1d2236] text-gray-300 hover:text-white border border-[#242b3e] text-xs font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none"
                  title="Download backup file (.JSON)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Backup</span>
                </button>

                <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#141826] hover:bg-[#1d2236] text-gray-300 hover:text-white border border-[#242b3e] text-xs font-semibold transition-all cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>

                {items.length > 0 && (
                  <button
                    onClick={() => setClearConfirmOpen(true)}
                    className="p-2 rounded-xl bg-[#141826] hover:bg-rose-500/15 text-gray-400 hover:text-rose-400 border border-[#242b3e] text-xs transition-colors"
                    title="Clear entire watchlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Simulcast Airing Alert Ribbon (If User has Shows Airing Weekly) */}
        {stats.airingNowCount > 0 && (
          <div className="rounded-2xl bg-gradient-to-r from-blue-900/20 via-[#131a2e] to-indigo-900/20 border border-blue-500/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 animate-pulse">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Active Simulcasts Airing This Week</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                    {stats.airingNowCount} Shows
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Episodes of your tracked series air live on Japanese television this week.
                </p>
              </div>
            </div>

            <Link
              href="/schedule"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-white px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 transition-all self-start sm:self-auto shadow-xs"
            >
              <span>Open Airing Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Quick Stats Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-[#121626] border border-[#20273a] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
              <span>Total Saved</span>
              <Bookmark className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">{stats.total}</div>
            <div className="text-[11px] text-gray-500 mt-1">all logged series</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#121626] border border-[#20273a] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-blue-400 font-semibold">
              <span>Watching</span>
              <PlayCircle className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-2">{stats.watching}</div>
            <div className="text-[11px] text-gray-500 mt-1">in active queue</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#121626] border border-[#20273a] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
              <span>Plan to Watch</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2">{stats.plan}</div>
            <div className="text-[11px] text-gray-500 mt-1">saved for later</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#121626] border border-[#20273a] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
              <span>Completed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
              {stats.completed}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">finished seasons</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#121626] border border-[#20273a] shadow-sm flex flex-col justify-between col-span-2 sm:col-span-4 lg:col-span-1">
            <div className="flex items-center justify-between text-xs text-purple-400 font-semibold">
              <span>Total Episodes</span>
              <Trophy className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-300 mt-2">
              {stats.totalEpisodesWatched}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">~{stats.estimatedHours} hrs logged</div>
          </div>
        </div>

        {/* Multi-Faceted Filter & Search Bar - Two Crisp Clean Rows */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#121626] border border-[#20273a] shadow-lg">
          {/* Row 1: Search Input (Wide) + Format Selector + Sort Dropdown + View Mode */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search watchlist by title, studio, or genre..."
                className="w-full bg-[#0d101a] border border-[#242c42] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
              {/* Format Filter */}
              <div className="flex items-center gap-1.5 bg-[#161a29] border border-[#242c42] rounded-xl px-2.5 py-1.5 text-xs text-gray-300">
                <Tv className="w-3.5 h-3.5 text-blue-400" />
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="bg-transparent text-white text-xs outline-none cursor-pointer"
                  aria-label="Filter by format"
                >
                  <option value="ALL" className="bg-[#121624]">
                    All Formats
                  </option>
                  <option value="TV" className="bg-[#121624]">
                    TV Series
                  </option>
                  <option value="MOVIE" className="bg-[#121624]">
                    Movies
                  </option>
                  <option value="ONA_OVA" className="bg-[#121624]">
                    ONA / OVA
                  </option>
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 bg-[#161a29] border border-[#242c42] rounded-xl px-2.5 py-1.5 text-xs text-gray-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white text-xs outline-none cursor-pointer"
                  aria-label="Sort watchlist by"
                >
                  <option value="UPDATED" className="bg-[#121624]">
                    Recently Updated
                  </option>
                  <option value="SCORE" className="bg-[#121624]">
                    Highest Score
                  </option>
                  <option value="TITLE" className="bg-[#121624]">
                    Title (A-Z)
                  </option>
                  <option value="PROGRESS" className="bg-[#121624]">
                    Most Progress
                  </option>
                  <option value="AIRING" className="bg-[#121624]">
                    Next Airing
                  </option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-[#161a29] border border-[#242c42] rounded-xl p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Compact Table / List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Status Tabs (Clear, spacious, horizontal scrollbar-free) */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-[#1d2334] overflow-x-auto pb-1 scrollbar-none">
            {STATUS_TABS.map((tab) => {
              const isActive = selectedStatus === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                      : "bg-[#161a29] hover:bg-[#20263a] text-gray-400 border-[#242c42] hover:text-white"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : tab.color}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      isActive ? "bg-blue-700 text-white" : "bg-[#10131c] text-gray-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Section: Grid or List View */}
        {!isLoaded ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-2xl bg-[#141724] border border-[#20273a]"
              />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          viewMode === "grid" ? (
            /* GRID VIEW (High-fidelity vertical poster cards with episode tracker) */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const anime = item.anime;
                const title = anime.title?.english || anime.title?.romaji || "Anime";
                const studio = anime.studios?.nodes?.[0]?.name;
                const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
                const totalEps = anime.episodes || 0;
                const currentProg =
                  item.progress ?? (item.status === "COMPLETED" ? totalEps : 0);
                const percent =
                  totalEps > 0 ? Math.min(100, Math.round((currentProg / totalEps) * 100)) : 0;

                const streamLinks =
                  anime.externalLinks?.filter(
                    (l) =>
                      l.type === "STREAMING" ||
                      ["Crunchyroll", "Netflix", "Hulu", "HIDIVE", "Amazon"].some((s) =>
                        l.site.toLowerCase().includes(s.toLowerCase())
                      )
                  ) || [];
                const primaryStream = streamLinks[0];

                const gcalUrl = anime.nextAiringEpisode
                  ? getGoogleCalendarUrl({
                      ...anime,
                      nextAiringEpisode: anime.nextAiringEpisode,
                    })
                  : null;

                const statusCfg = STATUS_CONFIG[item.status];

                return (
                  <div
                    key={anime.id}
                    className="group rounded-2xl bg-[#121626] border border-[#20273a] hover:border-[#323d58] hover:bg-[#151a2e] overflow-hidden flex flex-col transition-all duration-300 shadow-md hover:shadow-xl"
                  >
                    {/* Poster Image Area */}
                    <div className="relative aspect-[3/4] bg-[#181d2c] overflow-hidden">
                      <Link href={`/anime/${anime.id}`} className="absolute inset-0 z-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            anime.coverImage?.extraLarge ||
                            anime.coverImage?.large ||
                            anime.coverImage?.medium
                          }
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121626] via-transparent to-black/60" />
                      </Link>

                      {/* Header Overlay Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                        <div className="flex items-center gap-1.5">
                          {score && (
                            <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-white text-xs font-black border border-[#2b334a] flex items-center gap-1 shadow-sm">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{score}</span>
                            </span>
                          )}
                          {anime.format && (
                            <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-gray-300 text-[10px] font-bold uppercase tracking-wider border border-[#262d40]">
                              {anime.format.replace("_", " ")}
                            </span>
                          )}
                        </div>

                        {/* Status Dropdown Selector */}
                        <div className="relative">
                          <select
                            value={item.status}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "REMOVE") {
                                removeItem(anime.id);
                              } else {
                                setItemStatus(anime, val as WatchStatus);
                              }
                            }}
                            className={`text-xs font-bold rounded-xl px-2 py-1 outline-none border transition-colors cursor-pointer shadow-md ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
                          >
                            <option value="WATCHING" className="bg-[#121624] text-white">
                              Watching
                            </option>
                            <option value="PLAN_TO_WATCH" className="bg-[#121624] text-white">
                              Plan to Watch
                            </option>
                            <option value="COMPLETED" className="bg-[#121624] text-white">
                              Completed
                            </option>
                            <option value="DROPPED" className="bg-[#121624] text-white">
                              Dropped
                            </option>
                            <option value="REMOVE" className="bg-[#121624] text-rose-400">
                              ✕ Remove
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Bottom Banner Over Poster: Next Airing Countdown or Trailer */}
                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between z-10">
                        {anime.nextAiringEpisode ? (
                          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-900/90 backdrop-blur-md text-blue-200 border border-blue-400/40 shadow-sm animate-pulse">
                            <Radio className="w-3 h-3 text-blue-300" />
                            <span>Ep {anime.nextAiringEpisode.episode} Airing Soon</span>
                          </div>
                        ) : (
                          <div className="text-[10px] font-semibold text-gray-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md">
                            {totalEps ? `${totalEps} Episodes` : "Broadcast"}
                          </div>
                        )}

                        {anime.trailer?.id && (
                          <button
                            onClick={() =>
                              handleOpenTrailer(
                                anime.trailer!.id,
                                title,
                                primaryStream?.url,
                                primaryStream?.site
                              )
                            }
                            className="p-1 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white shadow-sm transition-transform active:scale-90"
                            title="Watch Trailer"
                          >
                            <Play className="w-3 h-3 fill-white" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Body Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        {/* Title & Studio */}
                        <Link href={`/anime/${anime.id}`}>
                          <h3
                            className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 leading-snug"
                            title={title}
                          >
                            {title}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                          {studio && <span className="truncate max-w-[130px]">{studio}</span>}
                          {studio && anime.genres?.[0] && <span>•</span>}
                          {anime.genres?.[0] && <span>{anime.genres[0]}</span>}
                        </div>
                      </div>

                      {/* Episode Progress Tracker Stepper & Visual Progress Bar */}
                      <div className="p-3 rounded-xl bg-[#0e111c] border border-[#1e2538] flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-gray-400 text-[11px]">Episodes Watched:</span>
                          <span className="text-white font-mono font-bold text-xs">
                            {currentProg} {totalEps > 0 ? `/ ${totalEps}` : "eps"}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        {totalEps > 0 && (
                          <div className="w-full h-1.5 rounded-full bg-[#1b2134] overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        )}

                        {/* Interactive Stepper Buttons */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateProgress(anime.id, Math.max(0, currentProg - 1))}
                              disabled={currentProg <= 0}
                              className="w-7 h-7 rounded-lg bg-[#181d2c] hover:bg-[#222a3e] disabled:opacity-30 disabled:pointer-events-none text-gray-300 hover:text-white flex items-center justify-center text-xs font-bold transition-colors border border-[#252d42]"
                              title="Decrease 1 Episode"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => updateProgress(anime.id, currentProg + 1)}
                              disabled={totalEps > 0 && currentProg >= totalEps}
                              className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none text-white flex items-center justify-center text-xs font-bold transition-colors shadow-xs"
                              title="Add 1 Episode (+1)"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Quick Complete / Max Button */}
                          {totalEps > 0 && currentProg < totalEps && (
                            <button
                              onClick={() => updateProgress(anime.id, totalEps)}
                              className="text-[10px] font-bold text-gray-400 hover:text-emerald-400 px-2 py-1 rounded-md hover:bg-emerald-500/10 transition-colors"
                            >
                              Mark Completed
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Card Bottom Footer: Stream & Actions */}
                      <div className="pt-2 border-t border-[#1c2234] flex items-center justify-between gap-2 text-xs">
                        {primaryStream ? (
                          <a
                            href={primaryStream.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 transition-all hover:bg-blue-500/20"
                            title={`Watch on ${primaryStream.site}`}
                          >
                            <StreamingBrandLogo
                              site={primaryStream.site}
                              className="w-3.5 h-3.5 rounded"
                            />
                            <span className="truncate max-w-[80px]">{primaryStream.site}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-blue-400/70" />
                          </a>
                        ) : (
                          <Link
                            href={`/anime/${anime.id}`}
                            className="text-[11px] font-semibold text-gray-400 hover:text-white"
                          >
                            View Guide
                          </Link>
                        )}

                        <div className="flex items-center gap-2">
                          {gcalUrl && (
                            <a
                              href={gcalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="Sync Next Airing Episode to Google Calendar"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() => removeItem(anime.id)}
                            className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Remove from Watchlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* COMPACT TABLE / LIST VIEW */
            <div className="rounded-2xl bg-[#121626] border border-[#20273a] overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#141828] border-b border-[#20273a] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Anime Series</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 min-w-[170px]">Episode Progress</th>
                      <th className="py-3 px-3">Score</th>
                      <th className="py-3 px-3">Streaming</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c2234]">
                    {filteredItems.map((item) => {
                      const anime = item.anime;
                      const title = anime.title?.english || anime.title?.romaji || "Anime";
                      const studio = anime.studios?.nodes?.[0]?.name;
                      const score = anime.averageScore
                        ? (anime.averageScore / 10).toFixed(1)
                        : null;
                      const totalEps = anime.episodes || 0;
                      const currentProg =
                        item.progress ?? (item.status === "COMPLETED" ? totalEps : 0);
                      const percent =
                        totalEps > 0 ? Math.min(100, Math.round((currentProg / totalEps) * 100)) : 0;

                      const streamLinks =
                        anime.externalLinks?.filter(
                          (l) =>
                            l.type === "STREAMING" ||
                            ["Crunchyroll", "Netflix", "Hulu", "HIDIVE"].some((s) =>
                              l.site.toLowerCase().includes(s.toLowerCase())
                            )
                        ) || [];
                      const primaryStream = streamLinks[0];
                      const statusCfg = STATUS_CONFIG[item.status];

                      return (
                        <tr
                          key={`row-${anime.id}`}
                          className="hover:bg-[#161b2d] transition-colors"
                        >
                          {/* Title & Poster */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-14 rounded-lg bg-[#1a1f2e] overflow-hidden border border-[#282f42] flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={
                                    anime.coverImage?.medium ||
                                    anime.coverImage?.large ||
                                    anime.coverImage?.extraLarge
                                  }
                                  alt={title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div className="min-w-0">
                                <Link href={`/anime/${anime.id}`}>
                                  <h4
                                    className="font-bold text-white hover:text-blue-400 truncate max-w-xs"
                                    title={title}
                                  >
                                    {title}
                                  </h4>
                                </Link>
                                <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
                                  {anime.format && <span>{anime.format.replace("_", " ")}</span>}
                                  {studio && <span>• {studio}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Status Dropdown */}
                          <td className="py-3 px-3">
                            <select
                              value={item.status}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "REMOVE") removeItem(anime.id);
                                else setItemStatus(anime, val as WatchStatus);
                              }}
                              className={`text-xs font-bold rounded-xl px-2 py-1 outline-none border transition-colors cursor-pointer ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}
                            >
                              <option value="WATCHING" className="bg-[#121624] text-white">
                                Watching
                              </option>
                              <option value="PLAN_TO_WATCH" className="bg-[#121624] text-white">
                                Plan to Watch
                              </option>
                              <option value="COMPLETED" className="bg-[#121624] text-white">
                                Completed
                              </option>
                              <option value="DROPPED" className="bg-[#121624] text-white">
                                Dropped
                              </option>
                              <option value="REMOVE" className="bg-[#121624] text-rose-400">
                                Remove
                              </option>
                            </select>
                          </td>

                          {/* Episode Stepper */}
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1.5 max-w-[180px]">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-white text-xs">
                                  {currentProg} {totalEps > 0 ? `/ ${totalEps}` : "eps"}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() =>
                                      updateProgress(anime.id, Math.max(0, currentProg - 1))
                                    }
                                    disabled={currentProg <= 0}
                                    className="w-5 h-5 rounded bg-[#181d2c] hover:bg-[#242c40] disabled:opacity-30 disabled:pointer-events-none text-white flex items-center justify-center text-xs font-bold transition-colors"
                                  >
                                    -
                                  </button>
                                  <button
                                    onClick={() => updateProgress(anime.id, currentProg + 1)}
                                    disabled={totalEps > 0 && currentProg >= totalEps}
                                    className="w-5 h-5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none text-white flex items-center justify-center text-xs font-bold transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              {totalEps > 0 && (
                                <div className="w-full h-1.5 rounded-full bg-[#1c2234] overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Score */}
                          <td className="py-3 px-3 font-semibold">
                            {score ? (
                              <span className="flex items-center gap-1 text-amber-400 font-bold">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                <span>{score}</span>
                              </span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>

                          {/* Streaming Provider */}
                          <td className="py-3 px-3">
                            {primaryStream ? (
                              <a
                                href={primaryStream.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-semibold transition-all"
                              >
                                <StreamingBrandLogo
                                  site={primaryStream.site}
                                  className="w-3.5 h-3.5"
                                />
                                <span>{primaryStream.site}</span>
                              </a>
                            ) : (
                              <span className="text-gray-500 italic">Guide</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {anime.trailer?.id && (
                                <button
                                  onClick={() =>
                                    handleOpenTrailer(
                                      anime.trailer!.id,
                                      title,
                                      primaryStream?.url,
                                      primaryStream?.site
                                    )
                                  }
                                  className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                                  title="Trailer"
                                >
                                  <Play className="w-3.5 h-3.5 fill-rose-500" />
                                </button>
                              )}
                              <button
                                onClick={() => removeItem(anime.id)}
                                className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* Empty State & Starter Recommendations */
          <div className="rounded-3xl bg-[#121626] border border-[#20273a] p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-6 shadow-md">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
              <Bookmark className="w-8 h-8 fill-blue-500/20" />
            </div>

            <div className="flex flex-col gap-1.5 max-w-md">
              <h3 className="text-lg font-bold text-white">
                {items.length === 0
                  ? "Your Watchlist is Ready for Your First Anime"
                  : `No series found in "${selectedStatus.replace("_", " ").toLowerCase()}"`}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {items.length === 0
                  ? "Use the search button above, import an existing list from AniList or MyAnimeList, or pick from our curated starter picks below to get tracking."
                  : "Try clearing your active search filter or resetting your status selection."}
              </p>
            </div>

            {items.length === 0 && (
              <div className="w-full max-w-xl pt-4 border-t border-[#1e2538]">
                <span className="text-xs font-bold text-gray-400 flex items-center justify-center gap-1.5 mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Popular Starter Recommendations (1-Click Add):</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {STARTER_RECOMMENDATIONS.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-2xl bg-[#151a2c] border border-[#242c44] flex flex-col items-center gap-2 hover:border-blue-500/50 transition-all text-center"
                    >
                      <div className="w-14 h-20 rounded-xl bg-[#1e2538] overflow-hidden border border-[#2b354e]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={rec.coverImage.large}
                          alt={rec.title.english}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-bold text-white line-clamp-1">
                        {rec.title.english}
                      </span>
                      <button
                        onClick={() =>
                          setItemStatus(
                            {
                              ...rec,
                              title: rec.title,
                              coverImage: rec.coverImage,
                              format: rec.format,
                              episodes: rec.episodes,
                              averageScore: rec.averageScore,
                            } as any,
                            "WATCHING"
                          )
                        }
                        className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-colors shadow-xs"
                      >
                        + Add to Watching
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap justify-center pt-2">
              <button
                onClick={() => setAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Anime Manually</span>
              </button>

              <Link
                href="/import"
                className="px-4 py-2 rounded-xl bg-[#181d2e] hover:bg-[#22283e] text-blue-300 text-xs font-semibold border border-[#273048] transition-colors flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Import from MAL / AniList</span>
              </Link>

              <Link
                href="/top"
                className="px-4 py-2 rounded-xl bg-[#181d2e] hover:bg-[#22283e] text-gray-300 text-xs font-semibold border border-[#273048] transition-colors flex items-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Browse Top 100</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Modern Comprehensive Footer */}
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

      {/* Stats Passport Modal */}
      <WatchlistStatsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        watchlist={watchlist}
      />

      {/* Quick Add Anime Search Modal */}
      <WatchlistAddModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />

      {/* Clear Confirmation Modal */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#121626] border border-[#242c42] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Clear entire watchlist?</h3>
              <p className="text-xs text-gray-400 mt-1">
                This will delete all saved titles and progress from your browser. We recommend
                exporting a JSON backup first.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setClearConfirmOpen(false)}
                className="flex-1 py-2 rounded-xl bg-[#161a29] hover:bg-[#20273c] text-gray-300 text-xs font-semibold border border-[#252c40] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-md"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
