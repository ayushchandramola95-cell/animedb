"use client";

import Link from "next/link";
import { Mic, User } from "lucide-react";
import { AnimeMedia } from "@/lib/types";

interface SeiyuuVisualizerProps {
  characters?: AnimeMedia["characters"];
}

export default function SeiyuuVisualizer({ characters }: SeiyuuVisualizerProps) {
  const edges = characters?.edges || [];

  if (edges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-blue-400" />
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Characters & Voice Actors (Seiyuu)
          </h3>
        </div>
        <span className="text-xs text-gray-400">
          Japanese Voice Cast
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {edges.map((edge, idx) => {
          const char = edge.node;
          const va = edge.voiceActors?.[0];

          return (
            <div
              key={idx}
              className="rounded-xl bg-[#141722] border border-[#222736] hover:border-[#32394e] p-2.5 flex items-center justify-between gap-3 transition-colors"
            >
              {/* Character (Left) */}
              <Link
                href={`/character/${char.id}`}
                className="flex items-center gap-2.5 min-w-0 flex-1 group hover:opacity-90 transition-opacity"
                title={`View ${char.name.full}'s character profile`}
              >
                <div className="w-12 h-16 rounded-lg bg-[#1a1f2e] overflow-hidden flex-shrink-0 border border-[#262c3d] group-hover:border-blue-500/50 transition-colors">
                  {char.image?.large ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={char.image.large}
                      alt={char.name.full}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white group-hover:text-blue-400 truncate transition-colors" title={char.name.full}>
                    {char.name.full}
                  </h4>
                  <span
                    className={`inline-block text-[10px] font-medium px-1.5 py-0.2 rounded mt-1 ${
                      edge.role === "MAIN"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-gray-800 text-gray-400 border border-gray-700"
                    }`}
                  >
                    {edge.role}
                  </span>
                </div>
              </Link>

              {/* Divider */}
              <div className="w-px h-10 bg-[#222736] flex-shrink-0" />

              {/* Voice Actor (Right) */}
              {va ? (
                <Link
                  href={`/staff/${va.id}`}
                  className="flex items-center gap-2.5 min-w-0 flex-1 justify-end text-right group hover:opacity-90 transition-opacity"
                  title={`View ${va.name.full}'s staff and seiyuu profile`}
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-white group-hover:text-emerald-400 truncate transition-colors" title={va.name.full}>
                      {va.name.full}
                    </h4>
                    <span className="text-[10px] text-gray-400 group-hover:text-emerald-400/80 block mt-0.5 transition-colors">
                      Japanese VA
                    </span>
                  </div>

                  <div className="w-12 h-16 rounded-lg bg-[#1a1f2e] overflow-hidden flex-shrink-0 border border-[#262c3d] group-hover:border-emerald-500/50 transition-colors">
                    {va.image?.large ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={va.image.large}
                        alt={va.name.full}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </Link>
              ) : (
                <div className="text-[11px] text-gray-500 italic pr-2">
                  TBA
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
