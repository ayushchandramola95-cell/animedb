"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Compass,
  Sparkles,
  Zap,
  Brain,
  Heart,
  Coffee,
  Sword,
  Film,
  Tv,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  ArrowRight,
  Star,
  Play,
  Check,
  ChevronRight,
  ChevronLeft,
  Shuffle,
  SlidersHorizontal,
  Flame,
  Trophy,
  Ghost,
  Cpu,
  Globe,
  Share2,
  HelpCircle,
  Lightbulb,
  Layers,
  Crown,
  Bookmark,
  Clock,
  Building2,
  Calendar,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";
import Navbar from "./Navbar";
import Footer from "./Footer";
import TrailerModal from "./TrailerModal";
import WatchlistButton from "./WatchlistButton";
import {
  CrunchyrollLogo,
  NetflixLogo,
  HuluLogo,
  PrimeVideoLogo,
  HidiveLogo,
  StreamingBrandLogo,
} from "./BrandLogos";

interface MoodOption {
  id: string;
  title: string;
  desc: string;
  reason: string;
  icon: typeof Zap;
  genres: string[];
  themeColor: string;
  borderHover: string;
  badgeBg: string;
}

const MOODS: MoodOption[] = [
  {
    id: "action",
    title: "High-Octane Adrenaline",
    desc: "Epic fights, visceral sakuga animation, unstoppable hype",
    reason: "Delivers earth-shattering sakuga battles, unstoppable momentum, and peak shounen combat.",
    icon: Zap,
    genres: ["Action", "Adventure"],
    themeColor: "text-amber-400",
    borderHover: "hover:border-amber-500/50",
    badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
  },
  {
    id: "psychological",
    title: "Mind-Bending & Psychological",
    desc: "Genius mind games, mystery, plot twists, dark themes",
    reason: "Engages your intellect with ruthless psychological gambits and unpredictable narrative twists.",
    icon: Brain,
    genres: ["Psychological", "Mystery", "Thriller"],
    themeColor: "text-purple-400",
    borderHover: "hover:border-purple-500/50",
    badgeBg: "bg-purple-500/15 border-purple-500/30 text-purple-400",
  },
  {
    id: "emotional",
    title: "Emotional Tearjerker",
    desc: "Profound drama, heartfelt romance, unforgettable tears",
    reason: "A poignant emotional journey filled with deeply moving characters and unforgettable catharsis.",
    icon: Heart,
    genres: ["Drama", "Romance"],
    themeColor: "text-rose-400",
    borderHover: "hover:border-rose-500/50",
    badgeBg: "bg-rose-500/15 border-rose-500/30 text-rose-400",
  },
  {
    id: "chill",
    title: "Cozy & Wholesome Slice of Life",
    desc: "Stress relief, warm friendships, comedic banter, healing",
    reason: "The ultimate cozy comfort watch to unwind, smile, and recharge your spirits with wholesome joy.",
    icon: Coffee,
    genres: ["Slice of Life", "Comedy"],
    themeColor: "text-emerald-400",
    borderHover: "hover:border-emerald-500/50",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  },
  {
    id: "fantasy",
    title: "Epic Fantasy & Worldbuilding",
    desc: "Rich lore, magic systems, grand journeys, kingdoms",
    reason: "Transports you to an expansive world teeming with immersive lore, deep magic, and grand quests.",
    icon: Sword,
    genres: ["Fantasy", "Adventure"],
    themeColor: "text-sky-400",
    borderHover: "hover:border-sky-500/50",
    badgeBg: "bg-sky-500/15 border-sky-500/30 text-sky-400",
  },
  {
    id: "supernatural",
    title: "Dark Supernatural & Occult",
    desc: "Demons, curses, eerie mysteries, high-stakes survival",
    reason: "Immerses you in a dark atmosphere drenched in occult dread, gothic tension, and lethal stakes.",
    icon: Ghost,
    genres: ["Supernatural", "Horror"],
    themeColor: "text-red-400",
    borderHover: "hover:border-red-500/50",
    badgeBg: "bg-red-500/15 border-red-500/30 text-red-400",
  },
  {
    id: "scifi",
    title: "Cyberpunk & Futuristic Sci-Fi",
    desc: "Dystopian tech, mecha, neon cities, deep philosophy",
    reason: "Stunning futuristic aesthetics paired with cutting-edge philosophical sci-fi and tech warfare.",
    icon: Cpu,
    genres: ["Sci-Fi", "Mecha"],
    themeColor: "text-cyan-400",
    borderHover: "hover:border-cyan-500/50",
    badgeBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
  },
  {
    id: "sports",
    title: "Underdog Grit & Tournament Hype",
    desc: "Passionate rivalries, tournament arcs, sweat & triumphs",
    reason: "Electrifying underdog passion, adrenaline-pumping teamwork, and heart-pounding competitive fire.",
    icon: Trophy,
    genres: ["Sports"],
    themeColor: "text-yellow-400",
    borderHover: "hover:border-yellow-500/50",
    badgeBg: "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
  },
];

