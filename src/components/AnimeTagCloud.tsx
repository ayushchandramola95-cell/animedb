"use client";

import { useState } from "react";
import { Tag, Eye, EyeOff, AlertTriangle } from "lucide-react";

interface AnimeTag {
  id?: number;
  name: string;
  description?: string;
  category?: string;
  rank: number;
  isMediaSpoiler: boolean;
}

interface AnimeTagCloudProps {
  tags?: AnimeTag[];
}

export default function AnimeTagCloud({ tags }: AnimeTagCloudProps) {
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!tags || tags.length === 0) return null;

  // Filter tags based on spoiler state
  const visibleTags = tags.filter((t) => showSpoilers || !t.isMediaSpoiler);
  const displayedTags = expanded ? visibleTags : visibleTags.slice(0, 16);
  const hasSpoilers = tags.some((t) => t.isMediaSpoiler);

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-[#131622] border border-[#222736] p-5 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-400" />
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Community Voted Tags & Tropes
          </h3>
          <span className="text-xs text-gray-500 font-medium hidden sm:inline-block">
            ({tags.length} tags)
          </span>
        </div>

        {hasSpoilers && (
          <button
            onClick={() => setShowSpoilers(!showSpoilers)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              showSpoilers
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-[#181c28] hover:bg-[#202534] text-gray-400 hover:text-white border-[#262c3e]"
            }`}
          >
            {showSpoilers ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide Spoiler Tags</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Show Spoiler Tags</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Tag Cloud Pills */}
      <div className="flex flex-wrap gap-2 pt-1">
        {displayedTags.map((tag, idx) => (
          <div
            key={idx}
            title={tag.description || tag.name}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-colors ${
              tag.isMediaSpoiler
                ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                : tag.rank >= 80
                ? "bg-[#181d2a] text-blue-300 border-blue-500/30 hover:border-blue-500/50"
                : "bg-[#161a26] text-gray-300 border-[#24293a] hover:border-[#333a4f]"
            }`}
          >
            <span>{tag.name}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                tag.rank >= 80
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-[#11141c] text-gray-400"
              }`}
            >
              {tag.rank}%
            </span>
          </div>
        ))}
      </div>

      {visibleTags.length > 16 && (
        <div className="pt-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            {expanded ? "Show Fewer Tags" : `+ Show ${visibleTags.length - 16} More Tags`}
          </button>
        </div>
      )}
    </section>
  );
}
