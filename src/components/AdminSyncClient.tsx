"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  Server,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import Navbar from "./Navbar";

const SUPABASE_SCHEMA_SQL = `-- 1. Anime Core Table
CREATE TABLE anime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anilist_id INTEGER UNIQUE,
    mal_id INTEGER,
    title_english VARCHAR(255),
    title_romaji VARCHAR(255) NOT NULL,
    title_native VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    synopsis TEXT,
    format VARCHAR(30) DEFAULT 'TV',
    status VARCHAR(30) DEFAULT 'FINISHED',
    season VARCHAR(20),
    season_year INTEGER,
    episodes_count INTEGER,
    episode_duration INTEGER,
    score NUMERIC(3, 1),
    popularity INTEGER,
    cover_image_url TEXT,
    banner_image_url TEXT,
    accent_color VARCHAR(10),
    youtube_trailer_id VARCHAR(50),
    next_airing_episode INTEGER,
    next_airing_at TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Studios Table
CREATE TABLE studios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anilist_id INTEGER UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    is_animation_studio BOOLEAN DEFAULT true
);

CREATE TABLE anime_studios (
    anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    PRIMARY KEY (anime_id, studio_id)
);

-- 3. Characters & Voice Actors (Seiyuu)
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anilist_id INTEGER UNIQUE,
    name VARCHAR(255) NOT NULL,
    image_url TEXT
);

CREATE TABLE voice_actors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anilist_id INTEGER UNIQUE,
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    language VARCHAR(50) DEFAULT 'Japanese'
);

CREATE TABLE anime_characters (
    anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    voice_actor_id UUID REFERENCES voice_actors(id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'MAIN',
    PRIMARY KEY (anime_id, character_id)
);

-- 4. Streaming Links (Where to Watch & Affiliates)
CREATE TABLE streaming_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
    platform_name VARCHAR(100) NOT NULL,
    target_url TEXT NOT NULL,
    region VARCHAR(10) DEFAULT 'US',
    is_free BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);`;

export default function AdminSyncClient() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "System initialized. Ready to trigger AniList GraphQL batch crawler.",
    "Target: https://graphql.anilist.co (Max 90 requests/minute)",
  ]);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const handleRunSync = async (action: "test" | "seasonal" | "top") => {
    setLoading(true);
    addLog(`Initiating batch ingestion action: ${action.toUpperCase()}...`);

    try {
      const res = await fetch("/api/admin/sync-anilist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, perPage: action === "test" ? 5 : 20 }),
      });

      const data = await res.json();

      if (data.success) {
        setLastSyncResult(data);
        addLog(
          `SUCCESS: Batch imported ${data.count} anime titles in ${data.metrics.executionTimeMs}ms.`
        );
        addLog(
          `Payload: ${data.metrics.totalCharacters} characters, ${data.metrics.totalVoiceActors} Seiyuu voice actors, ${data.metrics.totalStreamingLinks} streaming links.`
        );
      } else {
        addLog(`ERROR: ${data.error}`);
      }
    } catch (err: any) {
      addLog(`FATAL: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-gray-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#202533] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Section 2 Masterplan Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              1-Click Automated Ingestion Engine
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Automated batch crawler fetching complete anime metadata, Seiyuu voice actors, YouTube trailer IDs, and legal streaming links.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setShowSql(!showSql)}
              className="px-3.5 py-2 rounded-lg bg-[#141722] hover:bg-[#181d2a] text-gray-300 border border-[#222736] text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>{showSql ? "Hide SQL Schema" : "View Supabase SQL"}</span>
            </button>
          </div>
        </div>

        {/* Pipeline Metrics (Flat 4-Box Bar) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#141722] border border-[#222736]">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>GraphQL Pipeline</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-lg font-bold text-white">90 req / min</div>
            <div className="text-[10px] text-gray-500 mt-0.5">AniList Open API Limit</div>
          </div>

          <div className="p-4 rounded-xl bg-[#141722] border border-[#222736]">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Ingestion Speed</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-amber-400">4,500 titles / min</div>
            <div className="text-[10px] text-gray-500 mt-0.5">At 50 anime / batch</div>
          </div>

          <div className="p-4 rounded-xl bg-[#141722] border border-[#222736]">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Database Mode</span>
              <Server className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-blue-400">Edge Hydration</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Live Cache & Supabase Ready</div>
          </div>

          <div className="p-4 rounded-xl bg-[#141722] border border-[#222736]">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Legal Integrity</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-emerald-400">100% Legal</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Official Video & Streaming IDs</div>
          </div>
        </div>

        {/* 1-Click Sync Actions Bar */}
        <div className="p-5 rounded-xl bg-[#141722] border border-[#222736] flex flex-col gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Trigger Automated Batch Ingestion
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Execute live GraphQL query batches directly from your browser.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleRunSync("test")}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg bg-[#181d2a] hover:bg-[#202636] border border-[#282f42] text-white text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <Zap className="w-4 h-4 text-blue-400" />}
              <span>Test Connection (5 Anime Sample)</span>
            </button>

            <button
              onClick={() => handleRunSync("seasonal")}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Zap className="w-4 h-4 fill-white" />}
              <span>Sync Current Seasonal Releases (20 Anime)</span>
            </button>

            <button
              onClick={() => handleRunSync("top")}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Database className="w-4 h-4" />}
              <span>Sync All-Time Top Ranked (20 Anime)</span>
            </button>
          </div>
        </div>

        {/* SQL Schema Accordion (if open) */}
        {showSql && (
          <div className="p-5 rounded-xl bg-[#12151f] border border-[#202533] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span>Supabase PostgreSQL DDL Schema (from Masterplan Section 4)</span>
              </span>
              <button
                onClick={copySql}
                className="px-3 py-1 rounded bg-[#181d2a] hover:bg-[#222738] text-xs text-gray-300 border border-[#272d3f] flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied SQL" : "Copy SQL"}</span>
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-[#0b0c10] border border-[#1e2332] text-[11px] font-mono text-gray-300 overflow-x-auto max-h-64">
              {SUPABASE_SCHEMA_SQL}
            </pre>
          </div>
        )}

        {/* Live Terminal & Logs */}
        <div className="rounded-xl bg-[#12151f] border border-[#202533] overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-[#161a26] border-b border-[#202533] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-gray-300 font-semibold font-mono">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Ingestion Engine Terminal</span>
            </div>
            <span className="text-[10px] text-gray-500">Live Status Feed</span>
          </div>

          <div className="p-4 font-mono text-xs space-y-1.5 max-h-72 overflow-y-auto bg-[#0d0e13]">
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes("SUCCESS")
                    ? "text-emerald-400"
                    : log.includes("ERROR") || log.includes("FATAL")
                    ? "text-rose-400"
                    : "text-gray-400"
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Last Sync Result Preview Cards (if available) */}
        {lastSyncResult && lastSyncResult.sampleItems?.length > 0 && (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Sample Ingested Records ({lastSyncResult.sampleItems.length} shown)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {lastSyncResult.sampleItems.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-[#141722] border border-[#222736] flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] text-gray-500 font-mono">ID: #{item.id}</span>
                    <h4 className="text-xs font-semibold text-white truncate mt-0.5" title={item.title}>
                      {item.title}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2 pt-2 border-t border-[#202533]">
                    <span>{item.studio}</span>
                    <span className="text-amber-400 font-bold">★ {(item.score / 10).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#202533] bg-[#10131a] py-8 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-300">AnimeDB</span>
            <span>•</span>
            <span>Admin Automated Ingestion Control Center</span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <span>AniList GraphQL Automated Sync Route (/api/admin/sync-anilist)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
