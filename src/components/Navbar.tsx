"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Play,
  Search,
  Tv,
  Calendar,
  Flame,
  Trophy,
  Building2,
  Compass,
  Bookmark,
  SlidersHorizontal,
  Users,
  Mic,
  Dices,
  Menu,
  X,
  Sparkles,
  ArrowLeftRight,
  ChevronDown,
  Download,
  Home,
  ShieldCheck,
} from "lucide-react";
import SearchDialog from "./SearchDialog";
import StreamingRegionSelector from "./StreamingRegionSelector";
import { useWatchlist } from "@/lib/watchlist";

interface NavbarProps {
  onWatchTrailer?: (trailerId: string, title: string, streamUrl?: string, streamSite?: string) => void;
}

export default function Navbar({ onWatchTrailer }: NavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const { count } = useWatchlist();
  const navRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdowns on outside click or route change
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleDropdown = (name: string) => {
    setOpenDropdown((curr) => (curr === name ? null : name));
  };

  const isExploreActive = ["/browse", "/top", "/seasons", "/studios", "/watch"].some((r) =>
    pathname.startsWith(r)
  );
  const isCastActive = ["/characters", "/character", "/staff"].some((r) =>
    pathname.startsWith(r)
  );
  const isToolsActive = ["/compare", "/quiz", "/import", "/tierlist"].some((r) =>
    pathname.startsWith(r)
  );

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#10131c]/95 backdrop-blur-md border-b border-[#1e2330]">
        <div
          ref={navRef}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6"
        >
          {/* Logo & Navigation */}
          <div className="flex items-center gap-5 lg:gap-7">
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm group-hover:bg-blue-500 transition-colors">
                <Play className="w-4 h-4 fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5 leading-none">
                  AnimeDB
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Live
                  </span>
                </span>
                <span className="hidden sm:inline-block text-[10px] text-gray-400 leading-tight">
                  Next-Gen Encyclopedia
                </span>
              </div>
            </Link>

            {/* Desktop & Tablet Grouped Navigation (Visible from md / 768px upwards!) */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 text-xs font-semibold text-gray-300">
              {/* Direct Trending Link */}
              <Link
                href="/#catalog"
                className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname === "/"
                    ? "text-white bg-[#181d2a]"
                    : "hover:text-white hover:bg-[#151924]"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Trending</span>
              </Link>

              {/* Explore Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown("explore")}
                  onMouseEnter={() => setOpenDropdown("explore")}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isExploreActive || openDropdown === "explore"
                      ? "text-white bg-[#181d2a]"
                      : "hover:text-white hover:bg-[#151924]"
                  }`}
                  aria-expanded={openDropdown === "explore"}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Explore</span>
                  <ChevronDown
                    className={`w-3 h-3 text-gray-400 transition-transform ${
                      openDropdown === "explore" ? "rotate-180 text-white" : ""
                    }`}
                  />
                </button>

                {openDropdown === "explore" && (
                  <div
                    onMouseLeave={() => setOpenDropdown(null)}
                    className="absolute left-0 top-full mt-1.5 w-60 rounded-xl bg-[#131622] border border-[#23293a] p-2 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <Link
                      href="/browse"
                      className="px-3 py-2 rounded-lg hover:bg-[#1a1f2e] text-gray-200 hover:text-white transition-colors flex items-center gap-2.5"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                      <div>
                        <div className="font-semibold text-xs">Browse Matrix</div>
                        <div className="text-[10px] text-gray-400">Filter by tags, genres, studios</div>
                      </div>
                    </Link>

                    <Link
                      href="/top"
                      className="px-3 py-2 rounded-lg hover:bg-[#1a1f2e] text-gray-200 hover:text-white transition-colors flex items-center gap-2.5"
                    >
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-semibold text-xs">Top 100 Anime</div>
                        <div className="text-[10px] text-gray-400">All-time rated masterpieces</div>
                      </div>
                    </Link>

                    <Link
                      href="/seasons"
                      className="px-3 py-2 rounded-lg hover:bg-[#1a1f2e] text-gray-200 hover:text-white transition-colors flex items-center gap-2.5"
                    >
                      <Compass className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-xs">Seasons Archive</div>
                        <div className="text-[10px] text-gray-400">Historical seasons (2000–2026)</div>
                      </div>
                    </Link>

                    <Link
                      href="/studios"
                      className="px-3 py-2 rounded-lg hover:bg-[#1a1f2e] text-gray-200 hover:text-white transition-colors flex items-center gap-2.5"
                    >
                      <Building2 className="w-4 h-4 text-sky-400" />
                      <div>
                        <div className="font-semibold text-xs">Studios Showcase</div>
                        <div className="text-[10px] text-gray-400">MAPPA, ufotable, KyoAni & more</div>
                      </div>
                    </Link>

                    <Link
                      href="/watch"
                      className="px-3 py-2 rounded-lg hover:bg-[#1a1f2e] text-gray-200 hover:text-white transition-colors flex items-center gap-2.5 border-t border-[#1e2330] mt-1 pt-2"
                    >
                      <Tv className="w-4 h-4 text-rose-400" />
                      <div>
                        <div className="font-semibold text-xs">Legal Streams Hub</div>
                        <div className="text-[10px] text-gray-400">Crunchyroll, Netflix, Hulu & Prime</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Characters & Cast Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown("cast")}
                  onMouseEnter={() => setOpenDropdown("cast")}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isCastActive || openDropdown === "cast"
                      ? "text-white bg-[#181d2a]"
                      : "hover:text-white hover:bg-[#151924]"
                  }`}
                  aria-expanded={openDropdown === "cast"}
                >
                  <Users className="w-3.5 h-3.5 text-pink-400" />
                  <span>Cast</span>
                  <ChevronDown
                    className={`w-3 h-3 text-gray-400 transition-transform ${
                      openDropdown === "cast" ? "rotate-180 text-white" : ""
                    }`}
                  />
                </button>

                {openDropdown === "cast" && (
                  <div
                    onMouseLeave={() => setOpenDropdown(null)}
                    className="absolute left-0 top-full mt-1.5 w-60 rounded-xl bg-[#131622] border border-[#23293a] p-2 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <Link
                      href="/characters"
                      className="px-3 py-2 rounded-lg hover:bg-[#1a1f2e] text-gray-200 hover:text-white transition-colors flex items-center gap-2.5"
                    >
                      <Users className="w-4 h-4 text-pink-400" />
                      <div>
                        <div className="font-semibold text-xs">Top Characters</div>
                        <div className="text-[10px] text-gray-400">Hall of fame fan favorites</div>
                      </div>
                    </Link>

                    <Link
                      href="/staff"
                      className="px-3 py-2 rounded-lg hover:bg-[#1a1f2e] text-gray-200 hover:text-white transition-colors flex items-center gap-2.5"
                    >
                      <Mic className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-xs">Voice Actors (Seiyuu)</div>
                        <div className="text-[10px] text-gray-400">Voice cast & director directory</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Tools Dropdown (Compare, Quiz, Importer) */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown("tools")}
                  onMouseEnter={() => setOpenDropdown("tools")}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isToolsActive || openDropdown === "tools"
                      ? "text-white bg-[#181d2a]"
                      : "hover:text-white hover:bg-[#151924]"
                  }`}
                  aria-expanded={openDropdown === "tools"}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Tools</span>
                  <ChevronDown
                    className={`w-3 h-3 text-gray-400 transition-transform ${
                      openDropdown === "tools" ? "rotate-180 text-white" : ""
                    }`}
                  />
                </button>

                {openDropdown === "tools" && (
                  <div
                    onMouseLeave={() => setOpenDropdown(null)}
                    className="absolute left-0 top-full mt-1.5 w-64 rounded-xl bg-[#131622] border border-[#23293a] p-2 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <Link
                      href="/compare"
                      className="px-3 py-2 rounded-lg hover:bg-[#1a1f2e] text-gray-200 hover:text-white transition-colors flex items-center gap-2.5"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="font-semibold text-xs">Compare Anime</div>
                        <div className="text-[10px] text-gray-400">Head-to-head stats & cast overlap</div>
                      </div>
                    </Link>

                    <Link
                      href="/quiz"
                      className="px-3 py-2 rounded-lg hover:bg-[#1a1f2e] text-gray-200 hover:text-white transition-colors flex items-center gap-2.5"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <div>
                        <div className="font-semibold text-xs">Taste Quiz</div>
                        <div className="text-[10px] text-gray-400">60-second what to watch wizard</div>
                      </div>
                    </Link>

                    <Link
                      href="/import"
                      className="px-3 py-2 rounded-lg hover:bg-[#1a1f2e] text-gray-200 hover:text-white transition-colors flex items-center gap-2.5"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-xs">Import Watchlist</div>
                        <div className="text-[10px] text-gray-400">Sync from AniList or MyAnimeList</div>
                      </div>
                    </Link>

                    <Link
                      href="/tierlist"
                      className="px-3 py-2 rounded-lg hover:bg-[#1a1f2e] text-gray-200 hover:text-white transition-colors flex items-center gap-2.5"
                    >
                      <Trophy className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="font-semibold text-xs">Tier List Maker</div>
                        <div className="text-[10px] text-gray-400">Rank anime S to D and export image</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Direct Schedule Link */}
              <Link
                href="/schedule"
                className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname === "/schedule"
                    ? "text-white bg-[#181d2a]"
                    : "hover:text-white hover:bg-[#151924]"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Schedule</span>
              </Link>

              {/* Direct Watchlist Link */}
              <Link
                href="/watchlist"
                className={`px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname === "/watchlist"
                    ? "text-white bg-[#181d2a]"
                    : "hover:text-white hover:bg-[#151924]"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-blue-400 fill-blue-400/30" />
                <span>Watchlist</span>
                {count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                    {count}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          {/* Search Bar & Fast Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-1 justify-end max-w-sm sm:max-w-md">
            {/* Streaming Region Selector */}
            <div className="hidden sm:block">
              <StreamingRegionSelector compact />
            </div>

            {/* Surprise Me (Dice) */}
            <Link
              href="/random"
              prefetch={false}
              className="p-2 rounded-lg bg-[#151924] hover:bg-[#1d2232] border border-[#222736] hover:border-purple-500/50 text-gray-300 hover:text-purple-400 transition-colors flex items-center justify-center flex-shrink-0"
              title="Surprise Me (Roll the Dice for a Top Anime)"
            >
              <Dices className="w-4 h-4 text-purple-400" />
            </Link>

            {/* Quick Search Button (Responsive on all screen sizes) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex-1 sm:flex-initial sm:w-52 md:w-60 bg-[#151924] hover:bg-[#1c2232] text-xs text-gray-400 px-3 py-2 rounded-lg border border-[#222736] hover:border-[#30374a] flex items-center justify-between transition-colors shadow-inner"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <span className="truncate">Search anime, cast...</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#0f121a] text-gray-400 border border-[#222736] rounded">
                Ctrl K
              </kbd>
            </button>

            {/* Mobile Hamburger Menu Button (Phone only: < 768px) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-[#151924] hover:bg-[#1d2232] border border-[#222736] text-gray-300 flex items-center justify-center flex-shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-white" />
              ) : (
                <Menu className="w-4 h-4 text-gray-300" />
              )}
            </button>

            {/* Admin Ingestion Engine Link (Desktop & Tablet) */}
            <Link
              href="/admin/sync"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#131722] hover:bg-[#181d2a] border border-[#222736] text-[11px] text-emerald-400 font-semibold flex-shrink-0 transition-colors"
              title="Open 1-Click AniList Ingestion Engine"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sync</span>
            </Link>
          </div>
        </div>

        {/* Mobile Slide-Down Drawer (Phones < 768px) */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#1e2330] bg-[#0f121a]/98 backdrop-blur-xl p-4 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto">
            {/* Section 1: Explore */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                Explore Anime
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <Link
                  href="/#catalog"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-gray-200 flex items-center gap-2 border border-[#202534] transition-colors"
                >
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Trending</span>
                </Link>

                <Link
                  href="/browse"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-gray-200 flex items-center gap-2 border border-[#202534] transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                  <span>Browse Matrix</span>
                </Link>

                <Link
                  href="/top"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-gray-200 flex items-center gap-2 border border-[#202534] transition-colors"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Top 100</span>
                </Link>

                <Link
                  href="/seasons"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-gray-200 flex items-center gap-2 border border-[#202534] transition-colors"
                >
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>Seasons</span>
                </Link>

                <Link
                  href="/studios"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-gray-200 flex items-center gap-2 border border-[#202534] transition-colors"
                >
                  <Building2 className="w-4 h-4 text-sky-400" />
                  <span>Studios</span>
                </Link>

                <Link
                  href="/watch"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-gray-200 flex items-center gap-2 border border-[#202534] transition-colors"
                >
                  <Tv className="w-4 h-4 text-rose-400" />
                  <span>Legal Streams</span>
                </Link>
              </div>
            </div>

            {/* Section 2: Characters & Cast */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#1e2330]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                Characters & Voice Cast
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <Link
                  href="/characters"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-gray-200 flex items-center gap-2 border border-[#202534] transition-colors"
                >
                  <Users className="w-4 h-4 text-pink-400" />
                  <span>Characters</span>
                </Link>

                <Link
                  href="/staff"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-gray-200 flex items-center gap-2 border border-[#202534] transition-colors"
                >
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span>Voice Cast</span>
                </Link>
              </div>
            </div>

            {/* Section 3: Interactive Platform Tools */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#1e2330]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                Interactive Tools
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <Link
                  href="/compare"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-gray-200 flex items-center gap-2 border border-[#202534] transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                  <span>Compare Anime</span>
                </Link>

                <Link
                  href="/quiz"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-gray-200 flex items-center gap-2 border border-[#202534] transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Taste Quiz</span>
                </Link>

                <Link
                  href="/import"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-gray-200 flex items-center gap-2 border border-[#202534] transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Import Lists</span>
                </Link>

                <Link
                  href="/tierlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-gray-200 flex items-center gap-2 border border-[#202534] transition-colors"
                >
                  <Trophy className="w-4 h-4 text-purple-400" />
                  <span>Tier List Maker</span>
                </Link>

                <Link
                  href="/random"
                  onClick={() => setIsMobileMenuOpen(false)}
                  prefetch={false}
                  className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-gray-200 flex items-center gap-2 border border-[#202534] transition-colors"
                >
                  <Dices className="w-4 h-4 text-amber-400" />
                  <span>Surprise Me</span>
                </Link>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#1e2330] flex items-center justify-between">
              <Link
                href="/watchlist"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xs text-blue-400 font-semibold flex items-center gap-1.5"
              >
                <Bookmark className="w-4 h-4 fill-blue-400/30" />
                <span>My Watchlist ({count})</span>
              </Link>

              <Link
                href="/admin/sync"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ingestion Sync</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile App Bottom Navigation Bar (Phones < 768px: Sticky, native app UX) */}
      <aside aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0f121a]/98 backdrop-blur-xl border-t border-[#1e2330] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-around">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              pathname === "/" ? "text-blue-400" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex flex-col items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>

          <Link
            href="/schedule"
            className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              pathname === "/schedule" ? "text-blue-400" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule</span>
          </Link>

          <Link
            href="/quiz"
            className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              pathname === "/quiz" ? "text-amber-300" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Quiz</span>
          </Link>

          <Link
            href="/watchlist"
            className={`flex flex-col items-center gap-1 text-[10px] font-medium relative transition-colors ${
              pathname === "/watchlist" ? "text-blue-400" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Watchlist</span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-blue-600 text-[9px] font-bold text-white flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </aside>

      {/* Global Search Dialog (Ctrl + K) */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onWatchTrailer={onWatchTrailer}
      />
    </>
  );
}
