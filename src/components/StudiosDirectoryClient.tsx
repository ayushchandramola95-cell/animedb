"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Star,
  ExternalLink,
  ShieldCheck,
  Globe,
  Search,
  Filter,
  Flame,
  Tv,
  Film,
  Sparkles,
  Share2,
  Check,
  Dices,
  Play,
  LayoutGrid,
  List,
  Table as TableIcon,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,

  Clock,
  Award,
  Layers,
  History,
  Info,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import { PremierStudioInfo } from "@/lib/anilist";
import Navbar from "./Navbar";
import AnimeCard from "./AnimeCard";
import TrailerModal from "./TrailerModal";
import WatchlistButton from "./WatchlistButton";
import Footer from "./Footer";
import {
  CrunchyrollLogo,
  NetflixLogo,
  HuluLogo,
  PrimeVideoLogo,
  DisneyPlusLogo,
  BilibiliLogo,
} from "./BrandLogos";

type ViewMode = "GRID" | "DETAILED" | "COMPACT";

interface StudioWithMedia extends PremierStudioInfo {
  media: AnimeMedia[];
}

interface StudiosDirectoryClientProps {
  studiosData: StudioWithMedia[];
}

function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
}

export default function StudiosDirectoryClient({ studiosData }: StudiosDirectoryClientProps) {
  const [selectedStudioIndex, setSelectedStudioIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("GRID");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string>("ALL");
  const [selectedGenre, setSelectedGenre] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"score" | "popularity" | "newest" | "oldest">("score");
  const [dismissBanner, setDismissBanner] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showHistoryTimeline, setShowHistoryTimeline] = useState(false);

  // Genre horizontal scroll controls
  const genreScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkGenreScroll = () => {
    if (genreScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = genreScrollRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  const handleScrollGenres = (direction: "left" | "right") => {
    if (genreScrollRef.current) {
      const amount = direction === "left" ? -240 : 240;
      genreScrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
      setTimeout(checkGenreScroll, 300);
    }
  };


  // Trailer modal state
  const [trailerModal, setTrailerModal] = useState<{
    isOpen: boolean;
    trailerId: string | null;
    title: string;
    streamUrl?: string | null;
    streamSite?: string | null;
  }>({
    isOpen: false,
    trailerId: null,
    title: "",
    streamUrl: null,
    streamSite: null,
  });

  const activeStudio = studiosData[selectedStudioIndex] || studiosData[0];

  // Sync studio from URL query if provided
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const studioSlug = params.get("studio");
      if (studioSlug) {
        const idx = studiosData.findIndex(
          (s) => s.slug?.toLowerCase() === studioSlug.toLowerCase() || s.name.toLowerCase() === studioSlug.toLowerCase()
        );
        if (idx !== -1) {
          setSelectedStudioIndex(idx);
        }
      }
    }
  }, [studiosData]);

  // Handle studio selection with URL state update
  const handleSelectStudio = (idx: number) => {
    setSelectedStudioIndex(idx);
    setSearchQuery("");
    setSelectedGenre("ALL");
    setSelectedFormat("ALL");
    if (typeof window !== "undefined") {
      const studio = studiosData[idx];
      const url = new URL(window.location.href);
      if (studio?.slug) {
        url.searchParams.set("studio", studio.slug);
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleWatchTrailer = (
    trailerId: string,
    title: string,
    streamUrl?: string | null,
    streamSite?: string | null
  ) => {
    setTrailerModal({
      isOpen: true,
      trailerId,
      title,
      streamUrl: streamUrl || null,
      streamSite: streamSite || null,
    });
  };

  // Copy shareable link
  const handleCopyShare = () => {
    if (typeof window === "undefined" || !activeStudio) return;
    const url = `${window.location.origin}/studios?studio=${activeStudio.slug || "mappa"}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    });
  };

  // Pick a random masterpiece from the current studio
  const handleRandomPick = () => {
    if (!activeStudio?.media || activeStudio.media.length === 0) return;
    const randomIndex = Math.floor(Math.random() * activeStudio.media.length);
    const pick = activeStudio.media[randomIndex];
    if (pick.trailer?.id) {
      handleWatchTrailer(
        pick.trailer.id,
        pick.title.english || pick.title.romaji,
        pick.externalLinks?.find((l) => l.site.toLowerCase().includes("crunchyroll"))?.url,
        "Crunchyroll"
      );
    } else if (typeof window !== "undefined") {
      window.location.href = `/anime/${pick.id}`;
    }
  };

  // Calculate detailed stats for the active studio
  const activeStudioStats = useMemo(() => {
    if (!activeStudio || !activeStudio.media || activeStudio.media.length === 0) {
      return {
        avgScore: 0,
        totalWorks: 0,
        highestRated: null as AnimeMedia | null,
        mostPopular: null as AnimeMedia | null,
      };
    }

    const validScores = activeStudio.media
      .map((m) => m.averageScore)
      .filter((s): s is number => typeof s === "number" && s > 0);

    const avgScore =
      validScores.length > 0
        ? Math.round(validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length)
        : 0;

    const sortedByScore = [...activeStudio.media].sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
    const sortedByPop = [...activeStudio.media].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    return {
      avgScore,
      totalWorks: activeStudio.media.length,
      highestRated: sortedByScore[0] || null,
      mostPopular: sortedByPop[0] || null,
    };
  }, [activeStudio]);

  // Extract available genres for active studio
  const availableGenres = useMemo(() => {
    if (!activeStudio?.media) return ["ALL"];
    const set = new Set<string>();
    activeStudio.media.forEach((anime) => {
      anime.genres?.forEach((g) => set.add(g));
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [activeStudio]);

  // Filter and sort catalog for the active studio
  const filteredCatalog = useMemo(() => {
    if (!activeStudio || !activeStudio.media) return [];

    return activeStudio.media
      .filter((anime) => {
        // Format filter
        if (selectedFormat !== "ALL") {
          if (selectedFormat === "TV" && anime.format !== "TV" && anime.format !== "TV_SHORT") return false;
          if (selectedFormat === "MOVIE" && anime.format !== "MOVIE") return false;
          if (selectedFormat === "OVA" && anime.format !== "OVA" && anime.format !== "ONA" && anime.format !== "SPECIAL") return false;
        }

        // Genre filter
        if (selectedGenre !== "ALL") {
          if (!anime.genres?.includes(selectedGenre)) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle =
            (anime.title.english && anime.title.english.toLowerCase().includes(q)) ||
            (anime.title.romaji && anime.title.romaji.toLowerCase().includes(q)) ||
            (anime.description && anime.description.toLowerCase().includes(q));
          if (!matchTitle) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "score") {
          return (b.averageScore || 0) - (a.averageScore || 0);
        }
        if (sortBy === "newest") {
          return (b.seasonYear || 0) - (a.seasonYear || 0);
        }
        if (sortBy === "oldest") {
          return (a.seasonYear || 9999) - (b.seasonYear || 9999);
        }
        return (b.popularity || 0) - (a.popularity || 0);
      });
  }, [activeStudio, selectedFormat, selectedGenre, searchQuery, sortBy]);

  // Helper badge text for studio selector cards
  const getStudioBadge = (studio: StudioWithMedia) => {
    switch (studio.category) {
      case "action":
        return "Sakuga Titan";
      case "vfx":
        return "Digital VFX";
      case "emotion":
        return "Emotional Master";
      case "classic":
        return "Prestige Pioneer";
      case "stylized":
        return "Adrenaline Sakuga";
      default:
        return `Est. ${studio.founded}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d13] text-gray-100">
      <Navbar onWatchTrailer={handleWatchTrailer} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Header Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1c2230] pb-8">
          <div className="max-w-3xl">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <Link href="/" className="hover:text-blue-400 transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-gray-200 font-medium">Studios Showcase</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-3">
              <Building2 className="w-3.5 h-3.5" />
              <span>Animation Studios Directory</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Legendary Anime Animation Studios
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mt-2.5 leading-relaxed">
              Explore the visionary animation powerhouses behind the greatest productions in anime history. Discover their signature philosophies, key directors, historical milestones, and complete filmographies.
            </p>
          </div>

          {/* Quick Actions (Random Masterpiece & Share) */}
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <button
              onClick={handleRandomPick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] border border-[#242c3e] hover:border-blue-500/40 text-xs font-semibold text-gray-200 transition-all shadow-sm"
              title="Pick a random masterpiece from this studio"
            >
              <Dices className="w-4 h-4 text-amber-400" />
              <span>Random Masterpiece</span>
            </button>

            <button
              onClick={handleCopyShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] border border-[#242c3e] hover:border-blue-500/40 text-xs font-semibold text-gray-200 transition-all shadow-sm"
              title="Copy share link to this studio"
            >
              {copiedShare ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-blue-400" />
                  <span>Share Studio</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* NordVPN Global Geo-Unblocker Banner (Dismissible) */}
        {!dismissBanner && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#121622] via-[#10141f] to-[#0e121a] border border-[#242b3d] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg relative">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                  <span>Stream Studio Catalogs Without Geo-Blocks</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ⚡ 70% Off + 3 Mo Free
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
                  Japanese Netflix, US Crunchyroll, and UK Prime Video carry distinct regional licenses for studio titles. Use NordVPN to stream any studio production securely worldwide.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-400">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#181d2a] border border-[#242c3d]">
                    🇯🇵 Tokyo 10Gbps • Netflix JP / ABEMA
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#181d2a] border border-[#242c3d]">
                    🇺🇸 US Ultra-Fast • Crunchyroll / Hulu
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <a
                href="https://nordvpn.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 flex-shrink-0 shadow-md hover:shadow-emerald-950/40"
              >
                <span>Unlock Studio Catalogs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setDismissBanner(true)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#1a2030] transition-colors"
                title="Dismiss Banner"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 10 Premier Studios Thematic Selector Grid */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Select Animation Studio ({studiosData.length})</span>
            </span>
            <span className="text-xs text-gray-500 hidden sm:inline">
              Click a studio to load its history and productions
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {studiosData.map((studio, idx) => {
              const isSelected = selectedStudioIndex === idx;

              return (
                <button
                  key={studio.id || studio.name}
                  onClick={() => handleSelectStudio(idx)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 relative group overflow-hidden ${
                    isSelected
                      ? "bg-[#182033] border-blue-500/80 ring-2 ring-blue-500/40 shadow-xl text-white"
                      : "bg-[#131620] border-[#202534] text-gray-400 hover:text-white hover:border-[#32394e] hover:bg-[#161a26]"
                  }`}
                >
                  {/* Studio Accent Glow */}
                  {isSelected && (
                    <div
                      className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
                      style={{ backgroundColor: studio.accentColor || "#3b82f6" }}
                    />
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-[#1b202c] text-gray-300 border border-[#283042] group-hover:border-gray-500"
                        }`}
                      >
                        {studio.name.charAt(0)}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          isSelected
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "bg-[#1a1f2b] text-gray-400 border border-[#252c3c]"
                        }`}
                      >
                        {getStudioBadge(studio)}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                      {studio.name}
                    </h3>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#1d2230]/70 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Est. {studio.founded}</span>
                    <span className="font-semibold text-gray-400">
                      {studio.media?.length || 0} Titles
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Studio Spotlight Hero Banner & Snapshot Strip */}
        {activeStudio && (
          <div className="flex flex-col gap-4">
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#131826] via-[#101420] to-[#0c0f17] border border-[#22293b] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
              {/* Studio Ambient Gradient */}
              <div
                className="absolute top-0 left-0 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none"
                style={{ backgroundColor: activeStudio.accentColor || "#3b82f6" }}
              />

              <div className="max-w-3xl flex flex-col gap-3.5 relative z-10">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-base text-white shadow-lg"
                    style={{ backgroundColor: activeStudio.accentColor || "#3b82f6" }}
                  >
                    {activeStudio.name.charAt(0)}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {activeStudio.name}
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    {activeStudio.jpName}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#191f2c] text-gray-300 border border-[#262f42]">
                    Est. {activeStudio.founded} • {activeStudio.headquarters}
                  </span>
                </div>

                <div className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                  <span>{activeStudio.tagline}</span>
                </div>

                <p className="text-xs sm:text-sm text-gray-300/90 leading-relaxed max-w-2xl">
                  {activeStudio.description}
                </p>

                {/* Signature Style Bar */}
                {activeStudio.signatureStyle && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>Signature Philosophy: {activeStudio.signatureStyle}</span>
                  </div>
                )}

                {/* Key Visionaries & Directors */}
                {activeStudio.keyPeople && activeStudio.keyPeople.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[11px] font-semibold text-gray-400">Key Directors & Leaders:</span>
                    {activeStudio.keyPeople.map((person, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded bg-[#181e2b] text-gray-300 border border-[#273144]"
                      >
                        {person}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side Stats & Timeline Toggle */}
              <div className="flex flex-col items-start lg:items-end gap-3 text-xs text-gray-400 flex-shrink-0 relative z-10">
                <div className="px-3.5 py-2 rounded-xl bg-[#171c29] border border-[#262f42] flex items-center gap-2.5 text-gray-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">Verified Premier Studio</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-300">
                  <span>
                    Catalog Rating: <strong className="text-amber-400 font-bold">{activeStudioStats.avgScore}%</strong>
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-white font-bold">{activeStudioStats.totalWorks}</strong> Iconic Works
                  </span>
                </div>

                {/* Toggle Historical Milestones */}
                {activeStudio.milestones && activeStudio.milestones.length > 0 && (
                  <button
                    onClick={() => setShowHistoryTimeline(!showHistoryTimeline)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182030] hover:bg-[#1f283d] text-blue-300 text-xs font-semibold border border-blue-500/30 transition-colors"
                  >
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    <span>{showHistoryTimeline ? "Hide Milestones" : "Studio Milestones & Eras"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Expandable Studio Milestones Timeline */}
            {showHistoryTimeline && activeStudio.milestones && (
              <div className="p-6 rounded-2xl bg-[#11151f] border border-[#202738] animate-in fade-in slide-in-from-top-2 duration-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Historical Milestones & Turning Points — {activeStudio.name}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {activeStudio.milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#151924] border border-[#242b3b] flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-blue-400">{m.year}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 font-semibold">
                          Milestone #{idx + 1}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-white">{m.title}</h5>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{m.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Studio Production Snapshot Strip (Parallels Seasons Archive Snapshot) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-[#121622] border border-[#202636]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-400">Total Studio Catalog</div>
                  <div className="text-sm font-bold text-white">
                    {activeStudioStats.totalWorks} Productions
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-400">Average Critical Score</div>
                  <div className="text-sm font-bold text-amber-400">
                    {activeStudioStats.avgScore}% ★
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-[11px] text-gray-400">Highest Rated Masterpiece</div>
                  <div className="text-sm font-bold text-emerald-300 truncate">
                    {activeStudioStats.highestRated?.title.english ||
                      activeStudioStats.highestRated?.title.romaji ||
                      "N/A"}{" "}
                    <span className="text-xs text-amber-400 font-semibold">
                      ({activeStudioStats.highestRated?.averageScore || 0}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-[11px] text-gray-400">Most Popular Franchise</div>
                  <div className="text-sm font-bold text-purple-300 truncate">
                    {activeStudioStats.mostPopular?.title.english ||
                      activeStudioStats.mostPopular?.title.romaji ||
                      "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unified Filter Toolbar with Genre Quick Chips & View Mode Switcher */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#131724] border border-[#22293b]">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search within ${activeStudio?.name || "Studio"} catalog...`}
                className="w-full bg-[#181d2a] text-xs text-gray-200 placeholder-gray-500 pl-9 pr-3 py-2.5 rounded-xl border border-[#262f42] focus:outline-none focus:border-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Format Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Format:</span>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="bg-[#181d2a] text-xs text-gray-200 px-3 py-2 rounded-xl border border-[#262f42] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Formats</option>
                  <option value="TV">TV Series</option>
                  <option value="MOVIE">Theatrical Movies</option>
                  <option value="OVA">OVA / Specials</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#181d2a] text-xs text-gray-200 px-3 py-2 rounded-xl border border-[#262f42] focus:outline-none cursor-pointer"
                >
                  <option value="score">Highest Score ★</option>
                  <option value="popularity">Most Popular 🔥</option>
                  <option value="newest">Newest First 📅</option>
                  <option value="oldest">Oldest Classic ⏳</option>
                </select>
              </div>

              {/* View Mode Switcher (Grid, Detailed, Compact) */}
              <div className="flex items-center p-1 rounded-xl bg-[#181d2a] border border-[#262f42] ml-auto lg:ml-0">
                <button
                  onClick={() => setViewMode("GRID")}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    viewMode === "GRID"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Poster Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode("DETAILED")}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    viewMode === "DETAILED"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Detailed Cards View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Detailed</span>
                </button>
                <button
                  onClick={() => setViewMode("COMPACT")}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    viewMode === "COMPACT"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Compact Timetable View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Genre Quick Filter Chips with Smooth Chevron Controls & Hidden Scrollbar */}
          {availableGenres.length > 1 && (
            <div className="relative flex items-center pt-2.5 border-t border-[#1e2434]/80 group/genres">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold mr-2 flex-shrink-0">
                <Filter className="w-3.5 h-3.5 text-blue-400" />
                <span>Genre:</span>
              </div>

              {/* Left Scroll Chevron Button */}
              {canScrollLeft && (
                <button
                  onClick={() => handleScrollGenres("left")}
                  className="absolute left-16 z-20 p-1.5 rounded-full bg-[#131724]/95 hover:bg-[#1f2638] text-gray-300 hover:text-white border border-[#262f42] backdrop-blur-md shadow-lg transition-all"
                  title="Scroll Left"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Left Fade Mask */}
              {canScrollLeft && (
                <div className="absolute left-14 top-2.5 bottom-0 w-8 bg-gradient-to-r from-[#131724] to-transparent pointer-events-none z-10" />
              )}

              {/* Scrollable Container with Hidden Scrollbar */}
              <div
                ref={genreScrollRef}
                onScroll={checkGenreScroll}
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5 w-full"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {availableGenres.map((genre) => {
                  const isSelected = selectedGenre === genre;
                  return (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-md ring-1 ring-blue-400/40 font-semibold"
                          : "bg-[#181d2a] text-gray-400 hover:text-white hover:bg-[#202636] border border-[#242b3b]"
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>

              {/* Right Fade Mask */}
              {canScrollRight && (
                <div className="absolute right-7 top-2.5 bottom-0 w-8 bg-gradient-to-l from-[#131724] to-transparent pointer-events-none z-10" />
              )}

              {/* Right Scroll Chevron Button */}
              {canScrollRight && (
                <button
                  onClick={() => handleScrollGenres("right")}
                  className="absolute right-0 z-20 p-1.5 rounded-full bg-[#131724]/95 hover:bg-[#1f2638] text-gray-300 hover:text-white border border-[#262f42] backdrop-blur-md shadow-lg transition-all"
                  title="Scroll Right"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Reset Genre Filter Button if active */}
              {selectedGenre !== "ALL" && (
                <button
                  onClick={() => setSelectedGenre("ALL")}
                  className="ml-2 text-[10px] text-gray-500 hover:text-gray-300 underline flex-shrink-0 whitespace-nowrap"
                  title="Reset to All Genres"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        {/* Catalog Header & Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>{activeStudio?.name} Productions</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {filteredCatalog.length} {filteredCatalog.length === 1 ? "Title" : "Titles"}
              </span>
            </h3>
          </div>
          <span className="text-xs text-gray-500 hidden sm:inline">
            100% Legal Streaming Destinations
          </span>
        </div>

        {/* Multi-Mode Catalog Display */}
        {filteredCatalog.length > 0 ? (
          <>
            {/* VIEW MODE 1: POSTER GRID */}
            {viewMode === "GRID" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredCatalog.map((anime, idx) => (
                  <AnimeCard
                    key={`${anime.id}-${idx}`}
                    anime={anime}
                    rank={sortBy === "score" ? idx + 1 : undefined}
                    onWatchTrailer={handleWatchTrailer}
                  />
                ))}
              </div>
            )}

            {/* VIEW MODE 2: DETAILED CARDS */}
            {viewMode === "DETAILED" && (
              <div className="flex flex-col gap-4">
                {filteredCatalog.map((anime, idx) => {
                  const cleanedSynopsis = stripHtml(anime.description);
                  const crunchyroll = anime.externalLinks?.find((l) =>
                    l.site.toLowerCase().includes("crunchyroll")
                  );
                  const netflix = anime.externalLinks?.find((l) =>
                    l.site.toLowerCase().includes("netflix")
                  );
                  const hulu = anime.externalLinks?.find((l) =>
                    l.site.toLowerCase().includes("hulu")
                  );
                  const prime = anime.externalLinks?.find(
                    (l) =>
                      l.site.toLowerCase().includes("amazon") ||
                      l.site.toLowerCase().includes("prime")
                  );

                  return (
                    <div
                      key={`${anime.id}-${idx}`}
                      className="p-4 sm:p-5 rounded-2xl bg-[#131622] border border-[#212738] hover:border-blue-500/40 transition-all flex flex-col md:flex-row gap-5 group"
                    >
                      {/* Left: Poster & Trailer Button */}
                      <div className="relative w-full md:w-44 h-60 md:h-auto flex-shrink-0 rounded-xl overflow-hidden bg-[#1a1f2c]">
                        <img
                          src={anime.coverImage?.large || anime.coverImage?.medium || ""}
                          alt={anime.title.english || anime.title.romaji || "Anime Poster"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Rank / Score Badges */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          {sortBy === "score" && (
                            <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-extrabold text-amber-400 border border-amber-500/30">
                              #{idx + 1}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-extrabold text-white flex items-center gap-1 border border-white/10">
                            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                            {anime.averageScore ? `${anime.averageScore}%` : "N/A"}
                          </span>
                        </div>

                        {/* Watch Trailer Button Overlay */}
                        {anime.trailer?.id && (
                          <button
                            onClick={() =>
                              handleWatchTrailer(
                                anime.trailer!.id!,
                                anime.title.english || anime.title.romaji,
                                crunchyroll?.url,
                                "Crunchyroll"
                              )
                            }
                            className="absolute bottom-2.5 inset-x-2.5 py-1.5 rounded-lg bg-black/75 hover:bg-blue-600 backdrop-blur-md text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/10"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Trailer</span>
                          </button>
                        )}
                      </div>

                      {/* Right: Rich Details, Synopsis & Streaming Platform Links */}
                      <div className="flex-1 flex flex-col justify-between gap-3">
                        <div>
                          {/* Format, Episodes & Airing Status Row */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {anime.format || "TV"}
                            </span>
                            {anime.episodes && (
                              <span className="text-[10px] text-gray-400">
                                {anime.episodes} Episodes
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500">•</span>
                            <span className="text-[10px] text-gray-400">
                              {anime.seasonYear || anime.startDate?.year || "Classic"}
                            </span>
                            <span className="text-[10px] text-gray-500">•</span>
                            <span
                              className={`text-[10px] font-semibold ${
                                anime.status === "RELEASING"
                                  ? "text-emerald-400"
                                  : "text-gray-400"
                              }`}
                            >
                              {anime.status || "FINISHED"}
                            </span>
                          </div>

                          {/* Titles */}
                          <Link href={`/anime/${anime.id}`}>
                            <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                              {anime.title.english || anime.title.romaji}
                            </h4>
                          </Link>
                          {anime.title.english && anime.title.romaji && (
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                              {anime.title.romaji}
                            </p>
                          )}

                          {/* Genre Chips */}
                          {anime.genres && anime.genres.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                              {anime.genres.slice(0, 5).map((g) => (
                                <span
                                  key={g}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-[#191e2b] text-gray-300 border border-[#262f42]"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Synopsis Preview */}
                          <p className="text-xs text-gray-400 mt-2.5 line-clamp-3 leading-relaxed">
                            {cleanedSynopsis || "Official synopsis available on the anime details page."}
                          </p>
                        </div>

                        {/* Bottom Actions: Official Streaming Platform Logos + Details Link */}
                        <div className="pt-3 border-t border-[#1d2332] flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-gray-500">
                              Stream:
                            </span>
                            {crunchyroll && (
                              <a
                                href={crunchyroll.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-[#181d2a] hover:bg-[#202738] border border-[#273044] transition-colors"
                                title="Watch on Crunchyroll"
                              >
                                <CrunchyrollLogo className="w-4 h-4" size={16} />
                              </a>
                            )}
                            {netflix && (
                              <a
                                href={netflix.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-[#181d2a] hover:bg-[#202738] border border-[#273044] transition-colors"
                                title="Watch on Netflix"
                              >
                                <NetflixLogo className="w-4 h-4" size={16} />
                              </a>
                            )}
                            {hulu && (
                              <a
                                href={hulu.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-[#181d2a] hover:bg-[#202738] border border-[#273044] transition-colors"
                                title="Watch on Hulu"
                              >
                                <HuluLogo className="w-4 h-4" size={16} />
                              </a>
                            )}
                            {prime && (
                              <a
                                href={prime.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-[#181d2a] hover:bg-[#202738] border border-[#273044] transition-colors"
                                title="Watch on Prime Video"
                              >
                                <PrimeVideoLogo className="w-4 h-4" size={16} />
                              </a>
                            )}
                            {!crunchyroll && !netflix && !hulu && !prime && (
                              <span className="text-[11px] text-gray-500 italic">
                                Legal destinations available on details page
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <WatchlistButton anime={anime as any} />
                            <Link
                              href={`/anime/${anime.id}`}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                            >
                              <span>View Series</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW MODE 3: COMPACT SCANNING TABLE */}
            {viewMode === "COMPACT" && (
              <div className="rounded-2xl border border-[#22283a] bg-[#121520] overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#161a27] text-gray-400 font-semibold border-b border-[#22283a]">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4 min-w-[240px]">Production Title</th>
                        <th className="py-3 px-3">Format</th>
                        <th className="py-3 px-3 text-center">Episodes</th>
                        <th className="py-3 px-3 text-center">Year</th>
                        <th className="py-3 px-3 text-center">Score</th>
                        <th className="py-3 px-3 text-center">Popularity</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2332]">
                      {filteredCatalog.map((anime, idx) => (
                        <tr
                          key={`${anime.id}-${idx}`}
                          className="hover:bg-[#161b28] transition-colors group"
                        >
                          <td className="py-3 px-4 text-center font-bold text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={anime.coverImage?.medium || anime.coverImage?.large || ""}
                                alt=""
                                className="w-8 h-11 object-cover rounded-md bg-[#1a1f2c] flex-shrink-0"
                              />
                              <div className="truncate max-w-xs sm:max-w-sm">
                                <Link
                                  href={`/anime/${anime.id}`}
                                  className="font-bold text-white group-hover:text-blue-400 transition-colors truncate block"
                                >
                                  {anime.title.english || anime.title.romaji}
                                </Link>
                                <span className="text-[10px] text-gray-500 truncate block">
                                  {anime.genres?.slice(0, 3).join(", ")}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                              {anime.format || "TV"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-gray-300 font-medium">
                            {anime.episodes || "—"}
                          </td>
                          <td className="py-3 px-3 text-center text-gray-300 font-medium">
                            {anime.seasonYear || anime.startDate?.year || "—"}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {anime.averageScore ? `${anime.averageScore}%` : "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-gray-400">
                            {anime.popularity ? `${(anime.popularity / 1000).toFixed(0)}k` : "—"}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                anime.status === "RELEASING"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "text-gray-400"
                              }`}
                            >
                              {anime.status || "FINISHED"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {anime.trailer?.id && (
                                <button
                                  onClick={() =>
                                    handleWatchTrailer(
                                      anime.trailer!.id!,
                                      anime.title.english || anime.title.romaji
                                    )
                                  }
                                  className="p-1.5 rounded-lg bg-[#1a202e] hover:bg-blue-600 text-gray-300 hover:text-white transition-colors"
                                  title="Watch Trailer"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                </button>
                              )}
                              <Link
                                href={`/anime/${anime.id}`}
                                className="px-2.5 py-1 rounded-lg bg-[#1e2536] hover:bg-blue-600 text-gray-200 hover:text-white transition-colors font-medium text-[11px]"
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-16 text-center rounded-2xl bg-[#131622] border border-[#212738] p-8 text-gray-400">
            <Filter className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-gray-300">No Productions Found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No productions match your current search and filter settings for {activeStudio?.name}.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedFormat("ALL");
                setSelectedGenre("ALL");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      {/* Unified Platform Footer */}
      <Footer />

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerModal.isOpen}
        onClose={() => setTrailerModal((prev) => ({ ...prev, isOpen: false }))}
        trailerId={trailerModal.trailerId}
        title={trailerModal.title}
        streamUrl={trailerModal.streamUrl}
        streamSite={trailerModal.streamSite}
      />
    </div>
  );
}
