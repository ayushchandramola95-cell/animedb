"use client";

import { Newspaper, ExternalLink, Clock } from "lucide-react";
import { AnimeNewsItem } from "@/lib/types";

interface AnimeNewsTickerSectionProps {
  news?: AnimeNewsItem[];
}

export default function AnimeNewsTickerSection({
  news = [],
}: AnimeNewsTickerSectionProps) {
  if (!news || news.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202638] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-sm">
            <Newspaper className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Anime Industry News & Broadcast Dispatches
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                Official Wire
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Breaking film festival premieres, sequel confirmations, key visuals, and studio announcements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-[#131624] border border-[#22283a]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-gray-300">Live RSS Feed Synced</span>
        </div>
      </div>

      {/* Grid of News Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {news.slice(0, 6).map((item) => {
          // Format publication date into human friendly string
          let formattedDate = item.pubDate;
          try {
            const dateObj = new Date(item.pubDate);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
            }
          } catch {
            // Keep original
          }

          return (
            <a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 sm:p-5 rounded-2xl bg-[#121522] hover:bg-[#151928] border border-[#21273a] hover:border-cyan-500/50 transition-all flex flex-col justify-between gap-3.5 shadow-sm hover:shadow-md group hover:-translate-y-0.5"
            >
              <div>
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-2 text-[10px] mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 font-bold uppercase tracking-wider">
                    {item.category || "Anime"}
                  </span>
                  <span className="text-gray-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span>{formattedDate}</span>
                  </span>
                </div>

                {/* Article Headline */}
                <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h3>

                {/* Snippet */}
                {item.snippet && (
                  <p className="text-[11px] text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                    {item.snippet}
                  </p>
                )}
              </div>

              {/* Read Link */}
              <div className="pt-2.5 border-t border-[#1d2334] flex items-center justify-between text-xs text-gray-400 group-hover:text-cyan-400 transition-colors">
                <span className="font-bold">Read Full Dispatch</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
