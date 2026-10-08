"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  Share2,
  Copy,
  Check,
  Tv,
  Film,
  Mic,
  ExternalLink,
  ShoppingBag,
  Calendar,
  User,
  Search,
  Filter,
  Globe,
  Star,
  Tag,
  Sparkles,
  Droplet,
  Layers,
  ChevronRight,
} from "lucide-react";
import { CharacterDetail } from "@/lib/types";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";
import FormattedBio from "./FormattedBio";

interface CharacterDetailClientProps {
  character: CharacterDetail;
}

export default function CharacterDetailClient({ character }: CharacterDetailClientProps) {
  const [copiedName, setCopiedName] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Appearance filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedFormat, setSelectedFormat] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"POPULARITY" | "RATING" | "NEWEST" | "OLDEST">("POPULARITY");

  // Voice Actor language filter
  const [vaLangFilter, setVaLangFilter] = useState<string>("ALL");

  const displayTitle = character.name.full;
  const nativeTitle = character.name.native;
  const aliases = character.name.alternative || [];
  const spoilerAliases = character.name.alternativeSpoiler || [];

  // Local storage for character favorites
  useEffect(() => {
    try {
      const saved = localStorage.getItem("animedb_favorite_characters");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.includes(character.id)) {
          setIsFavorited(true);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [character.id]);

  const toggleFavorite = () => {
    try {
      const saved = localStorage.getItem("animedb_favorite_characters");
      const list: number[] = saved ? JSON.parse(saved) : [];
      let updated: number[];
      if (list.includes(character.id)) {
        updated = list.filter((id) => id !== character.id);
        setIsFavorited(false);
      } else {
        updated = [...list, character.id];
        setIsFavorited(true);
      }
      localStorage.setItem("animedb_favorite_characters", JSON.stringify(updated));
    } catch {
      setIsFavorited(!isFavorited);
    }
  };

  const handleCopyName = () => {
    if (nativeTitle) {
      navigator.clipboard.writeText(nativeTitle);
      setCopiedName(true);
      setTimeout(() => setCopiedName(false), 2000);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const birthDate = character.dateOfBirth?.month
    ? `${character.dateOfBirth.day || ""} ${
        [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ][character.dateOfBirth.month - 1]
      }${character.dateOfBirth.year ? `, ${character.dateOfBirth.year}` : ""}`.trim()
    : null;

  const appearances = character.media?.edges || [];

  // Best backdrop image from media
  const backdropImage =
    appearances.find((e) => e.node.bannerImage)?.node.bannerImage ||
    appearances[0]?.node.bannerImage ||
    character.image.large;

  // Extract and deduplicate all Voice Actors across all media edges
  interface DistinctVoiceActor {
    id: number;
    name: {
      full: string;
      native?: string | null;
    };
    image: {
      large?: string;
      medium: string;
    };
    languageV2: string;
    animeTitles: Array<{ id: number; title: string }>;
  }

  const voiceActorsMap = useMemo(() => {
    const map = new Map<number, DistinctVoiceActor>();

    for (const edge of appearances) {
      const animeTitle = edge.node.title.english || edge.node.title.romaji;
      for (const va of edge.voiceActors || []) {
        if (!map.has(va.id)) {
          map.set(va.id, {
            id: va.id,
            name: va.name,
            image: va.image,
            languageV2: va.languageV2 || "Unknown",
            animeTitles: [{ id: edge.node.id, title: animeTitle }],
          });
        } else {
          const existing = map.get(va.id)!;
          if (!existing.animeTitles.some((t) => t.id === edge.node.id)) {
            existing.animeTitles.push({ id: edge.node.id, title: animeTitle });
          }
        }
      }
    }

    return Array.from(map.values());
  }, [appearances]);

  // Filtered voice actors based on language tab
  const filteredVoiceActors = useMemo(() => {
    if (vaLangFilter === "ALL") return voiceActorsMap;
    if (vaLangFilter === "JAPANESE") {
      return voiceActorsMap.filter(
        (va) => va.languageV2.toLowerCase() === "japanese"
      );
    }
    if (vaLangFilter === "ENGLISH") {
      return voiceActorsMap.filter(
        (va) => va.languageV2.toLowerCase() === "english"
      );
    }
    // OTHER
    return voiceActorsMap.filter(
      (va) =>
        va.languageV2.toLowerCase() !== "japanese" &&
        va.languageV2.toLowerCase() !== "english"
    );
  }, [voiceActorsMap, vaLangFilter]);

  // Counts for VA filter tabs
  const countJapanese = voiceActorsMap.filter(
    (va) => va.languageV2.toLowerCase() === "japanese"
  ).length;
  const countEnglish = voiceActorsMap.filter(
    (va) => va.languageV2.toLowerCase() === "english"
  ).length;
  const countOther = voiceActorsMap.length - countJapanese - countEnglish;

  // Filtered & Sorted anime appearances
  const filteredAppearances = useMemo(() => {
    return appearances
      .filter((edge) => {
        const anime = edge.node;
        const matchesSearch =
          searchQuery.trim() === "" ||
          (anime.title.english &&
            anime.title.english.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (anime.title.romaji &&
            anime.title.romaji.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesRole =
          selectedRole === "ALL" || edge.characterRole === selectedRole;

        const matchesFormat =
          selectedFormat === "ALL" ||
          (selectedFormat === "TV" && (anime.format === "TV" || anime.format === "TV_SHORT")) ||
          (selectedFormat === "MOVIE" && anime.format === "MOVIE") ||
          (selectedFormat === "OVA" && (anime.format === "OVA" || anime.format === "ONA" || anime.format === "SPECIAL"));

        return matchesSearch && matchesRole && matchesFormat;
      })
      .sort((a, b) => {
        if (sortBy === "POPULARITY") {
          return (b.node.popularity || 0) - (a.node.popularity || 0);
        }
        if (sortBy === "RATING") {
          return (b.node.averageScore || 0) - (a.node.averageScore || 0);
        }
        if (sortBy === "NEWEST") {
          const yearA = a.node.seasonYear || a.node.startDate?.year || 0;
          const yearB = b.node.seasonYear || b.node.startDate?.year || 0;
          return yearB - yearA;
        }
        if (sortBy === "OLDEST") {
          const yearA = a.node.seasonYear || a.node.startDate?.year || 9999;
          const yearB = b.node.seasonYear || b.node.startDate?.year || 9999;
          return yearA - yearB;
        }
        return 0;
      });
  }, [appearances, searchQuery, selectedRole, selectedFormat, sortBy]);

  // Amazon Affiliate search items
  const merchCategories = [
    {
      title: "Scale Figures & Statues",
      query: `${displayTitle} anime scale figure`,
      desc: "Detailed PVC figures & collector statues",
      tag: "Best for Collectors",
    },
    {
      title: "Nendoroids & Pop Up Parade",
      query: `${displayTitle} nendoroid good smile`,
      desc: "Chibi poseable figures & affordable collectibles",
      tag: "Most Popular",
    },
    {
      title: "Acrylic Stands & Desk Decor",
      query: `${displayTitle} acrylic stand anime`,
      desc: "Official character stands, badges & keychains",
      tag: "Affordable",
    },
    {
      title: "Plushies & Nesoberi",
      query: `${displayTitle} anime plush`,
      desc: "Official soft plushies & cushion decor",
      tag: "Gift Idea",
    },
    {
      title: "Cosplay & Costume Props",
      query: `${displayTitle} anime cosplay costume wig`,
      desc: "Full cosplay sets, styled wigs & signature accessories",
      tag: "Costume",
    },
    {
      title: "Official Artbooks & Light Novels",
      query: `${displayTitle} light novel manga official artbook`,
      desc: "Original source material & high-res illustration books",
      tag: "Reading",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-gray-100 selection:bg-blue-600/30 selection:text-white">
      <Navbar />

      {/* Hero Ambient Banner */}
      <div className="relative w-full overflow-hidden bg-[#0c0e15] border-b border-[#1b202e]">
        {/* Backdrop Graphic */}
        <div className="absolute inset-0 h-96 opacity-25 filter blur-sm transform scale-105 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backdropImage}
            alt=""
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14] via-[#0d0f14]/85 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0f14] via-transparent to-[#0d0f14] pointer-events-none" />

        {/* Hero Content Container */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          {/* Top Bar: Back & ID */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/characters"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-[#141824]/80 backdrop-blur-md border border-[#222736] hover:border-gray-600"
              >
                <span>← Characters Directory</span>
              </Link>
              <Breadcrumbs
                items={[
                  { label: "Characters", href: "/characters" },
                  { label: displayTitle },
                ]}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400 px-2.5 py-1 rounded bg-[#131622]/80 border border-[#222736]">
                AniList ID: #{character.id}
              </span>
            </div>
          </div>

          {/* Main Hero Grid */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Left Column: Portrait & Action Buttons */}
            <div className="w-52 sm:w-64 flex-shrink-0 mx-auto md:mx-0 flex flex-col gap-4">
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-[#283045] bg-[#161a26] shadow-2xl group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={character.image.large || character.image.medium}
                  alt={displayTitle}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Ambient Bottom Gradient on Portrait */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14]/90 via-transparent to-transparent pointer-events-none" />

                {/* AniList Favorites Count Pill */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#0d0f14]/90 backdrop-blur-md text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5 shadow-lg">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>{character.favourites.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    isFavorited
                      ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/40"
                      : "bg-[#161a26] hover:bg-[#1d2333] text-gray-300 border-[#252c3d]"
                  }`}
                  title={isFavorited ? "Saved to your favorites" : "Add to favorites"}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isFavorited ? "fill-white text-white" : "text-rose-400"
                    }`}
                  />
                  <span>{isFavorited ? "Favorited" : "Favorite"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-[#161a26] hover:bg-[#1d2333] text-gray-300 border border-[#252c3d] transition-all"
                  title="Share profile link"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-blue-400" />
                      <span>Share</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Persona Info Card */}
              <div className="rounded-xl bg-[#131622]/90 border border-[#222736] p-4 flex flex-col gap-2.5 text-xs shadow-md">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#222736] pb-1.5 flex items-center justify-between">
                  <span>Character Data</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </span>

                {character.gender && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" /> Gender
                    </span>
                    <span className="text-white font-medium">{character.gender}</span>
                  </div>
                )}

                {character.age && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Age</span>
                    <span className="text-white font-medium">{character.age}</span>
                  </div>
                )}

                {birthDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Birthday
                    </span>
                    <span className="text-white font-medium">{birthDate}</span>
                  </div>
                )}

                {character.bloodType && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5 text-rose-400" /> Blood Type
                    </span>
                    <span className="text-white font-medium">{character.bloodType}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" /> Appearances
                  </span>
                  <span className="text-white font-medium">
                    {appearances.length} Titles
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Title, Native Name, Badges & Biography */}
            <div className="flex-1 flex flex-col gap-6 w-full">
              {/* Header Title Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                    {displayTitle}
                  </h1>

                  {/* Native Japanese Name with Copy Pill */}
                  {nativeTitle && (
                    <button
                      type="button"
                      onClick={handleCopyName}
                      className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181d2a] border border-[#262c3e] hover:border-gray-500 text-sm font-semibold text-gray-300 hover:text-white transition-all"
                      title="Copy native Japanese name"
                    >
                      <span className="text-gray-200">{nativeTitle}</span>
                      {copiedName ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
                      )}
                    </button>
                  )}
                </div>

                {/* Aliases & Also Known As */}
                {(aliases.length > 0 || spoilerAliases.length > 0) && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                      <Tag className="w-3 h-3 text-gray-400" /> Aliases:
                    </span>
                    {aliases.slice(0, 5).map((al, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#181d2a] border border-[#262c3e] text-xs text-gray-300"
                      >
                        {al}
                      </span>
                    ))}
                    {spoilerAliases.length > 0 && (
                      <span
                        className="px-2 py-0.5 rounded-md bg-rose-950/30 border border-rose-500/20 text-xs text-rose-300 cursor-help"
                        title={`Spoiler alias: ${spoilerAliases.join(", ")}`}
                      >
                        +{spoilerAliases.length} spoiler alias
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Character Biography with FormattedBio */}
              <div className="rounded-2xl bg-[#131622]/90 border border-[#222736] p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-[#222736] pb-2">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    Biography & Lore
                  </h2>
                  <span className="text-[11px] text-gray-400">
                    AniList Verified Lore
                  </span>
                </div>

                <FormattedBio description={character.description} maxInitialLength={550} />
              </div>

              {/* Quick External Links & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`https://anilist.co/character/${character.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] border border-[#222736] hover:border-blue-500/40 text-xs font-semibold text-gray-300 hover:text-white transition-all"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>AniList Profile</span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>

                <a
                  href={`https://myanimelist.net/character.php?q=${encodeURIComponent(displayTitle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] border border-[#222736] hover:border-blue-500/40 text-xs font-semibold text-gray-300 hover:text-white transition-all"
                >
                  <Star className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Search on MAL</span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>

                <a
                  href={`https://twitter.com/search?q=${encodeURIComponent(displayTitle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] border border-[#222736] hover:border-sky-500/40 text-xs font-semibold text-gray-300 hover:text-white transition-all"
                >
                  <span>X (Twitter) Buzz</span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>

                <a
                  href={`https://www.amazon.com/s?k=${encodeURIComponent(displayTitle + " anime figure")}&tag=animedb-20`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-all ml-auto"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Find Official Figures on Amazon</span>
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-12">
        {/* SECTION 1: Voice Actors & Dubbing Cast Showcase */}
        {voiceActorsMap.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222736] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Voice Actors & Dubbing Cast
                  </h2>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    {voiceActorsMap.length} Cast Members
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Seiyuu and international voice actors who voiced {displayTitle} across adaptations.
                </p>
              </div>

              {/* Language Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-[#141824] p-1 rounded-xl border border-[#222736] self-start sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setVaLangFilter("ALL")}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    vaLangFilter === "ALL"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  All ({voiceActorsMap.length})
                </button>
                <button
                  type="button"
                  onClick={() => setVaLangFilter("JAPANESE")}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    vaLangFilter === "JAPANESE"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Japanese ({countJapanese})
                </button>
                {countEnglish > 0 && (
                  <button
                    type="button"
                    onClick={() => setVaLangFilter("ENGLISH")}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                      vaLangFilter === "ENGLISH"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    English Dub ({countEnglish})
                  </button>
                )}
                {countOther > 0 && (
                  <button
                    type="button"
                    onClick={() => setVaLangFilter("OTHER")}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                      vaLangFilter === "OTHER"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Other Dubs ({countOther})
                  </button>
                )}
              </div>
            </div>

            {/* Voice Actors Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVoiceActors.map((va) => {
                const isJP = va.languageV2.toLowerCase() === "japanese";
                const isEN = va.languageV2.toLowerCase() === "english";

                return (
                  <Link
                    key={va.id}
                    href={`/staff/${va.id}`}
                    className="group rounded-2xl bg-[#131622] border border-[#222736] hover:border-emerald-500/40 p-3.5 flex items-start gap-3.5 transition-all duration-200 hover:shadow-lg hover:shadow-black/50 hover:-translate-y-0.5"
                  >
                    {/* VA Avatar */}
                    <div className="relative w-14 h-18 rounded-xl overflow-hidden bg-[#181c28] flex-shrink-0 border border-[#262c3e] group-hover:border-emerald-500/50 transition-colors">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={va.image.large || va.image.medium}
                        alt={va.name.full}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>

                    {/* VA Info */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            isJP
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : isEN
                              ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                              : "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                          }`}
                        >
                          {va.languageV2} {isJP && "• Original"}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 truncate mt-1.5 transition-colors">
                        {va.name.full}
                      </h3>

                      {va.name.native && (
                        <span className="text-[11px] text-gray-400 truncate">
                          {va.name.native}
                        </span>
                      )}

                      {/* Anime Works Badge */}
                      <div className="mt-2 text-[11px] text-gray-400 truncate flex items-center gap-1">
                        <Tv className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                          {va.animeTitles[0]?.title}
                          {va.animeTitles.length > 1 &&
                            ` +${va.animeTitles.length - 1} more`}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all self-center flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 2: Anime Appearances Explorer */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222736] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Anime Appearances & Filmography
                </h2>
                <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                  {filteredAppearances.length} of {appearances.length} Titles
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Explore all television anime, feature films, and OVAs starring {displayTitle}.
              </p>
            </div>

            {/* Live Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search anime title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141824] border border-[#222736] focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Filter & Sort Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131622] p-3 rounded-2xl border border-[#222736]">
            {/* Left: Role & Format Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-gray-400 mr-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Role:</span>
              </div>
              {["ALL", "MAIN", "SUPPORTING"].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                    selectedRole === role
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-[#181d2a] text-gray-400 hover:text-white border border-[#262c3e]"
                  }`}
                >
                  {role === "ALL" ? "All Roles" : role === "MAIN" ? "Main Role" : "Supporting"}
                </button>
              ))}

              <div className="h-4 w-[1px] bg-[#262c3e] mx-1 hidden sm:block" />

              <div className="flex items-center gap-1 text-xs text-gray-400 mr-1">
                <span>Format:</span>
              </div>
              {["ALL", "TV", "MOVIE", "OVA"].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                    selectedFormat === fmt
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-[#181d2a] text-gray-400 hover:text-white border border-[#262c3e]"
                  }`}
                >
                  {fmt === "ALL" ? "All Formats" : fmt === "TV" ? "TV Series" : fmt === "MOVIE" ? "Movies" : "OVAs & Specials"}
                </button>
              ))}
            </div>

            {/* Right: Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#181d2a] border border-[#262c3e] text-xs font-semibold text-gray-200 rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:border-gray-500"
              >
                <option value="POPULARITY">Most Popular</option>
                <option value="RATING">Highest Score</option>
                <option value="NEWEST">Newest Year</option>
                <option value="OLDEST">Oldest Year</option>
              </select>
            </div>
          </div>

          {/* Appearances Grid */}
          {filteredAppearances.length === 0 ? (
            <div className="rounded-2xl bg-[#131622] border border-[#222736] p-12 text-center flex flex-col items-center justify-center gap-3">
              <Tv className="w-10 h-10 text-gray-400" />
              <h3 className="text-sm font-bold text-gray-300">
                No appearances match your search or filter
              </h3>
              <p className="text-xs text-gray-400 max-w-sm">
                Try resetting your search query or switching role/format filter tabs.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedRole("ALL");
                  setSelectedFormat("ALL");
                }}
                className="mt-2 text-xs font-semibold text-blue-400 hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAppearances.map((edge, idx) => {
                const anime = edge.node;
                const isMain = edge.characterRole === "MAIN";
                const primaryVA =
                  edge.voiceActors?.find((v) => v.languageV2?.toLowerCase() === "japanese") ||
                  edge.voiceActors?.find((v) => v.languageV2?.toLowerCase() === "english") ||
                  edge.voiceActors?.[0];

                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#131622] border border-[#222736] hover:border-[#343c52] p-3.5 flex flex-col justify-between gap-3 transition-all duration-200 hover:shadow-lg hover:shadow-black/40 group"
                  >
                    {/* Top Anime Link & Meta */}
                    <div className="flex items-start gap-3">
                      {/* Poster */}
                      <Link
                        href={`/anime/${anime.id}`}
                        className="w-16 h-22 rounded-xl overflow-hidden bg-[#181c28] flex-shrink-0 border border-[#262c3e] group-hover:border-blue-500/50 transition-colors"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            anime.coverImage.extraLarge ||
                            anime.coverImage.large ||
                            anime.coverImage.medium
                          }
                          alt={anime.title.english || anime.title.romaji}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </Link>

                      {/* Anime Details */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                              isMain
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            }`}
                          >
                            {edge.characterRole}
                          </span>

                          {anime.format && (
                            <span className="text-[10px] text-gray-400 bg-[#181d2a] px-1.5 py-0.5 rounded border border-[#262c3e]">
                              {anime.format.replace("_", " ")}
                            </span>
                          )}

                          {anime.averageScore && (
                            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5 ml-auto">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span>{anime.averageScore}%</span>
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/anime/${anime.id}`}
                          className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mt-1.5 leading-snug"
                        >
                          {anime.title.english || anime.title.romaji}
                        </Link>

                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                          {anime.seasonYear && <span>{anime.seasonYear}</span>}
                          {anime.episodes && (
                            <>
                              <span>•</span>
                              <span>{anime.episodes} eps</span>
                            </>
                          )}
                          {anime.studios?.nodes?.[0] && (
                            <>
                              <span>•</span>
                              <span className="truncate">
                                {anime.studios.nodes[0].name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Voice Actor Attribution */}
                    {primaryVA ? (
                      <div className="pt-2.5 border-t border-[#1e2332] flex items-center justify-between text-xs">
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <span>Voiced by:</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#181d2a] text-gray-300 font-semibold uppercase">
                            {primaryVA.languageV2 === "Japanese" ? "JP" : primaryVA.languageV2 === "English" ? "EN" : primaryVA.languageV2}
                          </span>
                        </span>
                        <Link
                          href={`/staff/${primaryVA.id}`}
                          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
                        >
                          <span className="font-bold text-emerald-400 hover:underline truncate max-w-[130px]">
                            {primaryVA.name.full}
                          </span>
                          <div className="w-6 h-6 rounded-md overflow-hidden bg-[#181c28] border border-[#262c3e] flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={primaryVA.image.medium}
                              alt={primaryVA.name.full}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </Link>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-[#1e2332] flex items-center justify-between text-[11px] text-gray-400">
                        <span>Voice Actor</span>
                        <span>Uncredited / Silent</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 3: Official Figures & Character Merchandise */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222736] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Official Figures & Collectibles
                </h2>
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  Amazon Prime & Hobby
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Curated official merchandise, Nendoroids, acrylic stands, and cosplay for {displayTitle}.
              </p>
            </div>

            <a
              href={`https://www.amazon.com/s?k=${encodeURIComponent(displayTitle + " anime")}&tag=animedb-20`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 self-start sm:self-auto bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl hover:bg-amber-500/20 transition-all"
            >
              <span>Explore All on Amazon</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {merchCategories.map((item, idx) => (
              <a
                key={idx}
                href={`https://www.amazon.com/s?k=${encodeURIComponent(item.query)}&tag=animedb-20`}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl bg-[#131622] border border-[#222736] hover:border-amber-500/40 p-4 flex flex-col justify-between gap-3 transition-all duration-200 hover:shadow-lg hover:shadow-amber-950/20 hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded-md">
                      {item.tag}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1e2332] text-xs font-semibold text-gray-300 group-hover:text-amber-300 transition-colors">
                  <span>Search on Amazon</span>
                  <span className="text-amber-400">→</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>

      {/* Global Comprehensive Footer */}
      <Footer />
    </div>
  );
}
