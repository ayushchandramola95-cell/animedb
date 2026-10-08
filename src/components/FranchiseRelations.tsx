"use client";

import Link from "next/link";
import { GitBranch, ArrowRight, Film, Tv, BookOpen, Layers, Star } from "lucide-react";
import { AnimeMedia } from "@/lib/types";

interface FranchiseRelationsProps {
  relations?: AnimeMedia["relations"];
  animeId?: number;
}

export default function FranchiseRelations({ relations, animeId }: FranchiseRelationsProps) {
  const edges = relations?.edges || [];

  if (edges.length === 0) return null;

  const getRelationBadgeStyle = (type: string) => {
    switch (type.toUpperCase()) {
      case "PREQUEL":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "SEQUEL":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "ADAPTATION":
      case "SOURCE":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "SIDE_STORY":
        return "bg-sky-500/10 text-sky-400 border-sky-500/30";
      case "ALTERNATIVE":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
      case "SPIN_OFF":
        return "bg-pink-500/10 text-pink-400 border-pink-500/30";
      case "SUMMARY":
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
      default:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    }
  };

  const getFormatIcon = (format?: string | null) => {
    if (format === "MOVIE") return <Film className="w-3 h-3 text-amber-400" />;
    if (format === "MANGA" || format === "NOVEL") return <BookOpen className="w-3 h-3 text-purple-400" />;
    return <Tv className="w-3 h-3 text-cyan-400" />;
  };

  const franchiseLink = animeId ? `/anime/${animeId}/franchise` : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#1f2433]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Franchise Timeline & Related Works
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {edges.length} Works
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Prequels, sequels, movies, OVAs, and source material adaptations in this universe.
            </p>
          </div>
        </div>

        {franchiseLink && (
          <Link
            href={franchiseLink}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 hover:from-emerald-500/20 hover:to-blue-500/20 border border-emerald-500/30 text-emerald-400 hover:text-white text-xs font-semibold transition-all group shadow-sm flex-shrink-0 self-start sm:self-auto"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Complete Watch Order & Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {/* Franchise Callout Banner */}
      {franchiseLink && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#111928] via-[#101e28] to-[#111928] border border-emerald-500/20 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
              <GitBranch className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                Need the recommended viewing order?
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  New Dedicated Guide
                </span>
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Explore chronological lore order, release order, canon status vs filler movies, and total episodes runtime.
              </p>
            </div>
          </div>
          <Link
            href={franchiseLink}
            className="w-full sm:w-auto text-center px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20 flex-shrink-0"
          >
            <span>Explore Watch Order</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Grid of Relations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {edges.map((edge, idx) => {
          const item = edge.node;
          const title = item.title.english || item.title.romaji;
          const isAnime = item.format !== "MANGA" && item.format !== "NOVEL";
          const year = item.seasonYear || item.startDate?.year;

          const cardContent = (
            <div className="p-3 rounded-xl bg-[#141722] border border-[#222736] hover:border-emerald-500/40 hover:bg-[#181c2b] transition-all flex items-center gap-3.5 group h-full shadow-sm hover:shadow-md">
              <div className="w-14 h-20 rounded-lg bg-[#1a1f2e] overflow-hidden flex-shrink-0 border border-[#262c3d] relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.coverImage.extraLarge || item.coverImage.large || item.coverImage.medium}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {item.averageScore && (
                  <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[9px] font-bold text-amber-400 flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400" />
                    <span>{Math.round(item.averageScore)}%</span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5 h-full">
                <div>
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getRelationBadgeStyle(
                        edge.relationType
                      )}`}
                    >
                      {edge.relationType.replace("_", " ")}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-[#1c2233] px-1.5 py-0.5 rounded border border-[#272e42]">
                      {getFormatIcon(item.format)}
                      <span>{item.format}</span>
                    </span>
                  </div>

                  <h4
                    className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug"
                    title={title}
                  >
                    {title}
                  </h4>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-2 pt-1 border-t border-[#1e2333]">
                  {year && <span>{year}</span>}
                  {item.episodes && (
                    <span>
                      {year ? "• " : ""}
                      {item.episodes} {item.episodes === 1 ? "ep" : "eps"}
                    </span>
                  )}
                  {item.status && (
                    <span className="truncate">
                      {(year || item.episodes) ? "• " : ""}
                      {item.status.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );

          const readingUrl = `https://www.amazon.com/s?k=${encodeURIComponent(
            title + " " + (item.format === "NOVEL" ? "light novel" : "manga")
          )}&tag=animedb0e-20`;

          return isAnime ? (
            <Link key={idx} href={`/anime/${item.id}`} className="block h-full">
              {cardContent}
            </Link>
          ) : (
            <a
              key={idx}
              href={readingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full"
              title={`Shop ${title} ${item.format === "NOVEL" ? "Light Novel" : "Manga"} Volumes on Amazon`}
            >
              {cardContent}
            </a>
          );
        })}
      </div>
    </div>
  );
}
