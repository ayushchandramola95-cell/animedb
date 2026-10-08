"use client";

import { useState, useEffect } from "react";
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
  const [batchPage, setBatchPage] = useState(1);
  const [batchMaxPages, setBatchMaxPages] = useState(5);

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

  // Automated Multi-Page Batch Crawler
  const runMultiPageBatch = async () => {
    setBatchRunning(true);
    addLog(`Starting Automated Multi-Page Crawler: Pages 1 to ${batchMaxPages}...`);

    for (let p = 1; p <= batchMaxPages; p++) {
      setBatchPage(p);
      addLog(`[Batch Job] Crawling & Syncing Page ${p} of ${batchMaxPages}...`);
      try {
        const res = await fetch("/api/admin/sync-anilist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "top", page: p, perPage: 25 }),
        });
        const data = await res.json();
        if (data.success) {
          addLog(`✓ Page ${p}: Ingested ${data.count} titles into PostgreSQL.`);
          await fetchStats();
        } else {
          addLog(`✗ Page ${p} Error: ${data.error}`);
          break;
        }
      } catch (err: any) {
        addLog(`✗ Page ${p} Failed: ${err.message}`);
        break;
      }

      if (p < batchMaxPages) {
        addLog(`Sleeping 1.5s to respect AniList API rate limits...`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    addLog(`Batch Crawl Completed!`);
    setBatchRunning(false);
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
            <div className="p-6 rounded-2xl bg-[#121622] border border-[#1f2638] flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Automated Multi-Page Ingestion Crawler</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Sequentially crawls AniList pages and stores anime, characters, and stream destinations into Cloud SQL with automatic rate-limit throttling (1.5s delay).
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <span>Crawl Pages:</span>
                    <select
                      value={batchMaxPages}
                      onChange={(e) => setBatchMaxPages(Number(e.target.value))}
                      disabled={batchRunning}
                      className="px-2.5 py-1.5 rounded-lg bg-[#181e2c] border border-[#273044] text-white text-xs font-semibold"
                    >
                      <option value={3}>3 Pages (75 anime)</option>
                      <option value={5}>5 Pages (125 anime)</option>
                      <option value={10}>10 Pages (250 anime)</option>
                      <option value={20}>20 Pages (500 anime)</option>
                    </select>
                  </div>

                  <button
                    onClick={runMultiPageBatch}
                    disabled={batchRunning}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/30"
                  >
                    {batchRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Crawling Page {batchPage}/{batchMaxPages}...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 text-white" />
                        <span>Start Automated Crawler</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {batchRunning && (
                <div className="w-full bg-[#181e2c] rounded-full h-2 overflow-hidden mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(batchPage / batchMaxPages) * 100}%` }}
                  />
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
