"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Tv,
  ShieldCheck,
  Globe,
  ExternalLink,
  Search,
  Filter,
  Star,
  Flame,
  Check,
  Sparkles,
  Dices,
  Share2,
  LayoutGrid,
  List,
  Table as TableIcon,
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  Award,
  Layers,

  Radio,
  Clock,
  Film,
  Zap,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";
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
  HidiveLogo,
  DisneyPlusLogo,
} from "./BrandLogos";

type ViewMode = "GRID" | "DETAILED" | "COMPACT";
type ProviderKey = "ALL" | "Crunchyroll" | "Netflix" | "Hulu" | "Amazon Prime Video" | "HIDIVE";

interface ProviderMeta {
  key: ProviderKey;
  slug: string;
  name: string;
  badge: string;
  description: string;
  pricing: string;
  perks: string[];
  ctaText: string;
  directUrl: string;
  accentColor: string;
  logoType: "all" | "crunchyroll" | "netflix" | "hulu" | "prime" | "hidive";
}

const PROVIDERS: ProviderMeta[] = [
  {
    key: "ALL",
    slug: "all",
    name: "All Streaming Services",
    badge: "Unified Guide",
    description: "Browse verified legal streams across all major subscription platforms worldwide.",
    pricing: "Aggregated Catalog",
    perks: ["100% Legal & DMCA-Safe", "Zero Ad Popups", "1080p / 4K Feeds"],
    ctaText: "Explore All Platforms",
    directUrl: "#",
    accentColor: "#3b82f6",
    logoType: "all",
  },
  {
    key: "Crunchyroll",
    slug: "crunchyroll",
    name: "Crunchyroll",
    badge: "Simulcast King",
    description: "World's largest dedicated anime library with same-day Japan simulcasts & dubs.",
    pricing: "From $7.99/mo • 14-Day Free Trial",
    perks: ["1-Hour Japan Simulcasts", "1,000+ Anime Series", "Mega Fan Offline Mode"],
    ctaText: "Start Free Trial on Crunchyroll",
    directUrl: "https://www.crunchyroll.com",
    accentColor: "#F47521",
    logoType: "crunchyroll",
  },
  {
    key: "Netflix",
    slug: "netflix",
    name: "Netflix",
    badge: "Global Exclusives",
    description: "High-budget anime originals, 4K HDR master editions & multi-language dubs.",
    pricing: "From $6.99/mo • 4K HDR Available",
    perks: ["4K HDR Dolby Vision", "High-Budget Originals", "30+ Dub Languages"],
    ctaText: "Browse Netflix Anime",
    directUrl: "https://www.netflix.com/browse/genre/7424",
    accentColor: "#E50914",
    logoType: "netflix",
  },
  {
    key: "Hulu",
    slug: "hulu",
    name: "Hulu",
    badge: "US Broadcast",
    description: "Major TV anime broadcasts, classic franchises & same-day broadcast premieres.",
    pricing: "From $7.99/mo • Disney Bundle",
    perks: ["Next-Day TV Broadcasts", "Classic Anime Vault", "English Dub Primetime"],
    ctaText: "Stream on Hulu",
    directUrl: "https://www.hulu.com/hub/anime",
    accentColor: "#1CE783",
    logoType: "hulu",
  },
  {
    key: "Amazon Prime Video",
    slug: "prime-video",
    name: "Prime Video",
    badge: "Prime Included",
    description: "Exclusive theatrical movie premieres, classic epics & Amazon anime originals.",
    pricing: "Included with Prime ($14.99/mo)",
    perks: ["Theatrical Anime Movies", "Included with Amazon Prime", "X-Ray Cast Trivia"],
    ctaText: "Watch with Prime Video",
    directUrl: "https://www.amazon.com/gp/video/storefront?benefitId=anime",
    accentColor: "#00A8E1",
    logoType: "prime",
  },
  {
    key: "HIDIVE",
    slug: "hidive",
    name: "HIDIVE",
    badge: "Niche & Dubs",
    description: "Dedicated anime platform featuring uncut releases, classic dubs & niche gems.",
    pricing: "From $4.99/mo • 7-Day Free Trial",
    perks: ["Uncensored Home Video Releases", "Sentai Filmworks Exclusives", "Retro Cult Hits"],
    ctaText: "Visit HIDIVE",
    directUrl: "https://www.hidive.com",
    accentColor: "#00AEEF",
    logoType: "hidive",
  },
];

interface WatchHubClientProps {
  initialCatalog: AnimeMedia[];
}

function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
}

