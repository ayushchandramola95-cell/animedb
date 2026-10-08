"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";

interface FormattedBioProps {
  description: string | null | undefined;
  maxInitialLength?: number;
}

export default function FormattedBio({
  description,
  maxInitialLength = 450,
}: FormattedBioProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<number, boolean>>({});

  if (!description || !description.trim()) {
    return (
      <p className="text-xs sm:text-sm text-gray-400 italic">
        No biography or background information is currently documented for this entry.
      </p>
    );
  }

  // Pre-process raw AniList description
  const cleanRawText = description
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[bi]>/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

  const isLong = cleanRawText.length > maxInitialLength;
  const displayText = isLong && !isExpanded
    ? cleanRawText.slice(0, maxInitialLength) + "..."
    : cleanRawText;

  const toggleSpoiler = (index: number) => {
    setRevealedSpoilers((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Parse text segments into React elements
  const parseSegments = (text: string) => {
    // Regex for:
    // 1. Spoilers: ~!content!~
    // 2. Markdown links: [label](url)
    // 3. Bold: **text** or __text__
    // 4. Italic: *text* or _text_
    const regex = /(~![\s\S]*?!~)|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*|__[^_]+__)|(\*[^*]+\*|_[^_]+_)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let spoilerCounter = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const [fullMatch, spoiler, mdLink, bold, italic] = match;

      if (spoiler) {
        const spoilerIndex = spoilerCounter++;
        const content = spoiler.slice(2, -2).trim();
        const isRevealed = !!revealedSpoilers[spoilerIndex];

        parts.push(
          <span
            key={`spoiler-${spoilerIndex}-${match.index}`}
            onClick={() => toggleSpoiler(spoilerIndex)}
            className={`inline-block mx-0.5 px-2 py-0.5 rounded cursor-pointer transition-all select-none text-xs ${
              isRevealed
                ? "bg-rose-950/40 border border-rose-500/30 text-rose-200"
                : "bg-gray-800 text-gray-500 hover:text-gray-300 border border-gray-700/60 blur-[3px] hover:blur-none"
            }`}
            title={isRevealed ? "Click to conceal spoiler" : "Spoiler text - click to reveal"}
          >
            {isRevealed ? content : "⚠️ Spoiler (click to reveal)"}
          </span>
        );
      } else if (mdLink) {
        const linkMatch = mdLink.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          const [, label, rawUrl] = linkMatch;
          let href = rawUrl.trim();
          let isInternal = false;

          // Convert AniList URLs to internal routes
          const charMatch = href.match(/https?:\/\/anilist\.co\/character\/(\d+)/i);
          const animeMatch = href.match(/https?:\/\/anilist\.co\/anime\/(\d+)/i);
          const staffMatch = href.match(/https?:\/\/anilist\.co\/staff\/(\d+)/i);

          if (charMatch) {
            href = `/character/${charMatch[1]}`;
            isInternal = true;
          } else if (animeMatch) {
            href = `/anime/${animeMatch[1]}`;
            isInternal = true;
          } else if (staffMatch) {
            href = `/staff/${staffMatch[1]}`;
            isInternal = true;
          }

          if (isInternal) {
            parts.push(
              <Link
                key={`link-${match.index}`}
                href={href}
                className="text-blue-400 hover:text-blue-300 font-semibold underline decoration-blue-500/30 hover:decoration-blue-400 transition-colors"
              >
                {label}
              </Link>
            );
          } else {
            parts.push(
              <a
                key={`ext-${match.index}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline decoration-cyan-500/30 hover:decoration-cyan-400 transition-colors"
              >
                {label}
              </a>
            );
          }
        } else {
          parts.push(fullMatch);
        }
      } else if (bold) {
        const boldText = bold.slice(2, -2);
        parts.push(
          <strong key={`b-${match.index}`} className="font-bold text-white">
            {boldText}
          </strong>
        );
      } else if (italic) {
        const italicText = italic.slice(1, -1);
        parts.push(
          <em key={`i-${match.index}`} className="italic text-gray-200">
            {italicText}
          </em>
        );
      }

      lastIndex = match.index + fullMatch.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line break-words">
        {parseSegments(displayText)}
      </div>

      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors py-1 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show Less</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Read Full Biography</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