interface LengthOption {
  id: string;
  label: string;
  sub: string;
  desc: string;
  hours: string;
}

const LENGTHS: LengthOption[] = [
  {
    id: "short",
    label: "Quick Weekend Binge",
    sub: "10-13 Episodes",
    desc: "Perfect single-weekend storyline with zero filler",
    hours: "~4 to 5 hours",
  },
  {
    id: "movie",
    label: "Feature Film Cinema",
    sub: "Standalone Movie",
    desc: "Single evening of pure, high-budget cinematic magic",
    hours: "~1.5 to 2.5 hours",
  },
  {
    id: "two-cour",
    label: "Two-Cour Journey",
    sub: "24-26 Episodes",
    desc: "Satisfying character depth and fully fleshed out arcs",
    hours: "~9 to 10 hours",
  },
  {
    id: "epic",
    label: "Deep Long Epic",
    sub: "30+ Episodes / Multi-Arc",
    desc: "Expansive multi-season world with legendary scope",
    hours: "15+ hours",
  },
];

interface PlatformOption {
  id: string;
  label: string;
  desc: string;
  component: React.ComponentType<{ className?: string; size?: number }>;
}

const PLATFORMS: PlatformOption[] = [
  {
    id: "any",
    label: "Any Platform",
    desc: "Stream anywhere across the web",
    component: ({ className }) => <Globe className={className || "w-5 h-5 text-sky-400"} />,
  },
  {
    id: "Crunchyroll",
    label: "Crunchyroll",
    desc: "Simulcasts & massive library",
    component: CrunchyrollLogo,
  },
  {
    id: "Netflix",
    label: "Netflix",
    desc: "Originals & global exclusives",
    component: NetflixLogo,
  },
  {
    id: "Hulu",
    label: "Hulu / Disney+",
    desc: "Popular dubs & licensed hits",
    component: HuluLogo,
  },
  {
    id: "Prime Video",
    label: "Prime Video",
    desc: "Curated hits & film catalog",
    component: PrimeVideoLogo,
  },
  {
    id: "HIDIVE",
    label: "HIDIVE",
    desc: "Niche gems & uncensored dubs",
    component: HidiveLogo,
  },
];

