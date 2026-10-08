"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Plus, Check, Star, Loader2, Sparkles, Film, Clock } from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import { useWatchlist, WatchStatus } from "@/lib/watchlist";

interface WatchlistAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_QUICK_TAGS = [
  "Solo Leveling",
  "Frieren",
  "Jujutsu Kaisen",
  "Demon Slayer",
  "Attack on Titan",
  "Chainsaw Man",
  "Spy x Family",
  "Bleach",
];

export default function WatchlistAddModal({ isOpen, onClose }: WatchlistAddModalProps) {
  const { watchlist, setItemStatus, getStatus } = useWatchlist();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.anime || data.results || []);
        }
      } catch (err) {
        console.error("Watchlist search error:", err);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#111420] border border-[#242c42] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Add Anime to Watchlist"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#1f273c] flex items-center justify-between gap-3 bg-[#131726]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Quick Add Anime to Watchlist
              </h2>
              <p className="text-xs text-gray-400">
                Search millions of titles and log them straight into your library
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1f263c] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="p-4 border-b border-[#1f273c] bg-[#0d101a]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anime title by English or Japanese name..."
              className="w-full bg-[#141828] border border-[#263048] rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Tags Suggestions */}
          {!query && (
            <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-1">
              <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Popular:
              </span>
              {POPULAR_QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-[#151a2c] hover:bg-blue-600/20 text-gray-300 hover:text-blue-300 border border-[#242c44] hover:border-blue-500/40 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[280px]">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs font-medium">Searching AniList catalog...</span>
            </div>
          ) : results.length > 0 ? (
            results.map((anime) => {
              const currentStatus = getStatus(anime.id);
              const title = anime.title.english || anime.title.romaji;
              const studio = anime.studios?.nodes?.[0]?.name;
              const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;

              return (
                <div
                  key={anime.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#141829] border border-[#222a40] hover:border-[#323d5c] transition-all"
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-15 rounded-xl bg-[#1e2538] overflow-hidden flex-shrink-0 border border-[#2b354e]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={anime.coverImage.medium || anime.coverImage.large}
                        alt={title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate" title={title}>
                        {title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                        {anime.format && <span>{anime.format.replace("_", " ")}</span>}
                        {anime.episodes && <span>• {anime.episodes} eps</span>}
                        {studio && <span>• {studio}</span>}
                        {score && (
                          <span className="text-amber-400 font-bold flex items-center gap-0.5">
                            • <Star className="w-3 h-3 fill-amber-400" /> {score}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {currentStatus ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold px-2 py-1 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span className="capitalize">{currentStatus.replace("_", " ").toLowerCase()}</span>
                        </span>
                        <button
                          onClick={() => setItemStatus(anime, null)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition-colors"
                          title="Remove from watchlist"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setItemStatus(anime, "WATCHING")}
                          className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-colors shadow-xs"
                        >
                          + Watching
                        </button>
                        <button
                          onClick={() => setItemStatus(anime, "PLAN_TO_WATCH")}
                          className="px-2.5 py-1 rounded-xl bg-[#1a2034] hover:bg-[#252c48] text-amber-300 text-[11px] font-bold border border-[#2b3552] transition-colors"
                        >
                          + Plan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : query ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-sm font-semibold text-gray-300">No results found for &quot;{query}&quot;</p>
              <p className="text-xs text-gray-500 mt-1">Try searching with Japanese or romaji romanization.</p>
            </div>
          ) : (
            <div className="py-16 text-center text-gray-400">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3 text-blue-400">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-gray-300">Type a show name to begin</p>
              <p className="text-xs text-gray-500 mt-1">Or pick one of the trending popular titles above</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#1f273c] bg-[#0d101a] flex items-center justify-between text-xs text-gray-400">
          <span>{results.length > 0 ? `${results.length} anime found` : "Powered by AniList GraphQL API"}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#161a29] hover:bg-[#20273a] text-gray-300 font-semibold border border-[#252c40] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
