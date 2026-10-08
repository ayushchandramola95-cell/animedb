"use client";

import { Trophy, Star, Flame, Award } from "lucide-react";

interface Ranking {
  id?: number;
  rank: number;
  type: string;
  allTime: boolean;
  context: string;
  season?: string | null;
  year?: number | null;
}

interface AnimeRankingsStripProps {
  rankings?: Ranking[];
}

export default function AnimeRankingsStrip({ rankings }: AnimeRankingsStripProps) {
  if (!rankings || rankings.length === 0) return null;

  // Filter the top 3-4 most prominent rankings (all-time or highest ranked)
  const topRankings = rankings
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 4);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {topRankings.map((r, idx) => {
        const isRated = r.type === "RATED";
        const isAllTime = r.allTime;

        return (
          <div
            key={idx}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors ${
              r.rank === 1
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : r.rank <= 10
                ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
                : "bg-[#181c28] border-[#262c3e] text-gray-300"
            }`}
          >
            {isRated ? (
              <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
            ) : isAllTime ? (
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Award className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="font-extrabold text-white">#{r.rank}</span>
            <span className="capitalize text-gray-300 font-medium">
              {r.context}
            </span>
          </div>
        );
      })}
    </div>
  );
}
