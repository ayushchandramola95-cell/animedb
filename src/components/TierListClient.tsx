"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Trophy,
  Download,
  RotateCcw,
  Search,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Layers,
  Flame,
  Star,
  Share2,
  Bookmark,
  Shuffle,
  ChevronRight,
  GripVertical,
  ExternalLink,
  Edit2,
  Palette,
  X,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import { useWatchlist } from "@/lib/watchlist";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface TierListClientProps {
  initialPool: AnimeMedia[];
}

export interface TierRow {
  key: string;
  label: string;
  sub: string;
  bg: string;
  hex: string;
  textColor: string;
}

const DEFAULT_TIERS: TierRow[] = [
  { key: "S", label: "S", sub: "Masterpiece", bg: "bg-rose-600", hex: "#e11d48", textColor: "text-white" },
  { key: "A", label: "A", sub: "Great", bg: "bg-orange-500", hex: "#f97316", textColor: "text-white" },
  { key: "B", label: "B", sub: "Good", bg: "bg-amber-500", hex: "#f59e0b", textColor: "text-white" },
  { key: "C", label: "C", sub: "Average", bg: "bg-emerald-600", hex: "#10b981", textColor: "text-white" },
  { key: "D", label: "D", sub: "Skip", bg: "bg-slate-600", hex: "#64748b", textColor: "text-white" },
];

