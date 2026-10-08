"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  Flame,
  Star,
  Play,
  Tv,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import WatchlistButton from "./WatchlistButton";

interface Top10TrendingStripProps {
  trendingList: AnimeMedia[];
  onWatchTrailer?: (trailerId: string, title: string, streamUrl?: string, streamSite?: string) => void;
}

export default function Top10TrendingStrip({
  trendingList,
  onWatchTrailer,
}: Top10TrendingStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const top10 = trendingList.slice(0, 10);

  if (top10.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -380 : 380;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Top 10 Trending This Week</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
                Global Pulse
              </span>
            </h2>
            <p className="text-[11px] text-gray-400">
              Ranked by real-time AniList community hype, discussion volume & simulcast views.
            </p>
          </div>
        </div>

        {/* Scroll Arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#1c2232] border border-[#222736] text-gray-300 hover:text-white transition-colors"
            aria-label="Previous trending anime"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#1c2232] border border-[#222736] text-gray-300 hover:text-white transition-colors"
            aria-label="Next trending anime"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Strip */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth"
      >
        {top10.map((anime, index) => {
          const rank = index + 1;
          const displayRank = rank < 10 ? `0${rank}` : `${rank}`;
          const title = anime.title.english || anime.title.romaji;
          const studio = anime.studios?.nodes?.[0]?.name;
          const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
          const stream = anime.externalLinks?.find(
            (l) => l.type === "STREAMING" || ["Crunchyroll", "Netflix", "Hulu"].includes(l.site)
          );

          return (
            <div
              key={anime.id}
              className="relative w-64 sm:w-72 flex-shrink-0 flex items-center rounded-2xl bg-[#121520] border border-[#202534] hover:border-[#2f374a] p-3 transition-all group shadow-md"
            >
              {/* Giant Stylized Rank Number (Netflix / Aniwave style) */}
              <div className="w-14 sm:w-16 flex-shrink-0 flex items-center justify-center select-none pointer-events-none">
                <span
                  className="font-black text-4xl sm:text-5xl tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-b from-gray-400 via-gray-600 to-[#121520] group-hover:from-blue-400 group-hover:to-blue-900 transition-colors"
                  style={{ textShadow: "0 0 1px rgba(255,255,255,0.1)" }}
                >
                  {displayRank}
                </span>
              </div>

              {/* Poster Card */}
              <div className="relative w-20 sm:w-24 aspect-[3/4] rounded-xl overflow-hidden bg-[#181d2a] flex-shrink-0 border border-[#242b3d]">
                <Link href={`/anime/${anime.id}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={anime.coverImage.extraLarge || anime.coverImage.large}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {score && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[10px] font-bold text-amber-400 flex items-center gap-0.5 border border-amber-400/20">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{score}</span>
                  </div>
                )}
              </div>

              {/* Info Column */}
              <div className="flex-1 min-w-0 pl-3 flex flex-col justify-between h-full py-0.5">
                <div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {studio || "Official Release"}
                  </div>
                  <Link href={`/anime/${anime.id}`}>
                    <h3
                      className="text-xs sm:text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug"
                      title={title}
                    >
                      {title}
                    </h3>
                  </Link>
                </div>

                <div className="text-[10px] text-gray-400 mt-1">
                  <span>{anime.format?.replace("_", " ") || "TV"}</span>
                  {anime.episodes && <span> • {anime.episodes} eps</span>}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-[#1e2330]">
                  {anime.trailer?.id && (
                    <button
                      onClick={() =>
                        onWatchTrailer &&
                        onWatchTrailer(anime.trailer!.id, title, stream?.url, stream?.site)
                      }
                      className="p-1.5 rounded-lg bg-[#181d2a] hover:bg-rose-500/20 text-rose-400 border border-[#262c3d] transition-colors"
                      title="Play Trailer"
                    >
                      <Play className="w-3 h-3 fill-rose-500" />
                    </button>
                  )}

                  <WatchlistButton anime={anime} compact />

                  {stream && (
                    <a
                      href={stream.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-[10px] text-blue-400 hover:text-white flex items-center gap-1 transition-colors"
                      title={`Stream on ${stream.site}`}
                    >
                      <Tv className="w-3 h-3" />
                      <span className="hidden sm:inline">{stream.site}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
