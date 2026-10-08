"use client";

import { Tv, ShieldCheck, ExternalLink, Globe, Sparkles, Check } from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import { StreamingBrandLogo } from "./BrandLogos";
import { resolveStreamingProviders } from "@/lib/streamingResolver";

interface StreamingAffiliateBoxProps {
  anime: AnimeMedia;
}

const STREAM_BRAND_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  Crunchyroll: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30", label: "Crunchyroll" },
  Netflix: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30", label: "Netflix" },
  Hulu: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", label: "Hulu" },
  "Amazon Prime Video": { bg: "bg-sky-500/15", text: "text-sky-400", border: "border-sky-500/30", label: "Prime Video" },
  HIDIVE: { bg: "bg-cyan-500/15", text: "text-cyan-400", border: "border-cyan-500/30", label: "HIDIVE" },
  "Disney Plus": { bg: "bg-blue-600/15", text: "text-blue-400", border: "border-blue-500/30", label: "Disney+" },
  "Bilibili TV": { bg: "bg-indigo-500/15", text: "text-indigo-400", border: "border-indigo-500/30", label: "Bilibili" },
  YouTube: { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30", label: "YouTube" },
};

export default function StreamingAffiliateBox({ anime }: StreamingAffiliateBoxProps) {
  const displayTitle = anime.title.english || anime.title.romaji;

  // Automatically discover & populate verified legal streaming providers
  const streamingLinks = resolveStreamingProviders(anime);

  return (
    <div className="rounded-2xl bg-[#141722] border border-[#222736] p-5 sm:p-6 flex flex-col gap-6 shadow-sm">
      {/* Box Header */}
      <div className="flex items-center justify-between border-b border-[#202533] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Where to Watch &quot;{displayTitle}&quot; Officially
            </h3>
            <p className="text-xs text-gray-400">
              Verified legal streaming providers with 1080p simulcasts and dual audio.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% Legal & Safe</span>
        </div>
      </div>

      {/* Official Streaming Providers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {streamingLinks.map((stream) => {
          const brand = STREAM_BRAND_CONFIG[stream.site] || {
            bg: "bg-[#202636]",
            text: "text-blue-400",
            border: "border-[#2c344a]",
            label: stream.site,
          };

          return (
            <a
              key={stream.id || stream.url}
              href={stream.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-[#181c28] border border-[#242b3b] hover:border-blue-500/50 hover:bg-[#1c2130] transition-all flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <StreamingBrandLogo
                  site={stream.site}
                  className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                      {stream.site}
                    </span>
                    {stream.isAutoResolved && (
                      <span className="text-[9px] font-semibold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                        Auto-Matched
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium">Official Episodes • Full HD</div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                <span>Watch</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>
          );
        })}
      </div>

      {/* High-Visibility Premium VPN Geo-Unblocker Showcase (NordVPN Affiliate Module) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1c27] via-[#0d222b] to-[#0c1829] border-2 border-emerald-500/40 p-5 sm:p-6 shadow-xl shadow-emerald-950/40 group hover:border-emerald-400 transition-all duration-300">
        {/* Ambient Glow Gradient */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500" />
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Info Column */}
          <div className="flex items-start gap-4 flex-1">
            {/* Shield / Logo Icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-lg shadow-emerald-500/10 mt-0.5">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>

            <div className="flex flex-col gap-1.5">
              {/* Badges strip */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Official Streaming Partner
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  🔥 Special 70% Off + 3 Months Free
                </span>
                <span className="text-[10px] text-gray-400 font-medium hidden sm:inline-block">
                  ★ 4.9/5 by 140k+ Anime Streamers
                </span>
              </div>

              {/* Headline */}
              <h4 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Unlock Anime Blocked in Your Country or Region</span>
              </h4>

              {/* Description */}
              <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
                Stream regional exclusives on <strong className="text-white">Japanese Netflix</strong>, <strong className="text-white">US Crunchyroll</strong>, and <strong className="text-white">Tokyo Abema TV</strong> with zero buffering, 10Gbps high-speed servers, and instant geo-unblocking.
              </p>

              {/* Value Feature Pills */}
              <div className="flex items-center gap-3.5 flex-wrap pt-1 text-xs text-gray-300">
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>10Gbps Ultra-Fast Anime Servers</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tokyo & US Streaming IPs</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>30-Day Money-Back Guarantee</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Pricing & CTA Action Column */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end justify-between gap-3 flex-shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-emerald-500/20">
            <div className="text-center lg:text-right">
              <div className="flex items-baseline gap-1.5 justify-center lg:justify-end">
                <span className="text-2xl sm:text-3xl font-black text-white">$3.09</span>
                <span className="text-xs text-gray-400 font-medium">/ month</span>
                <span className="text-xs text-gray-500 line-through ml-1">$12.99</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 block">
                Save 70% + 3 Extra Months Free
              </span>
            </div>

            <a
              href="https://nordvpn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 font-black text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>Unblock with NordVPN (70% Off)</span>
              <ExternalLink className="w-4 h-4 text-gray-950 stroke-[2.5]" />
            </a>

            <span className="text-[10px] text-gray-400 text-center lg:text-right">
              Verified 100% Legal & Risk-Free
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
