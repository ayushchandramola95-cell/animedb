"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Star,
  Clock,
  Calendar,
  Building,
  Building2,
  Film,
  Globe,
  Share2,
  ExternalLink,
  ArrowLeftRight,
  Heart,
  Users,
  Copy,
  Check,
  Hash,
  Sparkles,
  Tv,
  Mic,
  Clapperboard,
  Disc3,
  GitBranch,
  BarChart3,
  MessageSquare,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import Navbar from "./Navbar";
import StreamingAffiliateBox from "./StreamingAffiliateBox";
import SeiyuuVisualizer from "./SeiyuuVisualizer";
import FranchiseRelations from "./FranchiseRelations";
import MangaMerchAffiliate from "./MangaMerchAffiliate";
import WatchlistButton from "./WatchlistButton";
import TrailerModal from "./TrailerModal";
import AnimeRankingsStrip from "./AnimeRankingsStrip";
import AnimeTagCloud from "./AnimeTagCloud";
import KeyStaffDirectory from "./KeyStaffDirectory";
import AnimeRecommendations from "./AnimeRecommendations";
import EpisodeGuide from "./EpisodeGuide";
import AnimeStatsVisualizer from "./AnimeStatsVisualizer";
import AnimeReviewsSection from "./AnimeReviewsSection";
import ThemeSongsSection from "./ThemeSongsSection";
import Breadcrumbs from "./Breadcrumbs";
import Footer from "./Footer";
import { formatTimeUntilAiring } from "./AnimeCard";

interface AnimeDetailClientProps {
  anime: AnimeMedia;
}

function formatFuzzyDate(
  date?: { year: number | null; month: number | null; day: number | null } | null
): string | null {
  if (!date || !date.year) return null;
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const m = date.month ? monthNames[date.month - 1] : "";
  const d = date.day ? `${date.day}, ` : "";
  return m ? `${m} ${d}${date.year}` : `${date.year}`;
}

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toLocaleString();
}

