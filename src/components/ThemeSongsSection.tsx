"use client";

import { Music, Play, ExternalLink, Disc3, Headphones } from "lucide-react";

interface ThemeSongsSectionProps {
  animeTitle: string;
  synonyms?: string[];
  customThemes?: Array<{
    type: "OPENING" | "ENDING";
    number: number;
    title: string;
    artist: string;
    episodes?: string;
  }>;
}

// Known premier soundtrack profiles for legendary titles
const POPULAR_THEMES: Record<
  string,
  Array<{
    type: "OPENING" | "ENDING";
    number: number;
    title: string;
    artist: string;
    episodes?: string;
  }>
> = {
  "attack on titan": [
    { type: "OPENING", number: 1, title: "Guren no Yumiya (Crimson Bow and Arrow)", artist: "Linked Horizon", episodes: "Episodes 1–13" },
    { type: "OPENING", number: 2, title: "Jiyuu no Tsubasa (Wings of Freedom)", artist: "Linked Horizon", episodes: "Episodes 14–25" },
    { type: "ENDING", number: 1, title: "Utsukushiki Zankoku na Sekai", artist: "Yoko Hikasa", episodes: "Episodes 1–13" },
    { type: "ENDING", number: 2, title: "great escape", artist: "cinema staff", episodes: "Episodes 14–25" },
  ],
  "demon slayer: kimetsu no yaiba": [
    { type: "OPENING", number: 1, title: "Gurenge (Red Lotus)", artist: "LiSA", episodes: "Episodes 1–26" },
    { type: "ENDING", number: 1, title: "from the edge", artist: "FictionJunction feat. LiSA", episodes: "Episodes 1–26" },
  ],
  "jujutsu kaisen": [
    { type: "OPENING", number: 1, title: "Kaikai Kitan", artist: "Eve", episodes: "Episodes 1–13" },
    { type: "OPENING", number: 2, title: "VIVID VICE", artist: "Who-ya Extended", episodes: "Episodes 14–24" },
    { type: "ENDING", number: 1, title: "Lost in Paradise", artist: "ALI feat. AKLO", episodes: "Episodes 1–13" },
    { type: "ENDING", number: 2, title: "give it back", artist: "Cö shu Nie", episodes: "Episodes 14–24" },
  ],
  "frieren: beyond journey’s end": [
    { type: "OPENING", number: 1, title: "Yuusha (The Brave)", artist: "YOASOBI", episodes: "Episodes 1–16" },
    { type: "OPENING", number: 2, title: "Haru (Sunny)", artist: "yorushika", episodes: "Episodes 17–28" },
    { type: "ENDING", number: 1, title: "Anytime Anywhere", artist: "milet", episodes: "Episodes 1–28" },
  ],
  "chainsaw man": [
    { type: "OPENING", number: 1, title: "KICK BACK", artist: "Kenshi Yonezu", episodes: "Episodes 1–12" },
    { type: "ENDING", number: 1, title: "Chainsaw Blood", artist: "Vaundy", episodes: "Episode 1" },
    { type: "ENDING", number: 2, title: "Chu, Tayousei.", artist: "ano", episodes: "Episode 7" },
  ],
  "death note": [
    { type: "OPENING", number: 1, title: "the WORLD", artist: "Nightmare", episodes: "Episodes 1–19" },
    { type: "OPENING", number: 2, title: "What's up, people?!", artist: "Maximum the Hormone", episodes: "Episodes 20–37" },
    { type: "ENDING", number: 1, title: "Alumina", artist: "Nightmare", episodes: "Episodes 1–19" },
    { type: "ENDING", number: 2, title: "Zetsubou Billy", artist: "Maximum the Hormone", episodes: "Episodes 20–37" },
  ],
};

export default function ThemeSongsSection({ animeTitle }: ThemeSongsSectionProps) {
  const normTitle = animeTitle.toLowerCase().trim();
  const matchedKey = Object.keys(POPULAR_THEMES).find(
    (k) => normTitle.includes(k) || k.includes(normTitle)
  );

  const songs = matchedKey ? POPULAR_THEMES[matchedKey] : [
    { type: "OPENING" as const, number: 1, title: `${animeTitle} Official Opening Theme`, artist: "Official Soundtrack Artist" },
    { type: "ENDING" as const, number: 1, title: `${animeTitle} Official Ending Theme`, artist: "Official Ending Artist" },
  ];

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-[#131622] border border-[#222736] p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-purple-400" />
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Official Theme Songs & Soundtracks (OST)
          </h3>
        </div>
        <span className="text-xs text-gray-500 hidden sm:inline-block">
          Openings & Endings (OP / ED)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {songs.map((song, idx) => {
          const isOp = song.type === "OPENING";
          const query = encodeURIComponent(`${animeTitle} ${song.title} ${song.artist}`);
          const ytSearch = `https://www.youtube.com/results?search_query=${query}`;
          const spotifySearch = `https://open.spotify.com/search/${query}`;

          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#181c28] border border-[#252b3d] hover:border-[#333a50] flex flex-col justify-between gap-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      isOp
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {isOp ? `OP${song.number}` : `ED${song.number}`}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate" title={song.title}>
                      {song.title}
                    </span>
                    <span className="text-[11px] text-gray-400 truncate">
                      by <span className="text-gray-200 font-medium">{song.artist}</span>
                    </span>
                  </div>
                </div>

                {song.episodes && (
                  <span className="text-[10px] text-gray-500 font-medium px-2 py-0.5 rounded bg-[#11141c] border border-[#23293a] flex-shrink-0">
                    {song.episodes}
                  </span>
                )}
              </div>

              {/* Streaming Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#202534]">
                <a
                  href={ytSearch}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-md bg-[#12151f] hover:bg-[#1a1f2e] border border-[#242a3a] text-gray-300 hover:text-white text-[11px] font-medium transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 text-rose-500 fill-rose-500" />
                  <span>Listen on YouTube</span>
                  <ExternalLink className="w-2.5 h-2.5 text-gray-500" />
                </a>

                <a
                  href={spotifySearch}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-md bg-[#12151f] hover:bg-[#1a1f2e] border border-[#242a3a] text-gray-300 hover:text-white text-[11px] font-medium transition-colors flex items-center gap-1.5"
                >
                  <Headphones className="w-3 h-3 text-emerald-400" />
                  <span>Spotify</span>
                  <ExternalLink className="w-2.5 h-2.5 text-gray-500" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
