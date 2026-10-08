"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Download,
  Share2,
  Sparkles,
  Tv,
  Plus,
} from "lucide-react";
import { useWatchlist, WatchStatus } from "@/lib/watchlist";
import WatchlistButton from "./WatchlistButton";

const STATUS_BADGES: Record<WatchStatus, { label: string; color: string; bg: string }> = {
  WATCHING: { label: "Watching", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30" },
  PLAN_TO_WATCH: { label: "Planning", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
  COMPLETED: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  DROPPED: { label: "Dropped", color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/30" },
};

export default function PersonalizedWatchlistShelf() {
  const { watchlist, count, isLoaded } = useWatchlist();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!isLoaded) return null;

  const entries = Object.values(watchlist);

  const scrollShelf = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === "left" ? -350 : 350;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // If user has saved titles, show their active watchlist shelf
  if (count > 0) {
    return (
      <section className="p-5 sm:p-6 rounded-2xl bg-[#111420] border border-[#202638] shadow-lg flex flex-col gap-4 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1d2334] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-sm flex-shrink-0">
              <Bookmark className="w-4 h-4 fill-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Jump Back In • Your Watchlist
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                  {count} {count === 1 ? "Title" : "Titles"}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Client-side encrypted tracking • Instant sync across your browser sessions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Shelf Scroll Arrows */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => scrollShelf("left")}
                className="p-1.5 rounded-lg bg-[#161a29] hover:bg-[#20273a] border border-[#252c40] text-gray-400 hover:text-white transition-colors"
                aria-label="Scroll shelf left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollShelf("right")}
                className="p-1.5 rounded-lg bg-[#161a29] hover:bg-[#20273a] border border-[#252c40] text-gray-400 hover:text-white transition-colors"
                aria-label="Scroll shelf right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Link
              href="/watchlist"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 ml-1"
            >
              <span>Manage Shelf</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Horizontal scroll shelf with gradient fade masks */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-3.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth"
        >
          {entries.slice(0, 14).map((item) => {
            const anime = item.anime;
            const title = anime.title.english || anime.title.romaji;
            const badge = STATUS_BADGES[item.status];
            const posterSrc =
              anime.coverImage.extraLarge ||
              anime.coverImage.large ||
              anime.coverImage.medium;

            return (
              <div
                key={anime.id}
                className="w-44 sm:w-48 flex-shrink-0 p-2.5 rounded-xl bg-[#141825] border border-[#22293c] hover:border-blue-500/40 hover:bg-[#181d2e] flex flex-col gap-2 transition-all group shadow-sm hover:shadow-md"
              >
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#1a1f30]">
                  <Link href={`/anime/${anime.id}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={posterSrc}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  <div className="absolute top-1.5 left-1.5">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-xs shadow-xs ${badge.bg} ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="absolute top-1.5 right-1.5">
                    <WatchlistButton anime={anime} compact />
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <Link href={`/anime/${anime.id}`}>
                    <h4
                      className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate"
                      title={title}
                    >
                      {title}
                    </h4>
                  </Link>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>{anime.format?.replace("_", " ") || "TV"}</span>
                    <span>{anime.episodes ? `${anime.episodes} eps` : "Simulcasting"}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Prompt to add more titles if user has only a few */}
          {entries.length < 6 && (
            <Link
              href="/#catalog"
              className="w-44 sm:w-48 flex-shrink-0 p-4 rounded-xl bg-[#141825]/40 border border-dashed border-[#262f44] hover:border-blue-500/50 hover:bg-[#161d2e] flex flex-col items-center justify-center gap-2.5 transition-all text-center group min-h-[220px]"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                Discover More Shows
              </div>
              <p className="text-[10px] text-gray-400 leading-snug">
                Browse trending catalog to add more to your shelf
              </p>
            </Link>
          )}
        </div>
      </section>
    );
  }

  // If user has zero saved titles, show sleek onboarding strip
  return (
    <section className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#111420] via-[#141828] to-[#111420] border border-[#22283a] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400 flex-shrink-0 shadow-md">
          <Bookmark className="w-5 h-5 fill-blue-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Curate Your Anime Journey • Zero Account Or Sign-Up Needed
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Instant
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            Bookmark currently watching shows, rate finished masterpieces, and import your existing MyAnimeList or AniList profile in 1 click.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0">
        <Link
          href="/import"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Import AniList/MAL</span>
        </Link>
        <Link
          href="/#catalog"
          className="px-4 py-2.5 rounded-xl bg-[#161b2b] hover:bg-[#1f253a] text-gray-200 hover:text-white border border-[#283148] text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <span>Explore Catalog</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
