"use client";

import { useState } from "react";
import { BarChart3, PieChart, Users, TrendingUp } from "lucide-react";

interface ScorePoint {
  score: number;
  amount: number;
}

interface StatusPoint {
  status: string;
  amount: number;
}

interface AnimeStatsVisualizerProps {
  stats?: {
    scoreDistribution: ScorePoint[];
    statusDistribution: StatusPoint[];
  };
}

const STATUS_COLOR_MAP: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETED: { label: "Completed", color: "#10b981", bg: "bg-emerald-500" },
  CURRENT: { label: "Watching", color: "#3b82f6", bg: "bg-blue-500" },
  PLANNING: { label: "Planning", color: "#f59e0b", bg: "bg-amber-500" },
  DROPPED: { label: "Dropped", color: "#f43f5e", bg: "bg-rose-500" },
  PAUSED: { label: "Paused", color: "#a855f7", bg: "bg-purple-500" },
};

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toLocaleString();
}

export default function AnimeStatsVisualizer({ stats }: AnimeStatsVisualizerProps) {
  const [hoveredScore, setHoveredScore] = useState<ScorePoint | null>(null);

  if (!stats) return null;

  const scoreDist = stats.scoreDistribution || [];
  const statusDist = stats.statusDistribution || [];

  if (scoreDist.length === 0 && statusDist.length === 0) return null;

  // Calculate totals
  const totalScoreVotes = scoreDist.reduce((acc, curr) => acc + curr.amount, 0);
  const maxScoreAmount = Math.max(...scoreDist.map((s) => s.amount), 1);
  const totalStatusUsers = statusDist.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-[#131622] border border-[#222736] p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Community Stats & Score Distribution
          </h3>
        </div>
        <span className="text-xs text-gray-500 hidden sm:inline-block">
          AniList Real-Time Ratings ({formatCompactNumber(totalScoreVotes)} votes)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Bar */}
        <div className="flex flex-col gap-3 rounded-xl bg-[#181c28] border border-[#242a3b] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-blue-400" />
              <span>Watchlist Status Breakdown</span>
            </span>
            <span className="text-[11px] text-gray-400 font-semibold">
              {formatCompactNumber(totalStatusUsers)} Total Trackers
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full h-3 rounded-full bg-[#11141c] overflow-hidden flex">
            {statusDist.map((item, idx) => {
              const pct = totalStatusUsers > 0 ? (item.amount / totalStatusUsers) * 100 : 0;
              const config = STATUS_COLOR_MAP[item.status] || {
                label: item.status,
                color: "#6b7280",
                bg: "bg-gray-500",
              };

              return (
                <div
                  key={idx}
                  style={{ width: `${pct}%`, backgroundColor: config.color }}
                  className="h-full transition-all hover:opacity-80"
                  title={`${config.label}: ${item.amount.toLocaleString()} (${pct.toFixed(1)}%)`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
            {statusDist.map((item, idx) => {
              const pct = totalStatusUsers > 0 ? ((item.amount / totalStatusUsers) * 100).toFixed(1) : "0";
              const config = STATUS_COLOR_MAP[item.status] || {
                label: item.status,
                color: "#6b7280",
                bg: "bg-gray-500",
              };

              return (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <div className="min-w-0">
                    <span className="text-gray-300 font-medium block truncate">
                      {config.label}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {formatCompactNumber(item.amount)} ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score Distribution Histogram */}
        <div className="flex flex-col gap-3 rounded-xl bg-[#181c28] border border-[#242a3b] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Score Distribution (10 – 100%)</span>
            </span>

            {hoveredScore ? (
              <span className="text-[11px] font-bold text-emerald-400">
                Score {hoveredScore.score}% • {hoveredScore.amount.toLocaleString()} votes (
                {totalScoreVotes > 0 ? ((hoveredScore.amount / totalScoreVotes) * 100).toFixed(1) : 0}%)
              </span>
            ) : (
              <span className="text-[11px] text-gray-500">
                Hover bars for exact breakdown
              </span>
            )}
          </div>

          {/* Histogram Bars */}
          <div className="h-28 flex items-end gap-1.5 pt-4 pb-1">
            {scoreDist.map((point) => {
              const heightPct = Math.max((point.amount / maxScoreAmount) * 100, 6);
              const isHovered = hoveredScore?.score === point.score;
              const isHigh = point.score >= 80;

              return (
                <div
                  key={point.score}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setHoveredScore(point)}
                  onMouseLeave={() => setHoveredScore(null)}
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-sm transition-all duration-200 ${
                      isHovered
                        ? "bg-emerald-400"
                        : isHigh
                        ? "bg-blue-500/80 group-hover:bg-blue-400"
                        : "bg-[#28324a] group-hover:bg-gray-400"
                    }`}
                  />
                  <span className="text-[10px] text-gray-500 mt-1 font-mono">
                    {point.score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
