"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bookmark,
  FileCode,
  Globe,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Lock,
  Database,
  Copy,
  Check,
  FileText,
  RefreshCw,
  FileUp,
  Layers,
  ExternalLink,
  Eye,
  Trash2,
  HelpCircle,
  ChevronRight,
  Tv,
} from "lucide-react";
import {
  bulkImportItems,
  getStoredWatchlist,
  saveStoredWatchlist,
  useWatchlist,
  WatchlistItem,
  WatchStatus,
} from "@/lib/watchlist";
import { AnimeMedia } from "@/lib/types";
import Navbar from "./Navbar";
import Footer from "./Footer";

type ImportTab = "ANILIST" | "MAL" | "JSON" | "EXPORT";

interface ImportSummary {
  total: number;
  watching: number;
  completed: number;
  planning: number;
  dropped: number;
  sampleItems: WatchlistItem[];
}

export default function WatchlistImporter() {
  const [tab, setTab] = useState<ImportTab>("ANILIST");
  const { watchlist, count: currentCount } = useWatchlist();

  // AniList tab state
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  // MAL XML state
  const [xmlContent, setXmlContent] = useState("");
  const [xmlFileName, setXmlFileName] = useState<string | null>(null);
  const [isDraggingXml, setIsDraggingXml] = useState(false);
  const xmlFileInputRef = useRef<HTMLInputElement>(null);

  // JSON state
  const [jsonContent, setJsonContent] = useState("");
  const [jsonFileName, setJsonFileName] = useState<string | null>(null);
  const [isDraggingJson, setIsDraggingJson] = useState(false);
  const [mergeMode, setMergeMode] = useState<"merge" | "replace">("merge");
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Export state
  const [isCopied, setIsCopied] = useState(false);

  // Helper to compute stats and store items
  const processImportedItems = (record: Record<number, WatchlistItem>) => {
    let watching = 0;
    let completed = 0;
    let planning = 0;
    let dropped = 0;

    const list = Object.values(record);
    list.forEach((item) => {
      if (item.status === "WATCHING") watching++;
      else if (item.status === "COMPLETED") completed++;
      else if (item.status === "PLAN_TO_WATCH") planning++;
      else if (item.status === "DROPPED") dropped++;
    });

    if (mergeMode === "replace" && tab === "JSON") {
      saveStoredWatchlist(record);
    } else {
      bulkImportItems(record);
    }

    setImportSummary({
      total: list.length,
      watching,
      completed,
      planning,
      dropped,
      sampleItems: list.slice(0, 6),
    });
  };

  // AniList Import
  const handleAniListImport = async (targetUsername?: string) => {
    const handle = (targetUsername || username).trim();
    if (!handle) return;

    setLoading(true);
    setError(null);
    setImportSummary(null);

    try {
      const res = await fetch("/api/import/anilist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: handle }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import from AniList");
      }

      const record: Record<number, WatchlistItem> = {};
      data.items.forEach((item: WatchlistItem) => {
        if (item.anime?.id) {
          record[item.anime.id] = item;
        }
      });

      processImportedItems(record);
    } catch (e: any) {
      setError(e.message || "An error occurred while importing from AniList.");
    } finally {
      setLoading(false);
    }
  };

  // MAL XML Import
  const handleMalXmlImport = (contentToParse?: string) => {
    const text = (contentToParse || xmlContent).trim();
    if (!text) return;

    setError(null);
    setImportSummary(null);

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const animeNodes = xmlDoc.getElementsByTagName("anime");

      if (animeNodes.length === 0) {
        throw new Error("No <anime> entries found in the provided XML file.");
      }

      const record: Record<number, WatchlistItem> = {};

      for (let i = 0; i < animeNodes.length; i++) {
        const node = animeNodes[i];
        const idStr = node.getElementsByTagName("series_animedb_id")[0]?.textContent;
        const titleStr = node.getElementsByTagName("series_title")[0]?.textContent;
        const statusStr = node.getElementsByTagName("my_status")[0]?.textContent;
        const scoreStr = node.getElementsByTagName("my_score")[0]?.textContent;
        const epStr = node.getElementsByTagName("series_episodes")[0]?.textContent;
        const typeStr = node.getElementsByTagName("series_type")[0]?.textContent;

        if (idStr && titleStr) {
          const malId = parseInt(idStr, 10);
          let watchStatus: WatchStatus = "PLAN_TO_WATCH";

          if (statusStr === "Completed") watchStatus = "COMPLETED";
          else if (statusStr === "Watching") watchStatus = "WATCHING";
          else if (statusStr === "Dropped") watchStatus = "DROPPED";
          else if (statusStr === "Plan to Watch" || statusStr === "On-Hold") watchStatus = "PLAN_TO_WATCH";

          const episodesCount = epStr ? parseInt(epStr, 10) : null;
          const scoreVal = scoreStr ? parseInt(scoreStr, 10) * 10 : null;

          record[malId] = {
            anime: {
              id: malId,
              idMal: malId,
              title: {
                romaji: titleStr,
                english: titleStr,
                native: null,
              },
              description: null,
              coverImage: {
                extraLarge: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60",
                large: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60",
                medium: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60",
                color: null,
              },
              format: (typeStr as any) || "TV",
              status: "FINISHED",
              episodes: episodesCount,
              duration: 24,
              season: null,
              seasonYear: null,
              averageScore: scoreVal,
              popularity: 0,
              source: null,
              bannerImage: null,
              genres: [],
              studios: { nodes: [] },
              trailer: null,
              nextAiringEpisode: null,
              externalLinks: [],
            } as AnimeMedia,
            status: watchStatus,
            updatedAt: Date.now(),
          };
        }
      }

      processImportedItems(record);
    } catch (e: any) {
      setError(e.message || "Failed to parse MyAnimeList XML file.");
    }
  };

  // JSON Import
  const handleJsonImport = (contentToParse?: string) => {
    const text = (contentToParse || jsonContent).trim();
    if (!text) return;

    setError(null);
    setImportSummary(null);

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("Invalid JSON structure. Root must be an object.");
      }

      processImportedItems(parsed);
    } catch (e: any) {
      setError(e.message || "Invalid JSON syntax. Please verify backup content.");
    }
  };

  // File Upload Handlers
  const handleXmlFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setXmlFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setXmlContent(text);
      handleMalXmlImport(text);
    };
    reader.readAsText(file);
  };

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJsonFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonContent(text);
      handleJsonImport(text);
    };
    reader.readAsText(file);
  };

  // Export Handlers
  const handleExportDownload = () => {
    const current = getStoredWatchlist();
    const jsonStr = JSON.stringify(current, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `animedb_watchlist_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportCopy = () => {
    const current = getStoredWatchlist();
    navigator.clipboard.writeText(JSON.stringify(current, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2200);
  };

  // Current Watchlist Breakdown
  const currentList = Object.values(watchlist);
  const currentWatching = currentList.filter((i) => i.status === "WATCHING").length;
  const currentCompleted = currentList.filter((i) => i.status === "COMPLETED").length;
  const currentPlanning = currentList.filter((i) => i.status === "PLAN_TO_WATCH").length;
  const currentDropped = currentList.filter((i) => i.status === "DROPPED").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d13] text-gray-100">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-400">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-gray-400">Tools</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-sky-400 font-medium">Universal Watchlist Importer</span>
        </nav>

        {/* Hero Header Banner */}
        <section className="relative rounded-2xl bg-gradient-to-br from-[#141826] via-[#161a2a] to-[#10131e] border border-[#232b3f] p-6 sm:p-8 flex flex-col gap-5 overflow-hidden shadow-2xl">
          {/* Ambient Glow Orbs */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2.5 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1.5 shadow-sm">
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>ZERO-LOGIN DATA SYNC • Universal Watchlist Importer</span>
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1d2335] text-gray-300 border border-[#2b354d]">
                  100% Private LocalStorage
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Import Your Anime Watchlist
              </h1>

              <p className="text-xs sm:text-sm text-gray-300/90 leading-relaxed max-w-2xl">
                Instantly sync your existing watch history from{" "}
                <span className="text-sky-400 font-semibold underline decoration-sky-400/40 underline-offset-2">
                  AniList
                </span>{" "}
                or{" "}
                <span className="text-indigo-400 font-semibold underline decoration-indigo-400/40 underline-offset-2">
                  MyAnimeList
                </span>{" "}
                without creating an account. Everything is saved privately in your local browser storage.
              </p>
            </div>

            {/* Quick Header Navigation */}
            <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
              <Link
                href="/watchlist"
                className="px-3.5 py-2 rounded-xl bg-[#1b2133] hover:bg-[#222a42] border border-[#29324d] hover:border-sky-500/40 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Bookmark className="w-3.5 h-3.5 text-sky-400" />
                <span>My Watchlist ({currentCount})</span>
              </Link>

              <button
                onClick={() => setTab("EXPORT")}
                className="px-3.5 py-2 rounded-xl bg-[#1b2133] hover:bg-[#222a42] border border-[#29324d] hover:border-emerald-500/40 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Backup</span>
              </button>
            </div>
          </div>

          {/* Current Local Storage Snapshot Banner */}
          <div className="relative z-10 pt-4 border-t border-[#20273c] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#111522]/80 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
                <Bookmark className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">
                  Current Local Browser Storage: <strong className="text-sky-400">{currentCount} Titles Saved</strong>
                </span>
                <span className="text-[11px] text-gray-400">
                  {currentCount > 0 ? (
                    <>
                      {currentWatching} Watching • {currentCompleted} Completed • {currentPlanning} Planning • {currentDropped} Dropped
                    </>
                  ) : (
                    "No titles in storage yet. Sync below to populate your watchlist in seconds."
                  )}
                </span>
              </div>
            </div>

            {currentCount > 0 && (
              <Link
                href="/watchlist"
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
              >
                <span>View Full Watchlist</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </section>

        {/* Tab Selection Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => {
              setTab("ANILIST");
              setError(null);
              setImportSummary(null);
            }}
            className={`p-3.5 rounded-2xl text-left border transition-all flex items-center gap-3 ${
              tab === "ANILIST"
                ? "bg-[#181f30] border-sky-500 shadow-lg ring-1 ring-sky-500/30"
                : "bg-[#131622] border-[#222736] hover:border-[#31384e] hover:bg-[#161a29]"
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">AniList Sync</span>
              <span className="text-[10px] text-gray-400 truncate">Public Username</span>
            </div>
          </button>

          <button
            onClick={() => {
              setTab("MAL");
              setError(null);
              setImportSummary(null);
            }}
            className={`p-3.5 rounded-2xl text-left border transition-all flex items-center gap-3 ${
              tab === "MAL"
                ? "bg-[#181f30] border-indigo-500 shadow-lg ring-1 ring-indigo-500/30"
                : "bg-[#131622] border-[#222736] hover:border-[#31384e] hover:bg-[#161a29]"
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">MyAnimeList</span>
              <span className="text-[10px] text-gray-400 truncate">XML File Upload</span>
            </div>
          </button>

          <button
            onClick={() => {
              setTab("JSON");
              setError(null);
              setImportSummary(null);
            }}
            className={`p-3.5 rounded-2xl text-left border transition-all flex items-center gap-3 ${
              tab === "JSON"
                ? "bg-[#181f30] border-emerald-500 shadow-lg ring-1 ring-emerald-500/30"
                : "bg-[#131622] border-[#222736] hover:border-[#31384e] hover:bg-[#161a29]"
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">Restore Backup</span>
              <span className="text-[10px] text-gray-400 truncate">JSON Code / File</span>
            </div>
          </button>

          <button
            onClick={() => {
              setTab("EXPORT");
              setError(null);
              setImportSummary(null);
            }}
            className={`p-3.5 rounded-2xl text-left border transition-all flex items-center gap-3 ${
              tab === "EXPORT"
                ? "bg-[#181f30] border-amber-500 shadow-lg ring-1 ring-amber-500/30"
                : "bg-[#131622] border-[#222736] hover:border-[#31384e] hover:bg-[#161a29]"
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">Export Backup</span>
              <span className="text-[10px] text-gray-400 truncate">Save to File</span>
            </div>
          </button>
        </div>

        {/* TAB 1: ANILIST USERNAME SYNC */}
        {tab === "ANILIST" && (
          <section className="rounded-2xl bg-[#131622] border border-[#222736] p-6 sm:p-7 flex flex-col gap-6 shadow-xl">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <h2 className="text-base font-bold text-white">
                  Sync Directly via Public AniList Username
                </h2>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
                Enter your public AniList handle. We will pull your Watching, Completed, Planning, and Dropped lists and merge them cleanly into your private AnimeDB storage.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAniListImport()}
                  placeholder="e.g. Senpai, Kitsune, Goku"
                  className="w-full bg-[#181d2c] border border-[#262f44] rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                />
              </div>

              <button
                onClick={() => handleAniListImport()}
                disabled={loading || !username.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-sky-600/20 active:scale-98"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Syncing lists...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Fetch & Import</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Demo Samples */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1e2436]">
              <span className="text-[11px] text-gray-500 font-medium">Test with public profiles:</span>
              {["Senpai", "Kitsune", "AnimeFan", "Goku"].map((demoName) => (
                <button
                  key={demoName}
                  onClick={() => {
                    setUsername(demoName);
                    handleAniListImport(demoName);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#20273a] border border-[#262c3e] text-[11px] text-gray-300 hover:text-white transition-colors"
                >
                  @{demoName}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* TAB 2: MYANIMELIST XML IMPORT */}
        {tab === "MAL" && (
          <section className="rounded-2xl bg-[#131622] border border-[#222736] p-6 sm:p-7 flex flex-col gap-6 shadow-xl">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <h2 className="text-base font-bold text-white">
                  Import from MyAnimeList XML Export
                </h2>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
                On MyAnimeList, navigate to{" "}
                <strong className="text-gray-300">Export My List</strong> (
                <a
                  href="https://myanimelist.net/panel.php?go=export"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                >
                  myanimelist.net/panel.php?go=export <ExternalLink className="w-3 h-3" />
                </a>
                ), download your anime list XML file, and drop it below.
              </p>
            </div>

            {/* Drag & Drop File Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingXml(true);
              }}
              onDragLeave={() => setIsDraggingXml(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingXml(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  setXmlFileName(file.name);
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const text = event.target?.result as string;
                    setXmlContent(text);
                    handleMalXmlImport(text);
                  };
                  reader.readAsText(file);
                }
              }}
              onClick={() => xmlFileInputRef.current?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                isDraggingXml
                  ? "border-indigo-400 bg-indigo-500/10"
                  : "border-[#2a344d] hover:border-indigo-500/50 bg-[#161a28]/60 hover:bg-[#181d2e]"
              }`}
            >
              <input
                ref={xmlFileInputRef}
                type="file"
                accept=".xml"
                onChange={handleXmlFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileUp className="w-6 h-6" />
              </div>
              <div className="text-center">
                <span className="text-xs sm:text-sm font-bold text-white block">
                  {xmlFileName ? `Selected: ${xmlFileName}` : "Click to browse or drag & drop your MAL XML file"}
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  Standard MyAnimeList anime export (.xml)
                </span>
              </div>
            </div>

            {/* Manual XML Paste fallback */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Or paste raw XML text directly:
              </span>
              <textarea
                rows={6}
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
                placeholder="Paste raw <myanimelist>...</myanimelist> XML export here..."
                className="w-full bg-[#181c28] border border-[#262c3e] rounded-xl p-3.5 text-xs text-gray-200 font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => handleMalXmlImport()}
              disabled={!xmlContent.trim()}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm self-start transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FileCode className="w-4 h-4" />
              <span>Parse & Import MAL XML</span>
            </button>
          </section>
        )}

        {/* TAB 3: JSON BACKUP RESTORE */}
        {tab === "JSON" && (
          <section className="rounded-2xl bg-[#131622] border border-[#222736] p-6 sm:p-7 flex flex-col gap-6 shadow-xl">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white">
                  Restore from AnimeDB JSON Backup
                </h2>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
                Upload or paste the exported JSON backup code generated from AnimeDB to restore your watch history.
              </p>
            </div>

            {/* Merge Mode Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#161a29] border border-[#242b3e] text-xs">
              <span className="text-gray-400 font-medium">Import Mode:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMergeMode("merge")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    mergeMode === "merge"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Merge (Preserve existing)
                </button>
                <button
                  onClick={() => setMergeMode("replace")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    mergeMode === "replace"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Replace (Overwrite all)
                </button>
              </div>
            </div>

            {/* Drag & Drop JSON Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingJson(true);
              }}
              onDragLeave={() => setIsDraggingJson(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingJson(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  setJsonFileName(file.name);
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const text = event.target?.result as string;
                    setJsonContent(text);
                    handleJsonImport(text);
                  };
                  reader.readAsText(file);
                }
              }}
              onClick={() => jsonFileInputRef.current?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                isDraggingJson
                  ? "border-emerald-400 bg-emerald-500/10"
                  : "border-[#2a344d] hover:border-emerald-500/50 bg-[#161a28]/60 hover:bg-[#181d2e]"
              }`}
            >
              <input
                ref={jsonFileInputRef}
                type="file"
                accept=".json"
                onChange={handleJsonFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileUp className="w-6 h-6" />
              </div>
              <div className="text-center">
                <span className="text-xs sm:text-sm font-bold text-white block">
                  {jsonFileName ? `Selected: ${jsonFileName}` : "Click to browse or drop your AnimeDB JSON backup file"}
                </span>
                <span className="text-[11px] text-gray-500 mt-0.5 block">
                  Valid AnimeDB watchlist backup (.json)
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Or paste raw JSON text:
              </span>
              <textarea
                rows={5}
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                placeholder='Paste JSON backup code here (e.g. { "16498": { ... } })'
                className="w-full bg-[#181c28] border border-[#262c3e] rounded-xl p-3.5 text-xs text-gray-200 font-mono placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => handleJsonImport()}
              disabled={!jsonContent.trim()}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm self-start transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>Restore JSON Watchlist</span>
            </button>
          </section>
        )}

        {/* TAB 4: EXPORT WATCHLIST */}
        {tab === "EXPORT" && (
          <section className="rounded-2xl bg-[#131622] border border-[#222736] p-6 sm:p-7 flex flex-col gap-6 shadow-xl">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <h2 className="text-base font-bold text-white">
                  Export Your AnimeDB Watchlist Backup
                </h2>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
                Download a clean, structured JSON file of your entire watchlist or copy it directly to your clipboard. You own 100% of your data.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#161a29] border border-[#242b3e] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-white block">
                  Ready to export {currentCount} titles
                </span>
                <span className="text-[11px] text-gray-400">
                  Includes titles, formats, watch statuses, scores, and timestamp metadata.
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleExportDownload}
                  disabled={currentCount === 0}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-40"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .JSON File</span>
                </button>

                <button
                  onClick={handleExportCopy}
                  disabled={currentCount === 0}
                  className="px-4 py-2.5 rounded-xl bg-[#1a2133] hover:bg-[#222a42] border border-[#2b354e] text-gray-200 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-40"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* SUCCESS NOTIFICATION & RICH PREVIEW SHOWCASE */}
        {importSummary && (
          <section className="rounded-2xl bg-gradient-to-br from-[#12221e] via-[#141b27] to-[#121623] border border-emerald-500/40 p-6 flex flex-col gap-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#213531]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    Successfully Synced {importSummary.total} Anime Titles!
                  </h3>
                  <p className="text-xs text-emerald-300/90 mt-0.5">
                    Your local browser storage is fully up to date with zero cloud tracking.
                  </p>
                </div>
              </div>

              <Link
                href="/watchlist"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                <span>View Watchlist ({currentCount})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Status Breakdown Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#141d28] border border-[#233144] flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Watching</span>
                <span className="text-lg font-black text-white">{importSummary.watching} titles</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141d28] border border-[#233144] flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Completed</span>
                <span className="text-lg font-black text-white">{importSummary.completed} titles</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141d28] border border-[#233144] flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Plan to Watch</span>
                <span className="text-lg font-black text-white">{importSummary.planning} titles</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141d28] border border-[#233144] flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Dropped</span>
                <span className="text-lg font-black text-white">{importSummary.dropped} titles</span>
              </div>
            </div>

            {/* Sample Imported Cards */}
            {importSummary.sampleItems.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Recently Imported Preview:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {importSummary.sampleItems.map((item) => (
                    <div
                      key={item.anime.id}
                      className="p-2 rounded-xl bg-[#131926] border border-[#222e44] flex flex-col gap-2"
                    >
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.anime.coverImage.medium || item.anime.coverImage.large}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-white truncate block">
                        {item.anime.title.english || item.anime.title.romaji}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ERROR NOTIFICATION */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-xs shadow-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-white">Import Error</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* PRIVACY & ARCHITECTURE GUARANTEE STRIP */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#1d2334]">
          <div className="p-4 rounded-xl bg-[#121623] border border-[#20273a] flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white">100% Client-Side Privacy</span>
            <span className="text-[11px] text-gray-400 leading-relaxed">
              Your watchlist is stored exclusively on your device. Zero passwords or account creation needed.
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#121623] border border-[#20273a] flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Globe className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white">Live AniList GraphQL</span>
            <span className="text-[11px] text-gray-400 leading-relaxed">
              Real-time sync automatically pulls covers, scores, episode counts, and airing status.
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#121623] border border-[#20273a] flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white">Full Data Portability</span>
            <span className="text-[11px] text-gray-400 leading-relaxed">
              Never locked in. Export your entire library anytime as standard JSON backups with one click.
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#121623] border border-[#20273a] flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white">Smart Status Mapping</span>
            <span className="text-[11px] text-gray-400 leading-relaxed">
              Automatically categorizes Watching, Completed, Planning, and Dropped entries seamlessly.
            </span>
          </div>
        </section>
      </main>

      {/* Universal Modern Footer */}
      <Footer />
    </div>
  );
}
