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
  Globe,
  CheckSquare,
  Square,
  Filter,
  ChevronDown,
  ChevronUp,
  History,
  ListCheck,
  ArrowRight,
  ShieldAlert,
  CheckCheck,
  SlidersHorizontal,
  Star,
  Edit3,
  Trash2,
  Plus,
  X,
  Save,
  Palette,
  FileText,
  Link as LinkIcon,
  Music,
  Mic,
  MessageSquare,
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
  is_featured?: boolean;
  featured_order?: number;
  custom_notes?: string | null;
  created_at: string;
  updated_at: string;
  characters?: CharacterItem[];
  streaming_links?: StreamingLinkItem[];
}

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<"overview" | "airing" | "audit" | "ingest" | "database" | "extended">("overview");

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

  // Airing Sync state
  const [airingLoading, setAiringLoading] = useState(false);
  const [airingSettings, setAiringSettings] = useState<{
    autoSyncEnabled: boolean;
    lastSyncAt: string | null;
    intervalMinutes: number;
  }>({
    autoSyncEnabled: true,
    lastSyncAt: null,
    intervalMinutes: 30,
  });
  const [airingHistory, setAiringHistory] = useState<any[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [airingSummary, setAiringSummary] = useState<any | null>(null);
  const [nextSyncSeconds, setNextSyncSeconds] = useState<number>(30 * 60);

  // Catalog Audit state
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditScope, setAuditScope] = useState<"popular" | "recent" | "all">("popular");
  const [auditYear, setAuditYear] = useState<number>(2025);
  const [auditPage, setAuditPage] = useState<number>(1);
  const [auditTotalAvailable, setAuditTotalAvailable] = useState<number>(10000);
  const [auditedTotalCount, setAuditedTotalCount] = useState<number>(0);
  const [pendingDiffs, setPendingDiffs] = useState<any[]>([]);
  const [selectedDiffIds, setSelectedDiffIds] = useState<Set<string>>(new Set());
  const [diffFilterType, setDiffFilterType] = useState<string>("ALL");
  const [diffSearchQuery, setDiffSearchQuery] = useState<string>("");
  const [applyingChanges, setApplyingChanges] = useState(false);
  const [applyResultBanner, setApplyResultBanner] = useState<string | null>(null);
  const stopAuditRef = useRef(false);

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

  // Global Data Source state
  const [dataSource, setDataSource] = useState<"db" | "anilist">("db");
  const [updatingSource, setUpdatingSource] = useState(false);

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

  // Spotlight state
  const [spotlightList, setSpotlightList] = useState<AnimeRecord[]>([]);
  const [loadingSpotlight, setLoadingSpotlight] = useState(false);

  // Admin Anime Editor Modal state
  const [editingAnime, setEditingAnime] = useState<AnimeRecord | null>(null);
  const [editTab, setEditTab] = useState<"content" | "spotlight" | "streams">("content");
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSaveStatus, setEditSaveStatus] = useState<"success" | "error" | null>(null);

  const [editForm, setEditForm] = useState({
    synopsis: "",
    accent_color: "#3b82f6",
    custom_notes: "",
    is_featured: false,
    featured_order: 0,
    youtube_trailer_id: "",
    score: null as number | null,
    status: "FINISHED",
    episodes_count: null as number | null,
    is_published: true,
  });

  // Streaming links inside editor
  const [editingStreamingLinks, setEditingStreamingLinks] = useState<StreamingLinkItem[]>([]);
  const [newLinkPlatform, setNewLinkPlatform] = useState("Crunchyroll");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkAffiliate, setNewLinkAffiliate] = useState("");
  const [newLinkIsOfficial, setNewLinkIsOfficial] = useState(true);
  const [isAddingLink, setIsAddingLink] = useState(false);

  // Extended Media Suite State (Episodes, Themes, Dubs, Reviews)
  const [extendedStats, setExtendedStats] = useState<{
    totalEpisodes: number;
    totalThemes: number;
    totalDubs: number;
    totalReviews: number;
  }>({
    totalEpisodes: 0,
    totalThemes: 0,
    totalDubs: 0,
    totalReviews: 0,
  });
  const [extendedSyncLoading, setExtendedSyncLoading] = useState(false);
  const [extendedSearchId, setExtendedSearchId] = useState("16498");
  const [extendedBatchCount, setExtendedBatchCount] = useState(10);
  const [extendedBatchType, setExtendedBatchType] = useState<"popular" | "airing">("popular");
  const [selectedExtendedAnimeId, setSelectedExtendedAnimeId] = useState<number | null>(16498);
  const [selectedExtendedData, setSelectedExtendedData] = useState<{
    episodes: any[];
    themes: any[];
    dubs: any[];
    reviews: any[];
  } | null>(null);
  const [loadingExtendedDetail, setLoadingExtendedDetail] = useState(false);
  const [extendedSubTab, setExtendedSubTab] = useState<"episodes" | "themes" | "dubs" | "reviews">("episodes");
  const [extendedResultBanner, setExtendedResultBanner] = useState<string | null>(null);
  const [dubLanguageFilter, setDubLanguageFilter] = useState<string>("ALL");

  const addLog = (msg: string) => {
    setIngestLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 100)]);
  };

  // Fetch Settings (Data Source)
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success && data.dataSource) {
        setDataSource(data.dataSource);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Data Source
  const handleToggleDataSource = async (target: "db" | "anilist") => {
    if (dataSource === target || updatingSource) return;
    setUpdatingSource(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataSource: target }),
      });
      const data = await res.json();
      if (data.success) {
        setDataSource(data.dataSource);
        addLog(
          `⚡ Public Website Data Source switched to: ${
            data.dataSource === "db"
              ? "Google Cloud SQL (14,883+ titles, ~5ms speed, no rate limits)"
              : "Live AniList GraphQL API proxy"
          }`
        );
      }
    } catch (err: any) {
      addLog(`❌ Failed to switch data source: ${err.message}`);
    } finally {
      setUpdatingSource(false);
    }
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

  // Spotlight List Fetcher
  const fetchSpotlightAnime = async () => {
    setLoadingSpotlight(true);
    try {
      const res = await fetch("/api/admin/anime?spotlight=true");
      const data = await res.json();
      if (data.success) {
        setSpotlightList(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch spotlight list:", err);
    } finally {
      setLoadingSpotlight(false);
    }
  };

  // Open Full Anime Editor Modal
  const handleOpenEdit = async (anime: AnimeRecord) => {
    setEditingAnime(anime);
    setEditTab("content");
    setEditSaveStatus(null);
    setEditForm({
      synopsis: anime.synopsis || "",
      accent_color: anime.accent_color || "#3b82f6",
      custom_notes: anime.custom_notes || "",
      is_featured: Boolean(anime.is_featured),
      featured_order: anime.featured_order ?? 0,
      youtube_trailer_id: anime.youtube_trailer_id || "",
      score: anime.score,
      status: anime.status || "FINISHED",
      episodes_count: anime.episodes_count,
      is_published: anime.is_published ?? true,
    });
    setEditingStreamingLinks(anime.streaming_links || []);
    setNewLinkPlatform("Crunchyroll");
    setNewLinkUrl("");
    setNewLinkAffiliate("");
    setNewLinkIsOfficial(true);
    setEditModalLoading(true);

    try {
      const res = await fetch(`/api/admin/anime?id=${anime.anilist_id}`);
      const data = await res.json();
      if (data.success && data.data) {
        const full = data.data;
        setEditingAnime(full);
        setEditingStreamingLinks(full.streaming_links || []);
        setEditForm({
          synopsis: full.synopsis || "",
          accent_color: full.accent_color || "#3b82f6",
          custom_notes: full.custom_notes || "",
          is_featured: Boolean(full.is_featured),
          featured_order: full.featured_order ?? 0,
          youtube_trailer_id: full.youtube_trailer_id || "",
          score: full.score,
          status: full.status || "FINISHED",
          episodes_count: full.episodes_count,
          is_published: full.is_published ?? true,
        });
      }
    } catch (err) {
      console.error("Failed to load anime details for editing:", err);
    } finally {
      setEditModalLoading(false);
    }
  };

  // Save Edits to Cloud SQL
  const handleSaveEdit = async () => {
    if (!editingAnime) return;
    setIsSavingEdit(true);
    setEditSaveStatus(null);

    try {
      const res = await fetch("/api/admin/anime", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anilist_id: editingAnime.anilist_id,
          synopsis: editForm.synopsis,
          accent_color: editForm.accent_color,
          custom_notes: editForm.custom_notes,
          is_featured: editForm.is_featured,
          featured_order: Number(editForm.featured_order) || 0,
          youtube_trailer_id: editForm.youtube_trailer_id,
          score: editForm.score !== null && editForm.score !== undefined ? Number(editForm.score) : null,
          status: editForm.status,
          episodes_count: editForm.episodes_count !== null && editForm.episodes_count !== undefined ? Number(editForm.episodes_count) : null,
          is_published: editForm.is_published,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditSaveStatus("success");
        addLog(`✓ Updated Anime #${editingAnime.anilist_id} (${editingAnime.title_romaji}) in Cloud SQL.`);
        
        // Update local state in animeList so table reflects immediately
        setAnimeList((prev) =>
          prev.map((item) =>
            item.anilist_id === editingAnime.anilist_id
              ? { ...item, ...editForm, ...(data.data || {}) }
              : item
          )
        );
        if (selectedAnime && selectedAnime.anilist_id === editingAnime.anilist_id) {
          setSelectedAnime((prev) => (prev ? { ...prev, ...editForm, ...(data.data || {}) } : null));
        }
        fetchSpotlightAnime();
        setTimeout(() => setEditSaveStatus(null), 3000);
      } else {
        setEditSaveStatus("error");
        addLog(`❌ Failed to update anime #${editingAnime.anilist_id}: ${data.error}`);
      }
    } catch (err: any) {
      setEditSaveStatus("error");
      addLog(`❌ Edit save error: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Add Custom Legal / Affiliate Streaming Link
  const handleAddStreamingLink = async () => {
    if (!editingAnime || !newLinkPlatform.trim() || !newLinkUrl.trim()) return;
    setIsAddingLink(true);

    try {
      const res = await fetch("/api/admin/anime", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anilist_id: editingAnime.anilist_id,
          new_streaming_link: {
            platform_name: newLinkPlatform.trim(),
            target_url: newLinkUrl.trim(),
            affiliate_url: newLinkAffiliate.trim() || null,
            is_official: newLinkIsOfficial,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.streaming_links) {
        setEditingStreamingLinks(data.data.streaming_links);
        setNewLinkUrl("");
        setNewLinkAffiliate("");
        addLog(`✓ Added streaming link (${newLinkPlatform}) for #${editingAnime.anilist_id}`);
        fetchStats();
      }
    } catch (err: any) {
      addLog(`❌ Add streaming link error: ${err.message}`);
    } finally {
      setIsAddingLink(false);
    }
  };

  // Delete Streaming Link
  const handleDeleteStreamingLink = async (linkId: string) => {
    if (!editingAnime) return;
    try {
      const res = await fetch("/api/admin/anime", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anilist_id: editingAnime.anilist_id,
          delete_streaming_link_id: linkId,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.streaming_links) {
        setEditingStreamingLinks(data.data.streaming_links);
        addLog(`✓ Removed streaming link from #${editingAnime.anilist_id}`);
        fetchStats();
      }
    } catch (err: any) {
      addLog(`❌ Delete streaming link error: ${err.message}`);
    }
  };

  // Quick Spotlight Toggle Helper (e.g., from cards or table)
  const handleQuickSpotlightToggle = async (anime: AnimeRecord, shouldFeature: boolean, newOrder = 0) => {
    try {
      const res = await fetch("/api/admin/anime", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anilist_id: anime.anilist_id,
          is_featured: shouldFeature,
          featured_order: newOrder,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addLog(`✓ ${shouldFeature ? "Featured" : "Removed"} #${anime.anilist_id} in Homepage Spotlight Carousel.`);
        fetchSpotlightAnime();
        setAnimeList((prev) =>
          prev.map((item) =>
            item.anilist_id === anime.anilist_id
              ? { ...item, is_featured: shouldFeature, featured_order: newOrder }
              : item
          )
        );
      }
    } catch (err: any) {
      addLog(`❌ Toggle spotlight error: ${err.message}`);
    }
  };

  // Extended Media Handlers
  const fetchExtendedStats = async () => {
    try {
      const res = await fetch("/api/admin/extended-sync?stats=true");
      const data = await res.json();
      if (data.success && data.stats) {
        setExtendedStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching extended stats:", err);
    }
  };

  const loadExtendedAnimeData = async (animeId: number) => {
    setSelectedExtendedAnimeId(animeId);
    setLoadingExtendedDetail(true);
    try {
      const res = await fetch(`/api/admin/extended-sync?animeId=${animeId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedExtendedData(data.data);
      }
    } catch (err) {
      console.error("Error loading extended anime data:", err);
    } finally {
      setLoadingExtendedDetail(false);
    }
  };

  const handleSyncSingleExtended = async (idToSync?: number) => {
    const targetId = idToSync || parseInt(extendedSearchId, 10);
    if (!targetId || isNaN(targetId) || extendedSyncLoading) return;

    setExtendedSyncLoading(true);
    setExtendedResultBanner(null);
    addLog(`⚡ Initiating Extended Data Sync for Anime #${targetId}...`);

    try {
      const res = await fetch("/api/admin/extended-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_anime", animeId: targetId }),
      });
      const data = await res.json();

      if (data.success && data.result) {
        const r = data.result;
        setExtendedResultBanner(
          `✅ Successfully synced "${r.title}" (#${r.animeId}): +${r.episodesCount} episodes, +${r.themesCount} theme songs, +${r.dubsCount} dub cast roles, +${r.reviewsCount} reviews!`
        );
        addLog(
          `✓ Extended sync completed for #${r.animeId} (${r.title}): ${r.episodesCount} eps, ${r.themesCount} themes, ${r.dubsCount} dubs, ${r.reviewsCount} reviews.`
        );
        if (data.stats) setExtendedStats(data.stats);
        await loadExtendedAnimeData(targetId);
      } else {
        setExtendedResultBanner(`❌ Error: ${data.error || "Failed to sync extended data"}`);
        addLog(`❌ Extended sync error for #${targetId}: ${data.error}`);
      }
    } catch (err: any) {
      setExtendedResultBanner(`❌ Error: ${err.message}`);
      addLog(`❌ Extended sync fatal error: ${err.message}`);
    } finally {
      setExtendedSyncLoading(false);
    }
  };

  const handleBatchExtendedSync = async () => {
    if (extendedSyncLoading) return;
    setExtendedSyncLoading(true);
    setExtendedResultBanner(null);
    addLog(`🚀 Launching Batch Extended Sync for ${extendedBatchCount} ${extendedBatchType} anime...`);

    try {
      const res = await fetch("/api/admin/extended-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_sync",
          limit: extendedBatchCount,
          type: extendedBatchType,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setExtendedResultBanner(
          `🎉 Batch sync completed! Processed ${data.totalProcessed} anime with zero duplicates.`
        );
        addLog(`🎉 Batch extended sync processed ${data.totalProcessed} anime.`);
        if (data.stats) setExtendedStats(data.stats);
        if (selectedExtendedAnimeId) {
          await loadExtendedAnimeData(selectedExtendedAnimeId);
        }
      } else {
        setExtendedResultBanner(`❌ Batch error: ${data.error}`);
        addLog(`❌ Batch extended sync error: ${data.error}`);
      }
    } catch (err: any) {
      setExtendedResultBanner(`❌ Batch error: ${err.message}`);
      addLog(`❌ Batch extended fatal error: ${err.message}`);
    } finally {
      setExtendedSyncLoading(false);
    }
  };

  const handleDeleteExtendedItem = async (delete_type: "episode" | "theme" | "dub" | "review", id: string) => {
    try {
      const res = await fetch("/api/admin/extended-sync", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delete_type, id }),
      });
      const data = await res.json();
      if (data.success) {
        addLog(`✓ Deleted ${delete_type} #${id}`);
        fetchExtendedStats();
        if (selectedExtendedAnimeId) {
          loadExtendedAnimeData(selectedExtendedAnimeId);
        }
      }
    } catch (err: any) {
      addLog(`❌ Delete ${delete_type} error: ${err.message}`);
    }
  };

  // Airing Sync Helpers
  const fetchAiringSyncData = async () => {
    try {
      const res = await fetch("/api/admin/airing-sync");
      const data = await res.json();
      if (data.success) {
        if (data.settings) setAiringSettings(data.settings);
        if (data.history) setAiringHistory(data.history);
      }
    } catch (err) {
      console.error("Error fetching airing sync data:", err);
    }
  };

  const handleTriggerAiringSync = async () => {
    if (airingLoading) return;
    setAiringLoading(true);
    setAiringSummary(null);
    try {
      const res = await fetch("/api/admin/airing-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "manual" }),
      });
      const data = await res.json();
      if (data.success) {
        setAiringSummary(data.result);
        if (data.history) setAiringHistory(data.history);
        if (data.settings) setAiringSettings(data.settings);
        setNextSyncSeconds(30 * 60);
        addLog(
          `⚡ Airing Sync Complete: ${
            data.result?.status === "UPDATED"
              ? `Updated ${data.result.changedCount} shows (${data.result.checkedCount} checked)`
              : `Checked ${data.result.checkedCount} shows — No changes detected (all schedules up to date)`
          } in ${data.result.executionTimeMs}ms`
        );
        await fetchStats();
      } else {
        addLog(`❌ Airing Sync Failed: ${data.error}`);
      }
    } catch (err: any) {
      addLog(`❌ Airing Sync Error: ${err.message}`);
    } finally {
      setAiringLoading(false);
    }
  };

  const handleToggleAiringAutoSync = async () => {
    const nextState = !airingSettings.autoSyncEnabled;
    try {
      const res = await fetch("/api/admin/airing-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_auto_sync", enabled: nextState }),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setAiringSettings(data.settings);
        addLog(`⏱ Airing 30-min Auto-Sync ${nextState ? "ENABLED" : "PAUSED"}.`);
      }
    } catch (err: any) {
      addLog(`❌ Failed to toggle auto-sync: ${err.message}`);
    }
  };

  // Airing 30-min countdown timer effect
  useEffect(() => {
    if (!airingSettings.autoSyncEnabled) return;

    const timer = setInterval(() => {
      setNextSyncSeconds((prev) => {
        if (prev <= 1) {
          fetchAiringSyncData();
          return 30 * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [airingSettings.autoSyncEnabled]);

  // Catalog Audit Handlers
  const handleStartCatalogAudit = async () => {
    if (auditRunning) return;
    setAuditRunning(true);
    stopAuditRef.current = false;
    setApplyResultBanner(null);

    let p = auditPage;
    let keepAuditing = true;
    addLog(`🔍 Starting Catalog Audit: Scope=[${auditScope.toUpperCase()}], starting at Page ${p}...`);

    while (keepAuditing && !stopAuditRef.current) {
      try {
        const queryParams = new URLSearchParams({
          page: p.toString(),
          perPage: "50",
          scope: auditScope,
          ...(auditScope === "recent" ? { year: auditYear.toString() } : {}),
        });

        const res = await fetch(`/api/admin/catalog-audit?${queryParams.toString()}`);
        const data = await res.json();

        if (data.success) {
          setAuditTotalAvailable(data.totalAvailable || 10000);
          setAuditedTotalCount((prev) => prev + (data.checkedCount || 0));

          if (data.diffs && data.diffs.length > 0) {
            setPendingDiffs((prev) => {
              const existingIds = new Set(prev.map((d) => d.diffId));
              const newUnique = data.diffs.filter((d: any) => !existingIds.has(d.diffId));
              return [...prev, ...newUnique];
            });
            // Automatically pre-select newly found diffs
            setSelectedDiffIds((prev) => {
              const nextSet = new Set(prev);
              data.diffs.forEach((d: any) => nextSet.add(d.diffId));
              return nextSet;
            });
            addLog(
              `🔍 Page ${p}: Audited ${data.checkedCount} titles. Found ${data.diffs.length} discrepancies!`
            );
          } else {
            addLog(`✓ Page ${p}: Audited ${data.checkedCount} titles. 100% in sync with Cloud SQL!`);
          }

          if (!data.hasNextPage || p >= 200) {
            keepAuditing = false;
            addLog(`🏁 Catalog Audit complete for selected scope.`);
            break;
          }

          p++;
          setAuditPage(p);
        } else {
          addLog(`❌ Audit Page ${p} error: ${data.error}`);
          keepAuditing = false;
        }
      } catch (err: any) {
        addLog(`❌ Audit exception: ${err.message}`);
        keepAuditing = false;
      }

      // Safe throttle delay to honor AniList 90 req/min limit
      await new Promise((r) => setTimeout(r, 1200));
    }

    setAuditRunning(false);
  };

  const handleStopCatalogAudit = () => {
    stopAuditRef.current = true;
    setAuditRunning(false);
    addLog("⏸ Catalog Audit paused. You can review pending diffs or resume anytime.");
  };

  const handleToggleDiffSelection = (diffId: string) => {
    setSelectedDiffIds((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(diffId)) {
        nextSet.delete(diffId);
      } else {
        nextSet.add(diffId);
      }
      return nextSet;
    });
  };

  const handleSelectAllDiffs = (currentFiltered: any[]) => {
    setSelectedDiffIds(new Set(currentFiltered.map((d) => d.diffId)));
  };

  const handleDeselectAllDiffs = () => {
    setSelectedDiffIds(new Set());
  };

  const handleApplySelectedChanges = async () => {
    if (selectedDiffIds.size === 0 || applyingChanges) return;
    setApplyingChanges(true);

    const changesToApply = pendingDiffs
      .filter((d) => selectedDiffIds.has(d.diffId))
      .map((d) => ({
        anilistId: d.anilistId,
        field: d.field,
        value: d.newValue,
      }));

    try {
      const res = await fetch("/api/admin/catalog-audit/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedChanges: changesToApply }),
      });
      const data = await res.json();

      if (data.success) {
        setApplyResultBanner(
          `✅ Successfully applied ${data.result?.appliedCount} anime updates (${data.result?.count} field changes) to Google Cloud SQL!`
        );
        setPendingDiffs((prev) => prev.filter((d) => !selectedDiffIds.has(d.diffId)));
        setSelectedDiffIds(new Set());
        addLog(`🎉 Applied ${data.result?.appliedCount} audited changes into Cloud SQL.`);
        await fetchStats();
      } else {
        addLog(`❌ Failed to apply changes: ${data.error}`);
      }
    } catch (err: any) {
      addLog(`❌ Apply changes error: ${err.message}`);
    } finally {
      setApplyingChanges(false);
    }
  };

  const handleApplyAllDiffs = async () => {
    if (pendingDiffs.length === 0 || applyingChanges) return;
    setApplyingChanges(true);

    const changesToApply = pendingDiffs.map((d) => ({
      anilistId: d.anilistId,
      field: d.field,
      value: d.newValue,
    }));

    try {
      const res = await fetch("/api/admin/catalog-audit/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedChanges: changesToApply }),
      });
      const data = await res.json();

      if (data.success) {
        setApplyResultBanner(
          `✅ Successfully applied all ${data.result?.appliedCount} anime updates (${data.result?.count} field changes) to Google Cloud SQL!`
        );
        setPendingDiffs([]);
        setSelectedDiffIds(new Set());
        addLog(`🎉 Applied all ${data.result?.appliedCount} audited changes into Cloud SQL.`);
        await fetchStats();
      } else {
        addLog(`❌ Failed to apply changes: ${data.error}`);
      }
    } catch (err: any) {
      addLog(`❌ Apply changes error: ${err.message}`);
    } finally {
      setApplyingChanges(false);
    }
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  useEffect(() => {
    fetchStats();
    fetchSettings();
    fetchAiringSyncData();
    fetchSpotlightAnime();
    fetchExtendedStats();
  }, []);

  useEffect(() => {
    if (activeTab === "database") {
      fetchAnimeRecords(1);
    } else if (activeTab === "airing") {
      fetchAiringSyncData();
    } else if (activeTab === "extended") {
      fetchExtendedStats();
      if (selectedExtendedAnimeId) {
        loadExtendedAnimeData(selectedExtendedAnimeId);
      }
    }
  }, [activeTab, statusFilter]);

  // Execute single ingestion action
  const handleRunSync = async (action: "test" | "seasonal" | "top" | "upcoming", page = 1) => {
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

  // Filtered Diffs for Catalog Audit Table
  const filteredDiffs = pendingDiffs.filter((d) => {
    if (diffFilterType !== "ALL" && d.field !== diffFilterType) return false;
    if (diffSearchQuery.trim()) {
      const q = diffSearchQuery.toLowerCase();
      const matchTitle = (d.title || "").toLowerCase().includes(q);
      const matchEn = (d.titleEnglish || "").toLowerCase().includes(q);
      if (!matchTitle && !matchEn) return false;
    }
    return true;
  });

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

          {/* Controls: Data Source Toggle & Cloud SQL Heartbeat Badge */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            {/* Global Public Site Data Source Toggle */}
            <div className="p-1 rounded-xl bg-[#131722] border border-[#202738] flex items-center gap-1 shadow-sm">
              <span className="text-[11px] text-gray-400 font-medium px-2 hidden sm:inline">
                Site Data Source:
              </span>

              <button
                onClick={() => handleToggleDataSource("db")}
                disabled={updatingSource}
                title="Serve website directly from your Google Cloud SQL database (14,883 titles, ~5ms speed, zero rate limits)"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  dataSource === "db"
                    ? "bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-md shadow-emerald-900/30 ring-1 ring-emerald-400/40"
                    : "text-gray-400 hover:text-gray-200"
                } disabled:opacity-50`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Cloud SQL (14.8k)</span>
                {dataSource === "db" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse ml-0.5"></span>
                )}
              </button>

              <button
                onClick={() => handleToggleDataSource("anilist")}
                disabled={updatingSource}
                title="Serve website live through AniList GraphQL API proxy"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  dataSource === "anilist"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/30 ring-1 ring-blue-400/40"
                    : "text-gray-400 hover:text-gray-200"
                } disabled:opacity-50`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>AniList API</span>
                {dataSource === "anilist" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse ml-0.5"></span>
                )}
              </button>
            </div>

            {/* Database Live Heartbeat Badge */}
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
        <div className="flex flex-wrap items-center gap-1 border-b border-[#1c2130]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("airing")}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 relative ${
              activeTab === "airing"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Airing Scheduler & Sync</span>
            {airingSettings.autoSyncEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="30-Min Auto-Sync Running"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 relative ${
              activeTab === "audit"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <ListCheck className="w-4 h-4 text-purple-400" />
            <span>10,000+ Catalog Audit</span>
            {pendingDiffs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                {pendingDiffs.length} diffs
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("ingest")}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
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
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
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

          <button
            onClick={() => setActiveTab("extended")}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "extended"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Extended Media & Dubs</span>
            {(extendedStats.totalEpisodes > 0 || extendedStats.totalDubs > 0) && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px]">
                {extendedStats.totalEpisodes + extendedStats.totalDubs + extendedStats.totalThemes + extendedStats.totalReviews}
              </span>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            {/* Live Data Source Indicator Banner */}
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                dataSource === "db"
                  ? "bg-gradient-to-r from-emerald-950/30 via-[#131926] to-[#121622] border-emerald-500/30"
                  : "bg-gradient-to-r from-blue-950/30 via-[#131926] to-[#121622] border-blue-500/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    dataSource === "db" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {dataSource === "db" ? <Database className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Active Website Source:{" "}
                      <span className={dataSource === "db" ? "text-emerald-400" : "text-blue-400"}>
                        {dataSource === "db" ? "Google Cloud SQL (Database-First)" : "Live AniList GraphQL API"}
                      </span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dataSource === "db"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {dataSource === "db" ? "⚡ FAST (~5ms) • NO RATE LIMITS" : "🌐 LIVE PROXY"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {dataSource === "db"
                      ? "All public visitors on the Homepage, Browse, Search, and Detail pages are served directly from your 14,883 stored Cloud SQL records with zero rate limits."
                      : "The website is proxying requests live to AniList. If AniList throttles (HTTP 429), you can switch to Cloud SQL anytime."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleDataSource(dataSource === "db" ? "anilist" : "db")}
                  disabled={updatingSource}
                  className="px-3.5 py-1.5 rounded-xl bg-[#192030] hover:bg-[#222b40] text-xs font-semibold text-white border border-[#2b3650] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${updatingSource ? "animate-spin" : ""}`} />
                  <span>Switch to {dataSource === "db" ? "AniList API" : "Cloud SQL (Recommended)"}</span>
                </button>
              </div>
            </div>

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

                <button
                  onClick={() => handleRunSync("upcoming")}
                  disabled={ingestLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-purple-600/20"
                >
                  {ingestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Calendar className="w-3.5 h-3.5 text-white" />}
                  <span>Sync Upcoming (20)</span>
                </button>
              </div>
            </div>

            {/* NEW: Airing Sync & Catalog Audit Command Center */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Airing Schedule & Episode Countdown Hub */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121926] to-[#0f1420] border border-emerald-500/20 shadow-lg flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      <Clock className="w-3 h-3" />
                      <span>LIVE BROADCAST TRACKER</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400 font-mono">
                        {airingSettings.autoSyncEnabled ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Next check: {formatCountdown(nextSyncSeconds)}
                          </span>
                        ) : (
                          <span className="text-gray-500">Auto-sync paused</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Airing Schedule & Countdown Sync</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Monitors ~230 releasing anime. Automatically updates episode numbers (e.g. Ep 2 ➔ Ep 3), countdown timestamps, and status changes.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1e273a]">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTriggerAiringSync}
                      disabled={airingLoading}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {airingLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-white" />
                      )}
                      <span>Sync Airing Now</span>
                    </button>

                    <button
                      onClick={handleToggleAiringAutoSync}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        airingSettings.autoSyncEnabled
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                      }`}
                    >
                      <span>Auto-Sync (30m): {airingSettings.autoSyncEnabled ? "ON" : "OFF"}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveTab("airing")}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <span>View Logs ({airingHistory.length}) →</span>
                  </button>
                </div>
              </div>

              {/* Card 2: 10,000+ Catalog Audit Hub */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161324] to-[#100f1c] border border-purple-500/20 shadow-lg flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
                      <ListCheck className="w-3 h-3" />
                      <span>CATALOG DIFF AUDITOR</span>
                    </div>

                    {pendingDiffs.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30 animate-pulse">
                        {pendingDiffs.length} Changes Pending
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>10,000+ Aired Anime Catalog Audit</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Scan your 14,883 anime library against AniList in real time. Review score shifts, finalized episode counts, and trailers with selective approvals.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#261f38]">
                  <button
                    onClick={() => setActiveTab("audit")}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/30 flex items-center gap-1.5"
                  >
                    <ListCheck className="w-3.5 h-3.5 text-white" />
                    <span>Launch 10k+ Catalog Audit</span>
                  </button>

                  <span className="text-xs text-purple-300 font-mono">
                    {auditedTotalCount > 0 ? `${auditedTotalCount.toLocaleString()} audited` : "14,883 anime ready"}
                  </span>
                </div>
              </div>
            </div>

            {/* Homepage Hero Spotlight Carousel Manager Hub */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#181524] via-[#121622] to-[#0f121a] border border-amber-500/25 shadow-xl flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold mb-1.5">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                    <span>HOMEPAGE HERO SPOTLIGHT MANAGER</span>
                  </div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Curated Hero Spotlight Carousel ({spotlightList.length} Pinned)</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Admin-curated anime slide priority at the top of your homepage hero banner. Pinned titles appear first in sequence; remaining slots dynamically fill with high-res trending trailers.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setStatusFilter("SPOTLIGHT");
                      setActiveTab("database");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Filter Spotlight in DB</span>
                  </button>

                  <button
                    onClick={() => {
                      setStatusFilter("ALL");
                      setActiveTab("database");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Pin More Anime</span>
                  </button>
                </div>
              </div>

              {/* Spotlight Carousel Items Grid / Carousel */}
              {spotlightList.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#0e111a] border border-[#1e2436] flex flex-col items-center justify-center text-center gap-2">
                  <Star className="w-8 h-8 text-amber-500/30" />
                  <span className="text-xs font-semibold text-gray-300">
                    No custom anime pinned to the Hero Spotlight Carousel yet
                  </span>
                  <span className="text-[11px] text-gray-500 max-w-md">
                    The homepage is currently auto-selecting top trending titles with banners and trailers. Click &quot;Edit&quot; on any anime in Database Explorer to pin it here with custom slide priority!
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {spotlightList.map((anime, idx) => (
                    <div
                      key={anime.anilist_id}
                      className="p-3 rounded-2xl bg-[#0f131d] border border-amber-500/20 hover:border-amber-500/50 transition-all flex flex-col justify-between group relative overflow-hidden"
                    >
                      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-gray-900 mb-2.5">
                        {anime.banner_image_url || anime.cover_image_url ? (
                          <Image
                            src={anime.banner_image_url || anime.cover_image_url || ""}
                            alt={anime.title_romaji}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
                            No Banner
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-400/30 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                          <span>Slide #{anime.featured_order || idx + 1}</span>
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] text-gray-500 font-mono">#{anime.anilist_id}</span>
                        <h4 className="text-xs font-bold text-white truncate" title={anime.title_romaji}>
                          {anime.title_english || anime.title_romaji}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: anime.accent_color || "#3b82f6" }}
                          />
                          <span className="truncate">{anime.format || "TV"} • ★ {anime.score || "—"}</span>
                          {anime.youtube_trailer_id && (
                            <span className="text-rose-400 font-semibold shrink-0">Trailer ✓</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 mt-2 border-t border-[#1d2435] flex items-center justify-between gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(anime)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 text-[11px] font-semibold transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleQuickSpotlightToggle(anime, false)}
                          className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-semibold transition-colors"
                          title="Remove from Homepage Spotlight"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
        {/* TAB: AIRING SCHEDULE & EPISODE COUNTDOWN SYNC */}
        {/* ========================================================================= */}
        {activeTab === "airing" && (
          <div className="flex flex-col gap-6">
            {/* Airing Sync Header & Master Control */}
            <div className="p-6 rounded-3xl bg-[#121622] border border-[#1f2638] flex flex-col gap-5 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold mb-1.5">
                    <Clock className="w-3 h-3" />
                    <span>REAL-TIME BROADCAST ENGINE</span>
                  </div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>Airing Schedule & Episode Countdown Synchronization</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5 max-w-3xl">
                    Continuously synchronizes the ~230 currently airing anime with live Japanese TV schedules. Updates next episode numbers, air dates, countdown timers, scores, and marks completed shows as FINISHED.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleToggleAiringAutoSync}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                      airingSettings.autoSyncEnabled
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25 shadow-md shadow-emerald-950/40"
                        : "bg-[#181d2a] text-gray-400 border-[#252e42] hover:text-white"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${airingSettings.autoSyncEnabled ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
                    <span>30-Min Auto-Sync: {airingSettings.autoSyncEnabled ? "ACTIVE" : "PAUSED"}</span>
                  </button>

                  <button
                    onClick={handleTriggerAiringSync}
                    disabled={airingLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 disabled:opacity-50"
                  >
                    {airingLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Zap className="w-4 h-4 text-white" />
                    )}
                    <span>⚡ Sync Airing Schedules Now</span>
                  </button>
                </div>
              </div>

              {/* Airing Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-2 border-t border-[#1c2232]">
                <div className="p-4 rounded-xl bg-[#0e111a] border border-[#1b2233]">
                  <span className="text-[11px] text-gray-400 font-mono">TRACKED RELEASING TITLES</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {stats.airingCount} <span className="text-xs font-normal text-gray-500">in Cloud SQL</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0e111a] border border-[#1b2233]">
                  <span className="text-[11px] text-gray-400 font-mono">AUTOMATED BACKGROUND CRON</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-2">
                    <span>Every 30 Min</span>
                    {airingSettings.autoSyncEnabled && (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Running</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0e111a] border border-[#1b2233]">
                  <span className="text-[11px] text-gray-400 font-mono">NEXT AUTO-CHECK TICKER</span>
                  <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
                    {airingSettings.autoSyncEnabled ? formatCountdown(nextSyncSeconds) : "--:--"}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0e111a] border border-[#1b2233]">
                  <span className="text-[11px] text-gray-400 font-mono">LAST AIRING SYNC RUN</span>
                  <div className="text-sm font-bold text-gray-200 mt-2 truncate">
                    {airingSettings.lastSyncAt ? new Date(airingSettings.lastSyncAt).toLocaleTimeString() : "Pending"}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Sync Output Alert Banner (if sync just ran) */}
            {airingSummary && (
              <div
                className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all ${
                  airingSummary.status === "UPDATED"
                    ? "bg-emerald-950/30 border-emerald-500/40"
                    : "bg-blue-950/30 border-blue-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`p-2 rounded-xl ${
                        airingSummary.status === "UPDATED" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {airingSummary.status === "UPDATED" ? <CheckCircle2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {airingSummary.status === "UPDATED"
                          ? `Successfully synchronized ${airingSummary.changedCount} airing shows!`
                          : `Checked ${airingSummary.checkedCount} airing shows — No changes detected`}
                      </h4>
                      <p className="text-xs text-gray-400">
                        {airingSummary.status === "UPDATED"
                          ? `Applied episode increments and schedule updates to PostgreSQL in ${airingSummary.executionTimeMs}ms.`
                          : `All ${airingSummary.checkedCount} airing titles are fully up to date with broadcast schedules. Zero database writes needed (${airingSummary.executionTimeMs}ms).`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setAiringSummary(null)}
                    className="text-xs text-gray-500 hover:text-gray-300"
                  >
                    Dismiss
                  </button>
                </div>

                {airingSummary.changes && airingSummary.changes.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-[#1e273a]">
                    {airingSummary.changes.slice(0, 6).map((c: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-lg bg-[#0e111a] border border-[#1b2233] flex items-center justify-between text-xs">
                        <span className="font-semibold text-white truncate max-w-[140px]" title={c.title}>
                          {c.title}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-mono">
                          {c.formattedOld} ➔ {c.formattedNew}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Airing Sync History & Detailed Log Trail */}
            <div className="rounded-3xl bg-[#121622] border border-[#1f2638] overflow-hidden shadow-xl">
              <div className="px-6 py-4 bg-[#141926] border-b border-[#1f2638] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    <span>Airing Synchronization Audit Trail & History</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Persistent log of every manual and automated 30-minute sync execution, including zero-change confirmations.
                  </p>
                </div>

                <button
                  onClick={fetchAiringSyncData}
                  className="px-3 py-1.5 rounded-xl bg-[#181d2a] hover:bg-[#20273a] text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh History</span>
                </button>
              </div>

              {airingHistory.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-300">No Airing Sync Logs Recorded Yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click &quot;Sync Airing Schedules Now&quot; above to run your first broadcast schedule synchronization!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#1a2030]">
                  {airingHistory.map((item: any) => {
                    const isExpanded = expandedLogId === item.id;
                    const details = item.details || {};
                    const changesList = details.changes || [];

                    return (
                      <div key={item.id} className="p-4 sm:p-5 hover:bg-[#141824] transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center gap-3">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase shrink-0 ${
                                item.status === "UPDATED"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : item.status === "NO_CHANGE"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {item.status === "UPDATED" ? "🔄 UPDATED" : item.status === "NO_CHANGE" ? "✅ NO CHANGE" : "FAILED"}
                            </span>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs sm:text-sm font-bold text-white">
                                  {item.status === "UPDATED"
                                    ? `Synchronized ${item.countProcessed} Airing Titles`
                                    : `Checked ${details.checkedCount || item.countProcessed} Titles — Up To Date`}
                                </h4>
                                <span className="text-[10px] px-2 py-0.2 rounded bg-gray-800 text-gray-400 font-mono">
                                  {details.trigger === "auto_cron" ? "30-Min Cron" : "1-Click Manual"}
                                </span>
                              </div>

                              <p className="text-xs text-gray-400 mt-0.5">
                                {details.message ||
                                  (item.status === "UPDATED"
                                    ? `Updated ${item.countProcessed} anime rows in database.`
                                    : `No changes detected. All countdowns are current.`)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                            <div className="text-right text-[11px] font-mono text-gray-400">
                              <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                              <div className="text-gray-500">{new Date(item.createdAt).toLocaleTimeString()}</div>
                            </div>

                            {changesList.length > 0 && (
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : item.id)}
                                className="px-3 py-1.5 rounded-lg bg-[#1a2130] hover:bg-[#232c40] text-xs font-semibold text-gray-300 flex items-center gap-1 transition-colors"
                              >
                                <span>{isExpanded ? "Hide Diffs" : `View ${changesList.length} Diffs`}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable Diffs List */}
                        {isExpanded && changesList.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-[#1c2234] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {changesList.map((ch: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-[#0c0f17] border border-[#1b2234] flex items-center gap-3"
                              >
                                {ch.cover_image_url ? (
                                  <div className="relative w-8 h-10 rounded overflow-hidden shrink-0 bg-gray-900">
                                    <Image src={ch.cover_image_url} alt="" fill className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-10 rounded bg-gray-800 shrink-0 flex items-center justify-center text-[8px] text-gray-500">
                                    N/A
                                  </div>
                                )}
                                <div className="overflow-hidden flex-1">
                                  <span className="text-[10px] text-gray-500 font-mono">#{ch.anilist_id} • {ch.label}</span>
                                  <h5 className="text-xs font-bold text-white truncate" title={ch.title}>
                                    {ch.title}
                                  </h5>
                                  <div className="flex items-center gap-1.5 text-[10px] font-mono mt-0.5">
                                    <span className="text-rose-400 line-through truncate max-w-[80px]">{ch.formattedOld}</span>
                                    <ArrowRight className="w-2.5 h-2.5 text-gray-500 shrink-0" />
                                    <span className="text-emerald-400 font-bold truncate max-w-[90px]">{ch.formattedNew}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: 10,000+ CATALOG AUDIT & DIFF REVIEW */}
        {/* ========================================================================= */}
        {activeTab === "audit" && (
          <div className="flex flex-col gap-6">
            {/* Header & Controller */}
            <div className="p-6 rounded-3xl bg-[#121622] border border-[#1f2638] flex flex-col gap-5 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold mb-1.5">
                    <ListCheck className="w-3 h-3" />
                    <span>10,000+ CATALOG AUDITOR & CONFIRMATION ENGINE</span>
                  </div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>Catalog Diff & Approval Control Center</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5 max-w-3xl">
                    Cross-checks your 14,883 anime database against AniList. Inspect score updates, finalized episode counts, status changes, and new trailers with selective checkboxes before writing to Cloud SQL.
                  </p>
                </div>

                {/* Audit Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {auditRunning ? (
                    <button
                      onClick={handleStopCatalogAudit}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-amber-900/30"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pause Audit</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStartCatalogAudit}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-900/30 flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>🚀 Launch Catalog Audit</span>
                    </button>
                  )}

                  {pendingDiffs.length > 0 && (
                    <button
                      onClick={() => {
                        setPendingDiffs([]);
                        setSelectedDiffIds(new Set());
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-[#1a1f2c] hover:bg-[#222838] text-gray-400 hover:text-white text-xs font-semibold border border-[#273044] transition-colors"
                    >
                      Clear Queue
                    </button>
                  )}
                </div>
              </div>

              {/* Scope Selector & Target Year */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 border-t border-[#1c2232]">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-gray-400 font-semibold uppercase">Audit Scope:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => !auditRunning && setAuditScope("popular")}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        auditScope === "popular"
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                          : "bg-[#0e111a] text-gray-400 border-[#1f2638] hover:text-white"
                      }`}
                    >
                      Top 1,000 Popular
                    </button>
                    <button
                      onClick={() => !auditRunning && setAuditScope("recent")}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        auditScope === "recent"
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                          : "bg-[#0e111a] text-gray-400 border-[#1f2638] hover:text-white"
                      }`}
                    >
                      By Release Year
                    </button>
                    <button
                      onClick={() => !auditRunning && setAuditScope("all")}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        auditScope === "all"
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                          : "bg-[#0e111a] text-gray-400 border-[#1f2638] hover:text-white"
                      }`}
                    >
                      Full 10,000+ Deep
                    </button>
                  </div>
                </div>

                {auditScope === "recent" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-gray-400 font-semibold uppercase">Release Year:</label>
                    <select
                      value={auditYear}
                      disabled={auditRunning}
                      onChange={(e) => setAuditYear(Number(e.target.value))}
                      className="px-3 py-2 rounded-xl bg-[#0e111a] border border-[#1f2638] text-xs text-white font-medium focus:outline-none"
                    >
                      {Array.from({ length: 47 }, (_, i) => 2026 - i).map((y) => (
                        <option key={y} value={y}>
                          Year {y} Releases
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-gray-400 font-semibold uppercase">Audit Status:</label>
                  <div className="p-2 rounded-xl bg-[#0e111a] border border-[#1f2638] flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Audited: <strong className="text-white font-mono">{auditedTotalCount.toLocaleString()}</strong> titles
                    </span>
                    <span className="text-purple-400 font-bold font-mono">
                      {pendingDiffs.length} diffs detected
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar when Audit is Active */}
              {auditRunning && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1.5 text-purple-300">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Scanning Page {auditPage} (Throttled at 1.2s to comply with AniList 90 req/min rule)...
                    </span>
                    <span className="font-mono text-white font-bold">
                      {auditedTotalCount.toLocaleString()} scanned
                    </span>
                  </div>
                  <div className="w-full bg-[#161c29] rounded-full h-2.5 overflow-hidden p-0.5 border border-[#232c40]">
                    <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 h-1.5 rounded-full animate-pulse w-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Apply Result Banner */}
            {applyResultBanner && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{applyResultBanner}</span>
                </span>
                <button
                  onClick={() => setApplyResultBanner(null)}
                  className="text-xs text-emerald-400 hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Interactive Diff Review & Approval Table */}
            <div className="rounded-3xl bg-[#121622] border border-[#1f2638] overflow-hidden shadow-xl flex flex-col">
              {/* Table Toolbar */}
              <div className="p-5 bg-[#141926] border-b border-[#1f2638] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Search & Type Filter */}
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  <div className="relative min-w-[200px] flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search diffs by anime title..."
                      value={diffSearchQuery}
                      onChange={(e) => setDiffSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0e111a] border border-[#21293c] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto text-xs">
                    {["ALL", "score", "episodes_count", "status", "youtube_trailer_id", "popularity"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setDiffFilterType(f)}
                        className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                          diffFilterType === f
                            ? "bg-purple-600 text-white"
                            : "bg-[#0e111a] text-gray-400 hover:text-white border border-[#202738]"
                        }`}
                      >
                        {f === "ALL"
                          ? `All Diffs (${pendingDiffs.length})`
                          : f === "score"
                          ? "⭐ Ratings"
                          : f === "episodes_count"
                          ? "📺 Episodes"
                          : f === "status"
                          ? "🏷️ Status"
                          : f === "youtube_trailer_id"
                          ? "🎬 Trailers"
                          : "🔥 Popularity"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Master Checkboxes & Apply Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSelectAllDiffs(filteredDiffs)}
                    className="px-3 py-1.5 rounded-xl bg-[#181d2a] hover:bg-[#20273a] text-xs font-semibold text-gray-300 flex items-center gap-1.5 border border-[#273044]"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Select All ({filteredDiffs.length})</span>
                  </button>

                  <button
                    onClick={handleDeselectAllDiffs}
                    className="px-3 py-1.5 rounded-xl bg-[#181d2a] hover:bg-[#20273a] text-xs font-semibold text-gray-400 hover:text-white border border-[#273044]"
                  >
                    Deselect All
                  </button>

                  <button
                    onClick={handleApplySelectedChanges}
                    disabled={selectedDiffIds.size === 0 || applyingChanges}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {applyingChanges ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCheck className="w-3.5 h-3.5" />
                    )}
                    <span>Approve & Apply ({selectedDiffIds.size})</span>
                  </button>

                  <button
                    onClick={handleApplyAllDiffs}
                    disabled={pendingDiffs.length === 0 || applyingChanges}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/30 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>Apply All ({pendingDiffs.length})</span>
                  </button>
                </div>
              </div>

              {/* Diff Table Content */}
              {filteredDiffs.length === 0 ? (
                <div className="p-16 text-center text-gray-500">
                  <ListCheck className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-gray-300">
                    {pendingDiffs.length === 0 ? "No Pending Diffs Found" : "No Diffs Match Your Filters"}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                    {pendingDiffs.length === 0
                      ? "All titles in the audited range are 100% in sync with AniList! Click 'Launch Catalog Audit' to scan additional pages."
                      : "Try switching filters or clearing your search query."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#10131d] text-gray-400 uppercase text-[10px] tracking-wider border-b border-[#1c2232]">
                      <tr>
                        <th className="px-4 py-3 w-10">Select</th>
                        <th className="px-4 py-3">Anime Title</th>
                        <th className="px-4 py-3">Attribute</th>
                        <th className="px-4 py-3">Current in Cloud SQL</th>
                        <th className="px-4 py-3">AniList Live Value</th>
                        <th className="px-4 py-3">Impact</th>
                        <th className="px-4 py-3 text-right">Confirm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#181f2f] text-gray-300">
                      {filteredDiffs.map((diff: any) => {
                        const isSelected = selectedDiffIds.has(diff.diffId);

                        return (
                          <tr
                            key={diff.diffId}
                            className={`transition-colors ${isSelected ? "bg-purple-950/15 hover:bg-purple-950/25" : "hover:bg-[#141824]"}`}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleDiffSelection(diff.diffId)}
                                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-700 bg-gray-900 cursor-pointer"
                              />
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {diff.coverImageUrl ? (
                                  <div className="relative w-8 h-11 rounded overflow-hidden shrink-0 bg-gray-900">
                                    <Image src={diff.coverImageUrl} alt="" fill className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-11 rounded bg-gray-800 shrink-0 flex items-center justify-center text-[8px] text-gray-500">
                                    N/A
                                  </div>
                                )}
                                <div>
                                  <div className="text-[10px] text-gray-500 font-mono">
                                    #{diff.anilistId} • {diff.format || "TV"} {diff.seasonYear ? `(${diff.seasonYear})` : ""}
                                  </div>
                                  <h5 className="font-bold text-white truncate max-w-xs" title={diff.title}>
                                    {diff.title}
                                  </h5>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-semibold text-[11px] border border-gray-700">
                                {diff.label}
                              </span>
                            </td>

                            <td className="px-4 py-3 font-mono">
                              <span className="px-2 py-1 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40 text-[11px]">
                                {diff.formattedOld}
                              </span>
                            </td>

                            <td className="px-4 py-3 font-mono">
                              <span className="px-2 py-1 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 text-[11px] font-bold">
                                {diff.formattedNew}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  diff.impact === "HIGH"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : diff.impact === "MEDIUM"
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                }`}
                              >
                                {diff.impact}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleToggleDiffSelection(diff.diffId)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  isSelected
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-800 text-gray-400 hover:text-white"
                                }`}
                              >
                                {isSelected ? "Approved ✓" : "Review"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
                  <option value="SPOTLIGHT">⭐ Spotlight Featured</option>
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
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-white truncate max-w-xs" title={anime.title_romaji}>
                                    {anime.title_english || anime.title_romaji}
                                  </span>
                                  {anime.is_featured && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold shrink-0">
                                      ⭐ #{anime.featured_order || 0}
                                    </span>
                                  )}
                                </div>
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
                            <div className="flex items-center justify-end gap-1.5">
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
                              <button
                                onClick={() => handleOpenEdit(anime)}
                                className="px-2.5 py-1 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveTab("extended");
                                  setExtendedSearchId(anime.anilist_id.toString());
                                  loadExtendedAnimeData(anime.anilist_id);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-pink-600/15 hover:bg-pink-600/25 text-pink-300 border border-pink-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                                title="Manage & View Extended Media (Episodes, Themes, Dubs, Reviews)"
                              >
                                <Sparkles className="w-3 h-3 text-pink-400" />
                                <span>Extras</span>
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
        {/* TAB 6: EXTENDED MEDIA & DUBS SUITE */}
        {/* ========================================================================= */}
        {activeTab === "extended" && (
          <div className="flex flex-col gap-6">
            {/* Header Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#121622] border border-purple-500/20 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                    Standalone Extensible Engine
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-wider border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Zero Duplicates Guaranteed
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold tracking-wider border border-blue-500/20 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Rate-Limit Pacing
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  Extended Media, Dubs & Community Suite
                </h2>
                <p className="text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
                  Dedicated, decoupled synchronization for episode guides, opening/ending OSTs, multilingual dub voice actors, and in-depth community reviews. Completely modular and independent from core catalog sync.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchExtendedStats}
                  className="px-4 py-2.5 rounded-xl bg-[#1b2234] hover:bg-[#232c44] text-gray-200 border border-gray-700/50 text-xs font-semibold flex items-center gap-2 transition-all hover:border-purple-500/40 shadow-lg"
                >
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                  <span>Refresh Counts</span>
                </button>
              </div>
            </div>

            {/* 4 Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Episodes Card */}
              <div className="p-5 rounded-2xl bg-[#121622] border border-[#232c42] hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Episode Guides
                  </span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                    <Film className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-black text-white tracking-tight">
                    {extendedStats.totalEpisodes.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Titles, Synopses, Stills & Filler Flags
                  </div>
                </div>
              </div>

              {/* Themes Card */}
              <div className="p-5 rounded-2xl bg-[#121622] border border-[#232c42] hover:border-indigo-500/40 transition-all flex flex-col justify-between group shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Theme Songs (OSTs)
                  </span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                    <Music className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-black text-white tracking-tight">
                    {extendedStats.totalThemes.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    OP & ED Tracks with Artist Credits
                  </div>
                </div>
              </div>

              {/* Dub Casts Card */}
              <div className="p-5 rounded-2xl bg-[#121622] border border-[#232c42] hover:border-pink-500/40 transition-all flex flex-col justify-between group shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Multilingual Dub Casts
                  </span>
                  <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 group-hover:bg-pink-500/20 transition-colors">
                    <Mic className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-black text-white tracking-tight">
                    {extendedStats.totalDubs.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    English, Spanish, French, German & More
                  </div>
                </div>
              </div>

              {/* Reviews Card */}
              <div className="p-5 rounded-2xl bg-[#121622] border border-[#232c42] hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Community Reviews
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-black text-white tracking-tight">
                    {extendedStats.totalReviews.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Verified User Essays & Critic Scores
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Banner */}
            {extendedResultBanner && (
              <div
                className={`p-4 rounded-2xl border text-sm font-medium flex items-center justify-between gap-3 ${
                  extendedResultBanner.startsWith("✅") || extendedResultBanner.startsWith("🎉")
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-950/40 border-rose-500/30 text-rose-300"
                }`}
              >
                <span>{extendedResultBanner}</span>
                <button
                  onClick={() => setExtendedResultBanner(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Control Panels: Single Sync vs Batch Sync */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PANEL 1: Single Anime Targeted Ingestion */}
              <div className="p-6 rounded-3xl bg-[#121622] border border-[#232c42] flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                        <Zap className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-white text-base">Targeted Single Anime Sync</h3>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Real-Time
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    Enter any AniList ID to fetch all episode guides, theme songs, multilingual dub voice actors, and community reviews in a single atomic operation.
                  </p>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="number"
                      value={extendedSearchId}
                      onChange={(e) => setExtendedSearchId(e.target.value)}
                      placeholder="e.g. 16498 (Attack on Titan)"
                      className="flex-1 bg-[#181e2c] border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <button
                      onClick={() => handleSyncSingleExtended()}
                      disabled={extendedSyncLoading || !extendedSearchId}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20"
                    >
                      {extendedSyncLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      <span>Sync & Upsert</span>
                    </button>
                    <button
                      onClick={() => {
                        const id = parseInt(extendedSearchId, 10);
                        if (id) loadExtendedAnimeData(id);
                      }}
                      disabled={loadingExtendedDetail || !extendedSearchId}
                      className="px-4 py-2.5 rounded-xl bg-[#1b2234] hover:bg-[#232c44] text-gray-300 border border-gray-700/60 font-semibold text-xs transition-colors"
                      title="Load cached DB data"
                    >
                      {loadingExtendedDetail ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Preset Fast Chips */}
                  <div className="mt-3">
                    <span className="text-[11px] text-gray-400 font-medium block mb-2">
                      Quick Select Popular Titles:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: "Attack on Titan", id: 16498 },
                        { name: "Frieren", id: 154587 },
                        { name: "Demon Slayer", id: 101922 },
                        { name: "Jujutsu Kaisen", id: 113415 },
                        { name: "Solo Leveling", id: 151807 },
                        { name: "One Piece", id: 21 },
                        { name: "Chainsaw Man", id: 127230 },
                        { name: "Death Note", id: 1535 },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => {
                            setExtendedSearchId(preset.id.toString());
                            loadExtendedAnimeData(preset.id);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                            selectedExtendedAnimeId === preset.id
                              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                              : "bg-[#181e2c] hover:bg-[#222a3d] text-gray-400 hover:text-gray-200 border border-[#252f44]"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* PANEL 2: Batch Extended Ingestion Engine */}
              <div className="p-6 rounded-3xl bg-[#121622] border border-[#232c42] flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-white text-base">Batch Catalog Enrichment</h3>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Sequential Safe
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    Sequentially iterate through your existing Cloud SQL catalog and enrich each anime with episode guides, theme songs, dub casts, and reviews.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">
                        Target Selection
                      </label>
                      <select
                        value={extendedBatchType}
                        onChange={(e) => setExtendedBatchType(e.target.value as any)}
                        className="w-full bg-[#181e2c] border border-gray-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="popular">Top Popular Anime</option>
                        <option value="airing">Currently Airing Anime</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">
                        Batch Quantity
                      </label>
                      <select
                        value={extendedBatchCount}
                        onChange={(e) => setExtendedBatchCount(Number(e.target.value))}
                        className="w-full bg-[#181e2c] border border-gray-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value={5}>5 Anime</option>
                        <option value={10}>10 Anime</option>
                        <option value={25}>25 Anime</option>
                        <option value={50}>50 Anime</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Throttled at 800ms per anime to prevent API rate limiting and connection pooling exhaustion.</span>
                  </div>
                </div>

                <button
                  onClick={handleBatchExtendedSync}
                  disabled={extendedSyncLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                >
                  {extendedSyncLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ingesting Batch in Background...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Launch Batch Extended Ingestion ({extendedBatchCount} Anime)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Interactive Data Browser */}
            <div className="p-6 rounded-3xl bg-[#121622] border border-[#232c42] shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#232c42]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <span>Anime #{selectedExtendedAnimeId || "—"}</span>
                      {selectedExtendedAnimeId && (
                        <Link
                          href={`/anime/${selectedExtendedAnimeId}`}
                          target="_blank"
                          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-normal underline"
                        >
                          View Public Page <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Explore currently stored episodes, opening/closing themes, multilingual dubs, and user reviews.
                    </p>
                  </div>
                </div>

                {/* Sub Tab Navigation */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#181e2c] border border-gray-700/50">
                  <button
                    onClick={() => setExtendedSubTab("episodes")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      extendedSubTab === "episodes"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Episodes</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                      {selectedExtendedData?.episodes.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => setExtendedSubTab("themes")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      extendedSubTab === "themes"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Themes (OST)</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                      {selectedExtendedData?.themes.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => setExtendedSubTab("dubs")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      extendedSubTab === "dubs"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Dub Cast</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                      {selectedExtendedData?.dubs.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => setExtendedSubTab("reviews")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      extendedSubTab === "reviews"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Reviews</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                      {selectedExtendedData?.reviews.length || 0}
                    </span>
                  </button>
                </div>
              </div>

              {/* Data Content Body */}
              <div className="pt-5">
                {loadingExtendedDetail ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    <span className="text-sm text-gray-400">Loading stored extras from Cloud SQL...</span>
                  </div>
                ) : !selectedExtendedData || (
                    selectedExtendedData.episodes.length === 0 &&
                    selectedExtendedData.themes.length === 0 &&
                    selectedExtendedData.dubs.length === 0 &&
                    selectedExtendedData.reviews.length === 0
                  ) ? (
                  <div className="py-16 text-center flex flex-col items-center justify-center">
                    <Sparkles className="w-12 h-12 text-gray-600 mb-3" />
                    <h4 className="text-base font-bold text-gray-300">No Extended Records Found</h4>
                    <p className="text-xs text-gray-500 max-w-md mt-1 mb-4">
                      Anime #{selectedExtendedAnimeId} has not been synced with extended data yet. Click below to fetch all episodes, OSTs, dubs, and reviews.
                    </p>
                    <button
                      onClick={() => handleSyncSingleExtended(selectedExtendedAnimeId || undefined)}
                      disabled={extendedSyncLoading}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Sync Extras for Anime #{selectedExtendedAnimeId}</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* SUBTAB 1: EPISODES */}
                    {extendedSubTab === "episodes" && (
                      <div>
                        {selectedExtendedData.episodes.length === 0 ? (
                          <div className="text-center py-12 text-gray-500 text-xs">
                            No episode synopsis entries stored for this anime.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedExtendedData.episodes.map((ep) => (
                              <div
                                key={ep.id}
                                className="rounded-2xl bg-[#181e2c] border border-[#252f44] overflow-hidden flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-md group"
                              >
                                <div>
                                  {/* Thumbnail */}
                                  <div className="relative aspect-video w-full bg-gray-900 overflow-hidden">
                                    {ep.thumbnail_url ? (
                                      <Image
                                        src={ep.thumbnail_url}
                                        alt={ep.title || `Episode ${ep.episode_number}`}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                                        <Film className="w-8 h-8" />
                                      </div>
                                    )}
                                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                                      Episode {ep.episode_number}
                                    </div>
                                    {ep.is_filler && (
                                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-500/80 backdrop-blur-md text-[10px] font-bold text-black">
                                        Filler
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-4">
                                    <h4 className="text-sm font-bold text-white line-clamp-1 mb-1">
                                      {ep.title || `Episode ${ep.episode_number}`}
                                    </h4>
                                    {ep.air_date && (
                                      <div className="text-[11px] text-gray-400 mb-2 flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-purple-400" />
                                        <span>{new Date(ep.air_date).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                    {ep.synopsis && (
                                      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                                        {ep.synopsis}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="p-3 bg-[#131722] border-t border-[#252f44] flex items-center justify-between">
                                  {ep.site_url ? (
                                    <a
                                      href={ep.site_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                                    >
                                      <span>Stream Source</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <span className="text-[11px] text-gray-600">No site link</span>
                                  )}
                                  <button
                                    onClick={() => handleDeleteExtendedItem("episode", ep.id)}
                                    className="p-1 rounded text-gray-500 hover:text-rose-400 transition-colors"
                                    title="Delete episode record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 2: THEMES (OSTs) */}
                    {extendedSubTab === "themes" && (
                      <div>
                        {selectedExtendedData.themes.length === 0 ? (
                          <div className="text-center py-12 text-gray-500 text-xs">
                            No theme songs (OP/ED) recorded for this anime yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedExtendedData.themes.map((th) => (
                              <div
                                key={th.id}
                                className="p-4 rounded-2xl bg-[#181e2c] border border-[#252f44] flex items-center justify-between gap-4 hover:border-indigo-500/40 transition-all shadow-md group"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`px-2.5 py-1.5 rounded-xl font-black text-xs shrink-0 ${
                                      th.type === "OPENING"
                                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                    }`}
                                  >
                                    {th.type === "OPENING" ? "OP" : "ED"} {th.sequence_number}
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                                      {th.title}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                      by <span className="text-gray-300 font-medium">{th.artist || "Unknown Artist"}</span>
                                    </div>
                                    {th.episodes && (
                                      <div className="text-[10px] text-gray-500 mt-1">
                                        Episodes: {th.episodes}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDeleteExtendedItem("theme", th.id)}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                                  title="Delete theme track"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 3: MULTILINGUAL DUB CAST */}
                    {extendedSubTab === "dubs" && (
                      <div>
                        {selectedExtendedData.dubs.length === 0 ? (
                          <div className="text-center py-12 text-gray-500 text-xs">
                            No non-Japanese dub voice actors recorded for this anime yet.
                          </div>
                        ) : (
                          <div>
                            {/* Language Filter Pills */}
                            {(() => {
                              const languages = Array.from(
                                new Set(selectedExtendedData.dubs.map((d) => d.language).filter(Boolean))
                              );
                              const filteredDubs =
                                dubLanguageFilter === "ALL"
                                  ? selectedExtendedData.dubs
                                  : selectedExtendedData.dubs.filter((d) => d.language === dubLanguageFilter);

                              return (
                                <div>
                                  <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                                    <span className="text-xs text-gray-400 font-semibold shrink-0">
                                      Filter Language:
                                    </span>
                                    <button
                                      onClick={() => setDubLanguageFilter("ALL")}
                                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        dubLanguageFilter === "ALL"
                                          ? "bg-pink-600 text-white"
                                          : "bg-[#181e2c] text-gray-400 hover:text-gray-200"
                                      }`}
                                    >
                                      All ({selectedExtendedData.dubs.length})
                                    </button>
                                    {languages.map((lang) => (
                                      <button
                                        key={lang}
                                        onClick={() => setDubLanguageFilter(lang)}
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                          dubLanguageFilter === lang
                                            ? "bg-pink-600 text-white"
                                            : "bg-[#181e2c] text-gray-400 hover:text-gray-200"
                                        }`}
                                      >
                                        {lang} ({selectedExtendedData.dubs.filter((d) => d.language === lang).length})
                                      </button>
                                    ))}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredDubs.map((dub) => (
                                      <div
                                        key={dub.id}
                                        className="p-3.5 rounded-2xl bg-[#181e2c] border border-[#252f44] flex items-center justify-between gap-3 hover:border-pink-500/40 transition-all shadow-md"
                                      >
                                        <div className="flex items-center gap-3">
                                          {/* Character Avatar */}
                                          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-gray-800 shrink-0 border border-white/10">
                                            {dub.character_image ? (
                                              <Image
                                                src={dub.character_image}
                                                alt={dub.character_name}
                                                fill
                                                className="object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px]">
                                                Char
                                              </div>
                                            )}
                                          </div>

                                          <div className="min-w-0">
                                            <div className="text-xs font-bold text-white truncate">
                                              {dub.character_name}
                                            </div>
                                            <div className="text-[11px] text-pink-300 font-medium truncate flex items-center gap-1 mt-0.5">
                                              <Mic className="w-3 h-3" />
                                              <span>{dub.voice_actor_name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                              <span className="px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 text-[9px] font-bold uppercase">
                                                {dub.language}
                                              </span>
                                              <span className="text-[9px] text-gray-500 uppercase">
                                                {dub.role}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <button
                                          onClick={() => handleDeleteExtendedItem("dub", dub.id)}
                                          className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                                          title="Delete dub mapping"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 4: REVIEWS */}
                    {extendedSubTab === "reviews" && (
                      <div>
                        {selectedExtendedData.reviews.length === 0 ? (
                          <div className="text-center py-12 text-gray-500 text-xs">
                            No community reviews stored for this anime yet.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {selectedExtendedData.reviews.map((rev) => (
                              <div
                                key={rev.id}
                                className="p-5 rounded-2xl bg-[#181e2c] border border-[#252f44] hover:border-emerald-500/40 transition-all shadow-md"
                              >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-800 shrink-0 border border-white/10">
                                      {rev.user_avatar_url ? (
                                        <Image
                                          src={rev.user_avatar_url}
                                          alt={rev.user_name}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-xs">
                                          {rev.user_name.charAt(0)}
                                        </div>
                                      )}
                                    </div>

                                    <div>
                                      <div className="text-sm font-bold text-white">
                                        {rev.user_name}
                                      </div>
                                      <div className="text-[11px] text-gray-500">
                                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : "Verified Community Review"}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {rev.score && (
                                      <div className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/30 flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                                        <span>{rev.score}%</span>
                                      </div>
                                    )}
                                    <button
                                      onClick={() => handleDeleteExtendedItem("review", rev.id)}
                                      className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                      title="Delete review"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {rev.summary && (
                                  <h4 className="text-sm font-bold text-gray-200 mb-2 italic">
                                    "{rev.summary}"
                                  </h4>
                                )}

                                <p className="text-xs text-gray-400 leading-relaxed line-clamp-4 whitespace-pre-line">
                                  {rev.body}
                                </p>

                                <div className="mt-3 pt-3 border-t border-[#252f44] flex items-center justify-between text-[11px] text-gray-500">
                                  <span>Helpful score: +{rev.rating_amount || 0} votes</span>
                                  {rev.site_url && (
                                    <a
                                      href={rev.site_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-400 hover:underline flex items-center gap-1"
                                    >
                                      Read on AniList <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
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

                {/* Header Action Buttons */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(selectedAnime)}
                    className="px-3.5 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg transition-all flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Anime</span>
                  </button>
                  <button
                    onClick={() => setSelectedAnime(null)}
                    className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-gray-300 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

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

        {/* ========================================================================= */}
        {/* ADMIN ANIME EDITOR & HOMEPAGE SPOTLIGHT MANAGER MODAL */}
        {/* ========================================================================= */}
        {editingAnime && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="max-w-3xl w-full bg-[#11141e] border border-[#232c42] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
              {/* Modal Top Accent Strip */}
              <div
                className="h-2 w-full transition-colors duration-300"
                style={{ backgroundColor: editForm.accent_color || "#3b82f6" }}
              />

              {/* Modal Header */}
              <div className="px-6 py-4 bg-[#141824] border-b border-[#202738] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-gray-900 border border-[#2b354e] shrink-0">
                    {editingAnime.cover_image_url ? (
                      <Image
                        src={editingAnime.cover_image_url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600">
                        No Img
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                        #{editingAnime.anilist_id}
                      </span>
                      {editForm.is_featured && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                          <span>Spotlight #{editForm.featured_order}</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white truncate max-w-md mt-0.5" title={editingAnime.title_romaji}>
                      {editingAnime.title_english || editingAnime.title_romaji}
                    </h3>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {editingAnime.format || "TV"} • {editingAnime.season_year || "Unknown Year"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setEditingAnime(null)}
                  className="p-2 rounded-full bg-[#1b2130] hover:bg-[#252c40] text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Editor Tabs Navigation */}
              <div className="flex items-center px-6 bg-[#0f121b] border-b border-[#1c2334] gap-2 text-xs">
                <button
                  onClick={() => setEditTab("content")}
                  className={`py-3 px-3.5 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                    editTab === "content"
                      ? "border-purple-500 text-purple-300"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Content & Editorial</span>
                </button>

                <button
                  onClick={() => setEditTab("spotlight")}
                  className={`py-3 px-3.5 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                    editTab === "spotlight"
                      ? "border-amber-500 text-amber-300"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Homepage Hero Spotlight</span>
                </button>

                <button
                  onClick={() => setEditTab("streams")}
                  className={`py-3 px-3.5 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                    editTab === "streams"
                      ? "border-blue-500 text-blue-300"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Watch Links ({editingStreamingLinks.length})</span>
                </button>
              </div>

              {/* Editor Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1 bg-[#10131d]">
                {editModalLoading ? (
                  <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                    <span>Loading anime details from Cloud SQL...</span>
                  </div>
                ) : (
                  <>
                    {/* TAB 1: CONTENT & EDITORIAL */}
                    {editTab === "content" && (
                      <div className="space-y-4">
                        {/* Synopsis Override */}
                        <div className="space-y-1.5">
                          <label className="text-gray-300 font-semibold flex items-center justify-between">
                            <span>Synopsis / Description (HTML / Plain Text Override)</span>
                            <span className="text-[10px] text-gray-500 font-normal">
                              {editForm.synopsis.length} characters
                            </span>
                          </label>
                          <textarea
                            value={editForm.synopsis}
                            onChange={(e) => setEditForm({ ...editForm, synopsis: e.target.value })}
                            rows={6}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0c12] border border-[#232c40] text-gray-200 text-xs focus:outline-none focus:border-purple-500 transition-colors leading-relaxed font-sans"
                            placeholder="Enter anime synopsis or editorial description..."
                          />
                          <p className="text-[11px] text-gray-500">
                            Custom editorial descriptions will be served directly to all website visitors across the Homepage, Browse, and Details pages.
                          </p>
                        </div>

                        {/* Accent Color Customizer */}
                        <div className="p-4 rounded-2xl bg-[#0a0d14] border border-[#21293c] space-y-3">
                          <label className="text-gray-300 font-semibold flex items-center gap-2">
                            <Palette className="w-4 h-4 text-purple-400" />
                            <span>Theme Accent Color</span>
                          </label>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-[#121622] px-3 py-1.5 rounded-xl border border-[#273248]">
                              <input
                                type="color"
                                value={editForm.accent_color || "#3b82f6"}
                                onChange={(e) => setEditForm({ ...editForm, accent_color: e.target.value })}
                                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                              />
                              <input
                                type="text"
                                value={editForm.accent_color}
                                onChange={(e) => setEditForm({ ...editForm, accent_color: e.target.value })}
                                className="w-20 bg-transparent text-white font-mono text-xs focus:outline-none"
                              />
                            </div>

                            {/* Preset Color Swatches */}
                            <div className="flex items-center gap-1.5">
                              {[
                                { name: "Blue", hex: "#3b82f6" },
                                { name: "Emerald", hex: "#10b981" },
                                { name: "Purple", hex: "#a855f7" },
                                { name: "Crimson", hex: "#ef4444" },
                                { name: "Amber", hex: "#f59e0b" },
                                { name: "Pink", hex: "#ec4899" },
                                { name: "Teal", hex: "#14b8a6" },
                              ].map((preset) => (
                                <button
                                  key={preset.hex}
                                  type="button"
                                  onClick={() => setEditForm({ ...editForm, accent_color: preset.hex })}
                                  className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-110"
                                  style={{ backgroundColor: preset.hex }}
                                  title={preset.name}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Custom Editorial / Internal Notes */}
                        <div className="space-y-1.5">
                          <label className="text-gray-300 font-semibold flex items-center justify-between">
                            <span>Custom Editorial Notes / Admin Commentary</span>
                            <span className="text-[10px] text-amber-400 font-normal">
                              Internal / Editor Only
                            </span>
                          </label>
                          <textarea
                            value={editForm.custom_notes}
                            onChange={(e) => setEditForm({ ...editForm, custom_notes: e.target.value })}
                            rows={3}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0c12] border border-[#232c40] text-gray-200 text-xs focus:outline-none focus:border-purple-500 transition-colors leading-relaxed font-sans"
                            placeholder="Add admin notes, staff review highlights, content warnings, or affiliate campaign notes..."
                          />
                        </div>

                        {/* Score & Episode Count Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <span className="text-gray-400 font-medium">Community Score:</span>
                            <input
                              type="number"
                              step="0.1"
                              min={0}
                              max={10}
                              value={editForm.score ?? ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  score: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-[#0a0c12] border border-[#232c40] text-white font-mono focus:outline-none focus:border-purple-500"
                              placeholder="e.g. 8.8"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-gray-400 font-medium">Episodes Count:</span>
                            <input
                              type="number"
                              min={0}
                              value={editForm.episodes_count ?? ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  episodes_count: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl bg-[#0a0c12] border border-[#232c40] text-white font-mono focus:outline-none focus:border-purple-500"
                              placeholder="e.g. 24"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-gray-400 font-medium">Air Status:</span>
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[#0a0c12] border border-[#232c40] text-white font-medium focus:outline-none focus:border-purple-500"
                            >
                              <option value="FINISHED">FINISHED</option>
                              <option value="RELEASING">RELEASING</option>
                              <option value="NOT_YET_RELEASED">NOT_YET_RELEASED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: HOMEPAGE HERO SPOTLIGHT */}
                    {editTab === "spotlight" && (
                      <div className="space-y-5">
                        {/* Spotlight Toggle Card */}
                        <div
                          className={`p-5 rounded-2xl border transition-all ${
                            editForm.is_featured
                              ? "bg-gradient-to-r from-amber-950/40 via-[#181524] to-[#121622] border-amber-500/50 shadow-lg shadow-amber-950/20"
                              : "bg-[#0a0d14] border-[#21293c]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Star
                                  className={`w-4 h-4 ${
                                    editForm.is_featured ? "fill-amber-300 text-amber-300" : "text-gray-500"
                                  }`}
                                />
                                <span className="font-bold text-sm text-white">
                                  Homepage Hero Spotlight Carousel
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">
                                When enabled, this anime is pinned directly to the homepage hero carousel banner before any automated trending anime.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setEditForm({ ...editForm, is_featured: !editForm.is_featured })}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                                editForm.is_featured ? "bg-amber-500" : "bg-gray-700"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  editForm.is_featured ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Slide Priority Order */}
                        <div className="p-4 rounded-2xl bg-[#0a0d14] border border-[#21293c] space-y-2">
                          <label className="text-gray-300 font-semibold flex items-center justify-between">
                            <span>Carousel Slide Display Order (1 = Top / First Slide)</span>
                            <span className="text-[10px] text-amber-400 font-mono font-bold">
                              Current: Slide #{editForm.featured_order}
                            </span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={editForm.featured_order}
                            onChange={(e) =>
                              setEditForm({ ...editForm, featured_order: Number(e.target.value) || 0 })
                            }
                            className="w-full sm:w-48 px-3.5 py-2 rounded-xl bg-[#121622] border border-[#273248] text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                          />
                          <p className="text-[11px] text-gray-500">
                            Lower numbers appear first (Order 1 appears before Order 2). Recommended: feature up to 5 anime for a fast-loading hero carousel.
                          </p>
                        </div>

                        {/* YouTube Trailer ID */}
                        <div className="p-4 rounded-2xl bg-[#0a0d14] border border-[#21293c] space-y-2">
                          <label className="text-gray-300 font-semibold flex items-center justify-between">
                            <span>YouTube Trailer ID / Key</span>
                            {editForm.youtube_trailer_id && (
                              <span className="text-emerald-400 font-mono text-[10px]">
                                Preview Available
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={editForm.youtube_trailer_id}
                            onChange={(e) => setEditForm({ ...editForm, youtube_trailer_id: e.target.value })}
                            placeholder="e.g. 5kQGqGqGqGq or full URL"
                            className="w-full px-3.5 py-2 rounded-xl bg-[#121622] border border-[#273248] text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                          />
                          <p className="text-[11px] text-gray-500">
                            Trailers enable the interactive video modal playback directly from the hero carousel slides.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: LEGAL STREAMING & AFFILIATE LINKS */}
                    {editTab === "streams" && (
                      <div className="space-y-5">
                        {/* Current Streaming Links List */}
                        <div className="space-y-2">
                          <span className="text-gray-300 font-semibold">
                            Active Legal & Affiliate Streaming Links ({editingStreamingLinks.length})
                          </span>

                          {editingStreamingLinks.length === 0 ? (
                            <div className="p-6 rounded-2xl bg-[#0a0d14] border border-[#1e2436] text-center text-gray-500 text-xs">
                              No legal streaming links attached to this title yet. Add one below!
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {editingStreamingLinks.map((link) => (
                                <div
                                  key={link.id}
                                  className="p-3.5 rounded-xl bg-[#0a0d14] border border-[#21293c] flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold">
                                      {link.platform_name}
                                    </span>
                                    <div className="flex flex-col min-w-0">
                                      <a
                                        href={link.target_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-gray-300 hover:text-white truncate flex items-center gap-1 font-mono"
                                      >
                                        <span>{link.target_url}</span>
                                        <ExternalLink className="w-3 h-3 text-gray-500 shrink-0" />
                                      </a>
                                      {link.affiliate_url && (
                                        <span className="text-[10px] text-amber-400/90 font-mono truncate">
                                          Affiliate: {link.affiliate_url}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStreamingLink(link.id)}
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors shrink-0"
                                    title="Delete Link"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Add New Streaming Link Form */}
                        <div className="p-4 rounded-2xl bg-[#0f131d] border border-blue-500/20 space-y-3">
                          <span className="text-gray-200 font-bold flex items-center gap-2">
                            <Plus className="w-3.5 h-3.5 text-blue-400" />
                            <span>Add Custom Legal / Affiliate Streaming Link</span>
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-gray-400 text-[11px]">Platform Name:</span>
                              <select
                                value={newLinkPlatform}
                                onChange={(e) => setNewLinkPlatform(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-[#0a0d14] border border-[#232c40] text-white text-xs focus:outline-none"
                              >
                                <option value="Crunchyroll">Crunchyroll</option>
                                <option value="Netflix">Netflix</option>
                                <option value="Hulu">Hulu</option>
                                <option value="Disney+">Disney+</option>
                                <option value="Amazon Prime Video">Amazon Prime Video</option>
                                <option value="Hidive">Hidive</option>
                                <option value="YouTube">YouTube</option>
                                <option value="Custom Platform">Custom Platform</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <span className="text-gray-400 text-[11px]">Official Platform?</span>
                              <div className="flex items-center gap-2 pt-2">
                                <input
                                  type="checkbox"
                                  id="isOfficial"
                                  checked={newLinkIsOfficial}
                                  onChange={(e) => setNewLinkIsOfficial(e.target.checked)}
                                  className="rounded bg-[#0a0d14] border-[#232c40] text-blue-600 focus:ring-0"
                                />
                                <label htmlFor="isOfficial" className="text-xs text-gray-300">
                                  Mark as Verified Official Streaming
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-gray-400 text-[11px]">Target Watch URL:</span>
                            <input
                              type="url"
                              value={newLinkUrl}
                              onChange={(e) => setNewLinkUrl(e.target.value)}
                              placeholder="https://www.crunchyroll.com/series/..."
                              className="w-full px-3.5 py-2 rounded-xl bg-[#0a0d14] border border-[#232c40] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <span className="text-gray-400 text-[11px]">Affiliate Tracking URL (Optional):</span>
                            <input
                              type="url"
                              value={newLinkAffiliate}
                              onChange={(e) => setNewLinkAffiliate(e.target.value)}
                              placeholder="https://crunchyroll.pxf.io/c/... (affiliate link with revenue share)"
                              className="w-full px-3.5 py-2 rounded-xl bg-[#0a0d14] border border-[#232c40] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={handleAddStreamingLink}
                              disabled={isAddingLink || !newLinkUrl.trim()}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {isAddingLink ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                              <span>Add Link to Database</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-[#141824] border-t border-[#202738] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {editSaveStatus === "success" && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Changes saved to Google Cloud SQL!</span>
                    </span>
                  )}
                  {editSaveStatus === "error" && (
                    <span className="text-rose-400 font-semibold flex items-center gap-1 text-xs">
                      <AlertCircle className="w-4 h-4" />
                      <span>Failed to save changes.</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAnime(null)}
                    className="px-4 py-2 rounded-xl bg-[#1a202e] hover:bg-[#242c3e] text-gray-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-950/30 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingEdit ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Save className="w-4 h-4 text-white" />
                    )}
                    <span>Save All Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
