"use client";

import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerId: string | null;
  title: string;
  streamUrl?: string | null;
  streamSite?: string | null;
}

export default function TrailerModal({
  isOpen,
  onClose,
  trailerId,
  title,
  streamUrl,
  streamSite,
}: TrailerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !trailerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="relative w-full max-w-4xl bg-[#131620] border border-[#23293a] rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#202533] bg-[#161a26]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <h3 className="text-sm font-semibold text-white truncate max-w-md">
              {title} - Official Trailer
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#202533] transition-colors"
            aria-label="Close trailer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Frame */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&rel=0&modestbranding=1`}
            title={`${title} Official Trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>

        {/* Footer / Where to Watch CTA */}
        <div className="p-4 bg-[#141722] border-t border-[#202533] flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-gray-400">
            100% Official Trailer Embed via YouTube
          </span>

          {streamUrl && (
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Watch Full Episodes on {streamSite || "Streaming Partner"}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
