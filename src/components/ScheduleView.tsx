"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  ExternalLink,
  Play,
  Tv,
  Globe,
  Star,
  CheckCircle2,
  Download,
  Search,
  X,
  Radio,
  Bookmark,
  CalendarPlus,
  Sparkles,
  ChevronRight,
  LayoutGrid,
  List,
  ArrowUpDown,
  Flame,
  Share2,
} from "lucide-react";
import { ScheduleItem, AnimeMedia } from "@/lib/types";
import Navbar from "./Navbar";
import TrailerModal from "./TrailerModal";
import Footer from "./Footer";
import AiringNotifyButton from "./AiringNotifyButton";
import WatchlistButton from "./WatchlistButton";
import { downloadScheduleIcs, getGoogleCalendarUrl } from "@/lib/calendarExport";
import {
  StreamingBrandLogo,
  CrunchyrollLogo,
  NetflixLogo,
  HuluLogo,
  PrimeVideoLogo,
  HidiveLogo,
  DisneyPlusLogo,
} from "./BrandLogos";
import { useWatchlist } from "@/lib/watchlist";

interface ScheduleViewProps {
  initialSchedule: ScheduleItem[];
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const TIMEZONE_PRESETS = [
  { value: "AUTO", label: "Auto-detect (System Local)" },
  { value: "Asia/Tokyo", label: "Tokyo, Japan (JST • UTC+9)" },
  { value: "America/New_York", label: "New York / Eastern (EDT/EST • UTC-4)" },
  { value: "America/Chicago", label: "Chicago / Central (CDT/CST • UTC-5)" },
  { value: "America/Los_Angeles", label: "Los Angeles / Pacific (PDT/PST • UTC-7)" },
  { value: "Europe/London", label: "London / UK (BST/GMT • UTC+1)" },
  { value: "Europe/Paris", label: "Paris / Berlin (CEST/CET • UTC+2)" },
  { value: "Asia/Kolkata", label: "India / IST (UTC+5:30)" },
  { value: "Asia/Singapore", label: "Singapore / SGT (UTC+8)" },
  { value: "Australia/Sydney", label: "Sydney / AEST (UTC+10)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
];

const STREAM_PLATFORMS = [
  { id: "ALL", label: "All Platforms", logo: null },
  { id: "Crunchyroll", label: "Crunchyroll", logo: CrunchyrollLogo },
  { id: "Netflix", label: "Netflix", logo: NetflixLogo },
  { id: "Hulu", label: "Hulu", logo: HuluLogo },
  { id: "Prime", label: "Prime Video", logo: PrimeVideoLogo },
  { id: "HIDIVE", label: "HIDIVE", logo: HidiveLogo },
  { id: "Disney", label: "Disney+", logo: DisneyPlusLogo },
];

export default function ScheduleView({ initialSchedule }: ScheduleViewProps) {
  const { watchlist, getStatus } = useWatchlist();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTz, setSelectedTz] = useState<string>("AUTO");
  const [resolvedLocalTz, setResolvedLocalTz] = useState<string>("UTC");
  const [currentTime, setCurrentTime] = useState<number>(Math.floor(Date.now() / 1000));
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [streamFilter, setStreamFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UPCOMING" | "AIRED" | "WATCHLIST">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"AIR_TIME" | "POPULARITY" | "SCORE">("AIR_TIME");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  // Client mounting & initial timezone resolution
  useEffect(() => {
    setIsMounted(true);
    try {
      const local = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      setResolvedLocalTz(local);

      const savedTz = localStorage.getItem("animedb_schedule_tz");
      if (savedTz) {
        setSelectedTz(savedTz);
      }
    } catch {
      setResolvedLocalTz("UTC");
    }
  }, []);

  // Live timer tick every 15 seconds to keep countdowns and live broadcast indicators fresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Effective timezone string for Intl calculations
  const effectiveTz = useMemo(() => {
    if (!isMounted) return "UTC";
    if (selectedTz === "AUTO") return resolvedLocalTz;
    return selectedTz;
  }, [isMounted, selectedTz, resolvedLocalTz]);

  // Handle timezone change
  const handleTimezoneChange = (newTz: string) => {
    setSelectedTz(newTz);
    try {
      localStorage.setItem("animedb_schedule_tz", newTz);
    } catch {
      // ignore
    }
  };

  // Helper to get day index (0..6) and formatted times in the effective timezone
  const getDayInfoInTz = useMemo(() => {
    return (timestampSec: number) => {
      const date = new Date(timestampSec * 1000);
      try {
        const weekday = new Intl.DateTimeFormat("en-US", {
          timeZone: effectiveTz,
          weekday: "long",
        }).format(date);

        const timeStr = new Intl.DateTimeFormat("en-US", {
          timeZone: effectiveTz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(date);

        const dateStr = new Intl.DateTimeFormat("en-US", {
          timeZone: effectiveTz,
          month: "short",
          day: "numeric",
        }).format(date);

        const dayIdx = DAYS_OF_WEEK.indexOf(weekday as (typeof DAYS_OF_WEEK)[number]);
        return {
          dayIndex: dayIdx !== -1 ? dayIdx : date.getDay(),
          timeStr,
          dateStr,
        };
      } catch {
        return {
          dayIndex: date.getDay(),
          timeStr: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          dateStr: date.toLocaleDateString([], { month: "short", day: "numeric" }),
        };
      }
    };
  }, [effectiveTz]);

  // Current today index in effective timezone
  const currentTodayIndex = useMemo(() => {
    if (!isMounted) return new Date().getDay();
    try {
      const todayWeekday = new Intl.DateTimeFormat("en-US", {
        timeZone: effectiveTz,
        weekday: "long",
      }).format(new Date(currentTime * 1000));
      const idx = DAYS_OF_WEEK.indexOf(todayWeekday as (typeof DAYS_OF_WEEK)[number]);
      return idx !== -1 ? idx : new Date().getDay();
    } catch {
      return new Date().getDay();
    }
  }, [isMounted, effectiveTz, currentTime]);

  // Set selected day on initial load to current day
  useEffect(() => {
    if (isMounted) {
      setSelectedDayIndex(currentTodayIndex);
    }
  }, [isMounted, currentTodayIndex]);

  // Calculate calendar date labels for Sunday..Saturday for current week in effective timezone
  const weekDates = useMemo(() => {
    return DAYS_OF_WEEK.map((_, idx) => {
      const dayDiff = idx - currentTodayIndex;
      const targetMs = (currentTime + dayDiff * 86400) * 1000;
      try {
        return new Intl.DateTimeFormat("en-US", {
          timeZone: effectiveTz,
          month: "short",
          day: "numeric",
        }).format(new Date(targetMs));
      } catch {
        const d = new Date(targetMs);
        return d.toLocaleDateString([], { month: "short", day: "numeric" });
      }
    });
  }, [currentTime, currentTodayIndex, effectiveTz]);

  // Partition all schedule items by day of the week in effective timezone
  const itemsByDay = useMemo(() => {
    const map: Record<number, ScheduleItem[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    initialSchedule.forEach((item) => {
      const { dayIndex } = getDayInfoInTz(item.airingAt);
      if (map[dayIndex]) {
        map[dayIndex].push(item);
      }
    });

    // Sort chronologically within each day bucket
    Object.keys(map).forEach((k) => {
      map[Number(k)].sort((a, b) => a.airingAt - b.airingAt);
    });

    return map;
  }, [initialSchedule, getDayInfoInTz]);

  // Global counts for hero statistics
  const totalWeekReleases = useMemo(() => {
    return initialSchedule.length;
  }, [initialSchedule]);

  const todayReleasesCount = useMemo(() => {
    return itemsByDay[currentTodayIndex]?.length || 0;
  }, [itemsByDay, currentTodayIndex]);

  // Spotlights: Shows airing in the next 12 hours or currently broadcasting live
  const upcomingSpotlights = useMemo(() => {
    return initialSchedule
      .filter((item) => {
        const diff = item.airingAt - currentTime;
        return (diff >= -1800 && diff <= 12 * 3600);
      })
      .slice(0, 4);
  }, [initialSchedule, currentTime]);

  // Filter and sort items for the currently selected day
  const filteredDayItems = useMemo(() => {
    const rawItems = itemsByDay[selectedDayIndex] || [];

    return rawItems
      .filter((item) => {
        const anime = item.media;
        const titleEn = anime.title.english || "";
        const titleRo = anime.title.romaji || "";
        const studio = anime.studios?.nodes?.[0]?.name || "";
        const genres = anime.genres || [];

        // Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            titleEn.toLowerCase().includes(q) ||
            titleRo.toLowerCase().includes(q) ||
            studio.toLowerCase().includes(q) ||
            genres.some((g) => g.toLowerCase().includes(q));
          if (!matches) return false;
        }

        // Platform Filter
        if (streamFilter !== "ALL") {
          const hasStream = anime.externalLinks?.some((l) =>
            l.site.toLowerCase().includes(streamFilter.toLowerCase())
          );
          if (!hasStream) return false;
        }

        // Status Filter
        const diff = item.airingAt - currentTime;
        const isAired = diff < -1800; // past 30 mins after broadcast
        const isLiveOrUpcoming = diff >= -1800;

        if (statusFilter === "UPCOMING" && isAired) return false;
        if (statusFilter === "AIRED" && isLiveOrUpcoming) return false;
        if (statusFilter === "WATCHLIST") {
          const inWatchlist = Boolean(getStatus(anime.id));
          if (!inWatchlist) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "SCORE") {
          const scoreA = a.media.averageScore || 0;
          const scoreB = b.media.averageScore || 0;
          return scoreB - scoreA;
        }
        if (sortBy === "POPULARITY") {
          const popA = a.media.popularity || 0;
          const popB = b.media.popularity || 0;
          return popB - popA;
        }

        // Default: AIR_TIME logic
        // Active live broadcast or upcoming first, chronologically
        // Aired episodes moved to bottom
        const diffA = a.airingAt - currentTime;
        const diffB = b.airingAt - currentTime;
        const aIsAired = diffA < -1800;
        const bIsAired = diffB < -1800;

        if (aIsAired && !bIsAired) return 1;
        if (!aIsAired && bIsAired) return -1;

        if (aIsAired && bIsAired) {
          // Most recently aired first
          return b.airingAt - a.airingAt;
        }

        // Upcoming: closest air time first
        return a.airingAt - b.airingAt;
      });
  }, [
    itemsByDay,
    selectedDayIndex,
    searchQuery,
    streamFilter,
    statusFilter,
    sortBy,
    currentTime,
    getStatus,
  ]);

  // Counts for status tabs for the selected day
  const statusCounts = useMemo(() => {
    const raw = itemsByDay[selectedDayIndex] || [];
    let upcomingCount = 0;
    let airedCount = 0;
    let watchlistCount = 0;

    raw.forEach((item) => {
      const diff = item.airingAt - currentTime;
      if (diff >= -1800) upcomingCount++;
      else airedCount++;

      if (getStatus(item.media.id)) watchlistCount++;
    });

    return {
      all: raw.length,
      upcoming: upcomingCount,
      aired: airedCount,
      watchlist: watchlistCount,
    };
  }, [itemsByDay, selectedDayIndex, currentTime, getStatus]);

  // Helper for human countdown text
  const formatCountdown = (airingAt: number) => {
    const diff = airingAt - currentTime;
    if (diff <= 0 && diff >= -1800) {
      return { type: "LIVE", text: "AIRING NOW (Live Broadcast)" };
    }
    if (diff < -1800) {
      return { type: "AIRED", text: "Aired" };
    }
    if (diff < 60) {
      return { type: "SOON", text: "Airing in moments" };
    }
    const mins = Math.floor(diff / 60);
    if (mins < 60) {
      return { type: "COUNTDOWN", text: `Airs in ${mins}m` };
    }
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours < 24) {
      return {
        type: "COUNTDOWN",
        text: remMins > 0 ? `Airs in ${hours}h ${remMins}m` : `Airs in ${hours}h`,
      };
    }
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return {
      type: "COUNTDOWN",
      text: remHours > 0 ? `Airs in ${days}d ${remHours}h` : `Airs in ${days}d`,
    };
  };

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

  // Export calendar helper
  const handleExportWeekIcs = () => {
    const animeListForExport = initialSchedule.map((s) => ({
      ...s.media,
      nextAiringEpisode: {
        episode: s.episode,
        airingAt: s.airingAt,
        timeUntilAiring: Math.max(0, s.airingAt - currentTime),
      },
    }));
    downloadScheduleIcs(animeListForExport, "AnimeDB_7Day_Simulcast_Schedule.ics");
  };

  const handleExportDayIcs = () => {
    const dayItems = itemsByDay[selectedDayIndex] || [];
    const animeListForExport = dayItems.map((s) => ({
      ...s.media,
      nextAiringEpisode: {
        episode: s.episode,
        airingAt: s.airingAt,
        timeUntilAiring: Math.max(0, s.airingAt - currentTime),
      },
    }));
    const dayName = DAYS_OF_WEEK[selectedDayIndex];
    downloadScheduleIcs(animeListForExport, `AnimeDB_${dayName}_Schedule.ics`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d13] text-gray-100 selection:bg-blue-600/30">
      <Navbar onWatchTrailer={handleWatchTrailer} />

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
          <span className="text-gray-300">Tools</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-blue-400 font-semibold">Weekly Airing Schedule</span>
        </nav>

        {/* Hero Banner with Integrated Timezone Selector & Calendar Export */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#121624] via-[#101420] to-[#0d101a] border border-[#20273a] p-6 sm:p-8 overflow-hidden shadow-2xl">
          {/* Subtle Ambient Backing Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold tracking-wide">
                <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>BROADCAST ENGINE 2.0 • Real-Time Simulcast Airing Schedule</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Weekly Anime Broadcast Calendar
              </h1>

              <p className="text-sm text-gray-300 leading-relaxed">
                Track live television broadcasts & simulcasts across Tokyo networks and global
                streaming platforms. Air times and countdowns automatically synchronize to your
                selected timezone.
              </p>

              {/* Quick Stat Chips */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161a29] border border-[#252c40] text-xs font-semibold text-gray-300">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>{totalWeekReleases} Episodes This Week</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-300">
                  <Flame className="w-3.5 h-3.5 text-blue-400" />
                  <span>{todayReleasesCount} Airing Today</span>
                </div>
                {statusCounts.watchlist > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
                    <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
                    <span>{statusCounts.watchlist} in Your Watchlist</span>
                  </div>
                )}
              </div>
            </div>

            {/* Timezone Selector & Calendar Export Suite */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[280px]">
              {/* Interactive Timezone Dropdown */}
              <div className="bg-[#151928] border border-[#242c42] rounded-2xl p-3 shadow-lg">
                <div className="flex items-center justify-between gap-2 mb-2 text-xs text-gray-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Airing Timezone:</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    {effectiveTz === "UTC" ? "UTC" : effectiveTz.split("/").pop()?.replace("_", " ")}
                  </span>
                </div>

                <select
                  value={selectedTz}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="w-full bg-[#0d101a] border border-[#28324a] text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500 font-medium transition-colors cursor-pointer"
                  aria-label="Select Airing Timezone"
                >
                  {TIMEZONE_PRESETS.map((tz) => (
                    <option key={tz.value} value={tz.value} className="bg-[#121624] text-white py-1">
                      {tz.label}
                    </option>
                  ))}
                </select>

                <p className="text-[10px] text-gray-400 mt-2 flex items-center justify-between">
                  <span>Day columns shift dynamically to match your local air clock.</span>
                </p>
              </div>

              {/* Bulk Calendar Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportWeekIcs}
                  className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-blue-600/30"
                  title="Download full 7-Day .ics schedule for Google, Apple, or Outlook Calendar"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export 7-Day (.ICS)</span>
                </button>
                <button
                  onClick={handleExportDayIcs}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#161a29] hover:bg-[#1f253a] text-gray-300 hover:text-white border border-[#252c40] text-xs font-semibold transition-all"
                  title={`Export only ${DAYS_OF_WEEK[selectedDayIndex]}'s schedule (.ICS)`}
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Day Only</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Broadcast Spotlight Ticker (Shows Airing in Next 12 Hours or Live Now) */}
        {upcomingSpotlights.length > 0 && (
          <div className="rounded-2xl bg-[#121626]/90 border border-[#212940] p-4 flex flex-col gap-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-200">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Next Airing Broadcasts (Coming Up Next)</span>
              </div>
              <span className="text-[11px] text-gray-400">
                Updated in real-time
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {upcomingSpotlights.map((spotlight) => {
                const anime = spotlight.media;
                const title = anime.title.english || anime.title.romaji;
                const countdown = formatCountdown(spotlight.airingAt);
                const { timeStr } = getDayInfoInTz(spotlight.airingAt);

                return (
                  <div
                    key={`spotlight-${spotlight.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#171b2d] border border-[#242c44] hover:border-blue-500/50 transition-all group"
                  >
                    <Link href={`/anime/${anime.id}`} className="relative flex-shrink-0">
                      <div className="w-12 h-16 rounded-lg bg-[#20273a] overflow-hidden border border-[#2d3752]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={anime.coverImage.medium || anime.coverImage.large}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        {countdown.type === "LIVE" ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            AIRING
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-400">
                            {countdown.text}
                          </span>
                        )}
                        <span className="text-[9px] font-semibold text-gray-400">
                          • Ep {spotlight.episode}
                        </span>
                      </div>

                      <Link href={`/anime/${anime.id}`}>
                        <h4
                          className="text-xs font-bold text-white group-hover:text-blue-400 truncate"
                          title={title}
                        >
                          {title}
                        </h4>
                      </Link>

                      <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span>{timeStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7-Day Week Selector Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {DAYS_OF_WEEK.map((dayName, idx) => {
            const isSelected = selectedDayIndex === idx;
            const isToday = currentTodayIndex === idx;
            const isPast = idx < currentTodayIndex;
            const count = itemsByDay[idx]?.length || 0;
            const dateLabel = weekDates[idx] || "";

            return (
              <button
                key={dayName}
                onClick={() => setSelectedDayIndex(idx)}
                className={`group relative p-3 sm:p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-b from-blue-600 to-blue-700 border-blue-400 text-white shadow-xl shadow-blue-600/25 scale-[1.02]"
                    : "bg-[#131724] border-[#20273a] text-gray-400 hover:text-white hover:border-[#303a55] hover:bg-[#161b2b]"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider ${
                        isSelected ? "text-white" : "text-gray-300"
                      }`}
                    >
                      {dayName.slice(0, 3)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        isSelected ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {dateLabel}
                    </span>
                  </div>

                  {isToday ? (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isSelected
                          ? "bg-white text-blue-700 shadow-xs"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse"
                      }`}
                    >
                      Today
                    </span>
                  ) : isPast ? (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        isSelected
                          ? "bg-blue-800 text-blue-200"
                          : "bg-[#181d2c] text-gray-500 border border-[#252c42]"
                      }`}
                    >
                      Aired
                    </span>
                  ) : null}
                </div>

                <div className="mt-2.5 flex items-baseline justify-between">
                  <span
                    className={`text-sm font-bold tracking-tight ${
                      isSelected ? "text-white" : "text-gray-200"
                    }`}
                  >
                    {dayName}
                  </span>
                </div>

                <div
                  className={`mt-1 text-[11px] font-semibold flex items-center justify-between ${
                    isSelected
                      ? "text-blue-100"
                      : isPast
                      ? "text-emerald-400/90"
                      : "text-gray-400"
                  }`}
                >
                  <span>
                    {count} {count === 1 ? "release" : "releases"}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Multi-Faceted Controls & Filters Bar */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#121626] border border-[#20273a] shadow-lg">
          {/* Top Row: Search Input + Status Pills + Sort & View Toggles */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${DAYS_OF_WEEK[selectedDayIndex]} by title, studio, genre...`}
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

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-colors font-semibold ${
                  statusFilter === "ALL"
                    ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                    : "bg-[#161a29] text-gray-400 border-[#242c42] hover:text-white"
                }`}
              >
                All Shows ({statusCounts.all})
              </button>
              <button
                onClick={() => setStatusFilter("UPCOMING")}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-colors font-semibold flex items-center gap-1.5 ${
                  statusFilter === "UPCOMING"
                    ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                    : "bg-[#161a29] text-gray-400 border-[#242c42] hover:text-white"
                }`}
              >
                <Clock className="w-3 h-3 text-blue-400" />
                <span>Upcoming ({statusCounts.upcoming})</span>
              </button>
              <button
                onClick={() => setStatusFilter("AIRED")}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-colors font-semibold flex items-center gap-1.5 ${
                  statusFilter === "AIRED"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                    : "bg-[#161a29] text-gray-400 border-[#242c42] hover:text-white"
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Aired ({statusCounts.aired})</span>
              </button>
              <button
                onClick={() => setStatusFilter("WATCHLIST")}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-colors font-semibold flex items-center gap-1.5 ${
                  statusFilter === "WATCHLIST"
                    ? "bg-amber-600 text-white border-amber-500 shadow-sm"
                    : "bg-[#161a29] text-gray-400 border-[#242c42] hover:text-white"
                }`}
              >
                <Bookmark className="w-3 h-3 text-amber-400 fill-amber-400/40" />
                <span>My Watchlist ({statusCounts.watchlist})</span>
              </button>
            </div>

            {/* Sort & View Mode Switches */}
            <div className="flex items-center gap-2 self-start lg:self-auto">
              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 bg-[#161a29] border border-[#242c42] rounded-xl px-2.5 py-1 text-xs text-gray-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white text-xs outline-none cursor-pointer"
                  aria-label="Sort Episodes By"
                >
                  <option value="AIR_TIME" className="bg-[#121624]">
                    Air Time
                  </option>
                  <option value="SCORE" className="bg-[#121624]">
                    Top Rated
                  </option>
                  <option value="POPULARITY" className="bg-[#121624]">
                    Most Popular
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
                  title="Compact List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Official Streaming Platform Filter Pills with SVG Logos */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#1d2334] overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 flex-shrink-0">
              <Tv className="w-3.5 h-3.5 text-blue-400" />
              <span>Platform:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              {STREAM_PLATFORMS.map((plat) => {
                const isSelected = streamFilter === plat.id;
                const LogoComp = plat.logo;

                return (
                  <button
                    key={plat.id}
                    onClick={() => setStreamFilter(plat.id)}
                    className={`text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition-all font-semibold ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-500 shadow-xs"
                        : "bg-[#161a29] text-gray-400 border-[#242c42] hover:text-white hover:border-[#323d5a]"
                    }`}
                  >
                    {LogoComp && <LogoComp className="w-3.5 h-3.5" size={14} />}
                    <span>{plat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Schedule Grid / List Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>{DAYS_OF_WEEK[selectedDayIndex]} Broadcast Schedule</span>
              {weekDates[selectedDayIndex] && (
                <span className="text-xs text-blue-400 font-bold px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                  {weekDates[selectedDayIndex]}
                </span>
              )}
              <span className="text-xs text-gray-400 font-medium">
                ({filteredDayItems.length} shows)
              </span>
            </h2>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Timezone:</span>
              <span className="font-semibold text-emerald-400">{effectiveTz}</span>
            </div>
          </div>

          {filteredDayItems.length > 0 ? (
            viewMode === "grid" ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDayItems.map((item) => {
                  const anime = item.media;
                  const title = anime.title.english || anime.title.romaji;
                  const studio = anime.studios?.nodes?.[0]?.name;
                  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
                  const streamLinks =
                    anime.externalLinks?.filter(
                      (l) =>
                        l.type === "STREAMING" ||
                        ["Crunchyroll", "Netflix", "Hulu", "HIDIVE", "Amazon", "Disney"].some((s) =>
                          l.site.toLowerCase().includes(s.toLowerCase())
                        )
                    ) || [];
                  const primaryStream = streamLinks[0];

                  const countdown = formatCountdown(item.airingAt);
                  const isAired = countdown.type === "AIRED";
                  const isLive = countdown.type === "LIVE";
                  const { timeStr } = getDayInfoInTz(item.airingAt);

                  const posterSrc =
                    anime.coverImage.extraLarge ||
                    anime.coverImage.large ||
                    anime.coverImage.medium;

                  const gcalUrl = getGoogleCalendarUrl({
                    ...anime,
                    nextAiringEpisode: {
                      episode: item.episode,
                      airingAt: item.airingAt,
                      timeUntilAiring: Math.max(0, item.airingAt - currentTime),
                    },
                  });

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 flex gap-4 transition-all group ${
                        isLive
                          ? "bg-[#181a2e] border-rose-500/40 ring-1 ring-rose-500/30 shadow-lg shadow-rose-950/20"
                          : isAired
                          ? "bg-[#10131e]/90 border-[#1c2233] hover:border-[#2a334c] opacity-85 hover:opacity-100"
                          : "bg-[#121626] border-[#20273a] hover:border-[#323d58] hover:bg-[#151a2e] shadow-md"
                      }`}
                    >
                      {/* Poster Thumbnail */}
                      <Link href={`/anime/${anime.id}`} className="flex-shrink-0 relative">
                        <div className="w-20 h-28 rounded-xl bg-[#1a1f2e] overflow-hidden border border-[#282f42] relative shadow-inner">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={posterSrc}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />

                          {/* Overlay Status Strip */}
                          {isLive ? (
                            <div className="absolute bottom-0 inset-x-0 bg-rose-600 text-white text-[9px] font-black tracking-wide text-center py-0.5 animate-pulse">
                              LIVE
                            </div>
                          ) : isAired ? (
                            <div className="absolute bottom-0 inset-x-0 bg-emerald-700/90 text-white text-[9px] font-black tracking-wide text-center py-0.5">
                              AIRED
                            </div>
                          ) : null}
                        </div>
                      </Link>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          {/* Status and Episode Number Row */}
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            {isLive ? (
                              <div className="flex items-center gap-1 text-[11px] font-extrabold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>AIRING NOW</span>
                              </div>
                            ) : isAired ? (
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Aired ({timeStr})</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {countdown.text} • {timeStr}
                                </span>
                              </div>
                            )}

                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#181d2c] text-blue-300 border border-[#252c42]">
                              Ep {item.episode}
                            </span>
                          </div>

                          {/* Anime Title */}
                          <Link href={`/anime/${anime.id}`}>
                            <h3
                              className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 leading-snug"
                              title={title}
                            >
                              {title}
                            </h3>
                          </Link>

                          {/* Metadata: Studio, Format, Rating */}
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1 flex-wrap">
                            {studio && <span className="truncate max-w-[110px] font-medium">{studio}</span>}
                            {studio && anime.format && <span>•</span>}
                            {anime.format && <span>{anime.format.replace("_", " ")}</span>}
                            {score && (
                              <>
                                <span>•</span>
                                <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  {score}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="pt-2 mt-2 border-t border-[#1c2234] flex items-center justify-between gap-1.5 text-xs">
                          {/* Left: Trailer Button */}
                          <div className="flex items-center gap-1.5">
                            {anime.trailer?.id ? (
                              <button
                                onClick={() =>
                                  handleWatchTrailer(
                                    anime.trailer!.id,
                                    title,
                                    primaryStream?.url,
                                    primaryStream?.site
                                  )
                                }
                                className="text-[11px] font-bold text-gray-300 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#1a2030] transition-colors"
                              >
                                <Play className="w-3 h-3 fill-rose-500 text-rose-500" />
                                <span>Trailer</span>
                              </button>
                            ) : null}

                            {/* Google Calendar Add Button */}
                            {!isAired && gcalUrl && (
                              <a
                                href={gcalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                title="Add episode broadcast to Google Calendar"
                              >
                                <CalendarPlus className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>

                          {/* Right: Watchlist + Notify + Stream */}
                          <div className="flex items-center gap-1.5">
                            {/* Watchlist Toggle */}
                            <WatchlistButton anime={anime} compact size="sm" />

                            {/* Browser Notification Bell */}
                            {!isAired && (
                              <AiringNotifyButton
                                anime={{
                                  ...anime,
                                  nextAiringEpisode: {
                                    episode: item.episode,
                                    airingAt: item.airingAt,
                                    timeUntilAiring: Math.max(0, item.airingAt - currentTime),
                                  },
                                }}
                                compact
                              />
                            )}

                            {/* Stream Link Pill */}
                            {primaryStream ? (
                              <a
                                href={primaryStream.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 transition-all hover:bg-blue-500/20"
                                title={`Watch on ${primaryStream.site}`}
                              >
                                <StreamingBrandLogo
                                  site={primaryStream.site}
                                  className="w-3.5 h-3.5 rounded"
                                />
                                <span className="max-w-[70px] truncate">{primaryStream.site}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-blue-400/70" />
                              </a>
                            ) : (
                              <Link
                                href={`/anime/${anime.id}`}
                                className="text-[11px] font-semibold text-gray-400 hover:text-white px-1.5 py-0.5"
                              >
                                Details
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* COMPACT LIST VIEW */
              <div className="flex flex-col gap-2 rounded-2xl bg-[#121626] border border-[#20273a] p-3 shadow-md">
                {filteredDayItems.map((item) => {
                  const anime = item.media;
                  const title = anime.title.english || anime.title.romaji;
                  const studio = anime.studios?.nodes?.[0]?.name;
                  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
                  const streamLinks =
                    anime.externalLinks?.filter(
                      (l) =>
                        l.type === "STREAMING" ||
                        ["Crunchyroll", "Netflix", "Hulu", "HIDIVE", "Amazon"].some((s) =>
                          l.site.toLowerCase().includes(s.toLowerCase())
                        )
                    ) || [];
                  const primaryStream = streamLinks[0];

                  const countdown = formatCountdown(item.airingAt);
                  const isAired = countdown.type === "AIRED";
                  const isLive = countdown.type === "LIVE";
                  const { timeStr } = getDayInfoInTz(item.airingAt);

                  return (
                    <div
                      key={`list-${item.id}`}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                        isLive
                          ? "bg-rose-950/20 border-rose-500/40"
                          : isAired
                          ? "bg-[#10131e]/60 border-[#1c2233] opacity-80"
                          : "bg-[#141829] border-[#222a3e] hover:border-blue-500/40"
                      }`}
                    >
                      {/* Left: Time & Title */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-20 text-center flex-shrink-0">
                          <span className="text-xs font-black text-white">{timeStr}</span>
                          <div className="text-[10px] text-gray-400 font-semibold">
                            {isLive ? (
                              <span className="text-rose-400 font-bold">LIVE NOW</span>
                            ) : isAired ? (
                              <span className="text-emerald-400">Aired</span>
                            ) : (
                              countdown.text
                            )}
                          </div>
                        </div>

                        <div className="w-10 h-14 rounded-lg bg-[#1c2233] overflow-hidden flex-shrink-0 border border-[#28324a]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={anime.coverImage.medium || anime.coverImage.large}
                            alt={title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              Ep {item.episode}
                            </span>
                            <Link href={`/anime/${anime.id}`}>
                              <h4
                                className="text-sm font-bold text-white hover:text-blue-400 truncate"
                                title={title}
                              >
                                {title}
                              </h4>
                            </Link>
                          </div>
                          <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                            {studio && <span className="truncate">{studio}</span>}
                            {score && (
                              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-400" />
                                {score}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <WatchlistButton anime={anime} compact size="sm" />

                        {primaryStream && (
                          <a
                            href={primaryStream.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold transition-all"
                          >
                            <StreamingBrandLogo site={primaryStream.site} className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{primaryStream.site}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Empty State */
            <div className="py-16 text-center rounded-2xl bg-[#121626] border border-[#20273a] p-8 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#181d30] border border-[#28324a] flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Calendar className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                No broadcasts found for {DAYS_OF_WEEK[selectedDayIndex]}
              </h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto mb-5 leading-relaxed">
                {searchQuery || streamFilter !== "ALL" || statusFilter !== "ALL"
                  ? "No anime match your active filter settings. Try clearing the search query or resetting filters."
                  : "No anime scheduled for this day in the selected timezone."}
              </p>
              <div className="flex items-center justify-center gap-2.5">
                {(searchQuery || streamFilter !== "ALL" || statusFilter !== "ALL") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setStreamFilter("ALL");
                      setStatusFilter("ALL");
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    Reset All Filters
                  </button>
                )}
                <button
                  onClick={() => setSelectedDayIndex(currentTodayIndex)}
                  className="px-4 py-2 rounded-xl bg-[#181d2e] hover:bg-[#20273c] text-gray-300 text-xs font-semibold border border-[#262f44] transition-colors"
                >
                  View Today&apos;s Shows
                </button>
              </div>
            </div>
          )}
        </div>
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
