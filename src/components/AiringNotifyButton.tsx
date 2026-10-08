"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, Check } from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import { isReminderSubscribed, toggleAiringReminder } from "@/lib/airingNotifications";

interface AiringNotifyButtonProps {
  anime: AnimeMedia;
  compact?: boolean;
}

export default function AiringNotifyButton({
  anime,
  compact = false,
}: AiringNotifyButtonProps) {
  const [subscribed, setSubscribed] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setSubscribed(isReminderSubscribed(anime.id));
  }, [anime.id]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const result = await toggleAiringReminder(anime);
    setSubscribed(result.subscribed);
    if (result.subscribed) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }
  };

  if (!anime.nextAiringEpisode) return null;

  if (compact) {
    return (
      <div className="relative inline-block">
        <button
          onClick={handleClick}
          title={subscribed ? "Broadcast reminder active (Click to cancel)" : "Notify me before this episode airs"}
          className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
            subscribed
              ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm"
              : "bg-[#141824]/80 hover:bg-[#1a2030] text-gray-400 hover:text-white border-[#222838]"
          }`}
        >
          {subscribed ? (
            <BellRing className="w-3.5 h-3.5 fill-current animate-pulse text-amber-400" />
          ) : (
            <Bell className="w-3.5 h-3.5" />
          )}
        </button>

        {showToast && (
          <div className="absolute right-0 bottom-full mb-1.5 px-2 py-1 rounded bg-[#161a26] border border-amber-500/40 text-[10px] text-amber-300 font-bold whitespace-nowrap shadow-xl z-50 flex items-center gap-1 animate-fade-in">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Reminder Set!</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
          subscribed
            ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
            : "bg-[#161a26] hover:bg-[#1f2537] text-gray-300 hover:text-white border-[#262c3e]"
        }`}
      >
        {subscribed ? (
          <>
            <BellRing className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse" />
            <span>Reminder Active</span>
          </>
        ) : (
          <>
            <Bell className="w-3.5 h-3.5 text-gray-400" />
            <span>Notify Me</span>
          </>
        )}
      </button>

      {showToast && (
        <div className="absolute left-0 bottom-full mb-1.5 px-2.5 py-1 rounded-md bg-[#161a26] border border-amber-500/40 text-[11px] text-amber-300 font-bold whitespace-nowrap shadow-xl z-50 flex items-center gap-1.5 animate-fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Alert enabled for this episode!</span>
        </div>
      )}
    </div>
  );
}
