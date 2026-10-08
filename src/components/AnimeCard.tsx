"use client";

import Link from "next/link";
import { Play, ExternalLink, Clock, Star, Tv } from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import WatchlistButton from "./WatchlistButton";

interface AnimeCardProps {
  anime: AnimeMedia;
  rank?: number;
  onWatchTrailer?: (trailerId: string, title: string, streamUrl?: string, streamSite?: string) => void;
}

export function formatTimeUntilAiring(seconds: number): string {
  if (seconds <= 0) return "Airing now";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

export default function AnimeCard({ anime, rank, onWatchTrailer }: AnimeCardProps) {
  const displayTitle = anime.title.english || anime.title.romaji;
  const secondaryTitle = anime.title.english ? anime.title.romaji : anime.title.native;
  const studio = anime.studios?.nodes?.[0]?.name;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;

  // Extract official streaming links
  const streamingLinks = anime.externalLinks?.filter(
    (link) => link.type === "STREAMING" || ["Crunchyroll", "Netflix", "Hulu", "Amazon Prime Video", "Disney Plus", "HIDIVE"].includes(link.site)
  ) || [];

  const primaryStream = streamingLinks[0];

  const handleTrailerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (anime.trailer?.id && onWatchTrailer) {
      onWatchTrailer(
        anime.trailer.id,
        displayTitle,
        primaryStream?.url,
        primaryStream?.site
      );
    }
  };

  return (
    <div className="group rounded-2xl bg-[#121522] border border-[#21273a] hover:border-[#333d58] hover:bg-[#151928] overflow-hidden flex flex-col transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
      {/* Poster Image */}
      <div className="relative aspect-[3/4] bg-[#181d2c] overflow-hidden">
        <Link href={`/anime/${anime.id}`} className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={anime.coverImage.extraLarge || anime.coverImage.large}
            alt={displayTitle}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Top Badges: Rank, Score & Format & Watchlist Button */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            {rank !== undefined && (
              <div
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-black border shadow-md flex items-center justify-center select-none ${
                  rank === 1
                    ? "bg-amber-500 text-black border-amber-300"
                    : rank === 2
                    ? "bg-slate-300 text-black border-slate-100"
                    : rank === 3
                    ? "bg-amber-700 text-white border-amber-500"
                    : "bg-[#0e111a]/95 backdrop-blur-md text-white border-[#2b334a]"
                }`}
              >
                #{rank}
              </div>
            )}

            {score && (
              <div className="px-2 py-0.5 rounded-lg bg-[#0e111a]/95 backdrop-blur-md text-white text-xs font-black border border-[#2b334a] flex items-center gap-1 shadow-md">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{score}</span>
              </div>
            )}

            {anime.format && (
              <div className="px-1.5 py-0.5 rounded-md bg-[#0e111a]/90 backdrop-blur-md text-gray-300 text-[10px] font-bold uppercase tracking-wider border border-[#262d40]">
                {anime.format.replace("_", " ")}
              </div>
            )}
          </div>

          <div className="pointer-events-auto">
            <WatchlistButton anime={anime} compact size="sm" />
          </div>
        </div>

        {/* Bottom Badge: Airing Countdown or Status & Trailer Button */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
          {anime.nextAiringEpisode ? (
            <div className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#0e111a]/95 backdrop-blur-md text-blue-300 border border-blue-500/40 flex items-center gap-1 shadow-sm">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>
                Ep {anime.nextAiringEpisode.episode} {formatTimeUntilAiring(anime.nextAiringEpisode.timeUntilAiring)}
              </span>
            </div>
          ) : anime.status === "FINISHED" ? (
            <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0e111a]/95 backdrop-blur-md text-emerald-400 border border-emerald-500/40 shadow-sm">
              Completed {anime.episodes ? `• ${anime.episodes} eps` : ""}
            </div>
          ) : anime.status === "NOT_YET_RELEASED" ? (
            <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0e111a]/95 backdrop-blur-md text-amber-400 border border-amber-500/40 shadow-sm">
              Upcoming {anime.season ? `• ${anime.season}` : ""}
            </div>
          ) : (
            <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0e111a]/95 backdrop-blur-md text-gray-300 border border-[#282f42] shadow-sm">
              {anime.status || "TV"}
            </div>
          )}

          {/* Quick Trailer Button */}
          {anime.trailer?.id && (
            <button
              onClick={handleTrailerClick}
              className="p-1.5 rounded-lg bg-rose-600/95 hover:bg-rose-500 text-white transition-all shadow-md active:scale-90"
              title="Watch Official Trailer"
              aria-label="Watch Official Trailer"
            >
              <Play className="w-3 h-3 fill-white" />
            </button>
          )}
        </div>
      </div>

      {/* Card Details */}
      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
        <div>
          {/* Studio & Source tag */}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1">
            {studio && <span className="font-semibold text-gray-300 truncate max-w-[120px]">{studio}</span>}
            {studio && anime.source && <span>•</span>}
            {anime.source && <span className="text-gray-500 capitalize">{anime.source.toLowerCase().replace("_", " ")}</span>}
          </div>

          {/* Title */}
          <Link href={`/anime/${anime.id}`}>
            <h3
              className="text-xs sm:text-sm font-bold text-white line-clamp-1 hover:text-blue-400 transition-colors leading-snug"
              title={displayTitle}
            >
              {displayTitle}
            </h3>
          </Link>

          {/* Secondary Subtitle */}
          {secondaryTitle && (
            <p className="text-[10px] text-gray-500 truncate mt-0.5 font-medium" title={secondaryTitle}>
              {secondaryTitle}
            </p>
          )}

          {/* Genres */}
          <div className="flex flex-wrap gap-1 mt-2">
            {anime.genres?.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="text-[9px] font-medium text-gray-400 px-1.5 py-0.5 rounded bg-[#181d2c] border border-[#252c3f]"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>

        {/* Streaming Providers ("Where to Watch" - JustWatch style) */}
        <div className="pt-2.5 border-t border-[#1d2334] flex items-center justify-between text-xs">
          <span className="text-[10px] text-gray-500 font-medium">Stream on:</span>

          <div className="flex items-center gap-1 flex-wrap justify-end">
            {streamingLinks.length > 0 ? (
              streamingLinks.slice(0, 2).map((link) => (
                <a
                  key={link.id || link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[9px] font-bold text-gray-300 hover:text-white px-1.5 py-0.5 rounded bg-[#181d2c] border border-[#252c3f] hover:border-blue-500/40 transition-colors"
                  title={`Watch on ${link.site}`}
                >
                  <span className="truncate max-w-[65px]">{link.site}</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                </a>
              ))
            ) : (
              <span className="text-[9px] text-gray-500 italic">Guide</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
