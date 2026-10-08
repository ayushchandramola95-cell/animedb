"use client";

import { useState } from "react";
import Link from "next/link";
import { Music, Play, ExternalLink, Disc, Sparkles } from "lucide-react";
import { ThemeSongItem } from "@/lib/types";

interface ThemeMusicJukeboxSectionProps {
  onPlayTheme?: (youtubeId: string, title: string) => void;
}

const FEATURED_THEMES: ThemeSongItem[] = [
  {
    id: "theme-1",
    title: "Idol (アイドル)",
    artist: "YOASOBI",
    type: "OP",
    animeId: 150672,
    animeTitle: "【OSHI NO KO】",
    animeCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx150672-6u5ScvH4Fv7a.png",
    youtubeId: "ZRtdQ81jPUQ",
    spotifyUrl: "https://open.spotify.com/track/7uqLHvK6xN8G1E5y5Zt1hV",
    seasonTag: "Spring 2023",
  },
  {
    id: "theme-2",
    title: "SPECIALZ",
    artist: "King Gnu",
    type: "OP",
    animeId: 145064,
    animeTitle: "Jujutsu Kaisen Season 2",
    animeCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx145064-aRXTgZlWfFfQ.jpg",
    youtubeId: "gcgKUcJKxIs",
    spotifyUrl: "https://open.spotify.com/track/303Dk0p2K0m1G0F1p1K0L0",
    seasonTag: "Fall 2023",
  },
  {
    id: "theme-3",
    title: "Bling-Bang-Bang-Born",
    artist: "Creepy Nuts",
    type: "OP",
    animeId: 164994,
    animeTitle: "MASHLE: MAGIC AND MUSCLES S2",
    animeCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx164994-x1L6YjY4y2h4.jpg",
    youtubeId: "mLW35YMz1eo",
    spotifyUrl: "https://open.spotify.com/track/0A5c1m0F1p1K0L0p2K0m1G",
    seasonTag: "Winter 2024",
  },
  {
    id: "theme-4",
    title: "KICK BACK",
    artist: "Kenshi Yonezu",
    type: "OP",
    animeId: 127230,
    animeTitle: "Chainsaw Man",
    animeCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx127230-NuZc4k9i3Z5F.png",
    youtubeId: "M2cckDmNLMI",
    spotifyUrl: "https://open.spotify.com/track/3Gzd0p2K0m1G0F1p1K0L0p",
    seasonTag: "Fall 2022",
  },
  {
    id: "theme-5",
    title: "Akuma no Ko (悪魔の子)",
    artist: "Ai Higuchi",
    type: "ED",
    animeId: 131681,
    animeTitle: "Attack on Titan Final Season P2",
    animeCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx131681-W2A9w60gGv2Y.jpg",
    youtubeId: "WPl10ZrhCtk",
    spotifyUrl: "https://open.spotify.com/track/40B13b3x2jWp2hP6",
    seasonTag: "Winter 2022",
  },
  {
    id: "theme-6",
    title: "Anytime Anywhere",
    artist: "milet",
    type: "ED",
    animeId: 154587,
    animeTitle: "Frieren: Beyond Journey’s End",
    animeCover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n1HgnioioGhp.jpg",
    youtubeId: "0b0q19q062w",
    spotifyUrl: "https://open.spotify.com/track/25P6jQ9kL1p0w2v8",
    seasonTag: "Fall 2023",
  },
];

export default function ThemeMusicJukeboxSection({
  onPlayTheme,
}: ThemeMusicJukeboxSectionProps) {
  const [filter, setFilter] = useState<"ALL" | "OP" | "ED">("ALL");

  const displayedThemes =
    filter === "ALL"
      ? FEATURED_THEMES
      : FEATURED_THEMES.filter((t) => t.type === filter);

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202638] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/25 flex items-center justify-center text-pink-400 flex-shrink-0 shadow-sm">
            <Music className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Viral Anime Openings & Theme Songs
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/25 flex items-center gap-1">
                <Disc className="w-3 h-3 animate-spin text-pink-400" />
                <span>Audio Jukebox</span>
              </span>
            </div>
            <p className="text-xs text-gray-400">
              The internet's biggest chart-topping anime theme songs with 1-click official music videos.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center p-0.5 rounded-xl bg-[#131624] border border-[#22283a] self-start sm:self-auto">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filter === "ALL"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-gray-400 hover:text-white"
            }`}
          >
            All Tracks
          </button>
          <button
            onClick={() => setFilter("OP")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filter === "OP"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Openings (OP)
          </button>
          <button
            onClick={() => setFilter("ED")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filter === "ED"
                ? "bg-pink-600 text-white shadow-xs"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Endings (ED)
          </button>
        </div>
      </div>

      {/* Grid of Theme Songs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedThemes.map((track) => (
          <div
            key={track.id}
            className="group p-3.5 rounded-2xl bg-[#121522] border border-[#21273a] hover:border-pink-500/40 hover:bg-[#151928] transition-all flex items-center gap-3.5 shadow-sm hover:shadow-md"
          >
            {/* Anime Cover / Disc Art */}
            <div className="relative w-15 h-15 rounded-xl overflow-hidden bg-[#181d2c] border border-[#262d42] flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={track.animeCover}
                alt={track.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-5 h-5 fill-white text-white drop-shadow-md" />
              </div>
            </div>

            {/* Song Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-pink-500/15 text-pink-400 border border-pink-500/25">
                  {track.type}
                </span>
                <span className="text-[10px] text-gray-500 truncate font-medium">
                  {track.seasonTag}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-400 transition-colors truncate">
                {track.title}
              </h3>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                <span className="font-semibold text-gray-300">{track.artist}</span> •{" "}
                <Link
                  href={`/anime/${track.animeId}`}
                  className="hover:text-white transition-colors text-gray-400"
                >
                  {track.animeTitle}
                </Link>
              </p>
            </div>

            {/* Actions: Play MV & Spotify */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() =>
                  onPlayTheme &&
                  onPlayTheme(track.youtubeId, `${track.title} - ${track.artist}`)
                }
                title="Watch Official Music Video"
                className="p-2.5 rounded-xl bg-pink-600/15 hover:bg-pink-600 text-pink-400 hover:text-white border border-pink-500/30 transition-all flex items-center justify-center shadow-xs active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>

              {track.spotifyUrl && (
                <a
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Listen on Spotify"
                  className="p-2.5 rounded-xl bg-[#161a29] hover:bg-[#1f2538] text-gray-400 hover:text-emerald-400 border border-[#262d40] transition-colors flex items-center justify-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