export default function AnimeDetailClient({ anime }: AnimeDetailClientProps) {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedNative, setCopiedNative] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [showAllSynonyms, setShowAllSynonyms] = useState(false);

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setActiveSection(targetId);
    const el = document.getElementById(targetId);
    if (el) {
      // 64px (Navbar) + 48px (Sticky Subnav) + 20px (breathing space) = 132px offset
      const yOffset = -132;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      try {
        window.history.replaceState(null, "", `#${targetId}`);
      } catch {}
    }
  };

  // Scroll spy: automatically update active section on scroll
  useEffect(() => {
    const sectionIds = [
      "overview",
      "watch-officially",
      "episodes",
      "tags",
      "characters",
      "staff",
      "themes",
      "franchise",
      "merch",
      "stats",
      "recommendations",
      "reviews",
      "trailer",
    ];

    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            setActiveSection((prev) => (prev === sectionIds[i] ? prev : sectionIds[i]));
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smoothly center the active tab inside the horizontal subnav
  useEffect(() => {
    if (typeof window !== "undefined") {
      const activeLink = document.querySelector(
        `nav[aria-label="Section navigation"] a[href="#${activeSection}"]`
      );
      if (activeLink) {
        activeLink.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeSection]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyNative = () => {
    if (typeof window !== "undefined" && anime.title.native) {
      navigator.clipboard.writeText(anime.title.native);
      setCopiedNative(true);
      setTimeout(() => setCopiedNative(false), 2000);
    }
  };

  const displayTitle = anime.title.english || anime.title.romaji;
  const secondaryTitle = anime.title.english ? anime.title.romaji : null;
  const nativeTitle = anime.title.native;

  // Studio & Production Committee
  const allStudioEdges = anime.studios?.edges || [];
  const mainStudioNode = allStudioEdges.find((e) => e.isMain)?.node || anime.studios?.nodes?.[0];
  const producerNodes = allStudioEdges
    .filter((e) => !e.isMain)
    .map((e) => e.node)
    .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
  const studio = mainStudioNode?.name || anime.studios?.nodes?.[0]?.name;

  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const accentColor = anime.coverImage.color || "#3b82f6";

  const startDateStr = formatFuzzyDate(anime.startDate);
  const endDateStr = formatFuzzyDate(anime.endDate);
  const broadcastRange = startDateStr
    ? endDateStr && endDateStr !== startDateStr
      ? `${startDateStr} – ${endDateStr}`
      : startDateStr
    : null;

  const cleanDescription = anime.description
    ? anime.description.replace(/<[^>]*>?/gm, "").trim()
    : "No synopsis available for this title.";

  // Detect long synopsis to offer see more / expand
  const isLongSynopsis = cleanDescription.length > 280;

  const primaryStream = anime.externalLinks?.find(
    (l) => l.type === "STREAMING" || ["Crunchyroll", "Netflix", "Hulu", "HIDIVE"].includes(l.site)
  );

  // Official portal links & social channels
  const officialSite = anime.externalLinks?.find(
    (l) => l.site === "Official Site" || (l.type === "INFO" && !l.url.includes("anilist.co") && !l.url.includes("myanimelist.net"))
  );
  const officialTwitter = anime.externalLinks?.find(
    (l) => l.site === "Twitter" || (l.type === "SOCIAL" && (l.url.includes("twitter.com") || l.url.includes("x.com")))
  );

  // Country of origin mapping
  const countryNameMap: Record<string, string> = {
    JP: "Japan 🇯🇵",
    KR: "South Korea 🇰🇷",
    CN: "China 🇨🇳",
    US: "United States 🇺🇸",
  };
  const countryOrigin = anime.countryOfOrigin ? countryNameMap[anime.countryOfOrigin] || anime.countryOfOrigin : null;

  // Next episode formatted schedule
  const nextAiringDateStr = anime.nextAiringEpisode?.airingAt
    ? new Date(anime.nextAiringEpisode.airingAt * 1000).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  // Demographic tag detection
  const demographicTag = anime.tags?.find((t) =>
    ["Shounen", "Seinen", "Shoujo", "Josei", "Kids"].includes(t.name)
  );

  // Poster & Backdrop image sources with guaranteed high-resolution fallback
  const posterSrc =
    anime.coverImage.extraLarge ||
    anime.coverImage.large ||
    anime.coverImage.medium;
  const backdropSrc =
    anime.bannerImage ||
    anime.coverImage.extraLarge ||
    anime.coverImage.large;

  // JSON-LD SEO Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": anime.format === "MOVIE" ? "Movie" : "TVSeries",
    name: displayTitle,
    alternateName: [anime.title.romaji, anime.title.native, ...(anime.synonyms || [])].filter(Boolean),
    image: posterSrc,
    description: cleanDescription,
    genre: anime.genres,
    ...(countryOrigin && { countryOfOrigin: anime.countryOfOrigin }),
    ...(mainStudioNode && {
      productionCompany: {
        "@type": "Organization",
        name: mainStudioNode.name,
      },
    }),
    ...(score && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: score,
        bestRating: "10",
        ratingCount: anime.popularity || 1000,
      },
    }),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-gray-100">
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Navbar */}
      <Navbar
        onWatchTrailer={() => {
          setTrailerOpen(true);
        }}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
        {/* Top Breadcrumb & Quick Actions Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg bg-[#141824] border border-[#222736]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
            <Breadcrumbs items={[{ label: "Catalog", href: "/#catalog" }, { label: displayTitle }]} />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Compare Shortcut */}
            <Link
              href={`/compare?a=${anime.id}`}
              className="px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202636] border border-[#262c3d] text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
              title="Compare side-by-side with another anime"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
              <span>Compare</span>
            </Link>

            {/* Share / Copy Link Button */}
            <button
              onClick={handleShare}
              className="px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202636] border border-[#262c3d] text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
              title="Copy page link to clipboard"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copiedLink ? "Link Copied!" : "Share"}</span>
            </button>

            {/* Official Portal / Website Link */}
            {officialSite && (
              <a
                href={officialSite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202636] border border-[#262c3d] text-xs font-semibold text-sky-300 hover:text-white transition-colors flex items-center gap-1.5"
                title="Official Anime Website (Japan)"
              >
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Official Site</span>
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </a>
            )}

            {/* Official X / Twitter Account */}
            {officialTwitter && (
              <a
                href={officialTwitter.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202636] border border-[#262c3d] text-xs font-semibold text-cyan-300 hover:text-white transition-colors flex items-center gap-1.5"
                title="Official X / Twitter Account"
              >
                <span className="font-bold text-xs text-cyan-400">𝕏</span>
                <span>Official X</span>
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </a>
            )}

            {/* Official AniList & MAL external links */}
            <div className="flex items-center gap-2 text-xs text-gray-400 pl-1">
              <a
                href={`https://anilist.co/anime/${anime.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors flex items-center gap-1"
                title="View on Official AniList"
              >
                <span>AniList #{anime.id}</span>
                <ExternalLink className="w-3 h-3 text-gray-500" />
              </a>

              {anime.idMal && (
                <>
                  <span className="text-gray-600">•</span>
                  <a
                    href={`https://myanimelist.net/anime/${anime.idMal}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 transition-colors flex items-center gap-1"
                    title="View on MyAnimeList"
                  >
                    <span>MAL #{anime.idMal}</span>
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hero Spotlight Card with Ambient Glow */}
        <section
          id="overview"
          className="relative rounded-2xl bg-[#131622] border border-[#222736] overflow-hidden shadow-xl"
        >
          {/* Ambient Backdrop Artwork & Gradient Blend */}
          {backdropSrc && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={backdropSrc}
                alt={displayTitle}
                className={`w-full h-full object-cover transition-opacity duration-700 ${
                  anime.bannerImage ? "opacity-20" : "opacity-10 blur-2xl scale-110"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131622] via-[#131622]/85 to-transparent" />
              <div
                className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{ backgroundColor: accentColor }}
              />
            </div>
          )}

          <div className="relative z-10 p-5 sm:p-8 flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
            {/* Poster Column */}
            <div className="w-44 sm:w-56 flex-shrink-0 mx-auto md:mx-0">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-[#282f42] bg-[#1a1f2e] shadow-2xl group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterSrc}
                  alt={displayTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Score Pill */}
                {score && (
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#10131a]/95 text-white text-xs font-black border border-[#282f42] flex items-center gap-1.5 shadow-lg backdrop-blur-sm"
                    title={anime.meanScore ? `AniList Score: ${score}/10 (${anime.meanScore}% Community Mean)` : `Score: ${score}/10`}
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{score}</span>
                  </div>
                )}

                {/* Format Tag */}
                {anime.format && (
                  <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-gray-200 border border-white/10 uppercase tracking-wide">
                    {anime.format.replace("_", " ")}
                  </div>
                )}
              </div>

              {/* Status & Airing Details Pill */}
              <div className="mt-3 text-center">
                {anime.nextAiringEpisode ? (
                  <div className="text-xs font-semibold px-3 py-2 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/30 flex flex-col items-center justify-center gap-0.5 shadow-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                      <span>
                        Ep {anime.nextAiringEpisode.episode} {formatTimeUntilAiring(anime.nextAiringEpisode.timeUntilAiring)}
                      </span>
                    </div>
                    {nextAiringDateStr && (
                      <span className="text-[10px] text-blue-300/80 font-normal">
                        {nextAiringDateStr}
                      </span>
                    )}
                  </div>
                ) : anime.status === "FINISHED" ? (
                  <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Completed {anime.episodes ? `(${anime.episodes} eps)` : ""}</span>
                  </div>
                ) : (
                  <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#181d2a] text-gray-300 border border-[#262c3d]">
                    {anime.status?.replace("_", " ") || "Released"}
                  </div>
                )}
              </div>
            </div>

            {/* Info Column */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Titles & Native Translation */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                  {displayTitle}
                </h1>

                <div className="flex items-center gap-2 sm:gap-3 mt-1.5 text-xs sm:text-sm text-gray-400 flex-wrap">
                  {secondaryTitle && <span className="font-medium text-gray-300">{secondaryTitle}</span>}
                  {secondaryTitle && nativeTitle && <span className="text-gray-600">•</span>}
                  {nativeTitle && (
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <span>{nativeTitle}</span>
                      <button
                        onClick={handleCopyNative}
                        className="text-gray-500 hover:text-white transition-colors p-0.5 rounded"
                        title="Copy Japanese Title"
                      >
                        {copiedNative ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Synonyms / Alternative Aliases with Expand Toggle */}
                {anime.synonyms && anime.synonyms.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-400 mt-2.5">
                    <span className="text-gray-500 font-semibold text-[11px]">Aliases:</span>
                    {(showAllSynonyms ? anime.synonyms : anime.synonyms.slice(0, 4)).map((syn, i) => (
                      <span
                        key={i}
                        title={syn}
                        className="px-2 py-0.5 rounded-md bg-[#161a25] border border-[#222736] text-[11px] text-gray-400 max-w-[200px] sm:max-w-xs truncate"
                      >
                        {syn}
                      </span>
                    ))}
                    {anime.synonyms.length > 4 && (
                      <button
                        onClick={() => setShowAllSynonyms(!showAllSynonyms)}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        {showAllSynonyms ? "Show less" : `+${anime.synonyms.length - 4} more`}
                      </button>
                    )}
                  </div>
                )}

                {/* Official AniList Award Ribbons & Rankings */}
                {anime.rankings && anime.rankings.length > 0 && (
                  <div className="mt-3">
                    <AnimeRankingsStrip rankings={anime.rankings} />
                  </div>
                )}
              </div>

              {/* Key Highlights & Community Metrics Shelf */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {/* Popularity / Members */}
                {anime.popularity && (
                  <span
                    className="px-2.5 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-xs font-semibold text-gray-300 flex items-center gap-1.5"
                    title="Community Members Tracking this Anime"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>{formatCompactNumber(anime.popularity)} Trackers</span>
                  </span>
                )}

                {/* Favorites */}
                {anime.favourites && (
                  <span
                    className="px-2.5 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-xs font-semibold text-gray-300 flex items-center gap-1.5"
                    title="All-Time Community Favorites"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>{formatCompactNumber(anime.favourites)} Favorites</span>
                  </span>
                )}

                {/* Mean Score Badge */}
                {anime.meanScore && (
                  <span
                    className="px-2.5 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-xs font-semibold text-gray-300 flex items-center gap-1.5"
                    title="AniList Community Mean Score"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{anime.meanScore}% Mean</span>
                  </span>
                )}

                {/* Age Rating / Content Advisory */}
                {anime.isAdult ? (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>18+ Mature</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>All Audiences</span>
                  </span>
                )}

                {/* Demographic Tag */}
                {demographicTag && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                    {demographicTag.name}
                  </span>
                )}

                {/* Animation Studio */}
                {studio && (
                  <Link
                    href="/studios"
                    className="px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#22283a] border border-[#262c3d] hover:border-blue-500/40 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors"
                    title={`Explore ${studio} animation catalog`}
                  >
                    <Building className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Studio: {studio}</span>
                  </Link>
                )}

                {/* Producers / Production Committee */}
                {producerNodes.length > 0 && (
                  <div
                    className="px-2.5 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-xs font-medium text-gray-300 flex items-center gap-1.5"
                    title={`Production Committee: ${producerNodes.map((p) => p.name).join(", ")}`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-gray-400">Producers:</span>
                    <span className="text-gray-200 font-medium">
                      {producerNodes.slice(0, 3).map((p) => p.name).join(", ")}
                      {producerNodes.length > 3 ? ` +${producerNodes.length - 3}` : ""}
                    </span>
                  </div>
                )}

                {/* Country of Origin */}
                {countryOrigin && (
                  <span
                    className="px-2.5 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-xs font-medium text-gray-300 flex items-center gap-1.5"
                    title="Country of Origin"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>{countryOrigin}</span>
                  </span>
                )}

                {/* Season & Year */}
                {anime.season && anime.seasonYear && (
                  <span className="px-2.5 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-xs font-medium text-gray-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {anime.season} {anime.seasonYear}
                    </span>
                  </span>
                )}

                {/* Broadcast Range */}
                {broadcastRange && (
                  <span
                    className="px-2.5 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-xs font-medium text-gray-300 flex items-center gap-1.5"
                    title="Broadcast Run"
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{broadcastRange}</span>
                  </span>
                )}

                {/* Episode Duration */}
                {anime.duration && (
                  <span className="px-2.5 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-xs font-medium text-gray-400">
                    {anime.duration} min / ep
                  </span>
                )}

                {/* Source Material */}
                {anime.source && (
                  <span className="px-2.5 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-xs font-medium text-gray-400 capitalize">
                    Source: {anime.source.toLowerCase().replace("_", " ")}
                  </span>
                )}

                {/* Official Hashtag */}
                {anime.hashtag && (
                  <span className="px-2.5 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-xs font-medium text-gray-400 flex items-center gap-1">
                    <Hash className="w-3 h-3 text-cyan-400" />
                    <span>{anime.hashtag.split(" ")[0]}</span>
                  </span>
                )}
              </div>

              {/* Synopsis with See More / Expand Toggle */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Synopsis
                  </h3>
                  {isLongSynopsis && (
                    <button
                      onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      aria-expanded={synopsisExpanded}
                    >
                      <span>{synopsisExpanded ? "Collapse" : "Read full"}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          synopsisExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <p
                    className={`text-xs sm:text-sm text-gray-300 leading-relaxed max-w-3xl whitespace-pre-line transition-all duration-300 ${
                      !synopsisExpanded && isLongSynopsis ? "line-clamp-3 sm:line-clamp-4" : ""
                    }`}
                  >
                    {cleanDescription}
                  </p>
                  {!synopsisExpanded && isLongSynopsis && (
                    <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#131622] to-transparent pointer-events-none" />
                  )}
                </div>

                {isLongSynopsis && (
                  <button
                    onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#181d2a] hover:bg-[#22283a] border border-[#262c3d] text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    aria-expanded={synopsisExpanded}
                  >
                    <span>{synopsisExpanded ? "Show Less" : "Read Full Synopsis"}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        synopsisExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {anime.genres?.map((g) => (
                  <Link
                    key={g}
                    href={`/browse?genre=${encodeURIComponent(g)}`}
                    className="text-xs text-gray-300 hover:text-white px-2.5 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202738] border border-[#252c3e] hover:border-blue-500/40 transition-colors font-medium"
                  >
                    {g}
                  </Link>
                ))}
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                {anime.trailer?.id && (
                  <button
                    onClick={() => setTrailerOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-rose-600/20"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Watch Trailer</span>
                  </button>
                )}

                {primaryStream && (
                  <a
                    href={primaryStream.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <span>Stream on {primaryStream.site}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <a
                  href="#watch-officially"
                  onClick={(e) => handleScrollToSection(e, "watch-officially")}
                  className="px-4 py-2.5 rounded-xl bg-[#181d2a] hover:bg-[#202533] text-gray-200 hover:text-white border border-[#262c3d] text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5"
                >
                  <Tv className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Where to Watch</span>
                </a>

                {anime.relations?.edges && anime.relations.edges.length > 0 && (
                  <Link
                    href={`/anime/${anime.id}/franchise`}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
                    title="Explore full timeline & watch order guide"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Watch Order ({anime.relations.edges.length})</span>
                  </Link>
                )}

                <WatchlistButton anime={anime} />

                <Link
                  href={`/compare?a=${anime.id}`}
                  className="px-4 py-2.5 rounded-xl bg-[#181d2a] hover:bg-[#202533] text-gray-300 hover:text-white border border-[#262c3d] text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                  <span>Compare</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky Anchor In-Page Sub-Navigation Bar */}
        <nav
          aria-label="Section navigation"
          className="sticky top-16 z-20 -my-2 py-2.5 px-3 rounded-xl bg-[#10141f]/95 backdrop-blur-md border border-[#212738] overflow-x-auto shadow-md scrollbar-none flex items-center gap-1.5"
        >
          <a
            href="#overview"
            onClick={(e) => handleScrollToSection(e, "overview")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSection === "overview"
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-gray-300 hover:text-white hover:bg-[#181d2c] font-semibold"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Overview</span>
          </a>

          <a
            href="#watch-officially"
            onClick={(e) => handleScrollToSection(e, "watch-officially")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSection === "watch-officially"
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-gray-300 hover:text-white hover:bg-[#181d2c] font-semibold"
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-emerald-400" />
            <span>Where to Watch</span>
          </a>

          <a
            href="#episodes"
            onClick={(e) => handleScrollToSection(e, "episodes")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSection === "episodes"
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-gray-300 hover:text-white hover:bg-[#181d2c] font-semibold"
            }`}
          >
            <Film className="w-3.5 h-3.5 text-sky-400" />
            <span>
              Episodes {anime.episodes ? `(${anime.episodes})` : anime.streamingEpisodes?.length ? `(${anime.streamingEpisodes.length})` : ""}
            </span>
          </a>

          {anime.tags && anime.tags.length > 0 && (
            <a
              href="#tags"
              onClick={(e) => handleScrollToSection(e, "tags")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeSection === "tags"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-[#181d2c] font-semibold"
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Tags</span>
            </a>
          )}

          {anime.characters?.edges && anime.characters.edges.length > 0 && (
            <a
              href="#characters"
              onClick={(e) => handleScrollToSection(e, "characters")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeSection === "characters"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-[#181d2c] font-semibold"
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-blue-400" />
              <span>Voice Cast</span>
            </a>
          )}

          {anime.staff?.edges && anime.staff.edges.length > 0 && (
            <a
              href="#staff"
              onClick={(e) => handleScrollToSection(e, "staff")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeSection === "staff"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-[#181d2c] font-semibold"
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Staff</span>
            </a>
          )}

          <a
            href="#themes"
            onClick={(e) => handleScrollToSection(e, "themes")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSection === "themes"
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-gray-300 hover:text-white hover:bg-[#181d2c] font-semibold"
            }`}
          >
            <Disc3 className="w-3.5 h-3.5 text-purple-400" />
            <span>Themes (OP/ED)</span>
          </a>

          {anime.relations?.edges && anime.relations.edges.length > 0 && (
            <a
              href="#franchise"
              onClick={(e) => handleScrollToSection(e, "franchise")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeSection === "franchise"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-[#181d2c] font-semibold"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              <span>Franchise</span>
            </a>
          )}

          <a
            href="#merch"
            onClick={(e) => handleScrollToSection(e, "merch")}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSection === "merch"
                ? "bg-blue-600 text-white font-bold shadow-sm"
                : "text-gray-300 hover:text-white hover:bg-[#181d2c] font-semibold"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-rose-400" />
            <span>Manga & Merch</span>
          </a>

          {anime.stats && (
            <a
              href="#stats"
              onClick={(e) => handleScrollToSection(e, "stats")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeSection === "stats"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-[#181d2c] font-semibold"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Stats</span>
            </a>
          )}

          {anime.recommendations?.nodes && anime.recommendations.nodes.length > 0 && (
            <a
              href="#recommendations"
              onClick={(e) => handleScrollToSection(e, "recommendations")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeSection === "recommendations"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-[#181d2c] font-semibold"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Similar</span>
            </a>
          )}

          {anime.reviews?.nodes && anime.reviews.nodes.length > 0 && (
            <a
              href="#reviews"
              onClick={(e) => handleScrollToSection(e, "reviews")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeSection === "reviews"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-[#181d2c] font-semibold"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Reviews</span>
            </a>
          )}

          {anime.trailer?.id && (
            <a
              href="#trailer"
              onClick={(e) => handleScrollToSection(e, "trailer")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeSection === "trailer"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-[#181d2c] font-semibold"
              }`}
            >
              <Play className="w-3.5 h-3.5 text-rose-400" />
              <span>Trailer</span>
            </a>
          )}
        </nav>

        {/* Where to Watch Box (Signature Affiliate Hub) */}
        <div id="watch-officially" className="scroll-mt-32 sm:scroll-mt-36">
          <StreamingAffiliateBox anime={anime} />
        </div>

        {/* Official Streaming Episode Guide (Auto-Resolved Direct Stream Launchers) */}
        <div id="episodes" className="scroll-mt-32 sm:scroll-mt-36">
          <EpisodeGuide anime={anime} />
        </div>

        {/* Community Voted Tags & Tropes (AniList Community Insights) */}
        {anime.tags && anime.tags.length > 0 && (
          <div id="tags" className="scroll-mt-32 sm:scroll-mt-36">
            <AnimeTagCloud tags={anime.tags} />
          </div>
        )}

        {/* Interactive Seiyuu Visualizer */}
        {anime.characters?.edges && anime.characters.edges.length > 0 && (
          <div id="characters" className="scroll-mt-32 sm:scroll-mt-36">
            <SeiyuuVisualizer characters={anime.characters} />
          </div>
        )}

        {/* Key Production Staff & Creators (Director, Music, Composition) */}
        {anime.staff?.edges && anime.staff.edges.length > 0 && (
          <div id="staff" className="scroll-mt-32 sm:scroll-mt-36">
            <KeyStaffDirectory staff={anime.staff} />
          </div>
        )}

        {/* Official Theme Songs & Soundtracks Guide (OP/ED) */}
        <div id="themes" className="scroll-mt-32 sm:scroll-mt-36">
          <ThemeSongsSection animeTitle={displayTitle} synonyms={anime.synonyms} />
        </div>

        {/* Franchise Relations & Timeline */}
        {anime.relations?.edges && anime.relations.edges.length > 0 && (
          <div id="franchise" className="scroll-mt-32 sm:scroll-mt-36">
            <FranchiseRelations relations={anime.relations} animeId={anime.id} />
          </div>
        )}

        {/* Manga & Official Merchandise Hub (Amazon Affiliate Monetization) */}
        <div id="merch" className="scroll-mt-32 sm:scroll-mt-36">
          <MangaMerchAffiliate anime={anime} />
        </div>

        {/* Community Stats & Score Distribution (Signature AniList Feature) */}
        {anime.stats && (
          <div id="stats" className="scroll-mt-32 sm:scroll-mt-36">
            <AnimeStatsVisualizer stats={anime.stats} />
          </div>
        )}

        {/* Community Recommendations ("You May Also Like") */}
        {anime.recommendations?.nodes && anime.recommendations.nodes.length > 0 && (
          <div id="recommendations" className="scroll-mt-32 sm:scroll-mt-36">
            <AnimeRecommendations
              recommendations={anime.recommendations}
              onWatchTrailer={() => setTrailerOpen(true)}
            />
          </div>
        )}

        {/* Community Reviews & Editorial Critiques */}
        {anime.reviews?.nodes && anime.reviews.nodes.length > 0 && (
          <div id="reviews" className="scroll-mt-32 sm:scroll-mt-36">
            <AnimeReviewsSection reviews={anime.reviews} />
          </div>
        )}

        {/* In-Page Official Trailer Embed (if available) */}
        {anime.trailer?.id && (
          <section id="trailer" className="scroll-mt-32 sm:scroll-mt-36 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-rose-500" />
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Official YouTube Trailer
              </h3>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#222736] bg-black shadow-lg">
              <iframe
                src={`https://www.youtube.com/embed/${anime.trailer.id}?rel=0&modestbranding=1`}
                title={`${displayTitle} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          </section>
        )}
      </main>

      {/* Comprehensive Modern Footer */}
      <Footer />

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        trailerId={anime.trailer?.id || null}
        title={displayTitle}
        streamUrl={primaryStream?.url}
        streamSite={primaryStream?.site}
      />
    </div>
  );
}
