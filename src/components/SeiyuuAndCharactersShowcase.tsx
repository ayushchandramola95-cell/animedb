"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Mic,
  Heart,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface CharacterItem {
  id: number;
  name: {
    full: string;
    native?: string | null;
  };
  image: {
    large?: string | null;
    medium?: string | null;
  };
  favourites: number;
  media?: {
    edges?: Array<{
      characterRole: string;
      voiceActors?: Array<{
        id: number;
        name: {
          full: string;
        };
      }>;
      node?: {
        id: number;
        title: {
          english?: string | null;
          romaji?: string | null;
        };
      };
    }>;
  };
}

interface StaffItem {
  id: number;
  name: {
    full: string;
    native?: string | null;
  };
  image: {
    large?: string | null;
    medium?: string | null;
  };
  primaryOccupations?: string[];
  favourites: number;
  characterMedia?: {
    edges?: Array<{
      characterRole: string;
      characters?: Array<{
        id: number;
        name: {
          full: string;
        };
      }>;
      node?: {
        id: number;
        title: {
          english?: string | null;
          romaji?: string | null;
        };
      };
    }>;
  };
}

interface SeiyuuAndCharactersShowcaseProps {
  characters: CharacterItem[];
  staff: StaffItem[];
}

export default function SeiyuuAndCharactersShowcase({
  characters,
  staff,
}: SeiyuuAndCharactersShowcaseProps) {
  const [activeTab, setActiveTab] = useState<"characters" | "staff">("characters");

  return (
    <section className="flex flex-col gap-4">
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202638] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/25 flex items-center justify-center text-pink-400 flex-shrink-0 shadow-sm">
            {activeTab === "characters" ? (
              <Users className="w-4.5 h-4.5" />
            ) : (
              <Mic className="w-4.5 h-4.5 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {activeTab === "characters" ? "Iconic Characters Hall of Fame" : "Legendary Japanese Voice Cast (Seiyuu)"}
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/25">
                Fan Favorites
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {activeTab === "characters"
                ? "The most favorited heroes, anti-heroes & villains paired with their legendary voice actors."
                : "The premier Japanese voice actors bringing life to the anime industry's greatest legends."}
            </p>
          </div>
        </div>

        {/* Tab Switcher & View All Link */}
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <div className="flex items-center p-0.5 rounded-xl bg-[#131624] border border-[#22283a]">
            <button
              onClick={() => setActiveTab("characters")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "characters"
                  ? "bg-pink-600 text-white shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Characters</span>
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "staff"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Cast</span>
            </button>
          </div>

          <Link
            href={activeTab === "characters" ? "/characters" : "/staff"}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5 pl-1"
          >
            <span>Explore All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Content Grid (Responsive 2 to 8 columns) */}
      {activeTab === "characters" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-3.5">
          {characters.slice(0, 8).map((char) => {
            const animeEdge = char.media?.edges?.[0];
            const va = animeEdge?.voiceActors?.[0];

            return (
              <Link
                key={char.id}
                href={`/character/${char.id}`}
                className="p-3 rounded-2xl bg-[#121522] hover:bg-[#161a29] border border-[#21273a] hover:border-pink-500/40 transition-all flex flex-col gap-2 group shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#181d2c] border border-[#252c3f]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={char.image?.large || char.image?.medium || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300"}
                    alt={char.name.full}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-black text-pink-400 flex items-center gap-1 border border-pink-500/30 shadow-xs">
                    <Heart className="w-2.5 h-2.5 fill-pink-500 text-pink-500" />
                    <span>{char.favourites?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                    {char.name.full}
                  </h4>
                  {va && (
                    <p className="text-[10px] text-gray-400 truncate flex items-center gap-1 mt-0.5 font-medium">
                      <Mic className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                      <span>{va.name.full}</span>
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Top Voice Cast (Seiyuu) Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-3.5">
          {staff.slice(0, 8).map((st) => {
            const edge = st.characterMedia?.edges?.[0];
            const famousChar = edge?.characters?.[0];

            return (
              <Link
                key={st.id}
                href={`/staff/${st.id}`}
                className="p-3 rounded-2xl bg-[#121522] hover:bg-[#161a29] border border-[#21273a] hover:border-emerald-500/40 transition-all flex flex-col gap-2 group shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#181d2c] border border-[#252c3f]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={st.image?.large || st.image?.medium || "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300"}
                    alt={st.name.full}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-black text-emerald-400 flex items-center gap-1 border border-emerald-500/30 shadow-xs">
                    <Heart className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
                    <span>{st.favourites?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                    {st.name.full}
                  </h4>
                  {famousChar && (
                    <p className="text-[10px] text-gray-400 truncate flex items-center gap-1 mt-0.5 font-medium">
                      <Users className="w-2.5 h-2.5 text-pink-400 flex-shrink-0" />
                      <span>{famousChar.name.full}</span>
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
