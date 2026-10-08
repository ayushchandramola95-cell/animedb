"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain,
  Zap,
  Coffee,
  Globe2,
  Star,
  Play,
  ArrowRight,
  Sparkles,
  Quote,
} from "lucide-react";

interface CuratedAnime {
  id: number;
  title: string;
  studio: string;
  score: string;
  episodes: string;
  coverImage: string;
  hook: string;
  trailerId?: string;
}

const COLLECTIONS: Record<
  string,
  {
    title: string;
    subtitle: string;
    icon: typeof Brain;
    color: string;
    items: CuratedAnime[];
  }
> = {
  psychological: {
    title: "Mind-Bending Psychological Thrillers",
    subtitle: "High-stakes cat-and-mouse games, existential twists, and moral ambiguity.",
    icon: Brain,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    items: [
      {
        id: 1535,
        title: "Death Note",
        studio: "Madhouse",
        score: "8.4",
        episodes: "37 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-lawCwhzhi96X.jpg",
        hook: "Genius student vs. eccentric world-class detective in an epic battle of wits.",
        trailerId: "NlJZ-YgAt-c",
      },
      {
        id: 9253,
        title: "Steins;Gate",
        studio: "White Fox",
        score: "8.9",
        episodes: "24 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx9253-7pdn4YkWkSsw.png",
        hook: "Accidental microwave time-travel unravels into a terrifying global conspiracy.",
        trailerId: "uMYhjVwp0Fk",
      },
      {
        id: 19,
        title: "Monster",
        studio: "Madhouse",
        score: "8.8",
        episodes: "74 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/b19-x30uxLpIHb1p.png",
        hook: "A neurosurgeon risks everything to hunt down the psychopathic boy he saved.",
        trailerId: "x0ZrqV7y85c",
      },
      {
        id: 13601,
        title: "Psycho-Pass",
        studio: "Production I.G",
        score: "8.2",
        episodes: "22 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx13601-e2L1d11rE9j8.jpg",
        hook: "Dystopian cyberpunk society where weapons judge your criminal intent.",
        trailerId: "5sE0q6j75uE",
      },
    ],
  },
  sakuga: {
    title: "God-Tier Sakuga Animation & Battles",
    subtitle: "Fluid martial arts, breathtaking camera movements, and jaw-dropping battle choreography.",
    icon: Zap,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    items: [
      {
        id: 113415,
        title: "Jujutsu Kaisen",
        studio: "MAPPA",
        score: "8.5",
        episodes: "24 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pMWjvF.jpg",
        hook: "Visceral curse exorcisms with industry-leading hand-to-hand fight choreography.",
        trailerId: "4A_X-UdYS0U",
      },
      {
        id: 101922,
        title: "Demon Slayer: Kimetsu no Yaiba",
        studio: "ufotable",
        score: "8.4",
        episodes: "26 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-PEn1CTyeNhT5.png",
        hook: "Stunning breathing-style elemental sword techniques animated with cinematic mastery.",
        trailerId: "VQGCKyvzIM4",
      },
      {
        id: 127230,
        title: "Chainsaw Man",
        studio: "MAPPA",
        score: "8.4",
        episodes: "12 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-FloCoAjyBgjp.png",
        hook: "Gritty cinematic direction with raw, blood-pumping demon carnage.",
        trailerId: "q15CRdE5Bv0",
      },
      {
        id: 21507,
        title: "Mob Psycho 100",
        studio: "Bones",
        score: "8.5",
        episodes: "12 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21507-7T0hM8vUu5V6.png",
        hook: "Peak expressive 2D sakuga explosion whenever Mob reaches 100% emotional overflow.",
        trailerId: "89E9bH2V0Zk",
      },
    ],
  },
  comfort: {
    title: "Cozy Wholesome Escapes & Comfort",
    subtitle: "Heartwarming friendships, soul-healing humor, and cozy atmospheres to de-stress.",
    icon: Coffee,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    items: [
      {
        id: 154587,
        title: "Frieren: Beyond Journey’s End",
        studio: "Madhouse",
        score: "9.1",
        episodes: "28 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n1HgnioioGhp.jpg",
        hook: "An elf mage’s poignant, quiet pilgrimage to understand the brevity of human warmth.",
        trailerId: "ZEkwCGJ3o_Y",
      },
      {
        id: 140960,
        title: "Spy x Family",
        studio: "WIT STUDIO & CloverWorks",
        score: "8.4",
        episodes: "25 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-Y4yPsm1dK17G.jpg",
        hook: "Spy dad, assassin mom, and telepathic daughter form the sweetest fake family ever.",
        trailerId: "ofXigq9aIpo",
      },
      {
        id: 144949,
        title: "Bocchi the Rock!",
        studio: "CloverWorks",
        score: "8.8",
        episodes: "12 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx144949-V7bW9w2hE82R.png",
        hook: "Painfully relatable social anxiety meets electrifying underground indie rock music.",
        trailerId: "F1Wn3L08_a0",
      },
      {
        id: 124080,
        title: "Horimiya",
        studio: "CloverWorks",
        score: "8.1",
        episodes: "13 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx124080-692H3aM7B2R1.jpg",
        hook: "Two high schoolers reveal their secret home personalities to each other.",
        trailerId: "h_T7y5x5Mms",
      },
    ],
  },
  fantasy: {
    title: "Epic Fantasy & Legendary World-Building",
    subtitle: "Sprawling historical sagas, intricate magic systems, and generational destinies.",
    icon: Globe2,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    items: [
      {
        id: 16498,
        title: "Attack on Titan",
        studio: "WIT STUDIO / MAPPA",
        score: "8.5",
        episodes: "89 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-73IhOXpJZiDY.png",
        hook: "Humanity’s desperate battle for survival evolves into a dark geopolitical tragedy.",
        trailerId: "MGRm4IzK1SQ",
      },
      {
        id: 101348,
        title: "Vinland Saga",
        studio: "WIT STUDIO / MAPPA",
        score: "8.7",
        episodes: "48 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101348-18e34yQ4814A.jpg",
        hook: "Brutal Viking warfare transforms into a heartbreaking philosophical journey of peace.",
        trailerId: "f8JrZ7Q_F88",
      },
      {
        id: 5114,
        title: "Fullmetal Alchemist: Brotherhood",
        studio: "Bones",
        score: "9.0",
        episodes: "64 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx5114-1Q1c25lZ1x7u.jpg",
        hook: "Two alchemist brothers seek the Philosopher’s Stone to restore their broken bodies.",
        trailerId: "--IcmZkvL0Q",
      },
      {
        id: 108465,
        title: "Mushoku Tensei: Jobless Reincarnation",
        studio: "Studio Bind",
        score: "8.3",
        episodes: "36 eps",
        coverImage: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx108465-b771e72m37aB.jpg",
        hook: "Breathtakingly detailed fantasy world where an ex-recluse resolves to live earnestly.",
        trailerId: "r2Y2y4d8WqY",
      },
    ],
  },
};

