"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Star,
  Trophy,
  Users,
  Building2,
  Calendar,
  Clock,
  Tv,
  CheckCircle2,
  ExternalLink,
  Search,
  Sparkles,
  ArrowRight,
  X,
  Play,
  Heart,
  Share2,
  Check,
  Shuffle,
  ChevronRight,
  Film,
  BookOpen,
  Crown,
  Flame,
  Layers,
  Info,
  SlidersHorizontal,
  Swords,
  TrendingUp,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import Navbar from "./Navbar";
import Footer from "./Footer";
import TrailerModal from "./TrailerModal";

interface AnimeCompareClientProps {
  initialAnimeA?: AnimeMedia | null;
  initialAnimeB?: AnimeMedia | null;
}

interface PresetMatchup {
  label: string;
  idA: number;
  idB: number;
  tag: string;
}

const PRESET_MATCHUPS: PresetMatchup[] = [
  { label: "AOT vs. Demon Slayer", idA: 16498, idB: 101922, tag: "Dark Fantasy Shounen" },
  { label: "Jujutsu Kaisen vs. Chainsaw Man", idA: 113415, idB: 127230, tag: "Modern MAPPA Giants" },
  { label: "Death Note vs. Code Geass", idA: 1535, idB: 1575, tag: "Psychological Masterminds" },
  { label: "Frieren vs. Steins;Gate", idA: 154587, idB: 9253, tag: "All-Time Top Rated" },
  { label: "Hunter x Hunter vs. FMAB", idA: 11061, idB: 5114, tag: "Peak Shounen Classics" },
  { label: "One Piece vs. Naruto", idA: 21, idB: 20, tag: "The Big Three Battle" },
  { label: "Vinland Saga vs. Berserk", idA: 101348, idB: 33, tag: "Grimdark Seinen Epics" },
  { label: "Bocchi the Rock! vs. K-ON!", idA: 130003, idB: 5680, tag: "Music & Slice of Life" },
];

const SUGGESTED_QUICK_SEARCH = [
  { id: 16498, title: "Attack on Titan" },
  { id: 101922, title: "Demon Slayer" },
  { id: 113415, title: "Jujutsu Kaisen" },
  { id: 154587, title: "Frieren" },
  { id: 127230, title: "Chainsaw Man" },
  { id: 5114, title: "Fullmetal Alchemist: Brotherhood" },
];

