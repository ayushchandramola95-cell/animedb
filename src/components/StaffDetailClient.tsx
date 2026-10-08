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
  Clapperboard,
  Music,
  Palette,
  BookOpen,
  Volume2,
  ExternalLink,
  ShoppingBag,
  Calendar,
  User,
  Search,
  Filter,
  Globe,
  Star,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Disc,
} from "lucide-react";
import { StaffDetail } from "@/lib/types";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";
import FormattedBio from "./FormattedBio";

interface StaffDetailClientProps {
  staff: StaffDetail;
}

export default function StaffDetailClient({ staff }: StaffDetailClientProps) {
  const [copiedName, setCopiedName] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Voice roles filters
  const [voiceSearchQuery, setVoiceSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedFormat, setSelectedFormat] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"POPULARITY" | "RATING" | "NEWEST" | "OLDEST">("POPULARITY");

  // Production roles filter
  const [prodSearchQuery, setProdSearchQuery] = useState("");

  const displayTitle = staff.name.full;
  const nativeTitle = staff.name.native;
  const aliases = staff.name.alternative || [];
  const occupations = staff.primaryOccupations || [];

  // Local storage for favorite staff
  useEffect(() => {
    try {
      const saved = localStorage.getItem("animedb_favorite_staff");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.includes(staff.id)) {
          setIsFavorited(true);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [staff.id]);

  const toggleFavorite = () => {
    try {
      const saved = localStorage.getItem("animedb_favorite_staff");
      const list: number[] = saved ? JSON.parse(saved) : [];
      let updated: number[];
      if (list.includes(staff.id)) {
        updated = list.filter((id) => id !== staff.id);
        setIsFavorited(false);
      } else {
        updated = [...list, staff.id];
        setIsFavorited(true);
      }
      localStorage.setItem("animedb_favorite_staff", JSON.stringify(updated));
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

  const birthDate = staff.dateOfBirth?.month
    ? `${staff.dateOfBirth.day || ""} ${
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
        ][staff.dateOfBirth.month - 1]
      }${staff.dateOfBirth.year ? `, ${staff.dateOfBirth.year}` : ""}`.trim()
    : null;

  const deathDate = staff.dateOfDeath?.month
    ? `${staff.dateOfDeath.day || ""} ${
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
        ][staff.dateOfDeath.month - 1]
      }${staff.dateOfDeath.year ? `, ${staff.dateOfDeath.year}` : ""}`.trim()
    : null;

  const voiceRoles = staff.characterMedia?.edges || [];
  const staffRoles = staff.staffMedia?.edges || [];

  // Backdrop art from leading anime
  const backdropImage =
    voiceRoles.find((e) => e.node.bannerImage)?.node.bannerImage ||
    staffRoles.find((e) => e.node.bannerImage)?.node.bannerImage ||
    staff.image.large;

  // Top Iconic Roles (Pick top 6 characters sorted by popularity)
  const iconicRoles = useMemo(() => {
    const list: Array<{
      anime: (typeof voiceRoles)[0]["node"];
      character: NonNullable<(typeof voiceRoles)[0]["characters"]>[0];
      characterRole: string;
    }> = [];

    const seenCharIds = new Set<number>();

    for (const edge of voiceRoles) {
      const char = edge.characters?.[0];
      if (char && !seenCharIds.has(char.id)) {
        seenCharIds.add(char.id);
        list.push({
          anime: edge.node,
          character: char,
          characterRole: edge.characterRole,
        });
      }
      if (list.length >= 6) break;
    }

    return list;
  }, [voiceRoles]);

  // Filtered & Sorted voice acting filmography
  const filteredVoiceRoles = useMemo(() => {
    return voiceRoles
      .filter((edge) => {
        const anime = edge.node;
        const char = edge.characters?.[0];

        const matchesSearch =
          voiceSearchQuery.trim() === "" ||
          (anime.title.english &&
            anime.title.english.toLowerCase().includes(voiceSearchQuery.toLowerCase())) ||
          (anime.title.romaji &&
            anime.title.romaji.toLowerCase().includes(voiceSearchQuery.toLowerCase())) ||
          (char?.name.full &&
            char.name.full.toLowerCase().includes(voiceSearchQuery.toLowerCase())) ||
          (char?.name.native &&
            char.name.native.includes(voiceSearchQuery));

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
  }, [voiceRoles, voiceSearchQuery, selectedRole, selectedFormat, sortBy]);

  // Filtered production staff roles
  const filteredStaffRoles = useMemo(() => {
    if (!prodSearchQuery.trim()) return staffRoles;
    const q = prodSearchQuery.toLowerCase();
    return staffRoles.filter(
      (edge) =>
        (edge.node.title.english && edge.node.title.english.toLowerCase().includes(q)) ||
        (edge.node.title.romaji && edge.node.title.romaji.toLowerCase().includes(q)) ||
        (edge.staffRole && edge.staffRole.toLowerCase().includes(q))
    );
  }, [staffRoles, prodSearchQuery]);

  // Voice Actor / Staff Merchandise categories for Amazon
  const merchCategories = [
    {
      title: "Character Song & Voice CDs",
      query: `${displayTitle} anime character song cd`,
      desc: "Original anime theme songs & voice drama albums",
      tag: "Music & Audio",
    },
    {
      title: "Official Photo Books & Magazines",
      query: `${displayTitle} seiyuu photo book`,
      desc: "Autographed visual collections & Seiyuu Grand Prix issues",
      tag: "Collector",
    },
    {
      title: "Featured Anime Blu-ray & Box Sets",
      query: `${displayTitle} anime blu-ray collection`,
      desc: "Complete anime seasons featuring ${displayTitle}",
      tag: "Media",
    },
    {
      title: "Live Concert & Event Blu-rays",
      query: `${displayTitle} live concert event bluray`,
      desc: "Stage readings, live music performances & seiyuu festivals",
      tag: "Live Shows",
    },
  ];

  // Helper for occupation icons
  const getOccupationIcon = (occ: string) => {
    const o = occ.toLowerCase();
    if (o.includes("voice") || o.includes("actor")) return <Mic className="w-3.5 h-3.5 text-emerald-400" />;
    if (o.includes("direct")) return <Clapperboard className="w-3.5 h-3.5 text-purple-400" />;
    if (o.includes("music") || o.includes("sound") || o.includes("theme")) return <Music className="w-3.5 h-3.5 text-cyan-400" />;
    if (o.includes("animat") || o.includes("art") || o.includes("design")) return <Palette className="w-3.5 h-3.5 text-amber-400" />;
    if (o.includes("script") || o.includes("story") || o.includes("writ")) return <BookOpen className="w-3.5 h-3.5 text-rose-400" />;
    return <Sparkles className="w-3.5 h-3.5 text-blue-400" />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f14] text-gray-100 selection:bg-blue-600/30 selection:text-white">
      <Navbar />

      {/* Hero Ambient Banner */}
      <div className="relative w-full overflow-hidden bg-[#0c0e15] border-b border-[#1b202e]">
        {/* Backdrop Art with subtle blur */}
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
                href="/staff"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-[#141824]/80 backdrop-blur-md border border-[#222736] hover:border-gray-600"
              >
                <span>← Voice Actors & Staff</span>
              </Link>
              <Breadcrumbs
                items={[
                  { label: "Voice Actors & Staff", href: "/staff" },
                  { label: displayTitle },
                ]}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400 px-2.5 py-1 rounded bg-[#131622]/80 border border-[#222736]">
                AniList Staff ID: #{staff.id}
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
                  src={staff.image.large || staff.image.medium}
                  alt={displayTitle}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Bottom subtle shadow overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f14]/90 via-transparent to-transparent pointer-events-none" />

                {/* AniList Favorites Count Pill */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-[#0d0f14]/90 backdrop-blur-md text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5 shadow-lg">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>{staff.favourites.toLocaleString()}</span>
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

              {/* Quick Staff Info Card */}
              <div className="rounded-xl bg-[#131622]/90 border border-[#222736] p-4 flex flex-col gap-2.5 text-xs shadow-md">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#222736] pb-1.5 flex items-center justify-between">
                  <span>Profile Facts</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </span>

                {staff.gender && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" /> Gender
                    </span>
                    <span className="text-white font-medium">{staff.gender}</span>
                  </div>
                )}

                {staff.age && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Age</span>
                    <span className="text-white font-medium">{staff.age} years</span>
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

                {deathDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Deceased</span>
                    <span className="text-rose-400 font-medium">{deathDate}</span>
                  </div>
                )}

                {staff.homeTown && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" /> Hometown
                    </span>
                    <span className="text-white font-medium truncate max-w-[130px]">
                      {staff.homeTown}
                    </span>
                  </div>
                )}

                {staff.yearsActive && staff.yearsActive.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" /> Years Active
                    </span>
                    <span className="text-white font-medium">
                      {staff.yearsActive[0]} – {staff.yearsActive[1] || "Present"}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Voiced Roles</span>
                  <span className="text-emerald-400 font-bold">
                    {voiceRoles.length} Characters
                  </span>
                </div>

                {staffRoles.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Staff Works</span>
                    <span className="text-purple-400 font-bold">
                      {staffRoles.length} Productions
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Title, Occupations, Badges & Biography */}
            <div className="flex-1 flex flex-col gap-6 w-full">
              {/* Header Title Section */}
              <div className="flex flex-col gap-3">
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

                {/* Occupations Badges */}
                {occupations.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {occupations.map((occ, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-[#141824] border border-[#222736] text-xs font-semibold text-gray-300 flex items-center gap-1.5 shadow-sm"
                      >
                        {getOccupationIcon(occ)}
                        <span>{occ}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Aliases */}
                {aliases.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span className="text-xs text-gray-400 font-semibold">Also Known As:</span>
                    {aliases.slice(0, 5).map((al, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#181d2a] border border-[#262c3e] text-xs text-gray-300"
                      >
                        {al}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Biography with FormattedBio */}
              <div className="rounded-2xl bg-[#131622]/90 border border-[#222736] p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-[#222736] pb-2">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Biography & Career Background
                  </h2>
                  <span className="text-[11px] text-gray-400">
                    AniList Verified Industry Profile
                  </span>
                </div>

                <FormattedBio description={staff.description} maxInitialLength={550} />
              </div>

              {/* Quick External Links & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`https://anilist.co/staff/${staff.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] border border-[#222736] hover:border-emerald-500/40 text-xs font-semibold text-gray-300 hover:text-white transition-all"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AniList Staff Profile</span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>

                <a
                  href={`https://myanimelist.net/people.php?q=${encodeURIComponent(displayTitle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141824] hover:bg-[#1a2030] border border-[#222736] hover:border-blue-500/40 text-xs font-semibold text-gray-300 hover:text-white transition-all"
                >
                  <Star className="w-3.5 h-3.5 text-blue-400" />
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
                  href={`https://www.amazon.com/s?k=${encodeURIComponent(displayTitle + " anime cd")}&tag=animedb-20`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-all ml-auto"
                >
                  <Disc className="w-3.5 h-3.5 text-amber-400" />
                  <span>Character Songs & CDs on Amazon</span>
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-12">
        {/* SECTION 1: Iconic Roles Spotlight */}
        {iconicRoles.length > 0 && (
          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#222736] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Iconic & Most Celebrated Roles
                  </h2>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Signature characters voiced by {displayTitle} in fan-favorite anime.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                Top {iconicRoles.length} Featured
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {iconicRoles.map((item, idx) => {
                const isMain = item.characterRole === "MAIN";
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-gradient-to-br from-[#141826] to-[#10131d] border border-[#23293a] hover:border-amber-500/40 p-4 flex items-center justify-between gap-4 transition-all duration-200 hover:shadow-xl hover:shadow-amber-950/20 group"
                  >
                    {/* Character Avatar Left */}
                    <Link
                      href={`/character/${item.character.id}`}
                      className="flex items-center gap-3.5 min-w-0 flex-1"
                    >
                      <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-[#181c28] flex-shrink-0 border border-[#2a3248] group-hover:border-amber-500/50 transition-colors shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.character.image.large || item.character.image.medium}
                          alt={item.character.name.full}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span
                          className={`self-start text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                            isMain
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-[#1d2232] text-gray-400"
                          }`}
                        >
                          {item.characterRole}
                        </span>

                        <h3 className="text-sm font-bold text-white group-hover:text-amber-400 truncate mt-1 transition-colors">
                          {item.character.name.full}
                        </h3>

                        {item.character.name.native && (
                          <span className="text-[11px] text-gray-400 truncate">
                            {item.character.name.native}
                          </span>
                        )}

                        <span className="text-xs text-gray-300 truncate mt-1.5 font-medium">
                          in {item.anime.title.english || item.anime.title.romaji}
                        </span>
                      </div>
                    </Link>

                    {/* Anime Poster Right */}
                    <Link
                      href={`/anime/${item.anime.id}`}
                      className="w-12 h-16 rounded-lg overflow-hidden bg-[#181c28] flex-shrink-0 border border-[#252b3d] hover:opacity-85 transition-opacity"
                      title={item.anime.title.english || item.anime.title.romaji}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.anime.coverImage.medium}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 2: Complete Voice Acting Filmography */}
        {voiceRoles.length > 0 && (
          <section className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222736] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Voice Acting Filmography
                  </h2>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    {filteredVoiceRoles.length} of {voiceRoles.length} Roles
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Complete catalogue of animated characters and anime adaptations voiced by {displayTitle}.
                </p>
              </div>

              {/* Live Search Input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search character or anime..."
                  value={voiceSearchQuery}
                  onChange={(e) => setVoiceSearchQuery(e.target.value)}
                  className="w-full bg-[#141824] border border-[#222736] focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition-colors"
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
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-[#181d2a] text-gray-400 hover:text-white border border-[#262c3e]"
                    }`}
                  >
                    {role === "ALL" ? "All Roles" : role === "MAIN" ? "Main Roles" : "Supporting"}
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
                        ? "bg-emerald-600 text-white shadow-sm"
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

            {/* Roles Grid */}
            {filteredVoiceRoles.length === 0 ? (
              <div className="rounded-2xl bg-[#131622] border border-[#222736] p-12 text-center flex flex-col items-center justify-center gap-3">
                <Mic className="w-10 h-10 text-gray-400" />
                <h3 className="text-sm font-bold text-gray-300">
                  No voice acting roles match your filter
                </h3>
                <p className="text-xs text-gray-400 max-w-sm">
                  Try typing a different character or anime name, or reset the filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setVoiceSearchQuery("");
                    setSelectedRole("ALL");
                    setSelectedFormat("ALL");
                  }}
                  className="mt-2 text-xs font-semibold text-emerald-400 hover:underline"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVoiceRoles.map((edge, idx) => {
                  const anime = edge.node;
                  const char = edge.characters?.[0];
                  const isMain = edge.characterRole === "MAIN";

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl bg-[#131622] border border-[#222736] hover:border-[#343c52] p-3.5 flex items-center justify-between gap-3.5 transition-all duration-200 hover:shadow-lg hover:shadow-black/40 group"
                    >
                      {/* Left: Anime Info */}
                      <Link
                        href={`/anime/${anime.id}`}
                        className="flex items-center gap-3 min-w-0 flex-1"
                      >
                        <div className="w-12 h-16 rounded-xl overflow-hidden bg-[#181c28] flex-shrink-0 border border-[#262c3e] group-hover:border-blue-500/50 transition-colors">
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
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                            {anime.title.english || anime.title.romaji}
                          </span>

                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                                isMain
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                  : "bg-[#181d2a] text-gray-400"
                              }`}
                            >
                              {edge.characterRole}
                            </span>
                            {anime.seasonYear && (
                              <span className="text-[10px] text-gray-400">
                                {anime.seasonYear}
                              </span>
                            )}
                          </div>

                          {anime.averageScore && (
                            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5 mt-1">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span>{anime.averageScore}%</span>
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Right: Character Voiced */}
                      {char ? (
                        <Link
                          href={`/character/${char.id}`}
                          className="flex items-center gap-2 pl-3 border-l border-[#222736] flex-shrink-0 hover:opacity-90 transition-opacity"
                          title={`View ${char.name.full}'s character profile`}
                        >
                          <div className="flex flex-col items-end min-w-0 max-w-[110px]">
                            <span className="text-xs font-bold text-gray-200 hover:text-emerald-400 truncate">
                              {char.name.full}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
                              <Mic className="w-2.5 h-2.5" />
                              <span>Voiced Role</span>
                            </span>
                          </div>

                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#181c28] flex-shrink-0 border border-[#262c3e]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={char.image.large || char.image.medium}
                              alt={char.name.full}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        </Link>
                      ) : (
                        <div className="pl-3 border-l border-[#222736] text-[10px] text-gray-400">
                          Unspecified Role
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* SECTION 3: Production & Directorial Works (if applicable) */}
        {staffRoles.length > 0 && (
          <section className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222736] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Clapperboard className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    Production & Directorial Works
                  </h2>
                  <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                    {filteredStaffRoles.length} Productions
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Anime productions where {displayTitle} served as director, composer, animator, or writer.
                </p>
              </div>

              {/* Staff Work Search */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter production title or role..."
                  value={prodSearchQuery}
                  onChange={(e) => setProdSearchQuery(e.target.value)}
                  className="w-full bg-[#141824] border border-[#222736] focus:border-purple-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredStaffRoles.map((edge, idx) => {
                const anime = edge.node;
                return (
                  <Link
                    key={idx}
                    href={`/anime/${anime.id}`}
                    className="rounded-2xl bg-[#131622] border border-[#222736] hover:border-purple-500/40 p-3.5 flex items-center gap-3 transition-all duration-200 hover:shadow-lg hover:shadow-purple-950/20 group"
                  >
                    <div className="w-12 h-16 rounded-xl overflow-hidden bg-[#181c28] flex-shrink-0 border border-[#262c3e] group-hover:border-purple-500/50 transition-colors">
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
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 truncate transition-colors">
                        {anime.title.english || anime.title.romaji}
                      </span>
                      <span className="text-[11px] text-purple-400 font-semibold truncate mt-0.5">
                        {edge.staffRole}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400">
                        {anime.format && <span>{anime.format.replace("_", " ")}</span>}
                        {anime.seasonYear && (
                          <>
                            <span>•</span>
                            <span>{anime.seasonYear}</span>
                          </>
                        )}
                        {anime.averageScore && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-bold">{anime.averageScore}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 4: Voice Actor CDs & Discography Merchandise */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222736] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Voice Actor Music, CDs & Media
                </h2>
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  Amazon Prime & CDJapan
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Character song albums, voice drama CDs, photo books, and official concert discography for {displayTitle}.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <span>Find on Amazon</span>
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
