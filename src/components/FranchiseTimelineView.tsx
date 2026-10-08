"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  GitBranch,
  ArrowLeft,
  Calendar,
  Film,
  Tv,
  BookOpen,
  Sparkles,
  Star,
  Clock,
  CheckCircle2,
  Share2,
  ExternalLink,
  Info,
  HelpCircle,
  Play,
  ShoppingBag,
  Layers,
  Flame,
  Check,
} from "lucide-react";
import { FranchiseData, FranchiseItem } from "@/lib/types";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";

interface FranchiseTimelineViewProps {
  franchiseData: FranchiseData;
}

type OrderMode = "recommended" | "release" | "chronological" | "all";
type FilterCategory = "all" | "anime" | "movies" | "ovas" | "manga";

export default function FranchiseTimelineView({ franchiseData }: FranchiseTimelineViewProps) {
  const [orderMode, setOrderMode] = useState<OrderMode>("recommended");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [copiedLink, setCopiedLink] = useState(false);

  const { primary, items, totalEpisodes, totalWorks, earliestYear, latestYear } = franchiseData;
  const primaryTitle = primary.title.english || primary.title.romaji;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Sort items based on selected orderMode
  const sortedItems = useMemo(() => {
    const list = [...items];

    if (orderMode === "release") {
      return list.sort((a, b) => {
        const yearA = a.seasonYear || a.startDate?.year || 9999;
        const yearB = b.seasonYear || b.startDate?.year || 9999;
        if (yearA !== yearB) return yearA - yearB;
        const monthA = a.startDate?.month || 12;
        const monthB = b.startDate?.month || 12;
        return monthA - monthB;
      });
    }

    if (orderMode === "chronological") {
      // In-universe chronological: Prequels first, then primary, then sequels, then others
      const priorityMap: Record<string, number> = {
        PREQUEL: 1,
        PRIMARY: 2,
        SEQUEL: 3,
        PARENT: 2,
        SIDE_STORY: 4,
        ADAPTATION: 5,
        ALTERNATIVE: 6,
        SPIN_OFF: 7,
        SUMMARY: 8,
      };
      return list.sort((a, b) => {
        const pA = priorityMap[a.relationType] || 5;
        const pB = priorityMap[b.relationType] || 5;
        if (pA !== pB) return pA - pB;
        const yearA = a.seasonYear || a.startDate?.year || 9999;
        const yearB = b.seasonYear || b.startDate?.year || 9999;
        return yearA - yearB;
      });
    }

    if (orderMode === "recommended") {
      // Curated recommended: Canon main story and movies, then prequels, then side stories
      const tierPriority: Record<string, number> = {
        CANON_MAIN: 1,
        CANON_MOVIE: 2,
        CANON_OVA: 3,
        ORIGINAL_SOURCE: 4,
        SPIN_OFF: 5,
        SUMMARY: 6,
      };
      return list.sort((a, b) => {
        const tA = tierPriority[a.tier] || 3;
        const tB = tierPriority[b.tier] || 3;
        if (tA !== tB) return tA - tB;
        const yearA = a.seasonYear || a.startDate?.year || 9999;
        const yearB = b.seasonYear || b.startDate?.year || 9999;
        return yearA - yearB;
      });
    }

    // Default: all / grouped
    return list;
  }, [items, orderMode]);

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (filterCategory === "all") return sortedItems;
    if (filterCategory === "anime") {
      return sortedItems.filter((i) => i.format === "TV" || i.format === "ONA");
    }
    if (filterCategory === "movies") {
      return sortedItems.filter((i) => i.format === "MOVIE");
    }
    if (filterCategory === "ovas") {
      return sortedItems.filter((i) => i.format === "OVA" || i.format === "SPECIAL");
    }
    if (filterCategory === "manga") {
      return sortedItems.filter((i) => i.format === "MANGA" || i.format === "NOVEL");
    }
    return sortedItems;
  }, [sortedItems, filterCategory]);

  const backdropSrc = primary.bannerImage || primary.coverImage.extraLarge || primary.coverImage.large;

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-gray-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
        {/* Top Breadcrumb & Actions Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/anime/${primary.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg bg-[#141824] border border-[#222736]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Anime</span>
            </Link>
            <Breadcrumbs
              items={[
                { label: "Catalog", href: "/#catalog" },
                { label: primaryTitle, href: `/anime/${primary.id}` },
                { label: "Franchise Watch Order" },
              ]}
            />
          </div>

          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-lg bg-[#181d2a] hover:bg-[#202636] border border-[#262c3d] text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{copiedLink ? "Link Copied!" : "Share Watch Order"}</span>
          </button>
        </div>

        {/* Hero Spotlight Header Card */}
        <section className="relative rounded-2xl bg-[#131622] border border-[#222736] overflow-hidden shadow-xl">
          {backdropSrc && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={backdropSrc}
                alt={primaryTitle}
                className="w-full h-full object-cover opacity-20 blur-xl scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131622] via-[#131622]/90 to-transparent" />
            </div>
          )}

          <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-28 sm:w-36 aspect-[3/4] rounded-xl overflow-hidden border border-[#282f42] bg-[#1a1f2e] shadow-xl flex-shrink-0 mx-auto md:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primary.coverImage.extraLarge || primary.coverImage.large}
                alt={primaryTitle}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <GitBranch className="w-3 h-3 text-emerald-400" />
                  Official Franchise Roadmap
                </span>
                {earliestYear && latestYear && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#181d2a] text-gray-300 border border-[#262c3d]">
                    Active: {earliestYear} – {latestYear}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                {primaryTitle} — Complete Watch Order & Franchise Guide
              </h1>

              <p className="text-xs sm:text-sm text-gray-300 max-w-3xl leading-relaxed">
                Explore the complete timeline for the <strong className="text-white">{primaryTitle}</strong> universe. Follow our recommended beginner watch order, chronologically unroll prequel backstories and canon movies, or dive into the original manga and light novel adaptations.
              </p>

              {/* Stats highlights shelf */}
              <div className="flex items-center gap-2.5 flex-wrap pt-2">
                <div className="px-3 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>{totalWorks} Total Works</span>
                </div>
                <div className="px-3 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{totalEpisodes} Anime Episodes</span>
                </div>
                {primary.averageScore && (
                  <div className="px-3 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{(primary.averageScore / 10).toFixed(1)} Benchmark Rating</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Watch Order Strategy Switcher */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Select Watch Order Mode</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Switch between curated newcomer roadmaps, air-date release chronology, or story lore order.
              </p>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 bg-[#141824] p-1 rounded-xl border border-[#222736]">
              {[
                { id: "recommended", label: "⭐ Recommended Order", desc: "Best newcomer narrative experience" },
                { id: "release", label: "📅 Release Date Order", desc: "How it originally broadcasted" },
                { id: "chronological", label: "⏳ Story Lore Order", desc: "In-universe chronological timeline" },
                { id: "all", label: "📚 Complete Universe", desc: "Includes all media & spin-offs" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setOrderMode(mode.id as OrderMode)}
                  title={mode.desc}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                    orderMode === mode.id
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                      : "text-gray-400 hover:text-white hover:bg-[#1a2030]"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Media Format Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 text-xs">
            <span className="text-gray-500 font-semibold text-[11px] pr-1">Filter Media:</span>
            {[
              { id: "all", label: "All Formats" },
              { id: "anime", label: "Anime Series (TV)" },
              { id: "movies", label: "Theatrical Movies" },
              { id: "ovas", label: "OVAs & Specials" },
              { id: "manga", label: "Manga & Light Novels" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id as FilterCategory)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  filterCategory === cat.id
                    ? "bg-[#252f48] text-blue-300 border border-blue-500/50"
                    : "bg-[#141824] text-gray-400 hover:text-white border border-[#222736]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Visual Timeline Track */}
        <section className="flex flex-col gap-4">
          <div className="relative pl-6 sm:pl-8 border-l-2 border-blue-500/30 flex flex-col gap-6 ml-3 sm:ml-4">
            {filteredItems.map((item, idx) => {
              const itemTitle = item.title.english || item.title.romaji;
              const isAnime = item.format !== "MANGA" && item.format !== "NOVEL";
              const stepNumber = String(idx + 1).padStart(2, "0");

              // Badge configs
              const tierBadgeMap: Record<string, { label: string; bg: string; text: string; border: string }> = {
                CANON_MAIN: {
                  label: "Canon Main Story",
                  bg: "bg-emerald-500/15",
                  text: "text-emerald-300",
                  border: "border-emerald-500/35",
                },
                CANON_MOVIE: {
                  label: "Canon Theatrical Movie",
                  bg: "bg-blue-500/15",
                  text: "text-blue-300",
                  border: "border-blue-500/35",
                },
                CANON_OVA: {
                  label: "Canon OVA / Prequel",
                  bg: "bg-purple-500/15",
                  text: "text-purple-300",
                  border: "border-purple-500/35",
                },
                ORIGINAL_SOURCE: {
                  label: "Original Source Work",
                  bg: "bg-amber-500/15",
                  text: "text-amber-300",
                  border: "border-amber-500/35",
                },
                SPIN_OFF: {
                  label: "Spin-Off / Alternative",
                  bg: "bg-rose-500/15",
                  text: "text-rose-300",
                  border: "border-rose-500/35",
                },
                SUMMARY: {
                  label: "Recap Summary Film",
                  bg: "bg-gray-700/30",
                  text: "text-gray-400",
                  border: "border-gray-600/30",
                },
              };

              const badge = tierBadgeMap[item.tier] || tierBadgeMap.CANON_MAIN;

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Node Point */}
                  <div
                    className={`absolute -left-[31px] sm:-left-[39px] top-6 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      item.isPrimary
                        ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/50 scale-110"
                        : "bg-[#141824] border-gray-600 group-hover:border-blue-400 group-hover:bg-blue-950"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.isPrimary ? "bg-white animate-ping" : "bg-blue-400"
                      }`}
                    />
                  </div>

                  {/* Card Container */}
                  <div
                    className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 flex flex-col md:flex-row gap-4 sm:gap-5 items-start ${
                      item.isPrimary
                        ? "bg-gradient-to-r from-[#172238] to-[#141928] border-blue-500/50 shadow-lg shadow-blue-950/30"
                        : "bg-[#141824] border-[#222736] hover:border-[#333b52] hover:bg-[#181d2c]"
                    }`}
                  >
                    {/* Cover Art */}
                    <div className="w-20 sm:w-24 aspect-[3/4] rounded-xl overflow-hidden bg-[#1a1f2e] border border-[#282f42] flex-shrink-0 group-hover:border-blue-500/40 transition-colors shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.coverImage.extraLarge || item.coverImage.large || item.coverImage.medium}
                        alt={itemTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Information Content */}
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                      {/* Step index & Canon Tag */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 text-white font-mono font-black text-xs border border-white/10">
                          Step {stepNumber}
                        </span>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>

                        {item.relationType && item.relationType !== "PRIMARY" && (
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                            • {item.relationType.replace("_", " ")}
                          </span>
                        )}

                        {item.isPrimary && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40">
                            Currently Viewing
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">
                          {itemTitle}
                        </h3>
                        {item.title.romaji && item.title.english && (
                          <span className="text-xs text-gray-400 block mt-0.5 font-medium">
                            {item.title.romaji}
                          </span>
                        )}
                      </div>

                      {/* Meta Information Shelf */}
                      <div className="flex items-center gap-2.5 flex-wrap text-xs text-gray-400 pt-0.5">
                        {item.format && (
                          <span className="font-semibold text-gray-300 px-2 py-0.5 rounded bg-[#181d2a] border border-[#262c3d]">
                            {item.format}
                          </span>
                        )}
                        {item.episodes && (
                          <span>
                            {item.episodes} {item.format === "MANGA" ? "Chapters" : "Episodes"}
                          </span>
                        )}
                        {item.seasonYear && <span>• {item.seasonYear}</span>}
                        {item.status && (
                          <span>• {item.status.replace("_", " ").toLowerCase()}</span>
                        )}
                        {item.averageScore && (
                          <div className="flex items-center gap-1 text-amber-400 font-bold ml-auto sm:ml-0">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{(item.averageScore / 10).toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {/* Watch Recommendation Note */}
                      {item.watchTip && (
                        <div className="mt-1 p-2.5 rounded-lg bg-[#10141f] border border-[#202536] text-xs text-gray-300 flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            <strong className="text-gray-200">Viewing Guide:</strong> {item.watchTip}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Button Right */}
                    <div className="w-full md:w-auto flex md:flex-col justify-end gap-2 flex-shrink-0 pt-2 md:pt-0">
                      {isAnime ? (
                        <Link
                          href={`/anime/${item.id}`}
                          className="w-full md:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <span>Anime Details</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <a
                          href={`https://www.amazon.com/s?k=${encodeURIComponent(itemTitle)}+manga&tag=animedb0e-20`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full md:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-gray-950" />
                          <span>Official Manga</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Franchise Viewing FAQ & Tips */}
        <section className="rounded-2xl bg-[#131622] border border-[#222736] p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Franchise Watch Order FAQ & Viewing Advice
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
            <div className="p-4 rounded-xl bg-[#181d2a] border border-[#262c3d] flex flex-col gap-1.5">
              <h4 className="font-bold text-white text-sm">Where should newcomers start?</h4>
              <p className="text-gray-400 leading-relaxed">
                Always start with <strong className="text-white">{primaryTitle}</strong> or the primary Season 1 TV entry. Do not start with prequel OVAs or movies, as they often contain spoilers and presuppose familiarity with core world-building.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#181d2a] border border-[#262c3d] flex flex-col gap-1.5">
              <h4 className="font-bold text-white text-sm">Are the movies canon or filler?</h4>
              <p className="text-gray-400 leading-relaxed">
                Check the badge on each card above. Entries tagged with <strong className="text-blue-300">Canon Theatrical Movie</strong> are essential continuations written into the main timeline. Entries tagged with <strong className="text-rose-300">Spin-off</strong> or <strong className="text-gray-400">Recap</strong> can be safely skipped without missing plot developments.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
