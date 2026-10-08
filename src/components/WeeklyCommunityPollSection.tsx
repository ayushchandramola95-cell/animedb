"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Vote, CheckCircle2, Trophy, Clock, Sparkles, TrendingUp } from "lucide-react";
import { AnimeMedia } from "@/lib/types";

interface WeeklyCommunityPollSectionProps {
  candidates?: AnimeMedia[];
}

export default function WeeklyCommunityPollSection({
  candidates = [],
}: WeeklyCommunityPollSectionProps) {
  // Use top 5 candidates or fallback titles
  const nominees = candidates.slice(0, 5);

  // Poll state persisted in localStorage
  const [votedId, setVotedId] = useState<number | null>(null);
  const [votes, setVotes] = useState<Record<number, number>>({});

  useEffect(() => {
    // Generate base synthetic votes seeded by index for realism
    const initialVotes: Record<number, number> = {};
    const baseAmounts = [4250, 3620, 2980, 2340, 1890];
    nominees.forEach((nom, idx) => {
      initialVotes[nom.id] = baseAmounts[idx] || 1500;
    });

    try {
      const saved = localStorage.getItem("animedb_weekly_poll_vote");
      if (saved) {
        const parsed = parseInt(saved, 10);
        setVotedId(parsed);
        if (initialVotes[parsed]) {
          initialVotes[parsed] += 1;
        }
      }
    } catch {
      // Ignore storage errors
    }
    setVotes(initialVotes);
  }, [candidates]);

  const handleVote = (id: number) => {
    setVotes((prev) => {
      const updated = { ...prev };
      if (votedId && updated[votedId] && votedId !== id) {
        updated[votedId] = Math.max(0, updated[votedId] - 1);
      }
      updated[id] = (updated[id] || 0) + 1;
      return updated;
    });

    setVotedId(id);
    try {
      localStorage.setItem("animedb_weekly_poll_vote", id.toString());
    } catch {
      // Ignore
    }
  };

  const totalVotes = Object.values(votes).reduce((sum, v) => sum + v, 0);

  if (nominees.length === 0) return null;

  return (
    <section className="rounded-3xl bg-gradient-to-b from-[#121626] to-[#0f121d] border border-[#21273a] p-6 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202638] pb-4 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 flex-shrink-0 shadow-sm">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Weekly Community Poll: Anime of the Week
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">
                Week 4 Live
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Cast your vote for this week's standout broadcast episode. Live tally updates instantly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-gray-400 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141828] border border-[#23293e]">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold text-gray-300">Closes in 2d 16h</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141828] border border-[#23293e]">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-bold text-white">
              {totalVotes.toLocaleString()} Votes Logged
            </span>
          </div>
        </div>
      </div>

      {/* Poll Options List */}
      <div className="flex flex-col gap-3 relative z-10">
        {nominees.map((nom, index) => {
          const title = nom.title.english || nom.title.romaji;
          const studio = nom.studios?.nodes?.[0]?.name;
          const voteCount = votes[nom.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isVoted = votedId === nom.id;

          return (
            <div
              key={nom.id}
              onClick={() => handleVote(nom.id)}
              className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col gap-2 overflow-hidden ${
                isVoted
                  ? "bg-[#151a2b] border-blue-500/60 shadow-lg ring-1 ring-blue-500/30"
                  : "bg-[#131624] hover:bg-[#171c2c] border-[#22283a] hover:border-[#30384e]"
              }`}
            >
              {/* Animated Progress Bar Fill */}
              <div
                className={`absolute inset-y-0 left-0 rounded-2xl transition-all duration-700 pointer-events-none ${
                  isVoted
                    ? "bg-gradient-to-r from-blue-600/25 to-indigo-600/30"
                    : "bg-blue-600/10 group-hover:bg-blue-600/15"
                }`}
                style={{ width: `${percentage}%` }}
              />

              <div className="relative flex items-center justify-between gap-3">
                {/* Left: Thumbnail & Titles */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-12 sm:w-14 aspect-[3/4] rounded-xl overflow-hidden bg-[#1a1f30] border border-[#272e42] flex-shrink-0 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={nom.coverImage.extraLarge || nom.coverImage.large || nom.coverImage.medium}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-gray-500 font-bold">
                        #{index + 1}
                      </span>
                      {index === 0 && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center gap-1 shadow-xs">
                          <Trophy className="w-2.5 h-2.5" />
                          <span>Current Leader</span>
                        </span>
                      )}
                      {studio && (
                        <span className="text-[10px] text-gray-400 truncate hidden sm:inline font-medium">
                          • {studio}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate mt-0.5">
                      {title}
                    </h3>
                  </div>
                </div>

                {/* Right: Percentage & Vote Action */}
                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black text-white font-mono">
                      {percentage}%
                    </span>
                    <span className="text-[10px] text-gray-400 block font-medium">
                      {voteCount.toLocaleString()} votes
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                      isVoted
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "bg-[#181d2e] hover:bg-blue-600 text-gray-300 hover:text-white border border-[#283046]"
                    }`}
                  >
                    {isVoted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Voted</span>
                      </>
                    ) : (
                      <span>Vote</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer reassurance */}
      <div className="mt-5 pt-3.5 border-t border-[#1f2538] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 relative z-10">
        <span>1 vote per user per weekly cycle. Community results finalized every Sunday at 23:59 JST.</span>
        <span className="text-blue-400 font-semibold">Powered by AnimeDB Community Pulse</span>
      </div>
    </section>
  );
}