interface CuratedCollectionsSectionProps {
  onWatchTrailer?: (trailerId: string, title: string) => void;
}

export default function CuratedCollectionsSection({
  onWatchTrailer,
}: CuratedCollectionsSectionProps) {
  const [activeTab, setActiveTab] = useState<string>("psychological");
  const collection = COLLECTIONS[activeTab];
  const Icon = collection.icon;

  return (
    <section className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202638] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-sm">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Curated Taste Collections
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                Staff Picks
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Thematic binge playlists curated for specific vibes and storytelling cravings.
            </p>
          </div>
        </div>

        {/* Collection Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {Object.entries(COLLECTIONS).map(([key, col]) => {
            const TabIcon = col.icon;
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 border ${
                  isActive
                    ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/25"
                    : "bg-[#131624] border-[#22283a] text-gray-400 hover:text-white hover:bg-[#181d2e]"
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{col.title.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Collection Subtitle Pill */}
      <div className="p-3.5 rounded-2xl bg-[#121522] border border-[#21273a] flex items-center gap-3 text-xs text-gray-300 shadow-sm">
        <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400 flex-shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="font-bold text-white">{collection.title}:</span>
          <span className="text-gray-400">{collection.subtitle}</span>
        </div>
      </div>

      {/* Grid of 4 Curated Titles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {collection.items.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-[#121522] border border-[#21273a] hover:border-[#333d58] hover:bg-[#151928] transition-all flex flex-col justify-between gap-3 group shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-3.5">
              <Link
                href={`/anime/${item.id}`}
                className="relative w-20 sm:w-22 aspect-[3/4] rounded-xl overflow-hidden bg-[#181d2c] flex-shrink-0 border border-[#262d42]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </Link>

              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="text-[10px] text-gray-400 truncate font-medium">{item.studio}</div>
                  <Link href={`/anime/${item.id}`}>
                    <h3
                      className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mt-0.5"
                      title={item.title}
                    >
                      {item.title}
                    </h3>
                  </Link>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-md bg-[#161a29] border border-[#272f44] text-[10px] font-black text-amber-400 flex items-center gap-1 shadow-xs">
                    <Star className="w-2.5 h-2.5 fill-amber-400" />
                    <span>{item.score}</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">{item.episodes}</span>
                </div>
              </div>
            </div>

            {/* Editorial Hook Quote */}
            <div className="relative text-[11px] text-gray-300 italic leading-relaxed bg-[#151928] p-3 rounded-xl border border-[#21283c]">
              <Quote className="w-3.5 h-3.5 text-blue-400/40 absolute -top-1.5 -left-1.5 fill-current" />
              <span>&ldquo;{item.hook}&rdquo;</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1d2334] text-xs">
              {item.trailerId && (
                <button
                  onClick={() => onWatchTrailer && onWatchTrailer(item.trailerId!, item.title)}
                  className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1 font-bold"
                >
                  <Play className="w-3 h-3 fill-rose-500" />
                  <span>Trailer</span>
                </button>
              )}

              <Link
                href={`/anime/${item.id}`}
                className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-bold ml-auto"
              >
                <span>Where to Watch</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
