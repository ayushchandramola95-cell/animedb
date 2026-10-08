"use client";

import Link from "next/link";
import {
  Play,
  Flame,
  SlidersHorizontal,
  Trophy,
  Users,
  Mic,
  Calendar,
  Compass,
  Building2,
  Tv,
  Bookmark,
  ArrowLeftRight,
  Sparkles,
  Download,
  ShieldCheck,
  Zap,
  Globe,
  ExternalLink,
  Command,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[#1e2330] bg-[#0c0e14] text-xs text-gray-400">
      {/* Top Banner / Value Bar */}
      <div className="border-b border-[#181d28] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-xs">Sub-100ms Speed</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Turbo edge-cached Next.js engine with zero ad bloat.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-xs">100% Legal Streaming</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Official destination guides for Crunchyroll, Netflix & Hulu.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-xs">Live AniList GraphQL</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Real-time airing countdowns, scores, and Seiyuu data.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-xs">Zero-Login Watchlist</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Private client-side storage with 1-click AniList/MAL import.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-Column Links Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand Info & Mission */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
                <Play className="w-4 h-4 fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                  AnimeDB
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Live
                  </span>
                </span>
                <span className="text-[10px] text-gray-400">Next-Gen Anime Discovery & Guide</span>
              </div>
            </Link>

            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              The internet&apos;s fastest, cleanest anime encyclopedia and legal streaming guide.
              Pairing legendary Japanese voice actors, accurate release countdowns, and side-by-side anime comparisons.
            </p>

            {/* Quick Search Shortcut Tip */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141824] border border-[#222736] text-[11px] text-gray-300 w-fit">
              <Command className="w-3.5 h-3.5 text-blue-400" />
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-[#1d2232] border border-[#2c3347] font-mono text-[10px] text-white">Ctrl + K</kbd> anywhere to search</span>
            </div>

            {/* Live System Status Pill */}
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AniList GraphQL API: Operational & Synchronized</span>
            </div>
          </div>

          {/* Col 1: Explore & Browse */}
          <div className="flex flex-col gap-3">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Explore Anime</h5>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/#catalog" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Trending Now</span>
                </Link>
              </li>
              <li>
                <Link href="/browse" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Browse Matrix</span>
                </Link>
              </li>
              <li>
                <Link href="/top" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Top 100 Leaderboard</span>
                </Link>
              </li>
              <li>
                <Link href="/seasons" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Seasons Archive (2000–2026)</span>
                </Link>
              </li>
              <li>
                <Link href="/studios" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Studios Directory</span>
                </Link>
              </li>
              <li>
                <Link href="/watch" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-rose-400" />
                  <span>Legal Streams Guide</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Characters & Cast */}
          <div className="flex flex-col gap-3">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Characters & Cast</h5>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/characters" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-pink-400" />
                  <span>Top Characters Hall of Fame</span>
                </Link>
              </li>
              <li>
                <Link href="/staff" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Japanese Voice Cast (Seiyuu)</span>
                </Link>
              </li>
              <li>
                <Link href="/staff" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Anime Directors & Composers</span>
                </Link>
              </li>
              <li>
                <Link href="/character/40882" className="hover:text-blue-400 transition-colors">
                  <span>Eren Yeager (Attack on Titan)</span>
                </Link>
              </li>
              <li>
                <Link href="/character/40881" className="hover:text-blue-400 transition-colors">
                  <span>Mikasa Ackerman (Attack on Titan)</span>
                </Link>
              </li>
              <li>
                <Link href="/staff/95672" className="hover:text-blue-400 transition-colors">
                  <span>Yuuki Kaji (Featured Seiyuu)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Interactive Tools */}
          <div className="flex flex-col gap-3">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Platform Tools</h5>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/compare" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Anime Comparison Engine</span>
                </Link>
              </li>
              <li>
                <Link href="/quiz" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Taste Quiz & Recommender</span>
                </Link>
              </li>
              <li>
                <Link href="/import" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Import AniList / MAL List</span>
                </Link>
              </li>
              <li>
                <Link href="/tierlist" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-purple-400" />
                  <span>Anime Tier List Maker</span>
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Weekly Airing Calendar</span>
                </Link>
              </li>
              <li>
                <Link href="/watchlist" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-blue-400" />
                  <span>Personal Watchlist</span>
                </Link>
              </li>
              <li>
                <Link href="/random" prefetch={false} className="hover:text-blue-400 transition-colors">
                  <span>Roll the Dice (Surprise Me)</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Legal & Copyright Bottom Strip */}
      <div className="border-t border-[#181d28] bg-[#090b10] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <div>
            <span>© {new Date().getFullYear()} AnimeDB. Built for anime fans worldwide.</span>
            <span className="mx-2">•</span>
            <span>Metadata provided via AniList GraphQL API.</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-gray-400">
            <span className="text-gray-500">Verified Legal Sources:</span>
            <span className="hover:text-white transition-colors">Crunchyroll</span>
            <span>•</span>
            <span className="hover:text-white transition-colors">Netflix</span>
            <span>•</span>
            <span className="hover:text-white transition-colors">Hulu</span>
            <span>•</span>
            <span className="hover:text-white transition-colors">Prime Video</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 text-[10px] text-gray-600 text-center md:text-left">
          AnimeDB is a legal discovery portal, encyclopedia, and review platform. AnimeDB does not host, stream, or store any unlicensed media files. All trademarks and streaming logos belong to their respective copyright holders.
        </div>
      </div>
    </footer>
  );
}
