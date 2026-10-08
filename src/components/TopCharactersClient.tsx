"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Heart,
  Mic,
  Tv,
  Crown,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export interface TopCharacterItem {
  id: number;
  name: {
    full: string;
    native?: string | null;
  };
  image: {
    large?: string | null;
    medium?: string | null;
  };
  favourites: number;
  media?: {
    edges: Array<{
      characterRole: string;
      voiceActors?: Array<{
        id: number;
        name: {
          full: string;
        };
      }>;
      node: {
        id: number;
        title: {
          english?: string | null;
          romaji?: string | null;
        };
      };
    }>;
  };
}

interface TopCharactersClientProps {
  initialCharacters: TopCharacterItem[];
  initialHasNextPage: boolean;
}

export default function TopCharactersClient({
  initialCharacters,
  initialHasNextPage,
}: TopCharactersClientProps) {
  const [characters, setCharacters] = useState<TopCharacterItem[]>(initialCharacters);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [loading, setLoading] = useState(false);

  // Client-side search & filtering if user types
  const filteredCharacters = characters.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const fullName = c.name.full.toLowerCase();
    const nativeName = c.name.native ? c.name.native.toLowerCase() : "";
    const animeTitle = c.media?.edges?.[0]?.node?.title?.english?.toLowerCase() || 
                       c.media?.edges?.[0]?.node?.title?.romaji?.toLowerCase() || "";
    return fullName.includes(q) || nativeName.includes(q) || animeTitle.includes(q);
  });

  const handleLoadMore = async () => {
    if (loading || !hasNextPage) return;
    setLoading(true);
    const nextPage = page + 1;

    try {
      const res = await fetch(
        `/api/characters?page=${nextPage}&perPage=30${search ? `&search=${encodeURIComponent(search)}` : ""}`
      );
      if (res.ok) {
        const data = await res.json();
        setCharacters((prev) => [...prev, ...data.characters]);
        setHasNextPage(data.hasNextPage);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more characters:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-gray-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Header Banner */}
        <section className="relative rounded-2xl bg-[#131622] border border-[#222736] p-6 sm:p-8 overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 fill-amber-400" />
                  <span>AniList Global Hall of Fame</span>
                </span>
                <span className="text-xs text-gray-500">Live Rankings</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Top Anime Characters Leaderboard
              </h1>

              <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
                Discover the all-time most favorited anime icons, legendary protagonists, and unforgettable antagonists. Click any character or voice actor to explore their complete filmography.
              </p>
            </div>

            {/* Quick Search */}
            <div className="w-full md:w-80 flex-shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter characters or anime..."
                  className="w-full bg-[#181c28] border border-[#262c3e] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Character Grid */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {search ? `Matching Results (${filteredCharacters.length})` : "Most Favorited All-Time"}
              </h2>
            </div>
            <span className="text-xs text-gray-500">
              Ranked by community favourites
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCharacters.map((char, index) => {
              const rank = index + 1;
              const primaryMedia = char.media?.edges?.[0];
              const anime = primaryMedia?.node;
              const va = primaryMedia?.voiceActors?.[0];

              const isGold = rank === 1;
              const isSilver = rank === 2;
              const isBronze = rank === 3;

              return (
                <div
                  key={char.id}
                  className="relative rounded-2xl bg-[#131622] border border-[#222736] hover:border-[#333a50] p-3.5 flex flex-col justify-between gap-3.5 transition-all group shadow-sm hover:shadow-md"
                >
                  {/* Top Header: Character Portrait + Info */}
                  <div className="flex items-start gap-3">
                    {/* Rank Badge */}
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black flex-shrink-0 ${
                        isGold
                          ? "bg-amber-400 text-black shadow-amber-400/20 shadow-md"
                          : isSilver
                          ? "bg-slate-300 text-black shadow-slate-300/20 shadow-md"
                          : isBronze
                          ? "bg-amber-700 text-white"
                          : "bg-[#181d2a] text-gray-400 border border-[#252b3d]"
                      }`}
                    >
                      {rank}
                    </div>

                    {/* Character Avatar Link */}
                    <Link
                      href={`/character/${char.id}`}
                      className="w-16 h-20 rounded-xl overflow-hidden bg-[#181d2a] flex-shrink-0 border border-[#262c3e] group-hover:border-blue-500/50 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={char.image.large || char.image.medium || ""}
                        alt={char.name.full}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    </Link>

                    {/* Character Name & Favourites */}
                    <div className="flex flex-col min-w-0 flex-1 justify-center">
                      <Link
                        href={`/character/${char.id}`}
                        className="text-sm font-bold text-white group-hover:text-blue-400 truncate transition-colors"
                        title={char.name.full}
                      >
                        {char.name.full}
                      </Link>

                      {char.name.native && (
                        <span className="text-[11px] text-gray-500 truncate mt-0.5">
                          {char.name.native}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5 fill-rose-500" />
                          <span>{char.favourites.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Sub-Cards: Anime & Voice Actor */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[#1f2433] text-xs">
                    {/* Primary Anime Series */}
                    {anime && (
                      <Link
                        href={`/anime/${anime.id}`}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-[#181c28] hover:bg-[#1e2332] border border-[#252b3d] text-gray-300 hover:text-white transition-colors"
                        title={`Anime: ${anime.title.english || anime.title.romaji}`}
                      >
                        <Tv className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="text-[11px] font-medium truncate flex-1">
                          {anime.title.english || anime.title.romaji}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
                      </Link>
                    )}

                    {/* Japanese Voice Actor (Seiyuu) */}
                    {va && (
                      <Link
                        href={`/staff/${va.id}`}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-[#181c28] hover:bg-[#1e2332] border border-[#252b3d] text-gray-300 hover:text-emerald-400 transition-colors"
                        title={`Voice Actor: ${va.name.full}`}
                      >
                        <Mic className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="text-[11px] font-medium truncate">
                            {va.name.full}
                          </span>
                          <span className="text-[9px] text-gray-500">(VA)</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasNextPage && !search && (
            <div className="flex justify-center pt-6">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-[#141722] hover:bg-[#1a1f2e] border border-[#252b3d] hover:border-blue-500/50 text-xs sm:text-sm font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Loading more icons...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Load Next 30 Characters</span>
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Comprehensive Modern Footer */}
      <Footer />
    </div>
  );
}
