"use client";

import { useState, useRef, useEffect } from "react";
import { Bookmark, Check, ChevronDown, Trash2 } from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import { useWatchlist, WatchStatus } from "@/lib/watchlist";

interface WatchlistButtonProps {
  anime: AnimeMedia;
  compact?: boolean;
  size?: "sm" | "md" | "lg";
  placement?: "down" | "up";
}

const STATUS_CONFIG: Record<
  WatchStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  WATCHING: {
    label: "Watching",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
  },
  PLAN_TO_WATCH: {
    label: "Plan to Watch",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
  },
  DROPPED: {
    label: "Dropped",
    color: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
  },
};

export default function WatchlistButton({
  anime,
  compact = false,
  size,
  placement = "down",
}: WatchlistButtonProps) {
  const { getStatus, setItemStatus } = useWatchlist();
  const currentStatus = getStatus(anime.id);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleSelect = (status: WatchStatus | null, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setItemStatus(anime, status);
    setIsOpen(false);
  };

  const activeConfig = currentStatus ? STATUS_CONFIG[currentStatus] : null;
  const isCompact = compact || size === "sm";

  if (isCompact) {
    const compactPosition = placement === "up" ? "bottom-full mb-1.5 right-0" : "top-full mt-1.5 right-0";

    return (
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          title={currentStatus ? `Watchlist: ${activeConfig?.label}` : "Add to Watchlist"}
          className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
            currentStatus
              ? `${activeConfig?.bg} ${activeConfig?.border} ${activeConfig?.color}`
              : "bg-[#11141c]/90 hover:bg-[#191d29] text-gray-400 hover:text-white border-[#242b3d]"
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${currentStatus ? "fill-current" : ""}`} />
        </button>

        {isOpen && (
          <div className={`absolute ${compactPosition} w-40 rounded-lg bg-[#141722] border border-[#252b3d] shadow-2xl py-1 z-50 flex flex-col text-xs`}>
            {(Object.keys(STATUS_CONFIG) as WatchStatus[]).map((st) => (
              <button
                key={st}
                onClick={(e) => handleSelect(st, e)}
                className={`px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#1a1f2e] transition-colors ${
                  currentStatus === st ? STATUS_CONFIG[st].color : "text-gray-300"
                }`}
              >
                <span>{STATUS_CONFIG[st].label}</span>
                {currentStatus === st && <Check className="w-3.5 h-3.5 text-current" />}
              </button>
            ))}

            {currentStatus && (
              <>
                <div className="my-1 border-t border-[#222736]" />
                <button
                  onClick={(e) => handleSelect(null, e)}
                  className="px-3 py-1.5 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  const normalPosition = placement === "up" ? "bottom-full mb-2 left-0" : "top-full mt-2 left-0";

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
          currentStatus
            ? `${activeConfig?.bg} ${activeConfig?.border} ${activeConfig?.color}`
            : "bg-[#181d2a] hover:bg-[#202534] text-gray-200 border-[#262c3d]"
        }`}
      >
        <Bookmark className={`w-4 h-4 ${currentStatus ? "fill-current" : ""}`} />
        <span>{currentStatus ? activeConfig?.label : "Add to Watchlist"}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? (placement === "up" ? "-rotate-180" : "rotate-180") : ""}`} />
      </button>

      {isOpen && (
        <div className={`absolute ${normalPosition} w-48 rounded-xl bg-[#141722] border border-[#252b3d] shadow-2xl py-1.5 z-50 flex flex-col text-xs`}>
          {(Object.keys(STATUS_CONFIG) as WatchStatus[]).map((st) => (
            <button
              key={st}
              onClick={(e) => handleSelect(st, e)}
              className={`px-3.5 py-2 text-left flex items-center justify-between hover:bg-[#1a1f2e] transition-colors ${
                currentStatus === st ? STATUS_CONFIG[st].color : "text-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[st].bg.replace('/15', '')}`} />
                <span>{STATUS_CONFIG[st].label}</span>
              </div>
              {currentStatus === st && <Check className="w-4 h-4 text-current" />}
            </button>
          ))}

          {currentStatus && (
            <>
              <div className="my-1.5 border-t border-[#222736]" />
              <button
                onClick={(e) => handleSelect(null, e)}
                className="px-3.5 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove from List</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