export default function TierListClient({ initialPool }: TierListClientProps) {
  const { watchlist, count: watchlistCount } = useWatchlist();

  // Tier Rows configuration
  const [tiers, setTiers] = useState<TierRow[]>(DEFAULT_TIERS);

  // Items mapped by tier key
  const [tierData, setTierData] = useState<Record<string, AnimeMedia[]>>({
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  });

  const [pool, setPool] = useState<AnimeMedia[]>(initialPool);
  const [tierListTitle, setTierListTitle] = useState("My Anime Tier List");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [dragOverTier, setDragOverTier] = useState<string | null>(null);

  // Search & Filter Pool
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AnimeMedia[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [poolFilter, setPoolFilter] = useState<"all" | "shounen" | "fantasy" | "psychological" | "slice_of_life">("all");

  // Notifications
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Move an anime from anywhere to a target tier
  const moveToTier = (anime: AnimeMedia, targetTier: string) => {
    // Remove from unranked pool
    setPool((prev) => prev.filter((a) => a.id !== anime.id));

    // Remove from all existing tiers and add to target tier
    setTierData((prev) => {
      const next: Record<string, AnimeMedia[]> = {};
      Object.keys(prev).forEach((tk) => {
        next[tk] = prev[tk].filter((a) => a.id !== anime.id);
      });
      next[targetTier] = [...(next[targetTier] || []), anime];
      return next;
    });
  };

  // Move anime back to unranked pool
  const removeFromTier = (anime: AnimeMedia, currentTier: string) => {
    setTierData((prev) => ({
      ...prev,
      [currentTier]: (prev[currentTier] || []).filter((a) => a.id !== anime.id),
    }));
    setPool((prev) => (prev.some((a) => a.id === anime.id) ? prev : [anime, ...prev]));
  };

  // Clear specific tier row
  const clearTier = (tierKey: string) => {
    const items = tierData[tierKey] || [];
    if (items.length === 0) return;
    setTierData((prev) => ({
      ...prev,
      [tierKey]: [],
    }));
    setPool((prev) => [...items, ...prev]);
  };

  // Move tier row up
  const moveTierUp = (index: number) => {
    if (index <= 0) return;
    setTiers((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Move tier row down
  const moveTierDown = (index: number) => {
    if (index >= tiers.length - 1) return;
    setTiers((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Add a new custom tier row (e.g. S+ or F)
  const handleAddTierRow = () => {
    const newKey = `Tier ${tiers.length + 1}`;
    const newTier: TierRow = {
      key: newKey,
      label: newKey,
      sub: "Custom",
      bg: "bg-purple-600",
      hex: "#9333ea",
      textColor: "text-white",
    };
    setTiers((prev) => [...prev, newTier]);
    setTierData((prev) => ({ ...prev, [newKey]: [] }));
  };

  // Reset to initial
  const handleReset = () => {
    if (confirm("Reset tier list and return all anime to the unranked pool?")) {
      const resetObj: Record<string, AnimeMedia[]> = {};
      tiers.forEach((t) => (resetObj[t.key] = []));
      setTierData(resetObj);
      setPool(initialPool);
    }
  };

  // Import Watchlist items into the pool
  const handleImportWatchlist = () => {
    const watchlistAnime = Object.values(watchlist)
      .map((w) => w.anime)
      .filter(Boolean);

    if (watchlistAnime.length === 0) {
      alert("Your local watchlist is currently empty. Add some anime to your watchlist first!");
      return;
    }

    const seen = new Set(pool.map((a) => a.id));
    Object.values(tierData).forEach((items) => items.forEach((a) => seen.add(a.id)));

    const newToAdd = watchlistAnime.filter((a) => !seen.has(a.id));
    setPool((prev) => [...newToAdd, ...prev]);
  };

  // Auto-Shuffle / Random Placement (for fun viral ranks)
  const handleAutoShuffle = () => {
    if (pool.length === 0) return;
    const candidates = [...pool];
    const newTierData: Record<string, AnimeMedia[]> = { ...tierData };

    tiers.forEach((t) => {
      if (!newTierData[t.key]) newTierData[t.key] = [];
    });

    const tierKeys = tiers.map((t) => t.key);
    const toPlace = candidates.slice(0, 15);
    const remaining = candidates.slice(15);

    toPlace.forEach((anime) => {
      const randomTier = tierKeys[Math.floor(Math.random() * tierKeys.length)];
      newTierData[randomTier].push(anime);
    });

    setTierData(newTierData);
    setPool(remaining);
  };

  // Search live for more anime to add
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const json = await res.json();
        const found = json.anime || json.results || [];
        setSearchResults(found);
      }
    } catch {
      // Ignore
    } finally {
      setIsSearching(false);
    }
  };

  const addSearchedAnime = (anime: AnimeMedia) => {
    const isAlreadyInTier = Object.values(tierData).some((t) => t.some((a) => a.id === anime.id));
    const isAlreadyInPool = pool.some((a) => a.id === anime.id);

    if (!isAlreadyInTier && !isAlreadyInPool) {
      setPool((prev) => [anime, ...prev]);
    }
    setSearchResults([]);
    setSearchQuery("");
  };

  // Copy Markdown
  const handleCopyMarkdown = () => {
    let md = `# 🏆 ${tierListTitle}\n\n`;
    tiers.forEach((t) => {
      const items = tierData[t.key] || [];
      const names = items.map((a) => a.title.english || a.title.romaji).join(", ");
      md += `### ${t.label} (${t.sub})\n${names ? `- ${names}` : "*None*"}\n\n`;
    });
    md += `*Created on AnimeDB (https://animedb.org/tierlist)*`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, animeId: number) => {
    setActiveDragId(animeId);
    e.dataTransfer.setData("animeId", animeId.toString());
  };

  const handleDragOver = (e: React.DragEvent, tierKey: string) => {
    e.preventDefault();
    setDragOverTier(tierKey);
  };

  const handleDragLeave = () => {
    setDragOverTier(null);
  };

  const handleDrop = (e: React.DragEvent, targetTier: string) => {
    e.preventDefault();
    setDragOverTier(null);
    const animeIdStr = e.dataTransfer.getData("animeId");
    const animeId = parseInt(animeIdStr, 10);
    if (isNaN(animeId)) return;

    // Find anime in pool or in other tiers
    let targetAnime = pool.find((a) => a.id === animeId);
    if (!targetAnime) {
      Object.values(tierData).forEach((items) => {
        const found = items.find((a) => a.id === animeId);
        if (found) targetAnime = found;
      });
    }

    if (targetAnime) {
      moveToTier(targetAnime, targetTier);
    }
    setActiveDragId(null);
  };

  // Download high-resolution PNG using canvas
  const handleDownloadImage = async () => {
    setIsExporting(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      setIsExporting(false);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    const width = 1200;
    const rowHeight = 120;
    const headerHeight = 100;
    const footerHeight = 50;
    const totalHeight = headerHeight + rowHeight * tiers.length + footerHeight;

    canvas.width = width;
    canvas.height = totalHeight;

    // Background
    ctx.fillStyle = "#0c0f17";
    ctx.fillRect(0, 0, width, totalHeight);

    // Header Branding
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("⚡ ANIMEDB.ORG • ANIME TIER LIST MAKER", 35, 42);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(tierListTitle, 35, 80);

    // Draw each tier row
    let currentY = headerHeight;

    for (const t of tiers) {
      // Row Background
      ctx.fillStyle = "#121624";
      ctx.fillRect(0, currentY, width, rowHeight);

      // Row Border
      ctx.strokeStyle = "#1e2436";
      ctx.lineWidth = 1;
      ctx.strokeRect(0, currentY, width, rowHeight);

      // Tier Label Box
      ctx.fillStyle = t.hex || "#3b82f6";
      ctx.fillRect(0, currentY, 120, rowHeight);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(t.label, 60, currentY + 65);

      ctx.font = "bold 13px sans-serif";
      ctx.fillText(t.sub, 60, currentY + 90);

      // Draw Anime posters in row
      const itemsInTier = tierData[t.key] || [];
      let itemX = 135;
      const thumbW = 70;
      const thumbH = 102;
      const thumbY = currentY + (rowHeight - thumbH) / 2;

      for (const anime of itemsInTier.slice(0, 14)) {
        // Draw placeholder frame
        ctx.fillStyle = "#1e2436";
        ctx.fillRect(itemX, thumbY, thumbW, thumbH);

        const imgUrl = anime.coverImage.large || anime.coverImage.medium;
        if (imgUrl) {
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise<void>((resolve) => {
              img.onload = () => {
                ctx.drawImage(img, itemX, thumbY, thumbW, thumbH);
                resolve();
              };
              img.onerror = () => resolve();
              img.src = imgUrl;
            });
          } catch {
            // fallback
          }
        }
        itemX += thumbW + 10;
      }

      currentY += rowHeight;
    }

    // Footer Watermark
    ctx.textAlign = "left";
    ctx.fillStyle = "#64748b";
    ctx.font = "500 13px sans-serif";
    ctx.fillText("Generated on AnimeDB.org • Next-Gen Anime Encyclopedia & Watchlist Platform", 35, totalHeight - 18);

    // Download trigger
    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${tierListTitle.replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Canvas export failed:", err);
      alert("Could not export image due to cross-origin image restrictions. Text list has been copied instead!");
      handleCopyMarkdown();
    } finally {
      setIsExporting(false);
    }
  };

  // Filter pool items
  const filteredPool = pool.filter((a) => {
    if (poolFilter === "all") return true;
    if (poolFilter === "shounen") return a.genres?.includes("Action") || a.genres?.includes("Adventure");
    if (poolFilter === "fantasy") return a.genres?.includes("Fantasy");
    if (poolFilter === "psychological") return a.genres?.includes("Psychological") || a.genres?.includes("Mystery") || a.genres?.includes("Thriller");
    if (poolFilter === "slice_of_life") return a.genres?.includes("Slice of Life") || a.genres?.includes("Comedy");
    return true;
  });

  // Calculate statistics
  const totalRanked = Object.values(tierData).reduce((sum, items) => sum + items.length, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d13] text-gray-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-400">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-gray-400">Tools</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-rose-400 font-medium">Tier List Maker</span>
        </nav>

        {/* Hero Header Banner */}
        <section className="relative rounded-2xl bg-gradient-to-br from-[#141826] via-[#161a2a] to-[#10131e] border border-[#232b3f] p-6 sm:p-8 flex flex-col gap-5 overflow-hidden shadow-2xl">
          {/* Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2.5 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 shadow-sm">
                  <Trophy className="w-3.5 h-3.5 text-rose-400" />
                  <span>TIER LIST ENGINE 2.0 • S-to-D Ranking Suite</span>
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1d2335] text-gray-300 border border-[#2b354d]">
                  Drag & Drop + 1-Click
                </span>
              </div>

              {/* Editable Title */}
              <div className="flex items-center gap-2 group/title">
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={tierListTitle}
                    onChange={(e) => setTierListTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                    autoFocus
                    className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white bg-[#181d2c] border border-blue-500 rounded-xl px-3 py-1 tracking-tight outline-none"
                  />
                ) : (
                  <h1
                    onClick={() => setIsEditingTitle(true)}
                    className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight cursor-pointer hover:text-sky-300 transition-colors flex items-center gap-2.5"
                    title="Click to edit title"
                  >
                    <span>{tierListTitle}</span>
                    <Edit2 className="w-4 h-4 text-gray-500 opacity-60 group-hover/title:opacity-100 transition-opacity" />
                  </h1>
                )}
              </div>

              <p className="text-xs sm:text-sm text-gray-300/90 leading-relaxed max-w-2xl">
                Rank your favorite anime into tiers below using drag-and-drop or 1-click placement. Export high-res PNG graphics, share formatted Markdown lists, or import titles directly from your personal watchlist.
              </p>
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
              {watchlistCount > 0 && (
                <button
                  onClick={handleImportWatchlist}
                  className="px-3.5 py-2 rounded-xl bg-[#1b2133] hover:bg-[#222a42] border border-[#29324d] hover:border-sky-500/40 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Import titles from your local watchlist"
                >
                  <Bookmark className="w-3.5 h-3.5 text-sky-400" />
                  <span>From Watchlist ({watchlistCount})</span>
                </button>
              )}

              <button
                onClick={handleAutoShuffle}
                className="px-3.5 py-2 rounded-xl bg-[#1b2133] hover:bg-[#222a42] border border-[#29324d] hover:border-amber-500/40 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Randomly distribute 15 anime into tiers"
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Shuffle</span>
              </button>

              <button
                onClick={handleCopyMarkdown}
                className="px-3.5 py-2 rounded-xl bg-[#1b2133] hover:bg-[#222a42] border border-[#29324d] hover:border-emerald-500/40 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Copy markdown text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Text"}</span>
              </button>

              <button
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl bg-[#1b2133] hover:bg-rose-500/20 border border-[#29324d] hover:border-rose-500/40 text-xs font-semibold text-gray-300 hover:text-rose-400 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Reset all tiers"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                onClick={handleDownloadImage}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/25 active:scale-95 disabled:opacity-50"
                title="Download graphic as high-res PNG image"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? "Rendering..." : "Export Image"}</span>
              </button>
            </div>
          </div>

          {/* Snapshot Counter Bar */}
          <div className="relative z-10 pt-4 border-t border-[#20273c] flex flex-wrap items-center justify-between gap-3 bg-[#111522]/80 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 sm:px-8">
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Ranked: <strong className="text-amber-400">{totalRanked}</strong> Titles</span>
              </span>
              <span>•</span>
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                {tiers.map((t) => (
                  <span key={t.key} className="flex items-center gap-1 text-gray-300">
                    <span className={`w-2 h-2 rounded-full ${t.bg}`} />
                    <span>{t.label}: {tierData[t.key]?.length || 0}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-gray-400">
              Unranked in Pool: <strong className="text-sky-400 font-bold">{pool.length}</strong>
            </div>
          </div>
        </section>

        {/* TIER MATRIX BOARD */}
        <section className="flex flex-col gap-3">
          <div className="rounded-2xl border border-[#232b3f] bg-[#10131d] overflow-hidden shadow-2xl flex flex-col divide-y divide-[#1e2436]">
            {tiers.map((tier, idx) => {
              const itemsInTier = tierData[tier.key] || [];
              const isOver = dragOverTier === tier.key;

              return (
                <div
                  key={tier.key}
                  onDragOver={(e) => handleDragOver(e, tier.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, tier.key)}
                  className={`flex items-stretch min-h-[120px] transition-all group/row ${
                    isOver ? "bg-sky-500/10 ring-2 ring-sky-400/50" : "bg-[#121522] hover:bg-[#141826]"
                  }`}
                >
                  {/* Left Tier Header */}
                  <div
                    className={`w-24 sm:w-28 ${tier.bg} ${tier.textColor} flex flex-col items-center justify-center p-2 flex-shrink-0 select-none shadow-md relative group/header`}
                  >
                    <span className="text-3xl sm:text-4xl font-black tracking-tight">{tier.label}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 text-center line-clamp-1">
                      {tier.sub}
                    </span>

                    {/* Row Reorder & Actions */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover/header:opacity-100 transition-opacity flex flex-col gap-0.5 bg-black/60 rounded p-0.5">
                      {idx > 0 && (
                        <button
                          onClick={() => moveTierUp(idx)}
                          title="Move Tier Up"
                          className="text-white hover:text-sky-300"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                      )}
                      {idx < tiers.length - 1 && (
                        <button
                          onClick={() => moveTierDown(idx)}
                          title="Move Tier Down"
                          className="text-white hover:text-sky-300"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items in Tier */}
                  <div className="flex-1 p-2.5 sm:p-3 flex items-center gap-3 overflow-x-auto no-scrollbar relative">
                    {itemsInTier.length === 0 ? (
                      <div className="text-xs text-gray-500 italic px-4 select-none flex items-center gap-2">
                        <span>Drag anime here or click tier pill from the pool below</span>
                      </div>
                    ) : (
                      itemsInTier.map((anime) => {
                        const title = anime.title.english || anime.title.romaji;
                        return (
                          <div
                            key={anime.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, anime.id)}
                            className="group/card relative w-16 sm:w-20 aspect-[3/4] rounded-lg overflow-hidden bg-[#181d2a] border border-[#282f42] hover:border-sky-400 flex-shrink-0 shadow-md cursor-grab active:cursor-grabbing transition-transform hover:-translate-y-0.5"
                            title={title}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={anime.coverImage.extraLarge || anime.coverImage.large || anime.coverImage.medium}
                              alt={title}
                              className="w-full h-full object-cover"
                            />

                            {/* Score badge */}
                            {anime.averageScore && (
                              <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/85 text-[9px] font-black text-amber-400 flex items-center gap-0.5 border border-amber-400/30">
                                <span>★{(anime.averageScore / 10).toFixed(1)}</span>
                              </div>
                            )}

                            {/* Remove button */}
                            <button
                              onClick={() => removeFromTier(anime, tier.key)}
                              title="Remove to pool"
                              className="absolute top-1 right-1 p-1 rounded-md bg-black/80 text-gray-300 hover:text-rose-400 opacity-0 group-hover/card:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>

                            {/* Title preview on bottom */}
                            <div className="absolute bottom-0 inset-x-0 p-1 bg-gradient-to-t from-black via-black/80 to-transparent text-[9px] font-semibold text-white truncate opacity-0 group-hover/card:opacity-100 transition-opacity">
                              {title}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Row Clear Button on Right */}
                  {itemsInTier.length > 0 && (
                    <div className="pr-3 flex items-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <button
                        onClick={() => clearTier(tier.key)}
                        title={`Clear Tier ${tier.label}`}
                        className="p-1.5 rounded-lg bg-[#181e2e] hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-[#252f44] text-[10px] flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Clear</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add New Tier Row Button */}
          <div className="flex justify-between items-center pt-1">
            <button
              onClick={handleAddTierRow}
              className="px-3.5 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1b2132] border border-[#23293a] hover:border-purple-500/40 text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              <span>Add Custom Tier Row</span>
            </button>

            <span className="text-[11px] text-gray-500">
              Tip: Drag cards between tiers or click tier buttons below
            </span>
          </div>
        </section>

        {/* Hidden Canvas for High-Res PNG Drawing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* UNRANKED ANIME POOL */}
        <section className="flex flex-col gap-4 p-5 sm:p-6 rounded-2xl bg-[#11141e] border border-[#202534] shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2434] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Unranked Anime Pool</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    {filteredPool.length} Available
                  </span>
                </h3>
                <span className="text-[11px] text-gray-400">
                  Click a tier badge or drag directly onto the board
                </span>
              </div>
            </div>

            {/* Live Search Form to add ANY anime */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search AniList to add ANY anime..."
                  className="pl-8 pr-3 py-2 rounded-xl bg-[#161a26] border border-[#262c3e] text-xs text-white placeholder-gray-500 outline-none focus:border-sky-500 w-56 sm:w-64 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Add"}
              </button>
            </form>
          </div>

          {/* Search Results Dropdown Preview */}
          {searchResults.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#161a28] border border-blue-500/30 flex flex-col gap-2">
              <span className="text-xs text-blue-400 font-semibold">Click to add into unranked pool:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {searchResults.map((a) => {
                  const title = a.title.english || a.title.romaji;
                  return (
                    <button
                      key={a.id}
                      onClick={() => addSearchedAnime(a)}
                      className="p-1.5 rounded-lg bg-[#11141e] hover:bg-[#1a2030] border border-[#23293a] hover:border-blue-500/50 text-left flex items-center gap-2 group transition-all"
                    >
                      <div className="w-8 aspect-[3/4] rounded overflow-hidden bg-[#181d2a] flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.coverImage.medium} alt={title} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] text-gray-300 group-hover:text-white truncate font-medium">
                        {title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Genre / Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[11px] text-gray-500 font-medium mr-1">Filter Pool:</span>
            {[
              { id: "all", label: "All Pool" },
              { id: "shounen", label: "Shounen & Action" },
              { id: "fantasy", label: "Fantasy & Adventure" },
              { id: "psychological", label: "Psychological & Thriller" },
              { id: "slice_of_life", label: "Slice of Life & Comedy" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setPoolFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                  poolFilter === f.id
                    ? "bg-sky-500/20 border-sky-400 text-sky-200"
                    : "bg-[#161a26] border-[#252c3e] text-gray-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Unranked Anime Cards with 1-Click Tier Placement Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredPool.map((anime) => {
              const title = anime.title.english || anime.title.romaji;

              return (
                <div
                  key={anime.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, anime.id)}
                  className="group rounded-xl bg-[#141722] border border-[#222736] hover:border-sky-500/50 p-2 flex flex-col justify-between gap-1.5 transition-all shadow-sm cursor-grab active:cursor-grabbing hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-[#181d2a]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={anime.coverImage.extraLarge || anime.coverImage.large || anime.coverImage.medium}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />

                    {/* Score badge */}
                    {anime.averageScore && (
                      <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/85 text-[9px] font-black text-amber-400 border border-amber-400/30">
                        ★{(anime.averageScore / 10).toFixed(1)}
                      </div>
                    )}
                  </div>

                  <h4 className="text-[11px] font-semibold text-white truncate text-center" title={title}>
                    {title}
                  </h4>

                  {/* 1-Click Placement Chips */}
                  <div className="grid grid-cols-5 gap-0.5 pt-1 border-t border-[#1f2434]">
                    {tiers.slice(0, 5).map((t) => (
                      <button
                        key={t.key}
                        onClick={() => moveToTier(anime, t.key)}
                        title={`Place in Tier ${t.label}`}
                        className={`py-1 rounded text-[10px] font-black text-white ${t.bg} hover:opacity-80 transition-opacity`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
