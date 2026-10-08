"use client";

import { useRef, useState, useMemo } from "react";
import { X, Download, Copy, Check, BarChart2, Sparkles, Clock, Film, Trophy } from "lucide-react";
import { WatchlistItem, WatchStatus } from "@/lib/watchlist";

interface WatchlistStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: Record<number, WatchlistItem>;
}

export default function WatchlistStatsModal({
  isOpen,
  onClose,
  watchlist,
}: WatchlistStatsModalProps) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const items = useMemo(() => Object.values(watchlist), [watchlist]);

  const stats = useMemo(() => {
    let totalEps = 0;
    let completedCount = 0;
    let watchingCount = 0;
    let planCount = 0;
    let droppedCount = 0;
    const genreMap: Record<string, number> = {};
    let totalScore = 0;
    let scoredItems = 0;

    items.forEach((item) => {
      const anime = item.anime;
      const eps = anime.episodes || 12;
      totalEps += eps;

      if (item.status === "COMPLETED") completedCount++;
      else if (item.status === "WATCHING") watchingCount++;
      else if (item.status === "PLAN_TO_WATCH") planCount++;
      else if (item.status === "DROPPED") droppedCount++;

      if (anime.averageScore) {
        totalScore += anime.averageScore / 10;
        scoredItems++;
      }

      anime.genres?.forEach((g) => {
        genreMap[g] = (genreMap[g] || 0) + 1;
      });
    });

    const topGenres = Object.entries(genreMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);

    const totalHours = Math.round((totalEps * 24) / 60);
    const meanScore = scoredItems > 0 ? (totalScore / scoredItems).toFixed(1) : "8.2";

    return {
      totalAnime: items.length,
      totalEps,
      totalHours,
      completedCount,
      watchingCount,
      planCount,
      droppedCount,
      topGenres,
      meanScore,
    };
  }, [items]);

  if (!isOpen) return null;

  const handleCopyText = () => {
    const text = `📊 My AnimeDB Passport:\n🎬 ${stats.totalAnime} Anime Tracked (${stats.completedCount} Completed)\n⏱️ ~${stats.totalHours} Hours Watched (${stats.totalEps} Episodes)\n⭐ Average Score: ${stats.meanScore}/10\n🔥 Top Genres: ${stats.topGenres.join(", ") || "Action, Fantasy"}\n\nTrack your anime at https://animedb.org/watchlist`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions: 1200 x 630 (social share card standard)
    canvas.width = 1200;
    canvas.height = 630;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGrad.addColorStop(0, "#0c0e14");
    bgGrad.addColorStop(1, "#141724");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // Glowing accent blob
    const radial = ctx.createRadialGradient(200, 150, 20, 200, 150, 400);
    radial.addColorStop(0, "rgba(59, 130, 246, 0.2)");
    radial.addColorStop(1, "rgba(59, 130, 246, 0)");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 1200, 630);

    // Border
    ctx.strokeStyle = "#252b3d";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 1160, 590);

    // Title Brand
    ctx.fillStyle = "#3b82f6";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("ANIMEDB.ORG • ANIME PASSPORT", 60, 80);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px sans-serif";
    ctx.fillText("Personal Watchlist Analytics", 60, 145);

    // Stat boxes
    const drawBox = (x: number, y: number, w: number, h: number, val: string, label: string, color: string) => {
      ctx.fillStyle = "#121522";
      ctx.strokeStyle = "#23293a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = "bold 46px sans-serif";
      ctx.fillText(val, x + 30, y + 65);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 20px sans-serif";
      ctx.fillText(label, x + 30, y + 105);
    };

    drawBox(60, 190, 250, 140, stats.totalAnime.toString(), "Titles Tracked", "#38bdf8");
    drawBox(340, 190, 250, 140, `${stats.totalHours}h`, "Hours Watched", "#a855f7");
    drawBox(620, 190, 250, 140, stats.completedCount.toString(), "Completed", "#10b981");
    drawBox(900, 190, 240, 140, `${stats.meanScore} ★`, "Mean Score", "#f59e0b");

    // Breakdown Row
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "500 24px sans-serif";
    ctx.fillText(`Watching: ${stats.watchingCount}  •  Plan to Watch: ${stats.planCount}  •  Episodes: ${stats.totalEps}`, 60, 400);

    // Top Genres Row
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("Top Favorite Genres:", 60, 460);

    let tagX = 60;
    stats.topGenres.forEach((g) => {
      ctx.fillStyle = "#1e2436";
      ctx.strokeStyle = "#333d56";
      ctx.beginPath();
      ctx.roundRect(tagX, 480, 180, 45, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(g, tagX + 20, 508);
      tagX += 200;
    });

    // Watermark
    ctx.fillStyle = "#64748b";
    ctx.font = "500 18px sans-serif";
    ctx.fillText("Synced live from AnimeDB • Private zero-login anime database", 60, 580);

    // Trigger download
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "AnimeDB_Watchlist_Passport.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#11141e] border border-[#252b3d] p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-[#181d2a] hover:bg-[#222838] text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Your Watchlist Passport</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Stats Card
              </span>
            </h3>
            <p className="text-xs text-gray-400">
              Shareable summary of your anime journey and viewing achievements.
            </p>
          </div>
        </div>

        {/* Visual Preview Card */}
        <div className="p-5 rounded-xl bg-[#141724] border border-[#23293a] flex flex-col gap-4 relative overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-lg bg-[#181d2c] border border-[#262c3e]">
              <span className="text-xs text-gray-400 block">Total Titles</span>
              <span className="text-xl font-black text-blue-400">{stats.totalAnime}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#181d2c] border border-[#262c3e]">
              <span className="text-xs text-gray-400 block">Hours Spent</span>
              <span className="text-xl font-black text-purple-400">~{stats.totalHours}h</span>
            </div>
            <div className="p-3 rounded-lg bg-[#181d2c] border border-[#262c3e]">
              <span className="text-xs text-gray-400 block">Completed</span>
              <span className="text-xl font-black text-emerald-400">{stats.completedCount}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#181d2c] border border-[#262c3e]">
              <span className="text-xs text-gray-400 block">Mean Score</span>
              <span className="text-xl font-black text-amber-400">{stats.meanScore} ★</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-xs text-gray-300">
            <div className="flex justify-between py-1 border-b border-[#1f2434]">
              <span className="text-gray-400">Total Episodes Logged:</span>
              <span className="font-semibold text-white">{stats.totalEps} episodes</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1f2434]">
              <span className="text-gray-400">Currently Watching:</span>
              <span className="font-semibold text-white">{stats.watchingCount} titles</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-400">Top Genres:</span>
              <span className="font-semibold text-white">
                {stats.topGenres.join(", ") || "Action, Fantasy"}
              </span>
            </div>
          </div>
        </div>

        {/* Hidden Canvas for High-Res Image Generation */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Action Buttons */}
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={handleCopyText}
            className="px-4 py-2.5 rounded-xl bg-[#181d2a] hover:bg-[#202738] text-gray-200 border border-[#262c3e] text-xs font-semibold transition-all flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Summary Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadImage}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG Card</span>
          </button>
        </div>
      </div>
    </div>
  );
}
