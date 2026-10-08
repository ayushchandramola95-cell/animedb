"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  Flame,
  Play,
  Tv,
  Star,
  ChevronRight,
  Calendar,
  Radio,
  Trophy,
  Download,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import { formatTimeUntilAiring } from "./AnimeCard";
import WatchlistButton from "./WatchlistButton";
import AiringNotifyButton from "./AiringNotifyButton";
import { downloadScheduleIcs } from "@/lib/calendarExport";
import { StreamingBrandLogo } from "./BrandLogos";

interface AiringAndTrendingSplitProps {
  airingList: AnimeMedia[];
  trendingList: AnimeMedia[];
  onWatchTrailer?: (trailerId: string, title: string, streamUrl?: string, streamSite?: string) => void;
}

export default function AiringAndTrendingSplit({
  airingList,
  trendingList,
  onWatchTrailer,
}: AiringAndTrendingSplitProps) {
  // Live decrementing countdown state for airing anime
  const [airingItems, setAiringItems] = useState<AnimeMedia[]>(airingList);
  const [filterMode, setFilterMode] = useState<"ALL" | "UPCOMING" | "AIRED" | "SOON">("ALL");

  useEffect(() => {
    setAiringItems(airingList);
    const interval = setInterval(() => {
      setAiringItems((prev) =>
        prev.map((item) => {
          if (!item.nextAiringEpisode) return item;
          // Decrement timeUntilAiring down (reaches <= 0 when aired, moving it down)
          const updated = item.nextAiringEpisode.timeUntilAiring - 1;
          return {
            ...item,
            nextAiringEpisode: {
              ...item.nextAiringEpisode,
              timeUntilAiring: updated,
            },
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [airingList]);

  // Sort airing anime: UPCOMING episodes first (closest to airing),
  // and ALREADY AIRED episodes are MOVED DOWN (never removed)!
  const { upcomingList, airedList, sortedAiring } = useMemo(() => {
    const upcoming: AnimeMedia[] = [];
    const aired: AnimeMedia[] = [];

    airingItems.forEach((item) => {
      const time = item.nextAiringEpisode?.timeUntilAiring ?? 0;
      if (time > 0) {
        upcoming.push(item);
      } else {
        aired.push(item);
      }
    });

    // Upcoming sorted chronologically: closest to airing first
    upcoming.sort((a, b) => {
      const timeA = a.nextAiringEpisode?.timeUntilAiring ?? Infinity;
      const timeB = b.nextAiringEpisode?.timeUntilAiring ?? Infinity;
      return timeA - timeB;
    });

    // Aired episodes sorted: most recently aired first
    aired.sort((a, b) => {
      const timeA = a.nextAiringEpisode?.airingAt ?? 0;
      const timeB = b.nextAiringEpisode?.airingAt ?? 0;
      return timeB - timeA;
    });

    // Combined: Upcoming FIRST, Aired MOVED DOWN to bottom
    const all = [...upcoming, ...aired];

    let result = all;
    if (filterMode === "UPCOMING") {
      result = upcoming;
    } else if (filterMode === "AIRED") {
      result = aired;
    } else if (filterMode === "SOON") {
      result = upcoming.filter(
        (a) => a.nextAiringEpisode && a.nextAiringEpisode.timeUntilAiring <= 14400
      );
    }

    return {
      upcomingList: upcoming,
      airedList: aired,
      sortedAiring: result,
    };
  }, [airingItems, filterMode]);

  const top10 = trendingList.slice(0, 10);

  // Helper to format local air time
  const formatAirTime = (airingAt?: number) => {
    if (!airingAt) return "";
    try {
      return new Date(airingAt * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* ======================================================== */}
      {/* LEFT COLUMN: LIVE AIRING SIMULCAST SCHEDULE (~65% / 8 COLS) */}
      {/* ======================================================== */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202638] pb-3.5">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Live Airing Simulcasts
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25">
                  {airingItems.length} Shows Today
                </span>
                {airedList.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hidden sm:inline-block">
                    {airedList.length} Aired
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Synchronized to Japanese TV broadcast. Aired episodes move down but remain accessible.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* Filter Pills */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#141826] border border-[#23293c]">
              <button
                onClick={() => setFilterMode("ALL")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  filterMode === "ALL"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                All ({airingItems.length})
              </button>
              <button
                onClick={() => setFilterMode("UPCOMING")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  filterMode === "UPCOMING"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Upcoming ({upcomingList.length})
              </button>
              {airedList.length > 0 && (
                <button
                  onClick={() => setFilterMode("AIRED")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    filterMode === "AIRED"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Aired ({airedList.length})
                </button>
              )}
            </div>

            <button
              onClick={() => downloadScheduleIcs(sortedAiring.length > 0 ? sortedAiring : airingItems)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-300 hover:text-white bg-[#141826] hover:bg-[#1c2234] border border-[#23293c] transition-colors flex items-center gap-1.5 shadow-sm"
              title="Download iCalendar (.ics) file for Apple Calendar, Outlook & Google Calendar"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export .ICS</span>
            </button>

            <Link
              href="/schedule"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5 pl-1"
            >
              <span>Full Schedule</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 2-Column Responsive Airing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {sortedAiring.slice(0, 12).map((anime) => {
            const title = anime.title.english || anime.title.romaji;
            const studio = anime.studios?.nodes?.[0]?.name;
            const airing = anime.nextAiringEpisode;
            const hasAired = (airing?.timeUntilAiring ?? 0) <= 0;
            const stream = anime.externalLinks?.find(
              (l) => l.type === "STREAMING" || ["Crunchyroll", "Netflix", "Hulu", "HIDIVE"].includes(l.site)
            );

            // Use extraLarge or large to ensure razor-sharp image quality
            const posterSrc =
              anime.coverImage.extraLarge ||
              anime.coverImage.large ||
              anime.coverImage.medium;

            return (
              <div
                key={anime.id}
                className={`p-3.5 rounded-2xl border transition-all flex gap-3.5 shadow-sm hover:shadow-md group ${
                  hasAired
                    ? "bg-[#111420]/90 border-[#1e2334] hover:border-[#2c344a] opacity-90"
                    : "bg-[#121522] border-[#21273a] hover:border-[#313a52] hover:bg-[#151928]"
                }`}
              >
                {/* Poster Thumbnail (High Resolution) */}
                <Link
                  href={`/anime/${anime.id}`}
                  className="relative w-18 sm:w-20 aspect-[3/4] rounded-xl overflow-hidden bg-[#181d2c] flex-shrink-0 border border-[#262d42]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={posterSrc}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {airing && (
                    <div
                      className={`absolute bottom-0 inset-x-0 text-white text-[9px] font-black tracking-wide text-center py-0.5 ${
                        hasAired ? "bg-emerald-700/90" : "bg-blue-600/95"
                      }`}
                    >
                      EP {airing.episode} {hasAired ? "• AIRED" : ""}
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="text-[10px] text-gray-400 truncate font-medium">
                      {studio || "Official Broadcast"}
                    </div>
                    <Link href={`/anime/${anime.id}`}>
                      <h3
                        className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1 leading-snug mt-0.5"
                        title={title}
                      >
                        {title}
                      </h3>
                    </Link>
                  </div>

                  {/* Countdown Timer or Aired Status Pill */}
                  {hasAired ? (
                    <div className="inline-flex items-center gap-1.5 text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[11px] font-semibold my-1 w-fit shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>
                        Aired Today {airing?.airingAt ? `(${formatAirTime(airing.airingAt)})` : ""}
                      </span>
                    </div>
                  ) : airing ? (
                    <div className="inline-flex items-center gap-1.5 text-blue-300 bg-blue-950/70 border border-blue-500/30 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold my-1 w-fit shadow-xs">
                      <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 animate-pulse" />
                      <span>Drops in {formatTimeUntilAiring(airing.timeUntilAiring)}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-gray-300 bg-[#151928] border border-[#262c3e] px-2.5 py-1 rounded-lg text-[11px] font-semibold my-1 w-fit shadow-xs">
                      <Radio className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span>Broadcasting Today</span>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center gap-2.5 pt-2 border-t border-[#1d2334] text-xs">
                    {anime.trailer?.id && (
                      <button
                        onClick={() =>
                          onWatchTrailer &&
                          onWatchTrailer(anime.trailer!.id, title, stream?.url, stream?.site)
                        }
                        className="text-[11px] font-medium text-gray-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                        title="Watch Trailer"
                      >
                        <Play className="w-3 h-3 fill-rose-500 text-rose-500" />
                        <span>Trailer</span>
                      </button>
                    )}

                    <Link
                      href={`/anime/${anime.id}`}
                      className="text-[11px] font-medium text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      Guide
                    </Link>

                    {/* Broadcast Notification Alert (only if not yet aired) */}
                    {!hasAired && <AiringNotifyButton anime={anime} compact />}

                    {stream && (
                      <a
                        href={stream.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-[10px] font-semibold text-blue-400 hover:text-white flex items-center gap-1.5 transition-colors px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20"
                        title={`Stream on ${stream.site}`}
                      >
                        <StreamingBrandLogo site={stream.site} className="w-3.5 h-3.5 rounded" />
                        <span className="truncate max-w-[70px]">{stream.site}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View Complete Schedule Link Footer */}
        <Link
          href="/schedule"
          className="p-3 rounded-2xl bg-[#121522] hover:bg-[#161a29] border border-[#21273a] hover:border-blue-500/30 text-xs font-semibold text-gray-300 hover:text-white flex items-center justify-between transition-all mt-1 shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Looking for tomorrow or weekend simulcasts? View full 7-day schedule</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: TOP 10 TRENDING LEADERBOARD (~35% / 4-5 COLS) */}
      {/* ======================================================== */}
      <div className="lg:col-span-5 xl:col-span-4 rounded-3xl bg-[#111422] border border-[#21273a] p-5 sm:p-6 shadow-xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1f2536] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-sm">
              <Flame className="w-4.5 h-4.5 fill-amber-400/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Top 10 Trending
                </h3>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  Live Hype
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Real-time community popularity ranking
              </p>
            </div>
          </div>

          <Link
            href="/top"
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5"
          >
            <span>Top 100</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Vertical Numbered List (#01 to #10) */}
        <div className="flex flex-col divide-y divide-[#1a2030]">
          {top10.map((anime, idx) => {
            const rank = idx + 1;
            const displayRank = rank < 10 ? `0${rank}` : `${rank}`;
            const title = anime.title.english || anime.title.romaji;
            const studio = anime.studios?.nodes?.[0]?.name;
            const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
            const stream = anime.externalLinks?.find(
              (l) => l.type === "STREAMING" || ["Crunchyroll", "Netflix", "Hulu"].includes(l.site)
            );

            // Use extraLarge or large coverImage to ensure no blurriness
            const trendingPosterSrc =
              anime.coverImage.extraLarge ||
              anime.coverImage.large ||
              anime.coverImage.medium;

            // Special badge colors for Top 3
            const rankBadge =
              rank === 1
                ? "text-amber-300 font-black bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md"
                : rank === 2
                ? "text-slate-200 font-bold bg-slate-500/15 border border-slate-500/30 px-1.5 py-0.5 rounded-md"
                : rank === 3
                ? "text-amber-500 font-bold bg-amber-700/15 border border-amber-700/30 px-1.5 py-0.5 rounded-md"
                : "text-gray-500 font-mono font-semibold";

            return (
              <div
                key={anime.id}
                className="py-2.5 first:pt-1 last:pb-1 flex items-center gap-3 hover:bg-[#151928] px-2 rounded-xl transition-all group"
              >
                {/* Stylized Rank Number */}
                <div className="w-7 text-center text-xs tracking-tight flex-shrink-0 flex items-center justify-center">
                  <span className={rankBadge}>{displayRank}</span>
                </div>

                {/* Poster Thumbnail (High-Res) */}
                <Link
                  href={`/anime/${anime.id}`}
                  className="relative w-11 h-15 rounded-lg overflow-hidden bg-[#181d2c] flex-shrink-0 border border-[#252c40]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={trendingPosterSrc}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <Link href={`/anime/${anime.id}`}>
                    <h4
                      className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate"
                      title={title}
                    >
                      {title}
                    </h4>
                  </Link>

                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                    {studio && <span className="truncate max-w-[110px] font-medium">{studio}</span>}
                    {studio && <span>•</span>}
                    <span>{anime.format?.replace("_", " ") || "TV"}</span>
                  </div>
                </div>

                {/* Score & Quick Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {score && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#161a29] border border-[#272f44] text-[10px] font-bold text-amber-400 shadow-xs">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{score}</span>
                    </div>
                  )}

                  {anime.trailer?.id && (
                    <button
                      onClick={() =>
                        onWatchTrailer &&
                        onWatchTrailer(anime.trailer!.id, title, stream?.url, stream?.site)
                      }
                      className="p-1 rounded-md text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Watch Trailer"
                    >
                      <Play className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    </button>
                  )}

                  <WatchlistButton anime={anime} compact />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <Link
          href="/top"
          className="pt-2.5 border-t border-[#1f2536] text-center text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center gap-1"
        >
          <span>View All Top 100 Leaderboard</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