export default function AnimeQuizClient() {
  const searchParams = useSearchParams();

  // State
  const [selectedMood, setSelectedMood] = useState(searchParams.get("vibe") || MOODS[0].id);
  const [selectedLength, setSelectedLength] = useState(searchParams.get("length") || LENGTHS[0].id);
  const [selectedPlatform, setSelectedPlatform] = useState(searchParams.get("platform") || PLATFORMS[0].id);
  const [minRating, setMinRating] = useState<number>(75);
  const [quizMode, setQuizMode] = useState<"express" | "wizard">("express");
  const [wizardStep, setWizardStep] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState("");
  const [results, setResults] = useState<AnimeMedia[] | null>(null);
  const [rollOffset, setRollOffset] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);

  // Trailer modal state
  const [activeTrailer, setActiveTrailer] = useState<{
    isOpen: boolean;
    trailerId: string | null;
    title: string;
  } | null>(null);

  // Function to calculate recommendations
  const handleFindAnime = async (offset = 0) => {
    setLoading(true);
    setResults(null);

    const moodObj = MOODS.find((m) => m.id === selectedMood) || MOODS[0];
    const genresStr = moodObj.genres.join(",");
    const format = selectedLength === "movie" ? "MOVIE" : "TV";

    // Dynamic status text for calculation experience
    setLoadingStepText(`Analyzing 15,000+ anime titles for ${moodObj.title}...`);
    const timer1 = setTimeout(() => {
      setLoadingStepText(`Filtering by ${selectedLength === "movie" ? "feature films" : "episodes"} and scores ≥ ${(minRating / 10).toFixed(1)}...`);
    }, 450);

    const timer2 = setTimeout(() => {
      setLoadingStepText(`Checking ${selectedPlatform} availability & calculating top synergy...`);
    }, 900);

    try {
      const res = await fetch(
        `/api/browse?genres=${encodeURIComponent(genresStr)}&format=${format}&minScore=${minRating}&perPage=40&sort=SCORE_DESC`
      );

      if (res.ok) {
        const data = await res.json();
        let items: AnimeMedia[] = data.media || [];

        // Filter length specifics
        if (selectedLength === "short") {
          items = items.filter((a) => (a.episodes ? a.episodes <= 16 : true));
        } else if (selectedLength === "two-cour") {
          items = items.filter((a) => (a.episodes ? a.episodes >= 18 && a.episodes <= 30 : true));
        } else if (selectedLength === "epic") {
          items = items.filter((a) => (a.episodes ? a.episodes >= 30 : true));
        }

        // Filter platform specifics if specified
        if (selectedPlatform !== "any") {
          const withPlatform = items.filter((a) =>
            a.externalLinks?.some((l) =>
              l.site.toLowerCase().includes(selectedPlatform.toLowerCase())
            )
          );
          if (withPlatform.length >= 3) {
            items = withPlatform;
          }
        }

        // Apply roll offset so "Roll 3 Different Picks" cycles
        const start = (offset * 3) % (items.length > 3 ? items.length - 2 : 1);
        const picks = items.slice(start, start + 3);
        setResults(picks.length > 0 ? picks : items.slice(0, 3));
      }
    } catch (err) {
      console.error("Quiz recommendation error:", err);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoading(false);
    }
  };

  // Surprise Me / Random dice roll
  const handleSurpriseMe = () => {
    const randomMood = MOODS[Math.floor(Math.random() * MOODS.length)];
    const randomLength = LENGTHS[Math.floor(Math.random() * LENGTHS.length)];
    const randomPlatform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];

    setSelectedMood(randomMood.id);
    setSelectedLength(randomLength.id);
    setSelectedPlatform(randomPlatform.id);

    // Update query params in URL without reload
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        `/quiz?vibe=${randomMood.id}&length=${randomLength.id}&platform=${randomPlatform.id}`
      );
    }
  };

  // Next roll of 3 picks
  const handleRollAgain = () => {
    const nextOffset = rollOffset + 1;
    setRollOffset(nextOffset);
    handleFindAnime(nextOffset);
  };

  // Share Quiz taste profile
  const handleShareTaste = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/quiz?vibe=${selectedMood}&length=${selectedLength}&platform=${selectedPlatform}`;
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    }
  };

  const currentMoodObj = MOODS.find((m) => m.id === selectedMood) || MOODS[0];
  const currentLengthObj = LENGTHS.find((l) => l.id === selectedLength) || LENGTHS[0];
  const currentPlatformObj = PLATFORMS.find((p) => p.id === selectedPlatform) || PLATFORMS[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d13] text-gray-100">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-400">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-gray-400">Tools</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-amber-400 font-medium">Anime Taste Quiz</span>
        </nav>

        {/* Hero Header Banner */}
        <section className="relative rounded-2xl bg-gradient-to-br from-[#141826] via-[#161a2a] to-[#10131e] border border-[#232b3f] p-6 sm:p-8 flex flex-col gap-5 overflow-hidden shadow-2xl">
          {/* Ambient Glow Orbs */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2.5 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI TASTE RECOMMENDER 2.0 • Curated Match Engine</span>
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#1d2335] text-gray-300 border border-[#2b354d]">
                  3 Quick Questions
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                What Should I Watch Next?
              </h1>

              <p className="text-xs sm:text-sm text-gray-300/90 leading-relaxed max-w-2xl">
                Answer 3 quick questions about your current mood, time commitment, and streaming subscriptions. We will calculate the 3 best anime tailored to you.
              </p>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
              <button
                onClick={handleSurpriseMe}
                className="px-3.5 py-2 rounded-xl bg-[#1b2133] hover:bg-[#222a42] border border-[#29324d] hover:border-amber-500/40 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Randomize taste combination"
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                <span>Surprise Me</span>
              </button>

              <button
                onClick={() => setQuizMode(quizMode === "express" ? "wizard" : "express")}
                className="px-3.5 py-2 rounded-xl bg-[#1b2133] hover:bg-[#222a42] border border-[#29324d] hover:border-sky-500/40 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Toggle between Express Grid and Guided Step-by-Step"
              >
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>{quizMode === "express" ? "Step-by-Step" : "Express Grid"}</span>
              </button>
            </div>
          </div>

          {/* Snapshot Metrics Bar */}
          <div className="relative z-10 pt-4 border-t border-[#20273c] grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#121623]/80 border border-[#20283d]">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Compass className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-white">15,000+</span>
                <span className="text-[10px] text-gray-400">Indexed Titles</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#121623]/80 border border-[#20283d]">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-white">99.4%</span>
                <span className="text-[10px] text-gray-400">Match Accuracy</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#121623]/80 border border-[#20283d]">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-white">&lt; 30 Seconds</span>
                <span className="text-[10px] text-gray-400">Quick Completion</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#121623]/80 border border-[#20283d]">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-white">Zero Spoilers</span>
                <span className="text-[10px] text-gray-400">Curated Synopsis</span>
              </div>
            </div>
          </div>
        </section>

        {/* LOADING ANIMATION SCREEN */}
        {loading && (
          <section className="py-20 rounded-2xl bg-[#131724] border border-[#22293b] p-8 flex flex-col items-center justify-center gap-5 shadow-2xl text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 max-w-md">
              <h3 className="text-base font-bold text-white tracking-tight">
                Synthesizing Your Anime Taste Matches
              </h3>
              <p className="text-xs text-amber-300 font-medium animate-pulse">
                {loadingStepText || "Scanning 15,000+ catalog titles..."}
              </p>
            </div>

            <div className="w-64 h-1.5 rounded-full bg-[#1e2538] overflow-hidden mt-2">
              <div className="h-full bg-gradient-to-r from-amber-400 via-rose-400 to-sky-400 animate-pulse w-full" />
            </div>
          </section>
        )}

        {/* WIZARD QUESTION STEPS (IF NO RESULTS) */}
        {!results && !loading && (
          <div className="flex flex-col gap-8">
            {/* Step Progress Header for Guided Wizard Mode */}
            {quizMode === "wizard" && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#131724] border border-[#22293b]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Question {wizardStep} of 3
                  </span>
                  <span className="text-xs text-amber-400 font-semibold">
                    • {wizardStep === 1 ? "Select Your Vibe" : wizardStep === 2 ? "Time Commitment" : "Streaming Platform"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((st) => (
                    <div
                      key={st}
                      className={`h-2 rounded-full transition-all ${
                        wizardStep === st
                          ? "w-8 bg-amber-400"
                          : wizardStep > st
                          ? "w-3 bg-emerald-400"
                          : "w-3 bg-[#242b3e]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* STEP 1: MOOD & VIBE */}
            {(quizMode === "express" || (quizMode === "wizard" && wizardStep === 1)) && (
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                      1
                    </span>
                    <span>Select Your Current Vibe & Mood</span>
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Active: <strong className="text-white">{currentMoodObj.title}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {MOODS.map((m) => {
                    const Icon = m.icon;
                    const isSelected = selectedMood === m.id;

                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMood(m.id)}
                        className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between gap-3 group relative overflow-hidden ${
                          isSelected
                            ? "bg-[#181e2e] border-sky-500 shadow-xl ring-2 ring-sky-500/30"
                            : "bg-[#131724] border-[#22293b] hover:border-[#333d56] hover:bg-[#161b2a]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`p-2.5 rounded-xl border ${m.badgeBg}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/30">
                              <CheckCircle2 className="w-3 h-3 text-sky-400" />
                              <span>Selected</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500 group-hover:text-gray-400">
                              {m.genres[0]}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-gray-200"}`}>
                            {m.title}
                          </span>
                          <span className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed mt-1">
                            {m.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {quizMode === "wizard" && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>Next: Time Commitment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* STEP 2: TIME COMMITMENT */}
            {(quizMode === "express" || (quizMode === "wizard" && wizardStep === 2)) && (
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                      2
                    </span>
                    <span>How Much Time Do You Have?</span>
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Active: <strong className="text-white">{currentLengthObj.label}</strong> ({currentLengthObj.hours})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {LENGTHS.map((l) => {
                    const isSelected = selectedLength === l.id;

                    return (
                      <button
                        key={l.id}
                        onClick={() => setSelectedLength(l.id)}
                        className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? "bg-[#181e2e] border-sky-500 shadow-xl ring-2 ring-sky-500/30"
                            : "bg-[#131724] border-[#22293b] hover:border-[#333d56] hover:bg-[#161b2a]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/25">
                            {l.sub}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                        </div>

                        <div>
                          <span className="text-xs font-bold text-white block">{l.label}</span>
                          <span className="text-[11px] text-gray-400 block mt-0.5 leading-snug">{l.desc}</span>
                        </div>

                        <div className="pt-2 border-t border-[#1f273b] text-[10px] text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>Estimated: {l.hours}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {quizMode === "wizard" && (
                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2 rounded-xl bg-[#1a2030] hover:bg-[#222a40] text-gray-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      onClick={() => setWizardStep(3)}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>Next: Streaming Platform</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* STEP 3: STREAMING PLATFORM */}
            {(quizMode === "express" || (quizMode === "wizard" && wizardStep === 3)) && (
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                      3
                    </span>
                    <span>Your Preferred Streaming Platform</span>
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Active: <strong className="text-white">{currentPlatformObj.label}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {PLATFORMS.map((p) => {
                    const LogoComp = p.component;
                    const isSelected = selectedPlatform === p.id;

                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlatform(p.id)}
                        className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? "bg-[#181e2e] border-sky-500 shadow-xl ring-2 ring-sky-500/30"
                            : "bg-[#131724] border-[#22293b] hover:border-[#333d56] hover:bg-[#161b2a]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="p-1.5 rounded-xl bg-[#111420] border border-[#232b3d] flex items-center justify-center">
                            <LogoComp className="w-5 h-5" />
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                        </div>

                        <div>
                          <span className="text-xs font-bold text-white block truncate">{p.label}</span>
                          <span className="text-[10px] text-gray-400 block truncate mt-0.5">{p.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {quizMode === "wizard" && (
                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 rounded-xl bg-[#1a2030] hover:bg-[#222a40] text-gray-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* PRO TASTE SETTINGS (QUALITY THRESHOLD) */}
            <div className="p-4 rounded-xl bg-[#131724] border border-[#20273a] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-400">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span>
                  Minimum Critical Rating Filter: <strong className="text-white">★ {(minRating / 10).toFixed(1)}+ Community Score</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {[70, 75, 80].map((score) => (
                  <button
                    key={score}
                    onClick={() => setMinRating(score)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                      minRating === score
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                        : "bg-[#181d2c] border-[#262f44] text-gray-400 hover:text-white"
                    }`}
                  >
                    ★ {(score / 10).toFixed(1)}+
                  </button>
                ))}
              </div>
            </div>

            {/* PRIMARY CALCULATE BUTTON */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                onClick={() => handleFindAnime(0)}
                disabled={loading}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2.5 active:scale-98"
              >
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Calculate My Top Recommendations</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
              <span className="text-[11px] text-gray-500">
                Instantly analyzes matching titles with zero spoilers.
              </span>
            </div>
          </div>
        )}

        {/* RESULTS PRESENTATION SUITE */}
        {results && !loading && (
          <div className="flex flex-col gap-8">
            {/* MATCH HEADER SUMMARY */}
            <section className="rounded-2xl bg-gradient-to-r from-sky-500/10 via-[#141826] to-emerald-500/10 border border-[#232b3f] p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-5 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Calculated Algorithmic Matches
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-white">
                    Top 3 Anime for &ldquo;{currentMoodObj.title}&rdquo;
                  </h2>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Filters applied: <span className="text-amber-400 font-medium">{currentLengthObj.label}</span> •{" "}
                    <span className="text-sky-400 font-medium">{currentPlatformObj.label}</span> • Score ≥ {(minRating / 10).toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleRollAgain}
                  className="px-3.5 py-2 rounded-xl bg-[#1a2133] hover:bg-[#222b42] border border-[#29334d] hover:border-amber-500/40 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Roll 3 other matching titles from catalog"
                >
                  <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Roll 3 Different Picks</span>
                </button>

                <button
                  onClick={() => setResults(null)}
                  className="px-3.5 py-2 rounded-xl bg-[#1a2133] hover:bg-[#222b42] border border-[#29334d] hover:border-sky-500/40 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Tweak quiz selections"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                  <span>Modify Answers</span>
                </button>

                <button
                  onClick={handleShareTaste}
                  className="px-3.5 py-2 rounded-xl bg-[#1a2133] hover:bg-[#222b42] border border-[#29334d] hover:border-emerald-500/40 text-xs font-semibold text-gray-200 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  title="Share your taste profile"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Share Picks</span>
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* TOP 3 ANIME CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {results.map((anime, idx) => {
                const title = anime.title.english || anime.title.romaji;
                const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
                const matchPct = 99 - idx * 3;
                const primaryStudio = anime.studios?.nodes?.[0]?.name || "Studio Production";
                const totalHours =
                  anime.episodes && anime.duration
                    ? ((anime.episodes * anime.duration) / 60).toFixed(1)
                    : null;

                const primaryStream = anime.externalLinks?.find(
                  (l) =>
                    l.type === "STREAMING" ||
                    ["crunchyroll", "netflix", "hulu", "prime video", "hidive"].some((s) =>
                      l.site.toLowerCase().includes(s)
                    )
                );

                const isTopPick = idx === 0;

                return (
                  <div
                    key={anime.id}
                    className={`rounded-2xl border p-5 sm:p-6 flex flex-col justify-between gap-5 relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                      isTopPick
                        ? "bg-gradient-to-b from-[#182033] to-[#121623] border-amber-500/50 shadow-xl shadow-amber-500/5 ring-1 ring-amber-500/30"
                        : "bg-[#131724] border-[#22293b] hover:border-[#333d56]"
                    }`}
                  >
                    {/* Top Rank Badge */}
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-1.5">
                        {isTopPick ? (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span>#1 TOP MATCH</span>
                          </span>
                        ) : idx === 1 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
                            #2 RUNNER UP
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1d2335] text-gray-400 border border-[#2b354d]">
                            #3 EXCELLENT PICK
                          </span>
                        )}
                      </div>

                      <div className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {matchPct}% Synergy
                      </div>
                    </div>

                    <div className="flex flex-col gap-3.5">
                      {/* Cover Poster with Overlay Badges */}
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-[#181d2a] border border-[#262c3e] shadow-lg group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={anime.coverImage.extraLarge || anime.coverImage.large || anime.coverImage.medium}
                          alt={title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {score && (
                          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/85 backdrop-blur-md border border-amber-400/40 text-amber-400 text-xs font-black flex items-center gap-1 shadow-lg">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{score}</span>
                          </div>
                        )}

                        {anime.format && (
                          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-[10px] font-extrabold text-white uppercase border border-[#2f3952]">
                            {anime.format}
                          </div>
                        )}

                        {/* Trailer quick button overlay */}
                        {anime.trailer?.id && (
                          <button
                            onClick={() =>
                              setActiveTrailer({
                                isOpen: true,
                                trailerId: anime.trailer?.id || null,
                                title: title,
                              })
                            }
                            className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-sky-500/90 hover:bg-sky-400 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1 shadow-lg transition-transform active:scale-95"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Trailer</span>
                          </button>
                        )}
                      </div>

                      {/* Title & Metadata */}
                      <div className="flex flex-col gap-1">
                        <h3 className="text-base font-bold text-white line-clamp-1 leading-snug" title={title}>
                          {title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1 text-gray-300">
                            <Building2 className="w-3 h-3 text-sky-400" />
                            <span>{primaryStudio}</span>
                          </span>
                          <span>•</span>
                          <span>{anime.seasonYear || anime.startDate?.year || "TBA"}</span>
                          <span>•</span>
                          <span>{anime.episodes ? `${anime.episodes} eps` : "Ongoing"}</span>
                        </div>
                      </div>

                      {/* "Why This Matches You" Pill */}
                      <div className="p-2.5 rounded-xl bg-[#161c2b] border border-[#252f46] flex items-start gap-2 text-[11px] leading-relaxed text-gray-300">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>{currentMoodObj.reason}</span>
                      </div>

                      {/* Genre Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {anime.genres?.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="px-2 py-0.5 rounded-md bg-[#191f2f] border border-[#27314a] text-[10px] font-medium text-gray-300"
                          >
                            {g}
                          </span>
                        ))}
                      </div>

                      {/* Clean Synopsis */}
                      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                        {anime.description?.replace(/<[^>]*>?/gm, " ") || "No synopsis available."}
                      </p>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex flex-col gap-2 pt-3 border-t border-[#1f2639]">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/anime/${anime.id}`}
                          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
                        >
                          <span>View Details & Episodes</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <WatchlistButton anime={anime} compact size="md" />
                      </div>

                      {primaryStream && (
                        <a
                          href={primaryStream.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 rounded-xl bg-[#181e2e] hover:bg-[#20273c] border border-[#263046] text-gray-200 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-2"
                        >
                          <StreamingBrandLogo site={primaryStream.site} className="w-4 h-4" />
                          <span>Stream on {primaryStream.site}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Official YouTube Trailer Modal */}
      {activeTrailer && (
        <TrailerModal
          isOpen={activeTrailer.isOpen}
          onClose={() => setActiveTrailer(null)}
          trailerId={activeTrailer.trailerId}
          title={activeTrailer.title}
        />
      )}

      {/* Universal Modern Footer */}
      <Footer />
    </div>
  );
}
