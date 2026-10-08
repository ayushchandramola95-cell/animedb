"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  Sparkles,
  Dices,
  Download,
  Star,
  ArrowRight,
  Zap,
  Brain,
  ListOrdered,
} from "lucide-react";

export default function InteractiveDiscoveryLaunchpad() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Head-to-Head Anime Comparison Engine */}
      <div className="p-5 rounded-2xl bg-[#121522] border border-[#21273a] hover:border-cyan-500/50 hover:bg-[#151928] transition-all flex flex-col justify-between gap-4 group shadow-sm hover:shadow-xl hover:-translate-y-0.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shadow-xs">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/15 px-2.5 py-0.5 rounded-full border border-cyan-500/25">
            Head-to-Head
          </span>
        </div>

        <div>
          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
            Anime Comparison Engine
          </h3>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            Side-by-side metric analytics &amp; instant detection of shared Japanese voice actors (Seiyuu).
          </p>

          {/* Mini Preset Pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Link
              href="/compare?a=16498&b=101922"
              className="text-[10px] font-semibold px-2 py-1 rounded-md bg-[#161a2a] hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-[#242c40] transition-colors"
            >
              AOT vs Demon Slayer
            </Link>
            <Link
              href="/compare?a=113415&b=127230"
              className="text-[10px] font-semibold px-2 py-1 rounded-md bg-[#161a2a] hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-[#242c40] transition-colors"
            >
              JJK vs Chainsaw Man
            </Link>
          </div>
        </div>

        <Link
          href="/compare"
          className="text-xs font-bold text-cyan-400 flex items-center gap-1 group-hover:gap-2 transition-all pt-2.5 border-t border-[#1d2334]"
        >
          <span>Launch Comparison Tool</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. Anime Taste Quiz & Recommender */}
      <div className="p-5 rounded-2xl bg-[#121522] border border-[#21273a] hover:border-amber-500/50 hover:bg-[#151928] transition-all flex flex-col justify-between gap-4 group shadow-sm hover:shadow-xl hover:-translate-y-0.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/25">
            60-Sec Quiz
          </span>
        </div>

        <div>
          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-400 transition-colors">
            What Should I Watch Next?
          </h3>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            Answer 3 quick questions about your mood, available time, and streaming platform subscriptions.
          </p>

          {/* Quick Mood Chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Link
              href="/quiz"
              className="text-[10px] font-semibold px-2 py-1 rounded-md bg-[#161a2a] hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 border border-[#242c40] transition-colors flex items-center gap-1"
            >
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              <span>Adrenaline Hype</span>
            </Link>
            <Link
              href="/quiz"
              className="text-[10px] font-semibold px-2 py-1 rounded-md bg-[#161a2a] hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 border border-[#242c40] transition-colors flex items-center gap-1"
            >
              <Brain className="w-2.5 h-2.5 text-purple-400" />
              <span>Dark Mystery</span>
            </Link>
          </div>
        </div>

        <Link
          href="/quiz"
          className="text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:gap-2 transition-all pt-2.5 border-t border-[#1d2334]"
        >
          <span>Calculate My Matches</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3. Universal Watchlist Importer & Tier List Link */}
      <div className="p-5 rounded-2xl bg-[#121522] border border-[#21273a] hover:border-emerald-500/50 hover:bg-[#151928] transition-all flex flex-col justify-between gap-4 group shadow-sm hover:shadow-xl hover:-translate-y-0.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-xs">
            <Download className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
            Zero-Login Sync
          </span>
        </div>

        <div>
          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
            Import AniList &amp; MAL
          </h3>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            Transfer all your watched, planning, and completed lists in 1 click using your username or XML file.
          </p>

          <div className="flex items-center gap-2 mt-3 text-[11px] text-gray-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs" />
            <span>100% Client-Side Privacy</span>
          </div>
        </div>

        <Link
          href="/import"
          className="text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:gap-2 transition-all pt-2.5 border-t border-[#1d2334]"
        >
          <span>Start 1-Click Import</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4. Surprise Me (Random Masterpiece Dice) */}
      <div className="p-5 rounded-2xl bg-[#121522] border border-[#21273a] hover:border-purple-500/50 hover:bg-[#151928] transition-all flex flex-col justify-between gap-4 group shadow-sm hover:shadow-xl hover:-translate-y-0.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shadow-xs">
            <Dices className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/25">
            Instant Roll
          </span>
        </div>

        <div>
          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-400 transition-colors">
            Roll the Dice (Surprise Me)
          </h3>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            Tired of scrolling endlessly? Roll the dice to jump directly into a verified high-rated classic.
          </p>

          <div className="flex items-center gap-2 mt-3 text-[11px] text-gray-400 font-medium">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Guaranteed 80%+ Score</span>
          </div>
        </div>

        <Link
          href="/random"
          prefetch={false}
          className="text-xs font-bold text-purple-400 flex items-center gap-1 group-hover:gap-2 transition-all pt-2.5 border-t border-[#1d2334]"
        >
          <span>Roll for Random Anime</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