export default function WatchHubClient({ initialCatalog }: WatchHubClientProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey>("ALL");
  const [selectedGenre, setSelectedGenre] = useState<string>("ALL");
  const [selectedFormat, setSelectedFormat] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"popularity" | "score" | "newest" | "title">("popularity");
  const [viewMode, setViewMode] = useState<ViewMode>("GRID");
  const [dismissBanner, setDismissBanner] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

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

  // Sync platform from URL query if provided
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const platformParam = params.get("platform");
      if (platformParam) {
        const found = PROVIDERS.find(
          (p) =>
            p.slug.toLowerCase() === platformParam.toLowerCase() ||
            p.name.toLowerCase().includes(platformParam.toLowerCase())
        );
        if (found) {
          setSelectedProvider(found.key);
        }
      }
    }
  }, []);

  // Handle provider selection with URL update
  const handleSelectProvider = (key: ProviderKey) => {
    setSelectedProvider(key);
    setSearchQuery("");
    if (typeof window !== "undefined") {
      const provider = PROVIDERS.find((p) => p.key === key);
      const url = new URL(window.location.href);
      if (provider && provider.key !== "ALL") {
        url.searchParams.set("platform", provider.slug);
      } else {
        url.searchParams.delete("platform");
      }
      window.history.replaceState({}, "", url.toString());
    }
  };

  const activeProviderMeta = PROVIDERS.find((p) => p.key === selectedProvider) || PROVIDERS[0];

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
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/watch${
      activeProviderMeta.key !== "ALL" ? `?platform=${activeProviderMeta.slug}` : ""
    }`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    });
  };

  // Pick a random title from the filtered catalog
  const handleRandomPick = () => {
    if (!filteredCatalog || filteredCatalog.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredCatalog.length);
    const pick = filteredCatalog[randomIndex];
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

  // Extract all unique genres for quick chips
  const allGenres = useMemo(() => {
    const set = new Set<string>();
    initialCatalog.forEach((anime) => {
      anime.genres?.forEach((g) => set.add(g));
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [initialCatalog]);

  // Filter and sort catalog
  const filteredCatalog = useMemo(() => {
    return initialCatalog
      .filter((anime) => {
        // Provider filter
        if (selectedProvider !== "ALL") {
          const hasProvider = anime.externalLinks?.some((l) =>
            l.site.toLowerCase().includes(selectedProvider.toLowerCase())
          );
          if (!hasProvider) return false;
        }

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
        if (sortBy === "title") {
          const tA = a.title.english || a.title.romaji;
          const tB = b.title.english || b.title.romaji;
          return tA.localeCompare(tB);
        }
        return (b.popularity || 0) - (a.popularity || 0);
      });
  }, [initialCatalog, selectedProvider, selectedFormat, selectedGenre, searchQuery, sortBy]);

  // Provider Snapshot Stats
  const providerStats = useMemo(() => {
    const matchingAnime =
      selectedProvider === "ALL"
        ? initialCatalog
        : initialCatalog.filter((anime) =>
            anime.externalLinks?.some((l) =>
              l.site.toLowerCase().includes(selectedProvider.toLowerCase())
            )
          );

    const validScores = matchingAnime
      .map((m) => m.averageScore)
      .filter((s): s is number => typeof s === "number" && s > 0);

    const avgScore =
      validScores.length > 0
        ? Math.round(validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length)
        : 0;

    const highestRated = [...matchingAnime].sort(
      (a, b) => (b.averageScore || 0) - (a.averageScore || 0)
    )[0];

    const mostPopular = [...matchingAnime].sort(
      (a, b) => (b.popularity || 0) - (a.popularity || 0)
    )[0];

    return {
      total: matchingAnime.length,
      avgScore,
      highestRated,
      mostPopular,
    };
  }, [initialCatalog, selectedProvider]);

  // Helper to render platform logo
  const renderPlatformLogo = (type: ProviderMeta["logoType"], className = "w-5 h-5") => {
    switch (type) {
      case "crunchyroll":
        return <CrunchyrollLogo className={className} size={20} />;
      case "netflix":
        return <NetflixLogo className={className} size={20} />;
      case "hulu":
        return <HuluLogo className={className} size={20} />;
      case "prime":
        return <PrimeVideoLogo className={className} size={20} />;
      case "hidive":
        return <HidiveLogo className={className} size={20} />;
      case "all":
      default:
        return <Tv className={`${className} text-blue-400`} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d13] text-gray-100">
      <Navbar onWatchTrailer={handleWatchTrailer} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1c2230] pb-8">
          <div className="max-w-3xl">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <Link href="/" className="hover:text-blue-400 transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-gray-200 font-medium">Legal Streaming Guide</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-3">
              <Tv className="w-3.5 h-3.5" />
              <span>Official Streaming Discovery Hub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Where to Watch Anime Legally
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mt-2.5 leading-relaxed">
              Find verified official streams across all major subscription platforms. Zero piracy, zero malicious ad popups, and instant access to 1080p and 4K simulcasts.
            </p>
          </div>

          {/* Quick Actions (Random Pick & Share) */}
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <button
              onClick={handleRandomPick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] border border-[#242c3e] hover:border-blue-500/40 text-xs font-semibold text-gray-200 transition-all shadow-sm"
              title="Pick a random legal stream"
            >
              <Dices className="w-4 h-4 text-amber-400" />
              <span>Random Stream</span>
            </button>

            <button
              onClick={handleCopyShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] border border-[#242c3e] hover:border-blue-500/40 text-xs font-semibold text-gray-200 transition-all shadow-sm"
              title="Copy share link to this streaming platform guide"
            >
              {copiedShare ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-blue-400" />
                  <span>Share Guide</span>
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
                  <span>Unlock Region-Locked Anime Catalogs</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ⚡ 70% Off + 3 Mo Free
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
                  Japanese Netflix, US Crunchyroll, and UK Prime Video carry distinct regional licenses. Use NordVPN to stream any catalog securely from anywhere in the world.
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
                <span>Get NordVPN Deal</span>
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

        {/* Streaming Platforms Selector Cards */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Select Legal Destination ({PROVIDERS.length})</span>
            </span>
            <span className="text-xs text-gray-500 hidden sm:inline">
              Filter anime by official streaming licenses
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {PROVIDERS.map((p) => {
              const isSelected = selectedProvider === p.key;

              return (
                <button
                  key={p.key}
                  onClick={() => handleSelectProvider(p.key)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 relative group overflow-hidden ${
                    isSelected
                      ? "bg-[#182033] border-blue-500/80 ring-2 ring-blue-500/40 shadow-xl text-white"
                      : "bg-[#131620] border-[#202534] text-gray-400 hover:text-white hover:border-[#32394e] hover:bg-[#161a26]"
                  }`}
                >
                  {/* Subtle Accent Glow */}
                  {isSelected && (
                    <div
                      className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
                      style={{ backgroundColor: p.accentColor }}
                    />
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#1b202c] border border-[#283042] group-hover:border-gray-500 transition-colors">
                        {renderPlatformLogo(p.logoType, "w-4 h-4")}
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          isSelected
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "bg-[#1a1f2b] text-gray-400 border border-[#252c3c]"
                        }`}
                      >
                        {p.badge}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                      {p.name}
                    </h3>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#1d2230]/70 text-[10px] text-gray-500 line-clamp-1">
                    {p.pricing}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Platform Spotlight Banner & Snapshot Strip */}
        <div className="flex flex-col gap-4">
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#131826] via-[#101420] to-[#0c0f17] border border-[#22293b] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            {/* Ambient Platform Glow */}
            <div
              className="absolute top-0 left-0 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none"
              style={{ backgroundColor: activeProviderMeta.accentColor }}
            />

            <div className="max-w-3xl flex flex-col gap-3.5 relative z-10">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#1b2130] border border-[#2b354c] shadow-lg">
                  {renderPlatformLogo(activeProviderMeta.logoType, "w-6 h-6")}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {activeProviderMeta.name}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  {activeProviderMeta.badge}
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#191f2c] text-gray-300 border border-[#262f42]">
                  {activeProviderMeta.pricing}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-gray-300/90 leading-relaxed max-w-2xl">
                {activeProviderMeta.description}
              </p>

              {/* Streaming Platform Perks */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {activeProviderMeta.perks.map((perk, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#171d2b] border border-[#263044] text-gray-300"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{perk}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Direct Official Link for Selected Provider */}
            <div className="flex flex-col items-start lg:items-end gap-3 flex-shrink-0 relative z-10">
              <div className="px-3.5 py-2 rounded-xl bg-[#171c29] border border-[#262f42] flex items-center gap-2.5 text-gray-200 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">100% Verified Legal Destination</span>
              </div>

              {activeProviderMeta.key !== "ALL" && (
                <a
                  href={activeProviderMeta.directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-blue-900/40"
                >
                  <span>{activeProviderMeta.ctaText}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Platform Snapshot Metrics Bar (Parallels Seasons and Studios Snapshots) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-[#121622] border border-[#202636]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Tv className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-gray-400">Verified Titles</div>
                <div className="text-sm font-bold text-white">
                  {providerStats.total} Anime Series
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-gray-400">Average Platform Score</div>
                <div className="text-sm font-bold text-amber-400">
                  {providerStats.avgScore}% ★
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-[11px] text-gray-400">Highest Rated Release</div>
                <div className="text-sm font-bold text-emerald-300 truncate">
                  {providerStats.highestRated?.title.english ||
                    providerStats.highestRated?.title.romaji ||
                    "N/A"}{" "}
                  <span className="text-xs text-amber-400 font-semibold">
                    ({providerStats.highestRated?.averageScore || 0}%)
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
                  {providerStats.mostPopular?.title.english ||
                    providerStats.mostPopular?.title.romaji ||
                    "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>

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
                placeholder={`Search titles on ${activeProviderMeta.name}...`}
                className="w-full bg-[#181d2a] text-xs text-gray-200 placeholder-gray-500 pl-9 pr-8 py-2.5 rounded-xl border border-[#262f42] focus:outline-none focus:border-blue-500 transition-colors"
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
                  <option value="popularity">Most Popular 🔥</option>
                  <option value="score">Highest Score ★</option>
                  <option value="newest">Newest First 📅</option>
                  <option value="title">Alphabetical (A-Z)</option>
                </select>
              </div>

              {/* View Mode Switcher (Grid, Detailed, Compact Table) */}
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

          {/* Genre Quick Chips with Elegant Edge Fades & Smooth Chevron Controls */}
          {allGenres.length > 1 && (
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
                {allGenres.map((genre) => {
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
              <span>{activeProviderMeta.name} Titles</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {filteredCatalog.length} {filteredCatalog.length === 1 ? "Title" : "Titles"}
              </span>
            </h3>
          </div>
          <span className="text-xs text-gray-500 hidden sm:inline">
            100% Legal Direct Streaming Guides
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
                  const hidive = anime.externalLinks?.find((l) =>
                    l.site.toLowerCase().includes("hidive")
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

                      {/* Right: Rich Details, Synopsis & Official Streaming Destination Links */}
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
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-semibold text-gray-500">
                              Available on:
                            </span>
                            {crunchyroll && (
                              <a
                                href={crunchyroll.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202738] border border-[#273044] text-[11px] font-semibold text-orange-400 transition-colors"
                                title="Stream on Crunchyroll"
                              >
                                <CrunchyrollLogo className="w-3.5 h-3.5" size={14} />
                                <span>Crunchyroll</span>
                              </a>
                            )}
                            {netflix && (
                              <a
                                href={netflix.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202738] border border-[#273044] text-[11px] font-semibold text-red-400 transition-colors"
                                title="Stream on Netflix"
                              >
                                <NetflixLogo className="w-3.5 h-3.5" size={14} />
                                <span>Netflix</span>
                              </a>
                            )}
                            {hulu && (
                              <a
                                href={hulu.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202738] border border-[#273044] text-[11px] font-semibold text-emerald-400 transition-colors"
                                title="Stream on Hulu"
                              >
                                <HuluLogo className="w-3.5 h-3.5" size={14} />
                                <span>Hulu</span>
                              </a>
                            )}
                            {prime && (
                              <a
                                href={prime.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202738] border border-[#273044] text-[11px] font-semibold text-sky-400 transition-colors"
                                title="Stream on Prime Video"
                              >
                                <PrimeVideoLogo className="w-3.5 h-3.5" size={14} />
                                <span>Prime Video</span>
                              </a>
                            )}
                            {hidive && (
                              <a
                                href={hidive.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202738] border border-[#273044] text-[11px] font-semibold text-cyan-400 transition-colors"
                                title="Stream on HIDIVE"
                              >
                                <HidiveLogo className="w-3.5 h-3.5" size={14} />
                                <span>HIDIVE</span>
                              </a>
                            )}
                            {!crunchyroll && !netflix && !hulu && !prime && !hidive && (
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
                        <th className="py-3 px-4 min-w-[240px]">Anime Title</th>
                        <th className="py-3 px-3">Format</th>
                        <th className="py-3 px-3 text-center">Episodes</th>
                        <th className="py-3 px-3 text-center">Year</th>
                        <th className="py-3 px-3 text-center">Score</th>
                        <th className="py-3 px-3 text-center">Popularity</th>
                        <th className="py-3 px-3 min-w-[140px]">Available On</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2332]">
                      {filteredCatalog.map((anime, idx) => {
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
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                {crunchyroll && (
                                  <a
                                    href={crunchyroll.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Crunchyroll"
                                  >
                                    <CrunchyrollLogo className="w-4 h-4" size={16} />
                                  </a>
                                )}
                                {netflix && (
                                  <a
                                    href={netflix.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Netflix"
                                  >
                                    <NetflixLogo className="w-4 h-4" size={16} />
                                  </a>
                                )}
                                {hulu && (
                                  <a
                                    href={hulu.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Hulu"
                                  >
                                    <HuluLogo className="w-4 h-4" size={16} />
                                  </a>
                                )}
                                {prime && (
                                  <a
                                    href={prime.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Prime Video"
                                  >
                                    <PrimeVideoLogo className="w-4 h-4" size={16} />
                                  </a>
                                )}
                              </div>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-16 text-center rounded-2xl bg-[#131622] border border-[#212738] p-8 text-gray-400">
            <Filter className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-gray-300">No Titles Found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              No titles match your current search and filter settings on {activeProviderMeta.name}.
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
