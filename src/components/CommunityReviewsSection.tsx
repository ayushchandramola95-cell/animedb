"use client";

import Link from "next/link";
import { MessageSquare, ThumbsUp, ChevronRight, User, Quote } from "lucide-react";
import { GlobalReviewItem } from "@/lib/types";

interface CommunityReviewsSectionProps {
  reviews?: GlobalReviewItem[];
}

export default function CommunityReviewsSection({
  reviews = [],
}: CommunityReviewsSectionProps) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202638] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-sm">
            <MessageSquare className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Top Community Reviews & Critiques
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                Verified Opinions
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Honest editorial verdicts and in-depth appraisals written by passionate anime enthusiasts.
            </p>
          </div>
        </div>

        <Link
          href="/#catalog"
          className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5 self-start sm:self-auto"
        >
          <span>Explore Database</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid of Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.slice(0, 6).map((rev) => {
          const anime = rev.media;
          const title = anime.title.english || anime.title.romaji;
          const score = rev.score;
          const scoreColor =
            score >= 80
              ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
              : score >= 60
              ? "text-blue-400 bg-blue-500/15 border-blue-500/30"
              : "text-amber-400 bg-amber-500/15 border-amber-500/30";

          return (
            <div
              key={rev.id}
              className="p-4 sm:p-5 rounded-2xl bg-[#121522] border border-[#21273a] hover:border-emerald-500/40 hover:bg-[#151928] transition-all flex flex-col justify-between gap-3.5 shadow-sm hover:shadow-md group hover:-translate-y-0.5"
            >
              {/* Header: Reviewer & Score */}
              <div className="flex items-center justify-between gap-3 border-b border-[#1d2334] pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-[#181d2c] border border-[#272e42] flex-shrink-0 shadow-xs">
                    {rev.user.avatar?.medium ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rev.user.avatar.medium}
                        alt={rev.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {rev.user.name}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                      <ThumbsUp className="w-2.5 h-2.5 text-blue-400" />
                      <span>{rev.rating.toLocaleString()} found helpful</span>
                    </span>
                  </div>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-lg border text-xs font-black tracking-tight font-mono flex-shrink-0 shadow-xs ${scoreColor}`}
                >
                  {score}/100
                </div>
              </div>

              {/* Review Summary Body with Quotation Accent */}
              <div className="flex-1 relative">
                <Quote className="w-4 h-4 text-emerald-400/30 absolute -top-1 -left-1 fill-current" />
                <p className="text-xs text-gray-300 italic leading-relaxed line-clamp-3 pl-4">
                  "{rev.summary}"
                </p>
              </div>

              {/* Footer: Anime Card preview link */}
              <Link
                href={`/anime/${anime.id}`}
                className="mt-1 p-2.5 rounded-xl bg-[#151928] hover:bg-[#1b2134] border border-[#22293c] transition-colors flex items-center gap-3 shadow-xs"
              >
                <div className="relative w-8 aspect-[3/4] rounded-lg overflow-hidden bg-[#181d2c] flex-shrink-0 border border-[#272e42]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={anime.coverImage.extraLarge || anime.coverImage.large || anime.coverImage.medium}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-gray-400 font-medium">Reviewed Show</div>
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                    {title}
                  </h4>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
