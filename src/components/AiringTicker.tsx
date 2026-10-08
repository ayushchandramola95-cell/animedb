"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Clock,
  Play,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Tv,
  Radio,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import { formatTimeUntilAiring } from "./AnimeCard";

interface AiringTickerProps {
  animeList: AnimeMedia[];
  onWatchTrailer?: (trailerId: string, title: string, streamUrl?: string, streamSite?: string) => void;
}

export default function AiringTicker({ animeList, onWatchTrailer }: AiringTickerProps) {
  // Live countdown decrements
  const [items, setItems] = useState<AnimeMedia[]>(animeList);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(animeList);
    const interval = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => {
          if (!item.nextAiringEpisode) return item;
          const updatedSeconds = Math.max(0, item.nextAiringEpisode.timeUntilAiring - 1);
          return {
            ...item,
            nextAiringEpisode: {
              ...item.nextAiringEpisode,
              timeUntilAiring: updatedSeconds,
            },
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [animeList]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3.5">
      {/* Header with live pulse & calendar CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
          </span>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Live Airing Simulcasts</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
              {items.length} Shows Today
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll Arrows for Desktop & Tablet */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              className="p-1.5 rounded-lg bg-[#151924] hover:bg-[#1d2232] border border-[#222736] text-gray-300 hover:text-white transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-1.5 rounded-lg bg-[#151924] hover:bg-[#1d2232] border border-[#222736] text-gray-300 hover:text-white transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/schedule"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            <span>7-Day Calendar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Horizontal Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
      >
        {items.map((anime) => {
          const title = anime.title.english || anime.title.romaji;
          const studio = anime.studios?.nodes?.[0]?.name;
          const airing = anime.nextAiringEpisode;
          const stream = anime.externalLinks?.find(
            (l) => l.type === "STREAMING" || ["Crunchyroll", "Netflix", "Hulu"].includes(l.site)
          );

          return (
            <div
              key={anime.id}
              className="w-72 sm:w-80 flex-shrink-0 p-3 rounded-xl bg-[#121520] border border-[#202534] hover:border-[#2d3448] flex items-center gap-3 transition-colors shadow-sm group"
            >
              {/* Thumbnail with Episode Badge */}
              <Link href={`/anime/${anime.id}`} className="relative w-16 sm:w-20 h-24 rounded-lg overflow-hidden bg-[#181d2a] flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={anime.coverImage.medium || anime.coverImage.large}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {airing && (
                  <div className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-white text-[9px] font-bold text-center py-0.5">
                    EP {airing.episode}
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                <div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {studio || "Official Release"}
                  </div>
                  <Link href={`/anime/${anime.id}`}>
                    <h4
                      className="text-xs sm:text-sm font-semibold text-white hover:text-blue-400 transition-colors truncate"
                      title={title}
                    >
                      {title}
                    </h4>
                  </Link>
                </div>

                {/* Countdown Time */}
                {airing ? (
                  <div className="flex items-center gap-1.5 text-blue-400 text-[11px] font-semibold mt-1">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      Drops in {formatTimeUntilAiring(airing.timeUntilAiring)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold mt-1">
                    <Radio className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Airing Today</span>
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#1e2330]">
                  {anime.trailer?.id && (
                    <button
                      onClick={() =>
                        onWatchTrailer &&
                        onWatchTrailer(anime.trailer!.id, title, stream?.url, stream?.site)
                      }
                      className="text-[11px] text-gray-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                      title="Watch Trailer"
                    >
                      <Play className="w-3 h-3 fill-rose-500 text-rose-500" />
                      <span>Trailer</span>
                    </button>
                  )}

                  <Link
                    href={`/anime/${anime.id}`}
                    className="text-[11px] text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    Details
                  </Link>

                  {stream && (
                    <a
                      href={stream.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-gray-400 hover:text-white transition-colors ml-auto flex items-center gap-1"
                      title={`Stream on ${stream.site}`}
                    >
                      <Tv className="w-3 h-3 text-blue-400" />
                      <span>{stream.site}</span>
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
