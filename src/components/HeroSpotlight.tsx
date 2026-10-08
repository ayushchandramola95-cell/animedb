"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Play,
  Star,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info,
  Tv,
  Film,
  Sparkles,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import WatchlistButton from "./WatchlistButton";

interface HeroSpotlightProps {
  anime?: AnimeMedia | null;
  spotlightList?: AnimeMedia[];
  onWatchTrailer?: (trailerId: string, title: string, streamUrl?: string, streamSite?: string) => void;
}

export default function HeroSpotlight({
  anime,
  spotlightList,
  onWatchTrailer,
}: HeroSpotlightProps) {
  // Aggregate items: prefer spotlightList if provided, otherwise single anime
  const items = spotlightList && spotlightList.length > 0
    ? spotlightList
    : anime
    ? [anime]
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-rotate every 7 seconds unless user is hovering/interacting
  useEffect(() => {
    if (items.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [items.length, isPaused]);

  if (items.length === 0) return null;

  const currentAnime = items[currentIndex];
  const title = currentAnime.title.english || currentAnime.title.romaji;
  const secondaryTitle = currentAnime.title.english ? currentAnime.title.romaji : currentAnime.title.native;
  const studio = currentAnime.studios?.nodes?.[0]?.name;
  const score = currentAnime.averageScore ? (currentAnime.averageScore / 10).toFixed(1) : null;

  const stream = currentAnime.externalLinks?.find(
    (l) => l.type === "STREAMING" || ["Crunchyroll", "Netflix", "Hulu", "Amazon Prime Video"].includes(l.site)
  );

  const cleanDescription = currentAnime.description
    ? currentAnime.description.replace(/<[^>]*>?/gm, "").slice(0, 260) + "..."
    : "No synopsis available.";

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative rounded-3xl bg-gradient-to-br from-[#121626] via-[#101320] to-[#0d0f17] border border-[#23293c] hover:border-[#2f3852] shadow-2xl overflow-hidden transition-all duration-300"
    >
      {/* Background Banner with Layered Gradients and Subtle Atmospheric Vignette */}
      {currentAnime.bannerImage ? (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentAnime.bannerImage}
            alt={title}
            className="w-full h-full object-cover object-center opacity-30 scale-100 transition-all duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f17] via-[#101320]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f17] via-[#101320]/90 to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
      )}

      {/* Main Content Grid */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col-reverse md:flex-row items-center gap-8 lg:gap-12 justify-between">
        {/* Left Column: Metadata, Title, Synopsis, CTAs */}
        <div className="flex-1 max-w-2xl flex flex-col gap-4 text-left">
          {/* Badges Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-600/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Spotlight #{currentIndex + 1}</span>
            </span>

            {score && (
              <span className="px-2.5 py-1 rounded-lg bg-[#151928]/90 text-white text-xs font-bold border border-[#2b334a] flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{score} Score</span>
              </span>
            )}

            {studio && (
              <span className="px-2.5 py-1 rounded-lg bg-[#151928]/90 text-gray-300 text-xs font-medium border border-[#2b334a] flex items-center gap-1.5 shadow-sm backdrop-blur-sm">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>{studio}</span>
              </span>
            )}

            {currentAnime.format && (
              <span className="px-2.5 py-1 rounded-lg bg-[#151928]/90 text-gray-400 text-xs font-medium border border-[#2b334a] shadow-sm backdrop-blur-sm">
                {currentAnime.format.replace("_", " ")}
              </span>
            )}

            {currentAnime.episodes && (
              <span className="px-2.5 py-1 rounded-lg bg-[#151928]/90 text-gray-400 text-xs font-medium border border-[#2b334a] shadow-sm backdrop-blur-sm">
                {currentAnime.episodes} Episodes
              </span>
            )}
          </div>

          {/* Titles */}
          <div>
            <Link href={`/anime/${currentAnime.id}`}>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15] hover:text-blue-400 transition-colors drop-shadow-sm">
                {title}
              </h1>
            </Link>
            {secondaryTitle && (
              <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">{secondaryTitle}</p>
            )}
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xl font-normal line-clamp-3">
            {cleanDescription}
          </p>

          {/* Genre Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {currentAnime.genres?.map((genre) => (
              <Link
                key={genre}
                href={`/browse?genre=${encodeURIComponent(genre)}`}
                className="text-xs text-gray-300 hover:text-white px-2.5 py-1 rounded-md bg-[#161a29] hover:bg-blue-600/20 border border-[#282f44] hover:border-blue-500/40 transition-all font-medium"
              >
                {genre}
              </Link>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            {currentAnime.trailer?.id && (
              <button
                onClick={() =>
                  onWatchTrailer &&
                  onWatchTrailer(currentAnime.trailer!.id, title, stream?.url, stream?.site)
                }
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Trailer</span>
              </button>
            )}

            <Link
              href={`/anime/${currentAnime.id}`}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25 active:scale-95"
            >
              <Info className="w-4 h-4" />
              <span>Where to Watch</span>
            </Link>

            {/* Direct Watchlist Bookmark Dropdown */}
            <WatchlistButton anime={currentAnime} size="md" placement="up" />

            {stream && (
              <a
                href={stream.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex px-4 py-2.5 rounded-xl bg-[#161b2b] hover:bg-[#1d2338] text-gray-200 border border-[#2b334a] text-xs sm:text-sm font-semibold transition-all items-center gap-2 shadow-sm"
                title={`Stream on ${stream.site}`}
              >
                <Tv className="w-3.5 h-3.5 text-blue-400" />
                <span>{stream.site}</span>
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </a>
            )}
          </div>
        </div>

        {/* Right Column: High-Res Poster Frame & Carousel Selectors */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <Link href={`/anime/${currentAnime.id}`} className="group relative">
            <div className="relative w-48 sm:w-56 lg:w-60 aspect-[3/4] rounded-2xl overflow-hidden border border-[#2d354b] group-hover:border-blue-500/50 bg-[#151928] shadow-2xl transition-all duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentAnime.coverImage.extraLarge || currentAnime.coverImage.large}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>View Complete Details</span>
                </span>
              </div>
            </div>
          </Link>

          {/* Carousel Controls (if multiple spotlight items) */}
          {items.length > 1 && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
                }
                className="p-1.5 rounded-lg bg-[#161a29] hover:bg-[#20273a] border border-[#262d40] text-gray-400 hover:text-white transition-colors"
                aria-label="Previous spotlight"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-1">
                {items.map((it, idx) => (
                  <button
                    key={it.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? "w-7 bg-gradient-to-r from-blue-500 to-indigo-500"
                        : "w-2 bg-[#252b3d] hover:bg-gray-500"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev + 1) % items.length)
                }
                className="p-1.5 rounded-lg bg-[#161a29] hover:bg-[#20273a] border border-[#262d40] text-gray-400 hover:text-white transition-colors"
                aria-label="Next spotlight"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
