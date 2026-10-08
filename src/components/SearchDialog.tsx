"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Loader2,
  Star,
  Play,
  ExternalLink,
  Users,
  Mic,
  Film,
  Heart,
  ArrowRight,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";

interface CharacterSearchResult {
  id: number;
  name: {
    full: string;
    native?: string | null;
  };
  image: {
    medium: string;
    large?: string;
  };
  favourites: number;
}

interface StaffSearchResult {
  id: number;
  name: {
    full: string;
    native?: string | null;
  };
  image: {
    medium: string;
    large?: string;
  };
  primaryOccupations: string[];
  favourites: number;
}

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onWatchTrailer?: (trailerId: string, title: string, streamUrl?: string, streamSite?: string) => void;
}

type SearchTab = "ALL" | "ANIME" | "CHARACTERS" | "STAFF";

export default function SearchDialog({ isOpen, onClose, onWatchTrailer }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("ALL");
  const [animeResults, setAnimeResults] = useState<AnimeMedia[]>([]);
  const [charResults, setCharResults] = useState<CharacterSearchResult[]>([]);
  const [staffResults, setStaffResults] = useState<StaffSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      setQuery("");
      setAnimeResults([]);
      setCharResults([]);
      setStaffResults([]);
      setActiveTab("ALL");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setAnimeResults([]);
      setCharResults([]);
      setStaffResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setAnimeResults(data.anime || data.results || []);
        setCharResults(data.characters || []);
        setStaffResults(data.staff || []);
      } catch (e) {
        console.error("Search failed:", e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = animeResults.length + charResults.length + staffResults.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 p-4 bg-black/80">
      <div className="relative w-full max-w-2xl bg-[#131622] border border-[#23293a] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[82vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#202533] flex items-center gap-3 bg-[#161a27]">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime, characters, voice actors..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
          {query && !loading && (
            <button
              onClick={() => setQuery("")}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2 py-1 rounded bg-[#202533] text-gray-300 hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Entity Segment Tabs */}
        {query && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1f2434] bg-[#11141c] text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-[#181d2a] text-gray-400 hover:text-white"
              }`}
            >
              <span>All</span>
              <span className="text-[10px] opacity-75">({totalResults})</span>
            </button>

            <button
              onClick={() => setActiveTab("ANIME")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === "ANIME"
                  ? "bg-blue-600 text-white"
                  : "bg-[#181d2a] text-gray-400 hover:text-white"
              }`}
            >
              <Film className="w-3 h-3 text-blue-400" />
              <span>Anime</span>
              <span className="text-[10px] opacity-75">({animeResults.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("CHARACTERS")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === "CHARACTERS"
                  ? "bg-pink-600 text-white"
                  : "bg-[#181d2a] text-gray-400 hover:text-white"
              }`}
            >
              <Users className="w-3 h-3 text-pink-400" />
              <span>Characters</span>
              <span className="text-[10px] opacity-75">({charResults.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("STAFF")}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === "STAFF"
                  ? "bg-emerald-600 text-white"
                  : "bg-[#181d2a] text-gray-400 hover:text-white"
              }`}
            >
              <Mic className="w-3 h-3 text-emerald-400" />
              <span>Voice Cast</span>
              <span className="text-[10px] opacity-75">({staffResults.length})</span>
            </button>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-[#1e2332]">
          {/* ANIME SECTION */}
          {(activeTab === "ALL" || activeTab === "ANIME") && animeResults.length > 0 && (
            <div className="py-2">
              {activeTab === "ALL" && (
                <div className="px-3 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-3 h-3 text-blue-400" />
                  <span>Anime Titles</span>
                </div>
              )}
              {animeResults.map((anime) => {
                const title = anime.title.english || anime.title.romaji;
                const studio = anime.studios?.nodes?.[0]?.name;
                const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
                const stream = anime.externalLinks?.find(
                  (l) => l.type === "STREAMING" || ["Crunchyroll", "Netflix", "Hulu"].includes(l.site)
                );

                return (
                  <div
                    key={`anime-${anime.id}`}
                    className="py-2.5 px-3 hover:bg-[#181d2a] rounded-lg transition-colors flex items-center gap-3.5"
                  >
                    <Link
                      href={`/anime/${anime.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3.5 flex-1 min-w-0 group"
                    >
                      <div className="w-11 h-14 rounded overflow-hidden bg-[#1c2230] flex-shrink-0 border border-[#23293a] group-hover:border-blue-500/50 transition-colors">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={anime.coverImage.extraLarge || anime.coverImage.large || anime.coverImage.medium}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors truncate" title={title}>
                            {title}
                          </h4>
                          {score && (
                            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {score}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          {anime.format && <span>{anime.format.replace("_", " ")}</span>}
                          {studio && <span>• {studio}</span>}
                          {anime.seasonYear && <span>• {anime.seasonYear}</span>}
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {anime.trailer?.id && (
                        <button
                          onClick={() => {
                            onClose();
                            if (onWatchTrailer) {
                              onWatchTrailer(anime.trailer!.id, title, stream?.url, stream?.site);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-colors"
                          title="Watch Trailer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CHARACTERS SECTION */}
          {(activeTab === "ALL" || activeTab === "CHARACTERS") && charResults.length > 0 && (
            <div className="py-2">
              {activeTab === "ALL" && (
                <div className="px-3 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-pink-400" />
                  <span>Characters</span>
                </div>
              )}
              {charResults.map((char) => (
                <Link
                  key={`char-${char.id}`}
                  href={`/character/${char.id}`}
                  onClick={onClose}
                  className="py-2.5 px-3 hover:bg-[#181d2a] rounded-lg transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-12 rounded overflow-hidden bg-[#1c2230] flex-shrink-0 border border-[#23293a] group-hover:border-pink-500/50 transition-colors">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={char.image.medium || char.image.large || ""}
                        alt={char.name.full}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-white group-hover:text-pink-400 truncate transition-colors">
                        {char.name.full}
                      </span>
                      {char.name.native && (
                        <span className="text-[11px] text-gray-500 truncate">
                          {char.name.native}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-bold flex items-center gap-1 border border-rose-500/20">
                      <Heart className="w-2.5 h-2.5 fill-rose-500" />
                      <span>{char.favourites.toLocaleString()}</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-pink-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* STAFF & VOICE ACTORS SECTION */}
          {(activeTab === "ALL" || activeTab === "STAFF") && staffResults.length > 0 && (
            <div className="py-2">
              {activeTab === "ALL" && (
                <div className="px-3 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mic className="w-3 h-3 text-emerald-400" />
                  <span>Voice Actors & Production Staff</span>
                </div>
              )}
              {staffResults.map((person) => (
                <Link
                  key={`staff-${person.id}`}
                  href={`/staff/${person.id}`}
                  onClick={onClose}
                  className="py-2.5 px-3 hover:bg-[#181d2a] rounded-lg transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-12 rounded overflow-hidden bg-[#1c2230] flex-shrink-0 border border-[#23293a] group-hover:border-emerald-500/50 transition-colors">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={person.image.medium || person.image.large || ""}
                        alt={person.name.full}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-white group-hover:text-emerald-400 truncate transition-colors">
                        {person.name.full}
                      </span>
                      <span className="text-[11px] text-gray-500 truncate">
                        {person.primaryOccupations?.slice(0, 2).join(", ") || "Production Staff"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      Staff #{person.id}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* EMPTY STATES */}
          {query && !loading && totalResults === 0 && (
            <div className="py-12 text-center text-sm text-gray-500">
              No anime, characters, or voice actors found matching &quot;{query}&quot;.
            </div>
          )}

          {!query && (
            <div className="py-10 text-center text-xs text-gray-500">
              Type to search anime, characters (e.g. &quot;Gojou&quot;, &quot;Levi&quot;), or voice actors (e.g. &quot;Yuuki Kaji&quot;)...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
