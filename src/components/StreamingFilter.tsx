"use client";

import { Tv, ShieldCheck } from "lucide-react";
import StreamingRegionSelector from "./StreamingRegionSelector";

export type StreamFilterPlatform = "ALL" | "Crunchyroll" | "Netflix" | "Hulu" | "Amazon Prime Video";

interface StreamingFilterProps {
  selectedPlatform: StreamFilterPlatform;
  onSelectPlatform: (platform: StreamFilterPlatform) => void;
}

export default function StreamingFilter({
  selectedPlatform,
  onSelectPlatform,
}: StreamingFilterProps) {
  const platforms: Array<{ id: StreamFilterPlatform; label: string; badge: string; color: string }> = [
    { id: "ALL", label: "All Platforms", badge: "Universal", color: "bg-gray-700" },
    { id: "Crunchyroll", label: "Crunchyroll", badge: "Simulcast King", color: "bg-orange-600" },
    { id: "Netflix", label: "Netflix", badge: "Exclusives", color: "bg-red-600" },
    { id: "Hulu", label: "Hulu", badge: "US Catalog", color: "bg-emerald-600" },
    { id: "Amazon Prime Video", label: "Prime Video", badge: "Global", color: "bg-sky-600" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#141722] border border-[#222736]">
      <div className="flex items-center gap-2">
        <Tv className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-semibold text-gray-300">Filter by Official Stream:</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {platforms.map((p) => {
          const isActive = selectedPlatform === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPlatform(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
                isActive
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-[#181d2a] border-[#252c3d] text-gray-400 hover:text-white hover:border-[#32394e]"
              }`}
            >
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <StreamingRegionSelector compact />
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Legal & Verified</span>
        </div>
      </div>
    </div>
  );
}