export default function AnimeCompareClient({
  initialAnimeA,
  initialAnimeB,
}: AnimeCompareClientProps) {
  const [animeA, setAnimeA] = useState<AnimeMedia | null>(initialAnimeA || null);
  const [animeB, setAnimeB] = useState<AnimeMedia | null>(initialAnimeB || null);

  const [searchQueryA, setSearchQueryA] = useState("");
  const [searchQueryB, setSearchQueryB] = useState("");
  const [searchResultsA, setSearchResultsA] = useState<AnimeMedia[]>([]);
  const [searchResultsB, setSearchResultsB] = useState<AnimeMedia[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  const [activeTab, setActiveTab] = useState<"all" | "ratings" | "production" | "seiyuu" | "story">("all");
  const [isCopied, setIsCopied] = useState(false);
  const [isLoadingMatchup, setIsLoadingMatchup] = useState(false);

  // Trailer modal state
  const [activeTrailer, setActiveTrailer] = useState<{
    isOpen: boolean;
    trailerId: string | null;
    title: string;
  } | null>(null);

  // Debounced search for slot A
  useEffect(() => {
    if (!searchQueryA.trim()) {
      setSearchResultsA([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoadingA(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQueryA)}`);
        const data = await res.json();
        setSearchResultsA(data.anime || data.results || []);
      } catch (err) {
        console.error("Search A error:", err);
      } finally {
        setLoadingA(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQueryA]);

  // Debounced search for slot B
  useEffect(() => {
    if (!searchQueryB.trim()) {
      setSearchResultsB([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoadingB(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQueryB)}`);
        const data = await res.json();
        setSearchResultsB(data.anime || data.results || []);
      } catch (err) {
        console.error("Search B error:", err);
      } finally {
        setLoadingB(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQueryB]);

  // Function to select anime for slot A and enrich full details
  const handleSelectAnimeA = async (item: AnimeMedia) => {
    setAnimeA(item);
    setSearchQueryA("");
    setSearchResultsA([]);
    try {
      const res = await fetch(`/api/anime/${item.id}`);
      if (res.ok) {
        const fullData = await res.json();
        if (fullData && fullData.id) {
          setAnimeA(fullData);
        }
      }
    } catch (e) {
      console.warn("Could not fetch enriched details for anime A:", e);
    }
    if (typeof window !== "undefined") {
      const nextBId = animeB?.id || "";
      window.history.replaceState(null, "", `/compare?a=${item.id}${nextBId ? `&b=${nextBId}` : ""}`);
    }
  };

  // Function to select anime for slot B and enrich full details
  const handleSelectAnimeB = async (item: AnimeMedia) => {
    setAnimeB(item);
    setSearchQueryB("");
    setSearchResultsB([]);
    try {
      const res = await fetch(`/api/anime/${item.id}`);
      if (res.ok) {
        const fullData = await res.json();
        if (fullData && fullData.id) {
          setAnimeB(fullData);
        }
      }
    } catch (e) {
      console.warn("Could not fetch enriched details for anime B:", e);
    }
    if (typeof window !== "undefined") {
      const nextAId = animeA?.id || "";
      window.history.replaceState(null, "", `/compare?${nextAId ? `a=${nextAId}&` : ""}b=${item.id}`);
    }
  };

  // Load Preset smoothly
  const loadPreset = async (idA: number, idB: number) => {
    setIsLoadingMatchup(true);
    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/anime/${idA}`),
        fetch(`/api/anime/${idB}`),
      ]);
      if (resA.ok && resB.ok) {
        const dataA = await resA.json();
        const dataB = await resB.json();
        setAnimeA(dataA);
        setAnimeB(dataB);
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", `/compare?a=${idA}&b=${idB}`);
        }
      } else {
        window.location.href = `/compare?a=${idA}&b=${idB}`;
      }
    } catch {
      window.location.href = `/compare?a=${idA}&b=${idB}`;
    } finally {
      setIsLoadingMatchup(false);
    }
  };

  // Swap Left and Right sides
  const handleSwap = () => {
    const currentA = animeA;
    const currentB = animeB;
    setAnimeA(currentB);
    setAnimeB(currentA);
    if (typeof window !== "undefined") {
      const idA = currentB?.id || "";
      const idB = currentA?.id || "";
      window.history.replaceState(null, "", `/compare?a=${idA}&b=${idB}`);
    }
  };

  // Pick a random matchup
  const handleRandomMatchup = () => {
    const remainingPresets = PRESET_MATCHUPS.filter(
      (p) => !(p.idA === animeA?.id && p.idB === animeB?.id)
    );
    const pick = remainingPresets[Math.floor(Math.random() * remainingPresets.length)] || PRESET_MATCHUPS[0];
    loadPreset(pick.idA, pick.idB);
  };

  // Copy shareable link
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    }
  };

  // Voice Actors (Seiyuu) Overlap Analysis
  const sharedVoiceActors = (() => {
    if (!animeA || !animeB) return [];

    const vaMapA = new Map<
      number,
      {
        vaName: string;
        vaImage?: string;
        charA: { name: string; image?: string; role?: string };
      }
    >();

    animeA.characters?.edges?.forEach((e) => {
      const va = e.voiceActors?.[0];
      if (va) {
        vaMapA.set(va.id, {
          vaName: va.name.full,
          vaImage: va.image?.large,
          charA: {
            name: e.node?.name?.full || "Character",
            image: e.node?.image?.large,
            role: e.role || "SUPPORTING",
          },
        });
      }
    });

    const matches: Array<{
      vaId: number;
      vaName: string;
      vaImage?: string;
      charA: { name: string; image?: string; role?: string };
      charB: { name: string; image?: string; role?: string };
    }> = [];

    animeB.characters?.edges?.forEach((e) => {
      const va = e.voiceActors?.[0];
      if (va && vaMapA.has(va.id)) {
        const aInfo = vaMapA.get(va.id)!;
        if (!matches.some((m) => m.vaId === va.id)) {
          matches.push({
            vaId: va.id,
            vaName: va.name.full,
            vaImage: va.image?.large || aInfo.vaImage,
            charA: aInfo.charA,
            charB: {
              name: e.node?.name?.full || "Character",
              image: e.node?.image?.large,
              role: e.role || "SUPPORTING",
            },
          });
        }
      }
    });

    return matches;
  })();

  // Genre Overlaps & Exclusives
  const genresA = animeA?.genres || [];
  const genresB = animeB?.genres || [];
  const sharedGenres = genresA.filter((g) => genresB.includes(g));
  const exclusiveGenresA = genresA.filter((g) => !genresB.includes(g));
  const exclusiveGenresB = genresB.filter((g) => !genresA.includes(g));

  // Numerical metrics
  const scoreA = animeA?.averageScore || 0;
  const scoreB = animeB?.averageScore || 0;
  const scoreTotal = scoreA + scoreB;
  const scorePctA = scoreTotal > 0 ? Math.round((scoreA / scoreTotal) * 100) : 50;
  const scorePctB = 100 - scorePctA;

  const popA = animeA?.popularity || 0;
  const popB = animeB?.popularity || 0;
  const popTotal = popA + popB;
  const popPctA = popTotal > 0 ? Math.round((popA / popTotal) * 100) : 50;
  const popPctB = 100 - popPctA;

  const favA = animeA?.favourites || 0;
  const favB = animeB?.favourites || 0;
  const favTotal = favA + favB;
  const favPctA = favTotal > 0 ? Math.round((favA / favTotal) * 100) : 50;
  const favPctB = 100 - favPctA;

  const episodesA = animeA?.episodes || 0;
  const episodesB = animeB?.episodes || 0;
  const durationA = animeA?.duration || 24;
  const durationB = animeB?.duration || 24;
  const watchTimeHoursA = episodesA > 0 ? ((episodesA * durationA) / 60).toFixed(1) : null;
  const watchTimeHoursB = episodesB > 0 ? ((episodesB * durationB) / 60).toFixed(1) : null;

  // Advantage tally
  let winsA = 0;
  let winsB = 0;
  if (scoreA > scoreB) winsA++;
  else if (scoreB > scoreA) winsB++;

  if (popA > popB) winsA++;
  else if (popB > popA) winsB++;

  if (favA > favB) winsA++;
  else if (favB > favA) winsB++;

  const studioA = animeA?.studios?.nodes?.[0]?.name || "Independent";
  const studioB = animeB?.studios?.nodes?.[0]?.name || "Independent";

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
          <span className="text-sky-400 font-medium">Head-to-Head Comparator</span>
        </nav>

        {/* Hero Banner Header */}
        <section className="relative rounded-2xl bg-gradient-to-br from-[#131724] via-[#151928] to-[#10131d] border border-[#22293b] p-6 sm:p-8 flex flex-col gap-5 overflow-hidden shadow-2xl">
          {/* Ambient decorative glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2.5 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1.5 shadow-sm">
                  <Swords className="w-3.5 h-3.5 text-sky-400" />
                  <span>VS ENGINE 2.0 • Head-to-Head Comparator</span>
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1e2436] text-gray-300 border border-[#2c354d]">
                  Side-by-Side Analytics
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Compare Anime Side-by-Side
              </h1>

              <p className="text-xs sm:text-sm text-gray-300/90 leading-relaxed">
                Compare critical ratings, global popularity, animation studios, release schedules, and uncover{" "}
                <span className="text-amber-400 font-semibold underline decoration-amber-400/40 underline-offset-2">
                  shared Japanese voice actors (Seiyuu)
                </span>{" "}
                starring across both legendary productions.
              </p>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
              <button
                onClick={handleRandomMatchup}
                disabled={isLoadingMatchup}
                className="px-3.5 py-2 rounded-xl bg-[#1b2133] hover:bg-[#222a42] border border-[#29324d] hover:border-sky-500/40 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Load a random legendary rivalry"
              >
                <Shuffle className="w-3.5 h-3.5 text-sky-400" />
                <span>Random Duel</span>
              </button>

              <button
                onClick={handleSwap}
                disabled={!animeA || !animeB}
                className="px-3.5 py-2 rounded-xl bg-[#1b2133] hover:bg-[#222a42] border border-[#29324d] hover:border-indigo-500/40 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                title="Swap sides"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                <span>Swap Sides</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-[#1b2133] hover:bg-[#222a42] border border-[#29324d] hover:border-emerald-500/40 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Share this matchup"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Share Matchup</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Popular Rivalries Carousel / Pill Bar */}
          <div className="relative z-10 pt-4 border-t border-[#20273a] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Legendary Rivalry Matchups</span>
              </span>
              <span className="text-[10px] text-gray-500 hidden sm:inline-block">Click to instantly load matchup</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {PRESET_MATCHUPS.map((preset, idx) => {
                const isActive =
                  (animeA?.id === preset.idA && animeB?.id === preset.idB) ||
                  (animeA?.id === preset.idB && animeB?.id === preset.idA);
                return (
                  <button
                    key={idx}
                    onClick={() => loadPreset(preset.idA, preset.idB)}
                    disabled={isLoadingMatchup}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? "bg-sky-500/20 border-sky-400/60 text-sky-200 shadow-md shadow-sky-500/10 font-semibold"
                        : "bg-[#161b2a] hover:bg-[#1d2438] border-[#252e44] hover:border-sky-500/40 text-gray-300 hover:text-white"
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded ${
                        isActive ? "bg-sky-500/30 text-sky-100" : "bg-[#1f2639] text-gray-400"
                      }`}
                    >
                      {preset.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dual Title Matchup Arena */}
        <section className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
            {/* Centered Floating VS Badge for Desktop */}
            <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex-col items-center">
              <button
                onClick={handleSwap}
                disabled={!animeA || !animeB}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1a2134] to-[#121624] border-2 border-[#2f3b58] hover:border-sky-400 text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
                title="Swap Left & Right Titles"
              >
                <div className="flex items-center justify-center font-black text-xs text-sky-400 group-hover:hidden">
                  VS
                </div>
                <ArrowLeftRight className="w-4 h-4 text-sky-400 hidden group-hover:block transition-transform duration-300" />
              </button>
            </div>

            {/* SLOT 1 (LEFT SIDE - BLUE/CYAN ACCENT) */}
            <div className="rounded-2xl bg-[#131724] border border-[#22293b] p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden shadow-lg transition-all hover:border-sky-500/30">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2436]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    Contender 1 (Left Side)
                  </span>
                </div>
                {animeA && (
                  <button
                    onClick={() => setAnimeA(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2030] transition-colors flex items-center gap-1 text-[11px]"
                    title="Change Anime"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </button>
                )}
              </div>

              {animeA ? (
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Poster Thumbnail */}
                  <div className="relative w-28 sm:w-32 aspect-[2/3] rounded-xl overflow-hidden bg-black flex-shrink-0 border border-[#29324a] shadow-lg group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={animeA.coverImage.extraLarge || animeA.coverImage.large || animeA.coverImage.medium}
                      alt={animeA.title.english || animeA.title.romaji}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-bold text-amber-400 flex items-center gap-0.5 border border-amber-400/30">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>{animeA.averageScore ? (animeA.averageScore / 10).toFixed(1) : "N/A"}</span>
                    </div>
                    {animeA.format && (
                      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-sky-500/80 backdrop-blur-md text-[9px] font-bold text-white uppercase">
                        {animeA.format}
                      </div>
                    )}
                  </div>

                  {/* Metadata & Actions */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch gap-3">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-2">
                        {animeA.title.english || animeA.title.romaji}
                      </h3>
                      {animeA.title.native && (
                        <p className="text-xs text-gray-500 truncate">{animeA.title.native}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1 text-gray-300">
                          <Building2 className="w-3.5 h-3.5 text-sky-400" />
                          <span>{studioA}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span>{animeA.seasonYear || animeA.startDate?.year || "TBA"}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Tv className="w-3.5 h-3.5 text-gray-500" />
                          <span>{animeA.episodes ? `${animeA.episodes} eps` : "Ongoing"}</span>
                        </span>
                      </div>
                    </div>

                    {/* Quick Button Row */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#1e2436] flex-wrap">
                      {animeA.trailer?.id && (
                        <button
                          onClick={() =>
                            setActiveTrailer({
                              isOpen: true,
                              trailerId: animeA.trailer?.id || null,
                              title: animeA.title.english || animeA.title.romaji,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Trailer</span>
                        </button>
                      )}

                      <Link
                        href={`/anime/${animeA.id}`}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1a2030] hover:bg-[#222a40] border border-[#2a344d] text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                /* Search Box Slot A */
                <div className="flex flex-col gap-3 py-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQueryA}
                      onChange={(e) => setSearchQueryA(e.target.value)}
                      placeholder="Search title by name (e.g. Attack on Titan, Frieren)..."
                      className="w-full bg-[#181d2c] border border-[#262f44] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                      autoFocus
                    />
                    {loadingA && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Dropdown search suggestions */}
                  {searchResultsA.length > 0 && (
                    <div className="bg-[#181d2c] border border-[#28324a] rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-[#20273a] z-30">
                      {searchResultsA.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectAnimeA(item)}
                          className="w-full p-2.5 text-left hover:bg-[#20273c] flex items-center gap-3 transition-colors group"
                        >
                          <div className="w-9 h-12 rounded-lg bg-black overflow-hidden flex-shrink-0 border border-[#2e374e]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.coverImage.medium || item.coverImage.large}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-white group-hover:text-sky-300 truncate block">
                              {item.title.english || item.title.romaji}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {item.format || "TV"} • {item.seasonYear || "TBA"} • ★{" "}
                              {item.averageScore ? (item.averageScore / 10).toFixed(1) : "N/A"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick Pick Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-gray-500 font-medium">Quick suggestions:</span>
                    {SUGGESTED_QUICK_SEARCH.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          fetch(`/api/anime/${q.id}`)
                            .then((r) => r.json())
                            .then((data) => handleSelectAnimeA(data));
                        }}
                        className="px-2 py-0.5 rounded-md bg-[#191f30] hover:bg-[#222a42] border border-[#273149] text-[10px] text-gray-300 hover:text-white transition-colors"
                      >
                        {q.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SLOT 2 (RIGHT SIDE - ROSE/PINK ACCENT) */}
            <div className="rounded-2xl bg-[#131724] border border-[#22293b] p-5 sm:p-6 flex flex-col gap-4 relative overflow-hidden shadow-lg transition-all hover:border-rose-500/30">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2436]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    Contender 2 (Right Side)
                  </span>
                </div>
                {animeB && (
                  <button
                    onClick={() => setAnimeB(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2030] transition-colors flex items-center gap-1 text-[11px]"
                    title="Change Anime"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </button>
                )}
              </div>

              {animeB ? (
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Poster Thumbnail */}
                  <div className="relative w-28 sm:w-32 aspect-[2/3] rounded-xl overflow-hidden bg-black flex-shrink-0 border border-[#29324a] shadow-lg group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={animeB.coverImage.extraLarge || animeB.coverImage.large || animeB.coverImage.medium}
                      alt={animeB.title.english || animeB.title.romaji}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-bold text-amber-400 flex items-center gap-0.5 border border-amber-400/30">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>{animeB.averageScore ? (animeB.averageScore / 10).toFixed(1) : "N/A"}</span>
                    </div>
                    {animeB.format && (
                      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-rose-500/80 backdrop-blur-md text-[9px] font-bold text-white uppercase">
                        {animeB.format}
                      </div>
                    )}
                  </div>

                  {/* Metadata & Actions */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch gap-3">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-2">
                        {animeB.title.english || animeB.title.romaji}
                      </h3>
                      {animeB.title.native && (
                        <p className="text-xs text-gray-500 truncate">{animeB.title.native}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1 text-gray-300">
                          <Building2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>{studioB}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span>{animeB.seasonYear || animeB.startDate?.year || "TBA"}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Tv className="w-3.5 h-3.5 text-gray-500" />
                          <span>{animeB.episodes ? `${animeB.episodes} eps` : "Ongoing"}</span>
                        </span>
                      </div>
                    </div>

                    {/* Quick Button Row */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#1e2436] flex-wrap">
                      {animeB.trailer?.id && (
                        <button
                          onClick={() =>
                            setActiveTrailer({
                              isOpen: true,
                              trailerId: animeB.trailer?.id || null,
                              title: animeB.title.english || animeB.title.romaji,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Trailer</span>
                        </button>
                      )}

                      <Link
                        href={`/anime/${animeB.id}`}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1a2030] hover:bg-[#222a40] border border-[#2a344d] text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                /* Search Box Slot B */
                <div className="flex flex-col gap-3 py-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQueryB}
                      onChange={(e) => setSearchQueryB(e.target.value)}
                      placeholder="Search title by name (e.g. Demon Slayer, Steins;Gate)..."
                      className="w-full bg-[#181d2c] border border-[#262f44] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                      autoFocus
                    />
                    {loadingB && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Dropdown search suggestions */}
                  {searchResultsB.length > 0 && (
                    <div className="bg-[#181d2c] border border-[#28324a] rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-[#20273a] z-30">
                      {searchResultsB.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectAnimeB(item)}
                          className="w-full p-2.5 text-left hover:bg-[#20273c] flex items-center gap-3 transition-colors group"
                        >
                          <div className="w-9 h-12 rounded-lg bg-black overflow-hidden flex-shrink-0 border border-[#2e374e]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.coverImage.medium || item.coverImage.large}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-white group-hover:text-rose-300 truncate block">
                              {item.title.english || item.title.romaji}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {item.format || "TV"} • {item.seasonYear || "TBA"} • ★{" "}
                              {item.averageScore ? (item.averageScore / 10).toFixed(1) : "N/A"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick Pick Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-gray-500 font-medium">Quick suggestions:</span>
                    {SUGGESTED_QUICK_SEARCH.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          fetch(`/api/anime/${q.id}`)
                            .then((r) => r.json())
                            .then((data) => handleSelectAnimeB(data));
                        }}
                        className="px-2 py-0.5 rounded-md bg-[#191f30] hover:bg-[#222a42] border border-[#273149] text-[10px] text-gray-300 hover:text-white transition-colors"
                      >
                        {q.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Both anime selected: Show Complete Analysis Suite */}
        {animeA && animeB ? (
          <div className="flex flex-col gap-8">
            {/* Advantage Scorecard Banner */}
            <section className="rounded-2xl bg-gradient-to-r from-sky-500/10 via-[#161a29] to-rose-500/10 border border-[#252d43] p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#1b2235] border border-[#2d3753] flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Head-to-Head Advantage Breakdown</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Live Assessment
                    </span>
                  </h3>
                  <p className="text-xs text-gray-300 mt-0.5">
                    {winsA > winsB ? (
                      <>
                        <span className="font-bold text-sky-400">{animeA.title.english || animeA.title.romaji}</span>{" "}
                        leads across {winsA} major metric categories over{" "}
                        <span className="text-gray-200">{animeB.title.english || animeB.title.romaji}</span>.
                      </>
                    ) : winsB > winsA ? (
                      <>
                        <span className="font-bold text-rose-400">{animeB.title.english || animeB.title.romaji}</span>{" "}
                        leads across {winsB} major metric categories over{" "}
                        <span className="text-gray-200">{animeA.title.english || animeA.title.romaji}</span>.
                      </>
                    ) : (
                      "Both titles are locked in a near-perfect tie across primary critical metrics."
                    )}
                  </p>
                </div>
              </div>

              {/* Tally badges */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-xs">
                  <span className="font-bold text-sky-300 truncate max-w-[120px]">
                    {animeA.title.english || animeA.title.romaji}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-sky-500/30 font-extrabold text-sky-200 text-[11px]">
                    {winsA} pts
                  </span>
                </div>
                <span className="text-xs font-black text-gray-500">VS</span>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs">
                  <span className="font-bold text-rose-300 truncate max-w-[120px]">
                    {animeB.title.english || animeB.title.romaji}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/30 font-extrabold text-rose-200 text-[11px]">
                    {winsB} pts
                  </span>
                </div>
              </div>
            </section>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#20273a] no-scrollbar">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold transition-all flex items-center gap-1.5 border-b-2 ${
                  activeTab === "all"
                    ? "border-sky-400 text-white bg-[#171c2c]"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#141825]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Metrics</span>
              </button>

              <button
                onClick={() => setActiveTab("ratings")}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold transition-all flex items-center gap-1.5 border-b-2 ${
                  activeTab === "ratings"
                    ? "border-sky-400 text-white bg-[#171c2c]"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#141825]"
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Scores & Fanbase</span>
              </button>

              <button
                onClick={() => setActiveTab("production")}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold transition-all flex items-center gap-1.5 border-b-2 ${
                  activeTab === "production"
                    ? "border-sky-400 text-white bg-[#171c2c]"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#141825]"
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Production & Studio</span>
              </button>

              <button
                onClick={() => setActiveTab("seiyuu")}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold transition-all flex items-center gap-1.5 border-b-2 ${
                  activeTab === "seiyuu"
                    ? "border-sky-400 text-white bg-[#171c2c]"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#141825]"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Shared Seiyuu ({sharedVoiceActors.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("story")}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold transition-all flex items-center gap-1.5 border-b-2 ${
                  activeTab === "story"
                    ? "border-sky-400 text-white bg-[#171c2c]"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#141825]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Themes & Genres</span>
              </button>
            </div>

            {/* TAB: METRIC COMPARISON MATRIX */}
            {(activeTab === "all" || activeTab === "ratings" || activeTab === "production") && (
              <section className="rounded-2xl bg-[#131724] border border-[#22293b] overflow-hidden shadow-xl">
                <div className="p-4 sm:p-5 border-b border-[#20273a] bg-[#161a29] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-bold text-white">Comparative Differential Breakdown</h2>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">Higher value highlighted with trophy crown</span>
                </div>

                <div className="divide-y divide-[#1d2334] text-xs">
                  {/* METRIC 1: AVERAGE COMMUNITY SCORE */}
                  {(activeTab === "all" || activeTab === "ratings") && (
                    <div className="p-4 sm:p-5 flex flex-col gap-2.5 hover:bg-[#161b2c]/50 transition-colors">
                      <div className="flex items-center justify-between">
                        {/* Title A Score */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-lg sm:text-xl font-black flex items-center gap-1 ${
                              scoreA > scoreB ? "text-emerald-400" : "text-gray-300"
                            }`}
                          >
                            <Star className="w-4 h-4 fill-current text-amber-400" />
                            <span>{scoreA ? (scoreA / 10).toFixed(1) : "N/A"}</span>
                          </span>
                          {scoreA > scoreB && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <Crown className="w-3 h-3 text-emerald-400" />
                              <span>+{(Math.abs(scoreA - scoreB) / 10).toFixed(1)} HIGHER</span>
                            </span>
                          )}
                        </div>

                        {/* Metric Label */}
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                          Average Community Rating
                        </span>

                        {/* Title B Score */}
                        <div className="flex items-center gap-2">
                          {scoreB > scoreA && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <Crown className="w-3 h-3 text-emerald-400" />
                              <span>+{(Math.abs(scoreB - scoreA) / 10).toFixed(1)} HIGHER</span>
                            </span>
                          )}
                          <span
                            className={`text-lg sm:text-xl font-black flex items-center gap-1 ${
                              scoreB > scoreA ? "text-emerald-400" : "text-gray-300"
                            }`}
                          >
                            <Star className="w-4 h-4 fill-current text-amber-400" />
                            <span>{scoreB ? (scoreB / 10).toFixed(1) : "N/A"}</span>
                          </span>
                        </div>
                      </div>

                      {/* Visual Differential Bar */}
                      <div className="w-full h-2.5 rounded-full bg-[#1b2132] overflow-hidden flex">
                        <div
                          style={{ width: `${scorePctA}%` }}
                          className={`h-full transition-all duration-500 ${
                            scoreA > scoreB
                              ? "bg-gradient-to-r from-sky-400 to-emerald-400"
                              : "bg-sky-500/40"
                          }`}
                        />
                        <div
                          style={{ width: `${scorePctB}%` }}
                          className={`h-full transition-all duration-500 ${
                            scoreB > scoreA
                              ? "bg-gradient-to-l from-rose-400 to-emerald-400"
                              : "bg-rose-500/40"
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* METRIC 2: GLOBAL POPULARITY (MEMBERS) */}
                  {(activeTab === "all" || activeTab === "ratings") && (
                    <div className="p-4 sm:p-5 flex flex-col gap-2.5 hover:bg-[#161b2c]/50 transition-colors">
                      <div className="flex items-center justify-between">
                        {/* Title A Popularity */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm sm:text-base font-bold ${
                              popA > popB ? "text-sky-300 font-extrabold" : "text-gray-300"
                            }`}
                          >
                            {popA.toLocaleString()} members
                          </span>
                          {popA > popB && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                              +{(popA - popB).toLocaleString()} MORE
                            </span>
                          )}
                        </div>

                        {/* Metric Label */}
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                          Global Popularity
                        </span>

                        {/* Title B Popularity */}
                        <div className="flex items-center gap-2">
                          {popB > popA && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              +{(popB - popA).toLocaleString()} MORE
                            </span>
                          )}
                          <span
                            className={`text-sm sm:text-base font-bold ${
                              popB > popA ? "text-rose-300 font-extrabold" : "text-gray-300"
                            }`}
                          >
                            {popB.toLocaleString()} members
                          </span>
                        </div>
                      </div>

                      {/* Visual Differential Bar */}
                      <div className="w-full h-2.5 rounded-full bg-[#1b2132] overflow-hidden flex">
                        <div
                          style={{ width: `${popPctA}%` }}
                          className={`h-full transition-all duration-500 ${
                            popA > popB
                              ? "bg-gradient-to-r from-sky-500 to-sky-300"
                              : "bg-sky-500/30"
                          }`}
                        />
                        <div
                          style={{ width: `${popPctB}%` }}
                          className={`h-full transition-all duration-500 ${
                            popB > popA
                              ? "bg-gradient-to-l from-rose-500 to-rose-300"
                              : "bg-rose-500/30"
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* METRIC 3: COMMUNITY FAVORITES */}
                  {(activeTab === "all" || activeTab === "ratings") && (
                    <div className="p-4 sm:p-5 flex flex-col gap-2.5 hover:bg-[#161b2c]/50 transition-colors">
                      <div className="flex items-center justify-between">
                        {/* Title A Favorites */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm sm:text-base font-bold flex items-center gap-1.5 ${
                              favA > favB ? "text-pink-300 font-extrabold" : "text-gray-300"
                            }`}
                          >
                            <Heart className="w-3.5 h-3.5 text-pink-500 fill-current" />
                            <span>{favA.toLocaleString()}</span>
                          </span>
                          {favA > favB && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">
                              +{(favA - favB).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Metric Label */}
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                          Community Favorites
                        </span>

                        {/* Title B Favorites */}
                        <div className="flex items-center gap-2">
                          {favB > favA && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">
                              +{(favB - favA).toLocaleString()}
                            </span>
                          )}
                          <span
                            className={`text-sm sm:text-base font-bold flex items-center gap-1.5 ${
                              favB > favA ? "text-pink-300 font-extrabold" : "text-gray-300"
                            }`}
                          >
                            <Heart className="w-3.5 h-3.5 text-pink-500 fill-current" />
                            <span>{favB.toLocaleString()}</span>
                          </span>
                        </div>
                      </div>

                      {/* Visual Differential Bar */}
                      <div className="w-full h-2.5 rounded-full bg-[#1b2132] overflow-hidden flex">
                        <div
                          style={{ width: `${favPctA}%` }}
                          className={`h-full transition-all duration-500 ${
                            favA > favB ? "bg-pink-500" : "bg-pink-500/30"
                          }`}
                        />
                        <div
                          style={{ width: `${favPctB}%` }}
                          className={`h-full transition-all duration-500 ${
                            favB > favA ? "bg-rose-500" : "bg-rose-500/30"
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* METRIC 4: ANIMATION STUDIO */}
                  {(activeTab === "all" || activeTab === "production") && (
                    <div className="p-4 sm:p-5 grid grid-cols-3 items-center hover:bg-[#161b2c]/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 font-semibold text-xs truncate">
                          {studioA}
                        </span>
                      </div>

                      <div className="text-center font-extrabold text-gray-400 uppercase text-[11px]">
                        Animation Studio
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold text-xs truncate">
                          {studioB}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* METRIC 5: EPISODES & TOTAL WATCH TIME */}
                  {(activeTab === "all" || activeTab === "production") && (
                    <div className="p-4 sm:p-5 grid grid-cols-3 items-center hover:bg-[#161b2c]/50 transition-colors">
                      <div>
                        <span className="font-bold text-white text-xs block">
                          {episodesA ? `${episodesA} Episodes` : "Ongoing Broadcast"}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {durationA} min/ep {watchTimeHoursA && `(~${watchTimeHoursA} hrs total)`}
                        </span>
                      </div>

                      <div className="text-center font-extrabold text-gray-400 uppercase text-[11px]">
                        Episodes & Runtime
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-white text-xs block">
                          {episodesB ? `${episodesB} Episodes` : "Ongoing Broadcast"}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {durationB} min/ep {watchTimeHoursB && `(~${watchTimeHoursB} hrs total)`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* METRIC 6: RELEASE PERIOD & RECENCY */}
                  {(activeTab === "all" || activeTab === "production") && (
                    <div className="p-4 sm:p-5 grid grid-cols-3 items-center hover:bg-[#161b2c]/50 transition-colors">
                      <div className="text-gray-200 font-medium">
                        <span className="text-xs font-semibold text-white block">
                          {animeA.season || ""} {animeA.seasonYear || animeA.startDate?.year || "TBA"}
                        </span>
                        <span className="text-[11px] text-gray-400 capitalize">
                          {animeA.status ? animeA.status.toLowerCase().replace(/_/g, " ") : "Unknown"}
                        </span>
                      </div>

                      <div className="text-center font-extrabold text-gray-400 uppercase text-[11px]">
                        Release Era & Status
                      </div>

                      <div className="text-right text-gray-200 font-medium">
                        <span className="text-xs font-semibold text-white block">
                          {animeB.season || ""} {animeB.seasonYear || animeB.startDate?.year || "TBA"}
                        </span>
                        <span className="text-[11px] text-gray-400 capitalize">
                          {animeB.status ? animeB.status.toLowerCase().replace(/_/g, " ") : "Unknown"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* METRIC 7: FORMAT & SOURCE MATERIAL */}
                  {(activeTab === "all" || activeTab === "production") && (
                    <div className="p-4 sm:p-5 grid grid-cols-3 items-center hover:bg-[#161b2c]/50 transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          {animeA.format || "TV Series"}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Source: {animeA.source?.replace(/_/g, " ") || "Original"}
                        </span>
                      </div>

                      <div className="text-center font-extrabold text-gray-400 uppercase text-[11px]">
                        Format & Source
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold text-white block">
                          {animeB.format || "TV Series"}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Source: {animeB.source?.replace(/_/g, " ") || "Original"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* TAB: SHARED CAST & SEIYUU OVERLAP (SIGNATURE FEATURE) */}
            {(activeTab === "all" || activeTab === "seiyuu") && (
              <section className="rounded-2xl bg-[#131724] border border-[#22293b] p-5 sm:p-6 flex flex-col gap-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#20273a]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                        <span>Shared Japanese Voice Actors (Seiyuu Overlap)</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {sharedVoiceActors.length} Overlapping Cast
                        </span>
                      </h3>
                      <p className="text-xs text-gray-400">
                        Actors performing notable roles in both productions
                      </p>
                    </div>
                  </div>
                </div>

                {sharedVoiceActors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sharedVoiceActors.map((match) => (
                      <div
                        key={match.vaId}
                        className="p-4 rounded-xl bg-gradient-to-br from-[#161b2b] to-[#121623] border border-[#232c42] hover:border-emerald-500/30 transition-all flex flex-col gap-3 group shadow-md"
                      >
                        {/* Voice Actor Header */}
                        <div className="flex items-center justify-between border-b border-[#20273c] pb-2.5">
                          <Link
                            href={`/staff/${match.vaId}`}
                            className="flex items-center gap-2.5 hover:text-emerald-400 transition-colors group/va"
                          >
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-black border border-[#2d3752] flex-shrink-0">
                              {match.vaImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={match.vaImage}
                                  alt={match.vaName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 bg-[#161a26]">
                                  <Users className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white group-hover/va:text-emerald-400 transition-colors flex items-center gap-1">
                                <span>{match.vaName}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                              </span>
                              <span className="text-[10px] text-gray-500">Voice Actor (Seiyuu)</span>
                            </div>
                          </Link>

                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1f273b] text-gray-300">
                            Shared Cast
                          </span>
                        </div>

                        {/* Dual Characters Faceoff */}
                        <div className="grid grid-cols-2 gap-3 items-center">
                          {/* Character in Anime A */}
                          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#181e30] border border-[#252f48]">
                            <div className="w-8 h-10 rounded overflow-hidden bg-black flex-shrink-0 border border-[#2d3854]">
                              {match.charA.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={match.charA.image}
                                  alt={match.charA.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                  <Users className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-semibold text-sky-200 block truncate">
                                {match.charA.name}
                              </span>
                              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">
                                in {animeA.title.english || animeA.title.romaji}
                              </span>
                            </div>
                          </div>

                          {/* Character in Anime B */}
                          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#181e30] border border-[#252f48]">
                            <div className="w-8 h-10 rounded overflow-hidden bg-black flex-shrink-0 border border-[#2d3854]">
                              {match.charB.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={match.charB.image}
                                  alt={match.charB.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                  <Users className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-semibold text-rose-200 block truncate">
                                {match.charB.name}
                              </span>
                              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">
                                in {animeB.title.english || animeB.title.romaji}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400 bg-[#151928] rounded-xl border border-[#22293b] flex flex-col items-center gap-2">
                    <Users className="w-6 h-6 text-gray-500 mb-1" />
                    <p className="font-medium text-gray-300">
                      No primary shared Japanese voice actors detected between these two series.
                    </p>
                    <p className="text-[11px] text-gray-500 max-w-md">
                      Try exploring matchups like{" "}
                      <button
                        onClick={() => loadPreset(16498, 101922)}
                        className="text-sky-400 hover:underline"
                      >
                        Attack on Titan vs Demon Slayer
                      </button>{" "}
                      or{" "}
                      <button
                        onClick={() => loadPreset(113415, 127230)}
                        className="text-rose-400 hover:underline"
                      >
                        Jujutsu Kaisen vs Chainsaw Man
                      </button>{" "}
                      for extensive seiyuu overlap.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* TAB: THEMES, GENRES & SYNOPSIS BREAKDOWN */}
            {(activeTab === "all" || activeTab === "story") && (
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Genres Analysis */}
                <div className="rounded-2xl bg-[#131724] border border-[#22293b] p-5 sm:p-6 flex flex-col gap-4 shadow-lg">
                  <div className="flex items-center gap-2 pb-3 border-b border-[#20273a]">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">Genre & Thematic Overlap</h3>
                  </div>

                  {/* Shared Genres */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-gray-300 flex items-center justify-between">
                      <span>Shared Genres ({sharedGenres.length})</span>
                      <span className="text-[10px] text-sky-400 font-semibold">Common ground</span>
                    </span>
                    {sharedGenres.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {sharedGenres.map((g) => (
                          <span
                            key={g}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-xs font-semibold text-sky-300"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No genres completely shared.</p>
                    )}
                  </div>

                  {/* Exclusive to A */}
                  {exclusiveGenresA.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-[#1d2334]">
                      <span className="text-xs font-bold text-gray-400">
                        Exclusive to {animeA.title.english || animeA.title.romaji}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {exclusiveGenresA.map((g) => (
                          <span
                            key={g}
                            className="px-2 py-0.5 rounded-md bg-[#191f30] border border-[#28324a] text-[11px] text-gray-300"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exclusive to B */}
                  {exclusiveGenresB.length > 0 && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-[#1d2334]">
                      <span className="text-xs font-bold text-gray-400">
                        Exclusive to {animeB.title.english || animeB.title.romaji}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {exclusiveGenresB.map((g) => (
                          <span
                            key={g}
                            className="px-2 py-0.5 rounded-md bg-[#191f30] border border-[#28324a] text-[11px] text-gray-300"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Narrative Synopses */}
                <div className="rounded-2xl bg-[#131724] border border-[#22293b] p-5 sm:p-6 flex flex-col gap-4 shadow-lg">
                  <div className="flex items-center gap-2 pb-3 border-b border-[#20273a]">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Narrative Premise Comparison</h3>
                  </div>

                  {/* Synopsis A */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-sky-400">
                      {animeA.title.english || animeA.title.romaji}
                    </span>
                    <p
                      className="text-xs text-gray-300/90 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer"
                      title="Click to expand"
                      dangerouslySetInnerHTML={{
                        __html: animeA.description?.replace(/<[^>]+>/g, " ") || "No synopsis available.",
                      }}
                    />
                  </div>

                  {/* Synopsis B */}
                  <div className="flex flex-col gap-1.5 pt-3 border-t border-[#1d2334]">
                    <span className="text-xs font-bold text-rose-400">
                      {animeB.title.english || animeB.title.romaji}
                    </span>
                    <p
                      className="text-xs text-gray-300/90 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer"
                      title="Click to expand"
                      dangerouslySetInnerHTML={{
                        __html: animeB.description?.replace(/<[^>]+>/g, " ") || "No synopsis available.",
                      }}
                    />
                  </div>
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Empty State prompt */
          <div className="py-20 text-center text-xs sm:text-sm text-gray-400 bg-[#131724] rounded-2xl border border-[#22293b] p-8 flex flex-col items-center gap-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-[#1a2134] border border-[#28324a] flex items-center justify-center text-sky-400 shadow-inner">
              <Swords className="w-7 h-7 animate-pulse text-sky-400" />
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <h3 className="text-base font-bold text-white">Choose Your Two Anime Contenders</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Select both titles in the search boxes above, or choose any legendary rivalry preset from the top bar
                to initiate real-time head-to-head metric and cast analysis.
              </p>
            </div>
            <button
              onClick={handleRandomMatchup}
              className="mt-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Load Random Rivalry</span>
            </button>
          </div>
        )}
      </main>

      {/* Official Trailer Modal */}
      {activeTrailer && (
        <TrailerModal
          isOpen={activeTrailer.isOpen}
          onClose={() => setActiveTrailer(null)}
          trailerId={activeTrailer.trailerId}
          title={activeTrailer.title}
        />
      )}

      {/* Unified Universal Footer */}
      <Footer />
    </div>
  );
}
