"use client";

import Link from "next/link";
import { Sparkles, ThumbsUp, Star } from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import AnimeCard from "./AnimeCard";

interface RecommendationNode {
  rating: number;
  mediaRecommendation: AnimeMedia | null;
}

interface AnimeRecommendationsProps {
  recommendations?: {
    nodes: RecommendationNode[];
  };
  onWatchTrailer?: (trailerId: string, title: string, streamUrl?: string, streamSite?: string) => void;
}

export default function AnimeRecommendations({
  recommendations,
  onWatchTrailer,
}: AnimeRecommendationsProps) {
  if (!recommendations || !recommendations.nodes) return null;

  // Filter valid media recommendations
  const validRecs = recommendations.nodes.filter(
    (n) => n.mediaRecommendation && n.mediaRecommendation.id
  );

  if (validRecs.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Community Recommendations (You May Also Like)
          </h3>
        </div>
        <span className="text-xs text-gray-500 hidden sm:inline-block">
          Voted by thousands of anime enthusiasts
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {validRecs.slice(0, 6).map((rec, idx) => {
          const anime = rec.mediaRecommendation!;
          return (
            <div key={idx} className="relative flex flex-col group">
              <AnimeCard anime={anime} onWatchTrailer={onWatchTrailer} />

              {/* User Endorsement Count Badge */}
              {rec.rating > 0 && (
                <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-0.5 rounded-md">
                  <ThumbsUp className="w-3 h-3" />
                  <span>+{rec.rating.toLocaleString()} recommendations</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
