"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Zap,
  Database,
  Server,
  Terminal,
  Search,
  RefreshCw,
  Play,
  Pause,
  Layers,
  ShieldCheck,
  Eye,
  Tv,
  Users,
  Radio,
  ExternalLink,
  Loader2,
  Sparkles,
  Film,
  Tag,
  Clock,
  Video,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Navbar from "./Navbar";

interface DbStats {
  totalAnime: number;
  airingCount: number;
  totalCharacters: number;
  totalVoiceActors: number;
  totalStreamingLinks: number;
}

interface CharacterItem {
  character_id: number;
  character_name: string;
  character_image: string | null;
  voice_actor_id: number | null;
  voice_actor_name: string | null;
  voice_actor_image: string | null;
  role: string;
}

interface StreamingLinkItem {
  id: string;
  platform_name: string;
  target_url: string;
  affiliate_url: string | null;
  is_official: boolean;
  region: string | null;
}

interface AnimeRecord {
  id: string;
  anilist_id: number;
  mal_id: number | null;
  title_english: string | null;
  title_romaji: string;
  title_native: string | null;
  slug: string;
  synopsis: string | null;
  format: string;
  status: string;
  season: string | null;
  season_year: number | null;
  episodes_count: number | null;
  episode_duration: number | null;
  score: number | null;
  popularity: number;
  cover_image_url: string | null;
  banner_image_url: string | null;
  accent_color: string | null;
  genres: string[];
  studios: any;
  youtube_trailer_id: string | null;
  source: string | null;
  tags: any;
  relations: any;
  staff: any;
  start_date: string | null;
  end_date: string | null;
  next_airing_episode: number | null;
  next_airing_at: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  characters?: CharacterItem[];
  streaming_links?: StreamingLinkItem[];
}

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<"overview" | "ingest" | "database">("overview");

  // Database stats & status
  const [stats, setStats] = useState<DbStats>({
    totalAnime: 0,
    airingCount: 0,
    totalCharacters: 0,
    totalVoiceActors: 0,
    totalStreamingLinks: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [recentAnime, setRecentAnime] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Ingestion runner state
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestLogs, setIngestLogs] = useState<string[]>([
    "Cloud SQL PostgreSQL connection active (IP: 35.194.28.236)",
    "Ready to execute AniList GraphQL automated batch ingestion.",
  ]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [activeRunningMode, setActiveRunningMode] = useState<"years" | "ranking" | null>(null);
  const [batchPage, setBatchPage] = useState(1);
  const [batchStartPage, setBatchStartPage] = useState(1);
  const [batchTargetPages, setBatchTargetPages] = useState(400);
  const [batchSessionAdded, setBatchSessionAdded] = useState(0);
  const stopCrawlerRef = useRef(false);

  // Year-by-Year crawler state
  const [crawlerMode, setCrawlerMode] = useState<"years" | "ranking">("years");
  const [startYear, setStartYear] = useState<number>(2026);
  const [endYear, setEndYear] = useState<number>(1980);
  const [currentCrawlingYear, setCurrentCrawlingYear] = useState<number>(2026);
  const [yearPage, setYearPage] = useState<number>(1);
  const [yearSessionAdded, setYearSessionAdded] = useState<number>(0);

  // Database browser state
  const [animeList, setAnimeList] = useState<AnimeRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loadingAnime, setLoadingAnime] = useState(false);

  // Deep inspect modal state
  const [selectedAnime, setSelectedAnime] = useState<AnimeRecord | null>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);
  const [inspectTab, setInspectTab] = useState<"overview" | "cast" | "stream" | "trailer">("overview");

  const addLog = (msg: string) => {
    setIngestLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 100)]);
  };

  // Fetch Stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setRecentLogs(data.recentLogs || []);
        setRecentAnime(data.recentAnime || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Database Anime Records
  const fetchAnimeRecords = async (page = 1) => {
    setLoadingAnime(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        q: searchQuery,
        status: statusFilter,
      });
      const res = await fetch(`/api/admin/anime?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAnimeList(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalRecords(data.pagination?.total || 0);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnime(false);
    }
  };

  // Open Full Inspect Modal (fetch related characters & streams)
  const handleOpenInspect = async (anime: AnimeRecord) => {
    setSelectedAnime(anime);
    setInspectTab("overview");
    setLoadingInspect(true);

    try {
      const res = await fetch(`/api/admin/anime?id=${anime.anilist_id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedAnime(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInspect(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "database") {
      fetchAnimeRecords(1);
    }
  }, [activeTab, statusFilter]);

  // Execute single ingestion action
  const handleRunSync = async (action: "test" | "seasonal" | "top", page = 1) => {
    setIngestLoading(true);
    addLog(`Initiating AniList batch query [Action: ${action.toUpperCase()}, Page: ${page}]...`);

    try {
      const res = await fetch("/api/admin/sync-anilist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, page, perPage: action === "test" ? 5 : 20 }),
      });

      const data = await res.json();

      if (data.success) {
        addLog(
          `SUCCESS: Ingested & Upserted ${data.count} anime titles into Cloud SQL in ${data.metrics.executionTimeMs}ms.`
        );
        if (data.sampleItems && data.sampleItems.length > 0) {
          const names = data.sampleItems.map((s: any) => s.title).join(", ");
          addLog(`Sample items saved: ${names}`);
        }
        await fetchStats();
      } else {
        addLog(`ERROR: ${data.error}`);
      }
    } catch (err: any) {
      addLog(`FATAL: ${err.message}`);
    } finally {
      setIngestLoading(false);
    }
  };

  // Automated Full-Catalog Crawler with Pause & Resume
  const handleStartCrawler = async () => {
    stopCrawlerRef.current = false;
    setBatchRunning(true);
    setActiveRunningMode("ranking");
    let p = batchStartPage;
    let added = batchSessionAdded;
    addLog(`🚀 Starting Global Popularity Ranking Ingestion: Starting from Page ${p} up to Target Page ${batchTargetPages}...`);

    while (!stopCrawlerRef.current && p <= batchTargetPages) {
      setBatchPage(p);
      addLog(`[Batch Job] Ingesting Page ${p} of ${batchTargetPages} (25 anime / batch)...`);

      try {
        const res = await fetch("/api/admin/sync-anilist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "page", page: p, perPage: 25 }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          addLog(`⚠️ Page ${p} API notice: ${errData.error || res.statusText}`);
          if (errData.error?.includes("5000 entries") || errData.error?.includes("Page depth")) {
            addLog(`🛑 AniList 5,000 Depth Limit reached at Page ${p}! Switch to "Year-by-Year Deep Catalog" mode to continue.`);
            break;
          }
          await new Promise((r) => setTimeout(r, 4000));
          continue;
        }

        const data = await res.json();
        if (data.success) {
          added += data.count;
          setBatchSessionAdded(added);
          addLog(`✓ Page ${p}: Ingested ${data.count} titles into PostgreSQL (${data.metrics?.executionTimeMs}ms)`);
          await fetchStats();
          p++;
          setBatchStartPage(p);
        } else {
          addLog(`✗ Page ${p} error: ${data.error}`);
          if (data.error?.includes("5000 entries") || data.error?.includes("Page depth")) {
            addLog(`🛑 AniList 5,000 Depth Limit reached at Page ${p}! Switch to "Year-by-Year Deep Catalog" mode to continue.`);
            break;
          }
          await new Promise((r) => setTimeout(r, 4000));
        }
      } catch (err: any) {
        addLog(`✗ Network warning on Page ${p}: ${err.message}. Retrying in 4s...`);
        await new Promise((r) => setTimeout(r, 4000));
      }

      if (stopCrawlerRef.current) {
        addLog(`⏸ Crawler gracefully paused by user at Page ${p}. Ready to resume anytime.`);
        break;
      }

      // 1.2s polite delay to respect AniList 90 req/min limit
      await new Promise((r) => setTimeout(r, 1200));
    }

    if (p > batchTargetPages) {
      addLog(`🎉 Target of ${batchTargetPages} pages completed successfully!`);
    }

    setBatchRunning(false);
    setActiveRunningMode(null);
  };

  const handlePauseCrawler = () => {
    stopCrawlerRef.current = true;
    addLog("⏸ Pausing crawler after current batch finishes...");
  };

  // Chronological Year-by-Year Crawler (Bypasses AniList 5,000 Depth Limit)
  const handleStartYearCrawler = async () => {
    if (startYear < endYear) {
      addLog("⚠️ Start Year must be greater than or equal to End Year (we crawl backwards in time).");
      return;
    }

    stopCrawlerRef.current = false;
    setBatchRunning(true);
    setActiveRunningMode("years");
    let y = startYear;
    let added = yearSessionAdded;
    addLog(`🚀 Starting Chronological Year Crawler: Crawling release years ${y} down to ${endYear}...`);

    while (!stopCrawlerRef.current && y >= endYear) {
      setCurrentCrawlingYear(y);
      addLog(`[Year ${y}] Starting deep crawl for release year ${y}...`);

      let p = 1;
      let hasMore = true;

      while (!stopCrawlerRef.current && hasMore) {
        setYearPage(p);
        addLog(`[Year ${y}] Fetching Page ${p} (25 anime / batch)...`);

        try {
          const res = await fetch("/api/admin/sync-anilist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "year", year: y, page: p, perPage: 25 }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            addLog(`⚠️ Year ${y} Page ${p} notice: ${errData.error || res.statusText}`);
            await new Promise((r) => setTimeout(r, 4000));
            continue;
          }

          const data = await res.json();
          if (data.success) {
            added += data.count;
            setYearSessionAdded(added);
            addLog(`✓ Year ${y} Page ${p}: Ingested ${data.count} titles into PostgreSQL (${data.metrics?.executionTimeMs}ms)`);
            await fetchStats();

            hasMore = Boolean(data.pageInfo?.hasNextPage);
            p++;
          } else {
            addLog(`✗ Year ${y} Page ${p} error: ${data.error}`);
            await new Promise((r) => setTimeout(r, 4000));
          }
        } catch (err: any) {
          addLog(`✗ Network warning on Year ${y} Page ${p}: ${err.message}. Retrying in 4s...`);
          await new Promise((r) => setTimeout(r, 4000));
        }

        if (stopCrawlerRef.current) break;

        // 1.2s delay to comply with AniList 90 req/min rule
        await new Promise((r) => setTimeout(r, 1200));
      }

      if (stopCrawlerRef.current) {
        addLog(`⏸ Crawler paused at Year ${y} (Page ${p}). Ready to resume anytime!`);
        setStartYear(y);
        break;
      }

      addLog(`🎉 Year ${y} complete! Moving to next year...`);
      y--;
      setStartYear(y);
    }

    if (y < endYear && !stopCrawlerRef.current) {
      addLog(`🏆 Full Chronological Ingestion Complete down to ${endYear}! Ready to continue into older vintage classics.`);
      setStartYear(y);
      setEndYear(Math.max(1940, y - 20));
    }

    setBatchRunning(false);
    setActiveRunningMode(null);
  };

  // Helper for studios display
  const getStudioName = (studios: any) => {
    if (!studios) return "N/A";
    if (Array.isArray(studios) && studios.length > 0) {
      return studios[0].name || "N/A";
    }
    return "N/A";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d13] text-gray-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1c2130] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>Google Cloud SQL PostgreSQL 16</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>AnimeDB Command Center</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Live monitoring, automated AniList batch ingestion, and PostgreSQL data administration.
            </p>
          </div>

          {/* Database Live Heartbeat Badge */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-3.5 py-2 rounded-xl bg-[#131722] border border-[#202738] flex items-center gap-2.5 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-white leading-none">
                  Cloud SQL Online
                </span>
                <span className="text-[9px] text-emerald-400 font-mono mt-0.5">35.194.28.236:5432</span>
              </div>
            </div>

            <button
              onClick={fetchStats}
              disabled={loadingStats}
              className="p-2 rounded-xl bg-[#131722] hover:bg-[#1a2030] text-gray-400 hover:text-white border border-[#202738] transition-colors"
              title="Refresh database stats"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStats ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#1c2130]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("ingest")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "ingest"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Batch Ingestion Engine</span>
          </button>

          <button
            onClick={() => setActiveTab("database")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "database"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Database Explorer & Monitor</span>
            {stats.totalAnime > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">
                {stats.totalAnime}
              </span>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#121622] border border-[#1f2638] flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Total Anime Ingested</span>
                  <Tv className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-extrabold text-white tracking-tight">
                    {stats.totalAnime.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <span>Target: 20,000 titles</span>
                    <span>•</span>
                    <span className="text-blue-400 font-semibold">
                      {((stats.totalAnime / 20000) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#121622] border border-[#1f2638] flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Currently Airing Monitored</span>
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                    {stats.airingCount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Live schedule & episode countdowns active
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#121622] border border-[#1f2638] flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Characters & Seiyuu</span>
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
                    {(stats.totalCharacters + stats.totalVoiceActors).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    {stats.totalCharacters} chars • {stats.totalVoiceActors} voice actors
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#121622] border border-[#1f2638] flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Legal Streaming Links</span>
                  <ExternalLink className="w-4 h-4 text-purple-400" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-extrabold text-purple-400 tracking-tight">
                    {stats.totalStreamingLinks.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    Crunchyroll, Netflix, Hulu & Affiliates
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Sync Trigger */}
            <div className="p-6 rounded-2xl bg-[#121622] border border-[#1f2638] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span>Instant 1-Click Database Population</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Fetch live anime metadata with Japanese voice actors and save them permanently to Cloud SQL.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => handleRunSync("test")}
                  disabled={ingestLoading}
                  className="px-3.5 py-2 rounded-xl bg-[#181e2c] hover:bg-[#20273a] text-xs font-semibold text-white border border-[#273044] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {ingestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> : <Play className="w-3.5 h-3.5 text-blue-400" />}
                  <span>Test 5 Anime</span>
                </button>

                <button
                  onClick={() => handleRunSync("seasonal")}
                  disabled={ingestLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-blue-600/20"
                >
                  {ingestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Radio className="w-3.5 h-3.5 text-white" />}
                  <span>Sync Seasonal Airing (20)</span>
                </button>

                <button
                  onClick={() => handleRunSync("top")}
                  disabled={ingestLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                >
                  {ingestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Database className="w-3.5 h-3.5 text-white" />}
                  <span>Sync Top Ranked (20)</span>
                </button>
              </div>
            </div>

            {/* Recent Anime Ingested Grid */}
            {recentAnime.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Recently Ingested Anime</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("database")}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    View All in Database →
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {recentAnime.map((anime: any) => (
                    <div
                      key={anime.anilist_id}
                      onClick={() => handleOpenInspect(anime)}
                      className="p-2.5 rounded-xl bg-[#121622] border border-[#1f2638] flex flex-col justify-between group hover:border-blue-500/40 transition-all cursor-pointer"
                    >
                      <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-gray-900 mb-2">
                        {anime.cover_image_url ? (
                          <Image
                            src={anime.cover_image_url}
                            alt={anime.title_romaji}
                            fill
                            sizes="(max-width: 768px) 50vw, 20vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
                            No Cover
                          </div>
                        )}
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-amber-400">
                          ★ {anime.score || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 font-mono">#{anime.anilist_id}</span>
                        <h4 className="text-xs font-semibold text-white truncate" title={anime.title_romaji}>
                          {anime.title_english || anime.title_romaji}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                          <span>{anime.format || "TV"}</span>
                          <span className={anime.status === "RELEASING" ? "text-emerald-400 font-semibold" : "text-gray-400"}>
                            {anime.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Logs Feed */}
            {recentLogs.length > 0 && (
              <div className="rounded-2xl bg-[#121622] border border-[#1f2638] overflow-hidden">
                <div className="px-5 py-3 bg-[#151a28] border-b border-[#1f2638] flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Recent Ingestion Audit Trail</span>
                  </span>
                  <span className="text-gray-500 text-[10px] font-mono">PostgreSQL sync_logs</span>
                </div>
                <div className="divide-y divide-[#1c2232] text-xs">
                  {recentLogs.map((log: any) => (
                    <div key={log.id} className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono uppercase">
                          {log.action}
                        </span>
                        <span className="text-gray-300">
                          Processed <strong className="text-white">{log.count_processed}</strong> records
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-500 text-[11px] font-mono">
                        <span className="text-emerald-400 font-semibold">{log.status}</span>
                        <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INGESTION ENGINE */}
        {/* ========================================================================= */}
        {activeTab === "ingest" && (
          <div className="flex flex-col gap-6">
            {/* Master Ingestion Controller */}
            <div className="p-6 rounded-3xl bg-[#121622] border border-[#1f2638] flex flex-col gap-5 shadow-xl">
              {/* Header & Global Progress */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold mb-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Autonomous Full Catalog Engine</span>
                  </div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Full-Catalog Ingestion Control Center</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Sequentially crawls AniList GraphQL and populates Google Cloud SQL with zero duplicates (safe 1.2s throttle).
                  </p>
                </div>

                {/* Session Added Badge */}
                <div className="flex items-center gap-2">
                  <div className="px-3.5 py-2 rounded-xl bg-[#171d2b] border border-[#232c40] flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 uppercase font-mono">This Session</span>
                    <span className="text-sm font-bold text-emerald-400">+{yearSessionAdded + batchSessionAdded} Anime</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-[#171d2b] border border-[#232c40] flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 uppercase font-mono">Total In DB</span>
                    <span className="text-sm font-bold text-blue-400">{stats.totalAnime.toLocaleString()} / 20k</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar towards 20,000 anime */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Catalog Ingestion Progress</span>
                  <span className="font-mono text-white font-bold">
                    {((stats.totalAnime / 20000) * 100).toFixed(1)}% of 20,000 anime
                  </span>
                </div>
                <div className="w-full bg-[#161c29] rounded-full h-3 overflow-hidden p-0.5 border border-[#232c40]">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400 h-2 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.min(100, Math.max(1, (stats.totalAnime / 20000) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Crawler Mode Switcher Cards */}
              <div className="pt-2">
                <div className="text-xs font-semibold text-gray-300 mb-2.5 flex items-center justify-between">
                  <span>Choose Ingestion Strategy:</span>
                  {batchRunning && (
                    <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      Crawler active ({activeRunningMode === "years" ? "Year Mode" : "Ranking Mode"}) — Pause to switch modes
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Mode Card 1: Year-by-Year */}
                  <div
                    onClick={() => !batchRunning && setCrawlerMode("years")}
                    className={`p-4 rounded-2xl text-left transition-all border relative flex flex-col justify-between ${
                      crawlerMode === "years"
                        ? "bg-gradient-to-br from-purple-950/40 via-[#151928] to-[#121622] border-purple-500/60 shadow-lg shadow-purple-950/30 ring-1 ring-purple-500/30"
                        : "bg-[#10141e] border-[#1d2435] hover:border-[#2a344d] opacity-75 hover:opacity-100"
                    } ${batchRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>RECOMMENDED • BYPASSES 5K LIMIT</span>
                        </div>
                        {crawlerMode === "years" && (
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400"></span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span>Year-by-Year Deep Catalog Crawler</span>
                      </h4>
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                        Crawls release years sequentially (2026 down to 1980). Each year has only 200–450 releases, so AniList pagination resets every year and NEVER hits the 5,000-entry ceiling.
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-purple-500/10 flex items-center justify-between text-[11px]">
                      <span className="text-purple-300 font-medium">Safe 1.2s delay per batch</span>
                      <span className="font-mono text-emerald-400 font-semibold">Captures All 20,000+ Titles</span>
                    </div>
                  </div>

                  {/* Mode Card 2: Global Ranking */}
                  <div
                    onClick={() => !batchRunning && setCrawlerMode("ranking")}
                    className={`p-4 rounded-2xl text-left transition-all border relative flex flex-col justify-between ${
                      crawlerMode === "ranking"
                        ? "bg-gradient-to-br from-blue-950/40 via-[#151928] to-[#121622] border-blue-500/60 shadow-lg shadow-blue-950/30 ring-1 ring-blue-500/30"
                        : "bg-[#10141e] border-[#1d2435] hover:border-[#2a344d] opacity-75 hover:opacity-100"
                    } ${batchRunning ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                          <TrendingUp className="w-3 h-3 text-blue-400" />
                          <span>GLOBAL POPULARITY RANKING</span>
                        </div>
                        {stats.totalAnime >= 5000 && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                            5k Limit Reached
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-400" />
                        <span>Standard Popularity Ranking</span>
                      </h4>
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                        Crawls all media sorted globally by popularity. AniList hard-caps pagination on this query at Page 200 (5,000 entries max).
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-blue-500/10 flex items-center justify-between text-[11px]">
                      <span className="text-amber-400/90 font-medium">Capped at Page 200 (5,000 items)</span>
                      <span className="font-mono text-gray-400">Pages 1 → 200</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode-Specific Controls */}
              {crawlerMode === "years" ? (
                /* Year-by-Year Mode Panel */
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0f131d] border border-purple-500/20 flex flex-col gap-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Start Year Input */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-300 font-medium">Start Year:</span>
                        <input
                          type="number"
                          min={1917}
                          max={2030}
                          value={startYear}
                          onChange={(e) => setStartYear(Number(e.target.value))}
                          disabled={batchRunning}
                          className="w-20 px-3 py-1.5 rounded-lg bg-[#0a0d14] border border-[#232c40] text-white text-xs font-mono font-bold focus:outline-none focus:border-purple-500 disabled:opacity-50"
                        />
                      </div>

                      {/* End Year Input */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-300 font-medium">End Year:</span>
                        <input
                          type="number"
                          min={1917}
                          max={2030}
                          value={endYear}
                          onChange={(e) => setEndYear(Number(e.target.value))}
                          disabled={batchRunning}
                          className="w-20 px-3 py-1.5 rounded-lg bg-[#0a0d14] border border-[#232c40] text-white text-xs font-mono font-bold focus:outline-none focus:border-purple-500 disabled:opacity-50"
                        />
                      </div>

                      {/* Quick Presets */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-gray-500 mr-1">Presets:</span>
                        <button
                          type="button"
                          onClick={() => { setStartYear(2026); setEndYear(1980); }}
                          disabled={batchRunning}
                          className="px-2.5 py-1 rounded bg-[#171c28] hover:bg-[#1f2638] text-[11px] text-gray-300 hover:text-white border border-[#222a3d] transition-colors disabled:opacity-50"
                        >
                          2026→1980
                        </button>
                        <button
                          type="button"
                          onClick={() => { setStartYear(1979); setEndYear(1960); }}
                          disabled={batchRunning}
                          className="px-2.5 py-1 rounded bg-purple-500/15 hover:bg-purple-500/25 text-[11px] text-purple-200 border border-purple-500/30 transition-colors disabled:opacity-50 font-medium"
                        >
                          1979→1960 (Retro)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setStartYear(1979); setEndYear(1940); }}
                          disabled={batchRunning}
                          className="px-2.5 py-1 rounded bg-purple-500/15 hover:bg-purple-500/25 text-[11px] text-purple-200 border border-purple-500/30 transition-colors disabled:opacity-50 font-medium"
                        >
                          1979→1940 (Golden Age)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setStartYear(1979); setEndYear(1917); }}
                          disabled={batchRunning}
                          className="px-2.5 py-1 rounded bg-[#171c28] hover:bg-[#1f2638] text-[11px] text-gray-400 hover:text-white border border-[#222a3d] transition-colors disabled:opacity-50"
                        >
                          1979→1917 (All Origins)
                        </button>
                      </div>
                    </div>

                    {/* Action Button: Start, Pause, or Auto-Adjust Range */}
                    <div>
                      {batchRunning && activeRunningMode === "years" ? (
                        <button
                          onClick={handlePauseCrawler}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30"
                        >
                          <Pause className="w-4 h-4 fill-white" />
                          <span>Pause Year Crawler</span>
                        </button>
                      ) : startYear < endYear ? (
                        <button
                          onClick={() => setEndYear(Math.max(1940, startYear - 20))}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Set End Year to {Math.max(1940, startYear - 20)} & Continue</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleStartYearCrawler}
                          disabled={batchRunning}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Start Year-by-Year Ingestion ({startYear} → {endYear})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Banner when Year Crawler is Running */}
                  {batchRunning && activeRunningMode === "years" && (
                    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-purple-200 font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        <span>
                          Actively Crawling: Release Year <strong className="text-white text-sm">{currentCrawlingYear}</strong> (Page {yearPage})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-purple-300/80">
                        <span>+{yearSessionAdded} added this session</span>
                        <span>•</span>
                        <span>Throttled at 1.2s/batch</span>
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-gray-400 flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      Zero duplicates guarantee: Titles already in the database have their details, characters, voice actors, and streaming links updated via PostgreSQL ON CONFLICT (anilist_id) DO UPDATE.
                    </span>
                  </div>
                </div>
              ) : (
                /* Standard Ranking Mode Panel */
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0f131d] border border-blue-500/20 flex flex-col gap-4">
                  {stats.totalAnime >= 5000 && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300">AniList 5,000-entry Limit Reached:</strong> You already have {stats.totalAnime.toLocaleString()} anime in Cloud SQL. AniList strictly rejects global queries past Page 200 (5,000 entries) with HTTP 400.
                        <button
                          type="button"
                          onClick={() => setCrawlerMode("years")}
                          className="ml-2 underline font-bold text-white hover:text-purple-300"
                        >
                          Switch to Year-by-Year mode →
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Start Page */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-300 font-medium">Start Page:</span>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={batchStartPage}
                          onChange={(e) => setBatchStartPage(Math.max(1, Number(e.target.value)))}
                          disabled={batchRunning}
                          className="w-20 px-2.5 py-1.5 rounded-lg bg-[#0a0d14] border border-[#232c40] text-white text-xs font-mono font-bold focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        />
                      </div>

                      {/* Target Pages */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-300 font-medium">Target:</span>
                        <select
                          value={batchTargetPages}
                          onChange={(e) => setBatchTargetPages(Number(e.target.value))}
                          disabled={batchRunning}
                          className="px-3 py-1.5 rounded-lg bg-[#0a0d14] border border-[#232c40] text-white text-xs font-semibold focus:outline-none disabled:opacity-50"
                        >
                          <option value={40}>40 Pages (~1,000 anime)</option>
                          <option value={100}>100 Pages (~2,500 anime)</option>
                          <option value={200}>200 Pages (Max 5,000 anime limit)</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Button: Start or Pause Ranking Crawler */}
                    <div>
                      {batchRunning && activeRunningMode === "ranking" ? (
                        <button
                          onClick={handlePauseCrawler}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30"
                        >
                          <Pause className="w-4 h-4 fill-white" />
                          <span>Pause Crawler</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleStartCrawler}
                          disabled={batchRunning}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Start Ranking Ingestion</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Banner when Ranking Crawler is Running */}
                  {batchRunning && activeRunningMode === "ranking" && (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs animate-pulse">
                      <div className="flex items-center gap-2 text-blue-300 font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span>Actively crawling Page {batchPage} of {batchTargetPages}...</span>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400">
                        Throttled at 1.2s/batch
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Live Terminal Log Output */}
            <div className="rounded-2xl bg-[#0c0e14] border border-[#1e2434] overflow-hidden flex flex-col shadow-2xl">
              <div className="px-5 py-3 bg-[#131722] border-b border-[#1e2434] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-gray-300 font-mono font-semibold">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Ingestion Console</span>
                </div>
                <button
                  onClick={() => setIngestLogs(["Console cleared."])}
                  className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Clear Console
                </button>
              </div>

              <div className="p-5 font-mono text-xs space-y-1.5 max-h-96 overflow-y-auto bg-[#0a0c10]">
                {ingestLogs.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.includes("SUCCESS") || log.includes("✓")
                        ? "text-emerald-400"
                        : log.includes("ERROR") || log.includes("FATAL") || log.includes("✗")
                        ? "text-rose-400"
                        : log.includes("Starting") || log.includes("Initiating")
                        ? "text-blue-400"
                        : "text-gray-400"
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DATABASE EXPLORER & MONITOR */}
        {/* ========================================================================= */}
        {activeTab === "database" && (
          <div className="flex flex-col gap-6">
            {/* Search & Filter Bar */}
            <div className="p-4 rounded-2xl bg-[#121622] border border-[#1f2638] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by title (e.g., Attack on Titan, Solo Leveling, Frieren)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchAnimeRecords(1)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0e111a] border border-[#21293c] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#0e111a] border border-[#21293c] text-xs text-white font-medium focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="RELEASING">Currently Airing</option>
                  <option value="FINISHED">Finished Airing</option>
                  <option value="NOT_YET_RELEASED">Upcoming</option>
                </select>

                <button
                  onClick={() => fetchAnimeRecords(1)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* Anime Table */}
            <div className="rounded-2xl bg-[#121622] border border-[#1f2638] overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 bg-[#141926] border-b border-[#1f2638] flex items-center justify-between text-xs text-gray-400">
                <span className="font-semibold text-white">
                  {totalRecords} records found in Cloud SQL
                </span>
                <span>Page {currentPage} of {totalPages}</span>
              </div>

              {loadingAnime ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  <span className="text-xs">Querying PostgreSQL database...</span>
                </div>
              ) : animeList.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <Database className="w-8 h-8 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-300">
                    No anime found in database yet
                  </span>
                  <span className="text-xs text-gray-500">
                    Switch to the &quot;Batch Ingestion Engine&quot; tab or click &quot;Sync Seasonal&quot; above to ingest titles!
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#10131d] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#1c2232]">
                      <tr>
                        <th className="px-4 py-3">Anime</th>
                        <th className="px-4 py-3">Format</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Episodes</th>
                        <th className="px-4 py-3">Next Airing</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#191f2e] text-gray-300">
                      {animeList.map((anime) => (
                        <tr key={anime.id} className="hover:bg-[#151a28] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative w-9 h-12 rounded bg-gray-900 overflow-hidden shrink-0">
                                {anime.cover_image_url ? (
                                  <Image
                                    src={anime.cover_image_url}
                                    alt={anime.title_romaji}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-600">
                                    No Img
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-white truncate max-w-xs" title={anime.title_romaji}>
                                  {anime.title_english || anime.title_romaji}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                  AniList ID #{anime.anilist_id}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-gray-400">{anime.format || "TV"}</td>

                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                anime.status === "RELEASING"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : anime.status === "FINISHED"
                                  ? "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              }`}
                            >
                              {anime.status}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-amber-400">
                              {anime.score ? `★ ${anime.score}` : "—"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-gray-400">
                            {anime.episodes_count ? `${anime.episodes_count} eps` : "Ongoing"}
                          </td>

                          <td className="px-4 py-3 text-gray-400">
                            {anime.next_airing_at ? (
                              <span className="text-emerald-400 font-mono text-[11px]">
                                Ep {anime.next_airing_episode} on{" "}
                                {new Date(anime.next_airing_at).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/anime/${anime.anilist_id}`}
                                target="_blank"
                                className="p-1.5 rounded-lg bg-[#181e2c] hover:bg-[#20273a] text-gray-400 hover:text-white transition-colors"
                                title="View public page"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => handleOpenInspect(anime)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[11px] font-semibold transition-colors flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Inspect</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Pagination */}
              {totalPages > 1 && (
                <div className="px-5 py-3 bg-[#141926] border-t border-[#1f2638] flex items-center justify-between text-xs">
                  <button
                    onClick={() => fetchAnimeRecords(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-[#181e2c] hover:bg-[#222a3d] text-gray-300 disabled:opacity-40 transition-colors"
                  >
                    ← Previous
                  </button>
                  <span className="text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => fetchAnimeRecords(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg bg-[#181e2c] hover:bg-[#222a3d] text-gray-300 disabled:opacity-40 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* COMPREHENSIVE ANIME INSPECTION MODAL */}
        {/* ========================================================================= */}
        {selectedAnime && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="max-w-4xl w-full bg-[#11141e] border border-[#232c42] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
              {/* Top Cinematic Header Banner */}
              <div className="relative h-44 sm:h-56 w-full bg-gradient-to-t from-[#11141e] to-gray-900 shrink-0">
                {selectedAnime.banner_image_url ? (
                  <Image
                    src={selectedAnime.banner_image_url}
                    alt=""
                    fill
                    className="object-cover opacity-35"
                  />
                ) : (
                  <div
                    className="w-full h-full opacity-25"
                    style={{ backgroundColor: selectedAnime.accent_color || "#3b82f6" }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#11141e] via-[#11141e]/60 to-transparent" />

                {/* Close Button */}
                <button
                  onClick={() => setSelectedAnime(null)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-gray-300 hover:text-white transition-colors"
                >
                  ✕
                </button>

                {/* Header Content with Floating Cover Poster */}
                <div className="absolute bottom-4 left-6 right-6 flex items-end gap-4 sm:gap-6">
                  <div className="relative w-20 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 border-[#2b354e] bg-gray-900 shrink-0">
                    {selectedAnime.cover_image_url ? (
                      <Image
                        src={selectedAnime.cover_image_url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
                        No Cover
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold">
                        #{selectedAnime.anilist_id}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        {selectedAnime.status}
                      </span>
                      {selectedAnime.score && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                          ★ {selectedAnime.score}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-2xl font-extrabold text-white truncate" title={selectedAnime.title_romaji}>
                      {selectedAnime.title_english || selectedAnime.title_romaji}
                    </h2>
                    <p className="text-xs text-gray-400 truncate">
                      {selectedAnime.title_romaji} {selectedAnime.title_native ? `• ${selectedAnime.title_native}` : ""}
                    </p>
                  </div>

                  {/* Public Link Button */}
                  <Link
                    href={`/anime/${selectedAnime.anilist_id}`}
                    target="_blank"
                    className="hidden sm:flex px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/30 shrink-0"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Modal Tabs Bar */}
              <div className="px-6 border-b border-[#202738] bg-[#141824] flex items-center gap-2">
                <button
                  onClick={() => setInspectTab("overview")}
                  className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                    inspectTab === "overview"
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Story & Details</span>
                </button>

                <button
                  onClick={() => setInspectTab("cast")}
                  className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                    inspectTab === "cast"
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Cast & Voice Actors</span>
                  {selectedAnime.characters && selectedAnime.characters.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[9px]">
                      {selectedAnime.characters.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setInspectTab("stream")}
                  className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                    inspectTab === "stream"
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Where to Watch</span>
                  {selectedAnime.streaming_links && selectedAnime.streaming_links.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[9px]">
                      {selectedAnime.streaming_links.length}
                    </span>
                  )}
                </button>

                {selectedAnime.youtube_trailer_id && (
                  <button
                    onClick={() => setInspectTab("trailer")}
                    className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                      inspectTab === "trailer"
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-rose-400" />
                    <span>Official Trailer</span>
                  </button>
                )}
              </div>

              {/* Modal Body Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-gray-300">
                {loadingInspect ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    <span className="text-xs text-gray-400">Loading full relational records...</span>
                  </div>
                ) : (
                  <>
                    {/* SUBTAB 1: STORY & DETAILS */}
                    {inspectTab === "overview" && (
                      <div className="space-y-6">
                        {/* Quick Metadata Matrix */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 rounded-xl bg-[#151a26] border border-[#21293c]">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold">Format</span>
                            <div className="text-sm font-bold text-white mt-0.5">
                              {selectedAnime.format || "TV"} • {selectedAnime.episodes_count ? `${selectedAnime.episodes_count} eps` : "Ongoing"}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-[#151a26] border border-[#21293c]">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold">Studio</span>
                            <div className="text-sm font-bold text-white mt-0.5 truncate">
                              {getStudioName(selectedAnime.studios)}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-[#151a26] border border-[#21293c]">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold">Season</span>
                            <div className="text-sm font-bold text-white mt-0.5">
                              {selectedAnime.season || "Unknown"} {selectedAnime.season_year || ""}
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-[#151a26] border border-[#21293c]">
                            <span className="text-[10px] text-gray-500 uppercase font-semibold">Source Material</span>
                            <div className="text-sm font-bold text-white mt-0.5">
                              {selectedAnime.source || "Manga"}
                            </div>
                          </div>
                        </div>

                        {/* Next Airing Episode Banner (if ongoing) */}
                        {selectedAnime.next_airing_at && (
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
                              <span className="text-xs font-semibold text-emerald-300">
                                Episode {selectedAnime.next_airing_episode} Scheduled Release
                              </span>
                            </div>
                            <span className="text-xs font-mono text-emerald-400 font-bold">
                              {new Date(selectedAnime.next_airing_at).toLocaleString()}
                            </span>
                          </div>
                        )}

                        {/* Synopsis */}
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span>Plot Synopsis</span>
                            <span className="text-[10px] text-gray-500 font-normal">(Stored in Cloud SQL)</span>
                          </h4>
                          <div
                            className="p-4 rounded-2xl bg-[#0e111a] border border-[#1d2334] text-xs leading-relaxed text-gray-300 font-sans whitespace-pre-line"
                            dangerouslySetInnerHTML={{
                              __html: selectedAnime.synopsis || "No synopsis available for this title.",
                            }}
                          />
                        </div>

                        {/* Genres */}
                        {selectedAnime.genres && selectedAnime.genres.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Genres</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedAnime.genres.map((genre: string) => (
                                <span
                                  key={genre}
                                  className="px-2.5 py-1 rounded-lg bg-[#181d2a] text-blue-400 border border-[#252c3e] text-xs font-semibold"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 2: CAST & VOICE ACTORS */}
                    {inspectTab === "cast" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Characters & Japanese Seiyuu
                          </h4>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {selectedAnime.characters?.length || 0} cast members mapped
                          </span>
                        </div>

                        {(!selectedAnime.characters || selectedAnime.characters.length === 0) ? (
                          <div className="p-8 text-center text-gray-500 bg-[#0e111a] rounded-2xl border border-[#1d2334]">
                            No characters mapped for this title yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedAnime.characters.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-[#141824] border border-[#202738] flex items-center justify-between gap-3"
                              >
                                {/* Character Info */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-900 shrink-0">
                                    {item.character_image ? (
                                      <Image
                                        src={item.character_image}
                                        alt={item.character_name}
                                        fill
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-600">
                                        N/A
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-bold text-white truncate">
                                      {item.character_name}
                                    </h5>
                                    <span className="text-[10px] text-gray-500 uppercase font-mono">
                                      {item.role || "MAIN"}
                                    </span>
                                  </div>
                                </div>

                                {/* Voice Actor Info */}
                                <div className="flex items-center gap-2.5 text-right shrink-0">
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-bold text-amber-300 truncate">
                                      {item.voice_actor_name || "TBA"}
                                    </h5>
                                    <span className="text-[10px] text-gray-500 font-mono">
                                      Japanese VA
                                    </span>
                                  </div>
                                  <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-900 shrink-0">
                                    {item.voice_actor_image ? (
                                      <Image
                                        src={item.voice_actor_image}
                                        alt=""
                                        fill
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-600">
                                        N/A
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 3: WHERE TO WATCH & AFFILIATES */}
                    {inspectTab === "stream" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Legal Streaming Destinations
                          </h4>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {selectedAnime.streaming_links?.length || 0} links active
                          </span>
                        </div>

                        {(!selectedAnime.streaming_links || selectedAnime.streaming_links.length === 0) ? (
                          <div className="p-8 text-center text-gray-500 bg-[#0e111a] rounded-2xl border border-[#1d2334]">
                            No streaming links saved for this title yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedAnime.streaming_links.map((link) => (
                              <div
                                key={link.id}
                                className="p-3.5 rounded-xl bg-[#141824] border border-[#202738] flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    <Film className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-bold text-white">
                                      {link.platform_name}
                                    </h5>
                                    <span className="text-[10px] text-emerald-400 font-semibold">
                                      Official Streaming Source
                                    </span>
                                  </div>
                                </div>

                                <a
                                  href={link.target_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-[#181d2a] hover:bg-[#20273a] text-blue-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                                >
                                  <span>Watch</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 4: TRAILER */}
                    {inspectTab === "trailer" && selectedAnime.youtube_trailer_id && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Official YouTube Trailer
                        </h4>
                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[#232c42]">
                          <iframe
                            src={`https://www.youtube.com/embed/${selectedAnime.youtube_trailer_id}`}
                            title="Trailer"
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-[#141824] border-t border-[#202738] flex items-center justify-between text-xs text-gray-500 font-mono">
                <span>Ingested: {new Date(selectedAnime.created_at).toLocaleDateString()}</span>
                <Link
                  href={`/anime/${selectedAnime.anilist_id}`}
                  target="_blank"
                  className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                >
                  <span>Open Full Public View →</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
