"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Globe2,
  Lock,
} from "lucide-react";

export default function CommunityPulseBanner() {
  return (
    <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#121626] via-[#101322] to-[#0d0f18] border border-[#21273a] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex flex-col gap-2 max-w-xl text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-black text-blue-400">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="uppercase tracking-wider">The Open Anime Web</span>
        </div>
        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
          Fast, Ad-Free Anime Discovery Built for Connoisseurs
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed font-normal">
          Zero slow 10-second redirect ads, zero malware popups, and zero bloated 2008 tables.
          Direct streaming destinations, synchronized countdown clocks, and comprehensive Seiyuu cast filmographies.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full md:w-auto flex-shrink-0">
        <div className="p-3.5 rounded-2xl bg-[#151928] border border-[#232a3e] flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">100% Legal</div>
            <div className="text-[10px] text-gray-400">Official partners</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#151928] border border-[#232a3e] flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Zap className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Sub-100ms</div>
            <div className="text-[10px] text-gray-400">Turbopack edge</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#151928] border border-[#232a3e] flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Globe2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Live GraphQL</div>
            <div className="text-[10px] text-gray-400">Real-time stats</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#151928] border border-[#232a3e] flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Lock className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">100% Private</div>
            <div className="text-[10px] text-gray-400">Zero ad trackers</div>
          </div>
        </div>
      </div>
    </section>
  );
}
