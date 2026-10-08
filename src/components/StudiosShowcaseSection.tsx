"use client";

import Link from "next/link";
import { Building2, ChevronRight, Sparkles } from "lucide-react";

interface StudioFeature {
  name: string;
  jpName: string;
  tagline: string;
  signatureStyle: string;
  flagshipWorks: string[];
  bannerUrl: string;
  color: string;
  borderHover: string;
}

const STUDIOS: StudioFeature[] = [
  {
    name: "MAPPA",
    jpName: "株式会社MAPPA",
    tagline: "High-octane intensity & raw cinematic realism",
    signatureStyle: "Dynamic sakuga battles & raw emotional tension",
    flagshipWorks: ["Jujutsu Kaisen", "Chainsaw Man", "AOT Final Season"],
    bannerUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
    color: "from-red-600/20 to-orange-600/20 text-orange-400",
    borderHover: "hover:border-orange-500/50",
  },
  {
    name: "ufotable",
    jpName: "ユーフォーテーブル",
    tagline: "Industry-leading digital effects & VFX swordplay",
    signatureStyle: "Unmatched 3D camera tracking & particle lighting",
    flagshipWorks: ["Demon Slayer", "Fate/Zero", "Heaven's Feel"],
    bannerUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    color: "from-purple-600/20 to-indigo-600/20 text-purple-400",
    borderHover: "hover:border-purple-500/50",
  },
  {
    name: "WIT STUDIO",
    jpName: "株式会社ウィットスタジオ",
    tagline: "Visceral 3D gear physics & kinetic line art",
    signatureStyle: "Organic hand-drawn kinetic action",
    flagshipWorks: ["Attack on Titan S1–3", "Vinland Saga", "Spy x Family"],
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    color: "from-emerald-600/20 to-teal-600/20 text-emerald-400",
    borderHover: "hover:border-emerald-500/50",
  },
  {
    name: "Kyoto Animation",
    jpName: "京都アニメーション",
    tagline: "Poetic character animation & emotional micro-acting",
    signatureStyle: "Hyper-expressive body language & lush backgrounds",
    flagshipWorks: ["Violet Evergarden", "A Silent Voice", "Hyouka"],
    bannerUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
    color: "from-sky-600/20 to-blue-600/20 text-sky-400",
    borderHover: "hover:border-sky-500/50",
  },
  {
    name: "Bones",
    jpName: "株式会社ボンズ",
    tagline: "Legendary hand-drawn 2D impact frames & combat",
    signatureStyle: "Yutaka Nakamura iconic cubic debris & speedlines",
    flagshipWorks: ["Fullmetal Alchemist", "Mob Psycho 100", "My Hero Academia"],
    bannerUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80",
    color: "from-amber-600/20 to-yellow-600/20 text-amber-400",
    borderHover: "hover:border-amber-500/50",
  },
];

export default function StudiosShowcaseSection() {
  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202638] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-400 flex-shrink-0 shadow-sm">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Premier Animation Studios
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/25">
                Master Craft
              </span>
            </div>
            <p className="text-xs text-gray-400">
              The visionary production houses behind the world's most celebrated anime masterpieces.
            </p>
          </div>
        </div>

        <Link
          href="/studios"
          className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5 self-start sm:self-auto"
        >
          <span>All Studios</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid of 5 Studios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {STUDIOS.map((studio) => (
          <Link
            key={studio.name}
            href="/studios"
            className={`p-4 sm:p-5 rounded-2xl bg-[#121522] border border-[#21273a] ${studio.borderHover} hover:bg-[#151928] transition-all flex flex-col justify-between gap-3.5 group shadow-sm hover:shadow-xl hover:-translate-y-0.5`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-black text-sm sm:text-base text-white group-hover:text-blue-400 transition-colors">
                  {studio.name}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {studio.jpName}
                </span>
              </div>

              <p className="text-[11px] text-gray-400 mt-1 leading-snug line-clamp-2">
                {studio.tagline}
              </p>
            </div>

            <div className="pt-2.5 border-t border-[#1d2334]">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Signature Hits:
              </span>
              <ul className="flex flex-col gap-1 mt-1.5">
                {studio.flagshipWorks.map((work) => (
                  <li
                    key={work}
                    className="text-[11px] text-gray-300 truncate flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span>{work}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-[11px] font-bold text-blue-400 group-hover:text-blue-300 flex items-center gap-1 pt-1.5 border-t border-[#1d2334]">
              <span>Production Catalog</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
