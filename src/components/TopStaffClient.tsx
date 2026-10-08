"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mic,
  Clapperboard,
  Search,
  Heart,
  Tv,
  Crown,
  Sparkles,
  ArrowRight,
  Loader2,
  Users,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export interface TopStaffItem {
  id: number;
  name: {
    full: string;
    native?: string | null;
  };
  image: {
    large?: string | null;
    medium?: string | null;
  };
  primaryOccupations: string[];
  favourites: number;
  characterMedia?: {
    edges: Array<{
      characterRole: string;
      characters?: Array<{
        id: number;
        name: {
          full: string;
        };
        image?: {
          medium: string;
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

interface TopStaffClientProps {
  initialStaff: TopStaffItem[];
  initialHasNextPage: boolean;
}

export default function TopStaffClient({
  initialStaff,
  initialHasNextPage,
}: TopStaffClientProps) {
  const [staffList, setStaffList] = useState<TopStaffItem[]>(initialStaff);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staffList.length === 0) {
      setLoading(true);
      fetch("/api/staff?page=1&perPage=32")
        .then((r) => r.json())
        .then((d) => {
          if (d.staff && d.staff.length > 0) {
            setStaffList(d.staff);
            setHasNextPage(d.hasNextPage);
          }
        })
        .catch((err) => console.error("Failed to fetch initial staff:", err))
        .finally(() => setLoading(false));
    }
  }, [staffList.length]);

  // Client-side search & filtering
  const filteredStaff = staffList.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const fullName = s.name.full.toLowerCase();
    const nativeName = s.name.native ? s.name.native.toLowerCase() : "";
    const occupations = s.primaryOccupations?.join(" ").toLowerCase() || "";
    return fullName.includes(q) || nativeName.includes(q) || occupations.includes(q);
  });

  const handleLoadMore = async () => {
    if (loading || !hasNextPage) return;
    setLoading(true);
    const nextPage = page + 1;

    try {
      const res = await fetch(
        `/api/staff?page=${nextPage}&perPage=30${search ? `&search=${encodeURIComponent(search)}` : ""}`
      );
      if (res.ok) {
        const data = await res.json();
        setStaffList((prev) => [...prev, ...data.staff]);
        setHasNextPage(data.hasNextPage);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more staff:", err);
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
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 fill-emerald-400" />
                  <span>AniList Global Seiyuu & Creators</span>
                </span>
                <span className="text-xs text-gray-500">Live Rankings</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Top Voice Actors & Production Staff
              </h1>

              <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
                Discover the industry&apos;s most celebrated Japanese voice actors (Seiyuu), visionary directors, composers, and studio animators who bring your favorite anime to life.
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
                  placeholder="Filter voice actors or roles..."
                  className="w-full bg-[#181c28] border border-[#262c3e] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Staff Grid */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {search ? `Matching Results (${filteredStaff.length})` : "Most Favorited Voice Cast & Staff"}
              </h2>
            </div>
            <span className="text-xs text-gray-500">
              Ranked by community favourites
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredStaff.map((person, index) => {
              const rank = index + 1;
              const primaryRole = person.characterMedia?.edges?.[0];
              const anime = primaryRole?.node;
              const char = primaryRole?.characters?.[0];
              const isVoiceActor = person.primaryOccupations?.some((o) =>
                o.toLowerCase().includes("voice")
              );

              const isGold = rank === 1;
              const isSilver = rank === 2;
              const isBronze = rank === 3;

              return (
                <div
                  key={person.id}
                  className="relative rounded-2xl bg-[#131622] border border-[#222736] hover:border-[#333a50] p-3.5 flex flex-col justify-between gap-3.5 transition-all group shadow-sm hover:shadow-md"
                >
                  {/* Top Header: Portrait + Info */}
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

                    {/* Staff Portrait Link */}
                    <Link
                      href={`/staff/${person.id}`}
                      className="w-16 h-20 rounded-xl overflow-hidden bg-[#181d2a] flex-shrink-0 border border-[#262c3e] group-hover:border-emerald-500/50 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={person.image.large || person.image.medium || ""}
                        alt={person.name.full}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    </Link>

                    {/* Staff Name & Occupations */}
                    <div className="flex flex-col min-w-0 flex-1 justify-center">
                      <Link
                        href={`/staff/${person.id}`}
                        className="text-sm font-bold text-white group-hover:text-emerald-400 truncate transition-colors"
                        title={person.name.full}
                      >
                        {person.name.full}
                      </Link>

                      {person.name.native && (
                        <span className="text-[11px] text-gray-500 truncate mt-0.5">
                          {person.name.native}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5 fill-rose-500" />
                          <span>{person.favourites.toLocaleString()}</span>
                        </span>

                        {isVoiceActor && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-semibold">
                            Seiyuu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Sub-Cards: Famous Character Voiced */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[#1f2433] text-xs">
                    {char && anime ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                          Known For:
                        </span>
                        <Link
                          href={`/character/${char.id}`}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-[#181c28] hover:bg-[#1e2332] border border-[#252b3d] text-gray-300 hover:text-emerald-400 transition-colors"
                          title={`Character: ${char.name.full}`}
                        >
                          {char.image?.medium && (
                            <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0 border border-[#2a3144]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={char.image.medium}
                                alt={char.name.full}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <span className="text-[11px] font-medium truncate flex-1">
                            {char.name.full}
                          </span>
                          <span className="text-[10px] text-gray-500 truncate">
                            ({anime.title.english || anime.title.romaji})
                          </span>
                          <ArrowRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
                        </Link>
                      </div>
                    ) : person.primaryOccupations?.[0] ? (
                      <div className="p-1.5 rounded-lg bg-[#181c28] border border-[#252b3d] text-gray-400 text-[11px] truncate flex items-center gap-1.5">
                        <Clapperboard className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <span className="truncate">{person.primaryOccupations.join(", ")}</span>
                      </div>
                    ) : null}
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
                className="px-6 py-3 rounded-xl bg-[#141722] hover:bg-[#1a1f2e] border border-[#252b3d] hover:border-emerald-500/50 text-xs sm:text-sm font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Loading more staff...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Load Next 30 Staff</span>
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
