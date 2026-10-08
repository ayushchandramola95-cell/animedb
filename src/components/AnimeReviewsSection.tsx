"use client";

import { useState } from "react";
import { MessageSquare, Star, ThumbsUp, ChevronDown, ChevronUp, User } from "lucide-react";

interface ReviewNode {
  id: number;
  summary: string;
  score: number;
  rating: number;
  ratingAmount: number;
  user: {
    name: string;
    avatar?: {
      medium?: string;
    };
  };
  body: string;
}

interface AnimeReviewsSectionProps {
  reviews?: {
    nodes: ReviewNode[];
  };
}

export default function AnimeReviewsSection({ reviews }: AnimeReviewsSectionProps) {
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});

  if (!reviews || !reviews.nodes || reviews.nodes.length === 0) return null;

  const toggleExpand = (id: number) => {
    setExpandedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-[#131622] border border-[#222736] p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Community Reviews & Critiques
          </h3>
          <span className="text-xs text-gray-400 font-semibold">
            ({reviews.nodes.length} Highlighted)
          </span>
        </div>
        <span className="text-xs text-gray-500 hidden sm:inline-block">
          AniList Editorial Opinions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.nodes.map((rev) => {
          const isExpanded = !!expandedReviews[rev.id];
          const cleanBody = rev.body
            ? rev.body
                .replace(/<[^>]*>?/gm, "")
                .replace(/__([^_]+)__/g, "$1")
                .replace(/\*\*([^*]+)\*\*/g, "$1")
                .replace(/~{2,}/g, "")
            : "";

          return (
            <div
              key={rev.id}
              className="rounded-xl bg-[#181c28] border border-[#252b3d] hover:border-[#32394e] p-4 flex flex-col justify-between gap-3 transition-colors shadow-sm"
            >
              {/* Reviewer Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-[#11141c] flex-shrink-0 border border-[#262c3e]">
                    {rev.user?.avatar?.medium ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={rev.user.avatar.medium}
                        alt={rev.user?.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-gray-200 truncate">
                      {rev.user?.name || "Community Member"}
                    </span>
                    <span className="text-[10px] text-gray-500">Community Critic</span>
                  </div>
                </div>

                {/* Score Pill */}
                <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1 flex-shrink-0">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{rev.score}%</span>
                </div>
              </div>

              {/* Review Summary */}
              <div className="flex flex-col gap-1.5 flex-1">
                <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                  &ldquo;{rev.summary}&rdquo;
                </h4>

                <p
                  className={`text-[11px] text-gray-400 leading-relaxed whitespace-pre-line ${
                    isExpanded ? "" : "line-clamp-4"
                  }`}
                >
                  {cleanBody}
                </p>

                {cleanBody.length > 200 && (
                  <button
                    onClick={() => toggleExpand(rev.id)}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 self-start inline-flex items-center gap-1 mt-1 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <span>Read Less</span>
                        <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <span>Read Full Review</span>
                        <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Helpful Votes Footer */}
              <div className="pt-2 border-t border-[#202534] flex items-center justify-between text-[10px] text-gray-500">
                <span className="flex items-center gap-1 text-gray-400 font-medium">
                  <ThumbsUp className="w-3 h-3 text-emerald-400" />
                  <span>{rev.rating} of {rev.ratingAmount} found helpful</span>
                </span>
                <span>AniList Review #{rev.id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
