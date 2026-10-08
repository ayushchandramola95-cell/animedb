"use client";

import Link from "next/link";
import { Sparkles, Play, Calendar, Users, ChevronRight } from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import WatchlistButton from "./WatchlistButton";

interface UpcomingAnticipatedSectionProps {
  upcomingList: AnimeMedia[];
  onWatchTrailer?: (trailerId: string, title: string, streamUrl?: string, streamSite?: string) => void;
}

export default function UpcomingAnticipatedSection({
  upcomingList,
  onWatchTrailer,
}: UpcomingAnticipatedSectionProps) {
  if (!upcomingList || upcomingList.length === 0) return null;

  return (
    <section className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202638] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-sm">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Most Anticipated Upcoming
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                Future Releases
              </span>
            </div>
            <p className="text-xs text-gray-400">
              The hottest upcoming adaptations and sequel seasons ranked by global community hype.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/seasons"
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <span>Seasonal Archive</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Grid of Anticipated Shows (6 columns on lg, 4 on md, 3 on sm, 2 on xs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {upcomingList.slice(0, 12).map((anime, idx) => {
          const title = anime.title.english || anime.title.romaji;
          const studio = anime.studios?.nodes?.[0]?.name;
          const seasonTag =
            anime.season && anime.seasonYear
              ? `${anime.season.charAt(0) + anime.season.slice(1).toLowerCase()} ${anime.seasonYear}`
              : anime.seasonYear
              ? `${anime.seasonYear} TBA`
              : "Upcoming TBA";

          return (
            <div
              key={anime.id}
              className="group rounded-2xl bg-[#121522] border border-[#21273a] hover:border-indigo-500/40 hover:bg-[#151928] transition-all overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Poster Wrap */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#181d2c]">
                <Link href={`/anime/${anime.id}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={anime.coverImage.large || anime.coverImage.medium}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </Link>

                {/* Release Schedule Pill Tag */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#0e111a]/90 backdrop-blur-md text-indigo-300 text-[10px] font-bold border border-[#232a3d] flex items-center gap-1 shadow-sm">
                  <Calendar className="w-2.5 h-2.5 text-indigo-400" />
                  <span>{seasonTag}</span>
                </div>

                {/* Quick Watchlist Bookmark Button */}
                <div className="absolute top-2 right-2">
                  <WatchlistButton anime={anime} compact size="sm" />
                </div>

                {/* Trailer Button Overlay if Trailer Exists */}
                {anime.trailer?.id && (
                  <button
                    onClick={() =>
                      onWatchTrailer &&
                      onWatchTrailer(anime.trailer!.id, title)
                    }
                    className="absolute inset-x-2 bottom-2 py-1.5 rounded-lg bg-[#0e111a]/95 backdrop-blur-sm hover:bg-rose-600 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 border border-[#252c3f] shadow-md"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Watch Teaser</span>
                  </button>
                )}
              </div>

              {/* Card Meta Body */}
              <div className="p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span className="truncate max-w-[85px] font-medium text-gray-400">
                    {studio || "Studio TBA"}
                  </span>
                  {anime.format && (
                    <span className="uppercase text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#181d2a] text-gray-300 border border-[#252b3d]">
                      {anime.format.replace("_", " ")}
                    </span>
                  )}
                </div>

                <Link href={`/anime/${anime.id}`}>
                  <h3
                    className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug"
                    title={title}
                  >
                    {title}
                  </h3>
                </Link>

                {/* Anticipation / Member Popularity Indicator */}
                <div className="pt-2 mt-0.5 border-t border-[#1c2232] flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 flex items-center gap-1 font-medium">
                    <Users className="w-3 h-3 text-indigo-400" />
                    <span>{(anime.popularity || 0).toLocaleString()}</span>
                  </span>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                    Hype #{idx + 1}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
