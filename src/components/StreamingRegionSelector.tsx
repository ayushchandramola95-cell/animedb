"use client";

import { useState, useEffect, useRef } from "react";
import { Globe, ChevronDown, Check, ShieldCheck } from "lucide-react";

export interface RegionOption {
  code: string;
  name: string;
  flag: string;
  majorPlatforms: string[];
}

export const REGIONS: RegionOption[] = [
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    majorPlatforms: ["Crunchyroll", "Hulu", "Netflix", "HIDIVE", "Prime Video"],
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    majorPlatforms: ["Crunchyroll UK", "Netflix", "Channel 4", "Prime Video"],
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    majorPlatforms: ["Crunchyroll", "Netflix Canada", "Tubi", "Prime Video"],
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    majorPlatforms: ["Crunchyroll", "AnimeLab", "Netflix AU", "Stan"],
  },
  {
    code: "GLOBAL",
    name: "Global / Worldwide",
    flag: "🌐",
    majorPlatforms: ["Worldwide Availability", "Crunchyroll Worldwide"],
  },
];

interface StreamingRegionSelectorProps {
  currentRegion?: string;
  onRegionChange?: (regionCode: string) => void;
  compact?: boolean;
}

export default function StreamingRegionSelector({
  currentRegion = "US",
  onRegionChange,
  compact = false,
}: StreamingRegionSelectorProps) {
  const [selected, setSelected] = useState<string>(currentRegion);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("animedb_streaming_region");
      if (saved) {
        setSelected(saved);
        if (onRegionChange) onRegionChange(saved);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const handleSelect = (code: string) => {
    setSelected(code);
    setIsOpen(false);
    try {
      localStorage.setItem("animedb_streaming_region", code);
      // Dispatch custom storage event for sync
      window.dispatchEvent(new Event("regionchange"));
    } catch {
      // Ignore
    }
    if (onRegionChange) onRegionChange(code);
  };

  const currentOpt = REGIONS.find((r) => r.code === selected) || REGIONS[0];

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-lg border transition-all flex items-center gap-1.5 ${
          compact
            ? "px-2 py-1 text-xs bg-[#141824] hover:bg-[#1a2030] text-gray-300 border-[#222838]"
            : "px-2.5 py-1.5 text-xs font-semibold bg-[#141824] hover:bg-[#1b2132] text-white border-[#242b3d] shadow-sm"
        }`}
        title={`Streaming Region: ${currentOpt.name} (Click to change)`}
      >
        <span className="text-sm leading-none">{currentOpt.flag}</span>
        <span className="font-semibold">{currentOpt.code}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-[#141724] border border-[#252b3d] shadow-2xl py-1.5 z-50 flex flex-col text-xs animate-fade-in">
          <div className="px-3 py-1.5 border-b border-[#202534] text-[10px] text-gray-400 font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Select Streaming Region</span>
            <Globe className="w-3 h-3 text-blue-400" />
          </div>

          <div className="py-1 flex flex-col">
            {REGIONS.map((r) => (
              <button
                key={r.code}
                onClick={() => handleSelect(r.code)}
                className={`px-3 py-2 text-left flex items-center justify-between hover:bg-[#1a2032] transition-colors ${
                  selected === r.code ? "bg-[#181e30] text-blue-400 font-semibold" : "text-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{r.flag}</span>
                  <div>
                    <span className="block leading-tight">{r.name}</span>
                    <span className="text-[10px] text-gray-500 block">
                      {r.majorPlatforms.slice(0, 2).join(", ")}
                    </span>
                  </div>
                </div>
                {selected === r.code && <Check className="w-4 h-4 text-blue-400" />}
              </button>
            ))}
          </div>

          <div className="px-3 py-2 border-t border-[#202534] bg-[#0f121a] text-[10px] text-gray-400 rounded-b-xl flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>Licensing varies by territory. VPN lets you switch catalogs instantly.</span>
          </div>
        </div>
      )}
    </div>
  );
}
