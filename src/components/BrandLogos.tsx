import React from "react";

interface BrandLogoProps {
  className?: string;
  size?: number;
}

/**
 * High-fidelity official-style vector logos for anime streaming platforms
 */
export function CrunchyrollLogo({ className = "w-5 h-5", size = 20 }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Crunchyroll"
    >
      <circle cx="12" cy="12" r="10" fill="#F47521" />
      <path
        d="M13.8 6.2C10.6 6.2 8 8.8 8 12s2.6 5.8 5.8 5.8c1.6 0 3-.6 4.1-1.7.3-.3.3-.8 0-1.1-.3-.3-.8-.3-1.1 0-.8.8-1.9 1.3-3 1.3-2.4 0-4.3-1.9-4.3-4.3s1.9-4.3 4.3-4.3c1.1 0 2.2.5 3 1.3.3.3.8.3 1.1 0 .3-.3.3-.8 0-1.1-1.1-1.1-2.5-1.7-4.1-1.7z"
        fill="#FFFFFF"
      />
      <circle cx="14" cy="12" r="2.2" fill="#FFFFFF" />
    </svg>
  );
}

export function NetflixLogo({ className = "w-5 h-5", size = 20 }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Netflix"
    >
      <rect width="24" height="24" rx="4" fill="#000000" />
      <path d="M6 3.5h3.2v17H6z" fill="#E50914" />
      <path d="M14.8 3.5H18v17h-3.2z" fill="#E50914" />
      <path d="M6 3.5l8.8 17h3.2l-8.8-17H6z" fill="#B81D24" />
    </svg>
  );
}

export function HuluLogo({ className = "w-5 h-5", size = 20 }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Hulu"
    >
      <rect width="24" height="24" rx="4" fill="#0b1712" />
      <path
        d="M5 8.5v7h2.2v-3.2c0-.9.6-1.5 1.5-1.5s1.5.6 1.5 1.5v3.2h2.2v-3.7c0-1.8-1.2-2.9-2.8-2.9-1.2 0-2.1.6-2.6 1.5V5.5H5v3zm9.2 1.8v3.4c0 .9-.6 1.5-1.5 1.5s-1.5-.6-1.5-1.5v-3.4h-2.2v3.7c0 1.8 1.2 2.9 2.8 2.9 1.2 0 2.1-.6 2.6-1.5v1.3h2.2v-7.9h-2.4z"
        fill="#1CE783"
      />
    </svg>
  );
}

export function PrimeVideoLogo({ className = "w-5 h-5", size = 20 }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Amazon Prime Video"
    >
      <rect width="24" height="24" rx="4" fill="#001F3F" />
      {/* Prime Text */}
      <path
        d="M4.5 11.5c0-1.6 1-2.6 2.5-2.6s2.5 1 2.5 2.6-1 2.6-2.5 2.6-2.5-1-2.5-2.6zm3.3 0c0-.8-.3-1.3-.8-1.3s-.8.5-.8 1.3.3 1.3.8 1.3.8-.5.8-1.3zM11 9h1.5v5.2H11V9zm3.5 0h1.4v.8c.4-.6 1-1 1.7-1 1.2 0 2 1 2 2.7s-.8 2.7-2 2.7c-.7 0-1.3-.4-1.7-1v2.5h-1.4V9z"
        fill="#FFFFFF"
      />
      {/* Amazon Cyan Smile Arrow */}
      <path
        d="M4.5 17.2c3.5 2.2 9.5 2.2 13.5 0 .3-.2.6.1.4.3-1.6 1.4-5.2 2.3-7.5 2.3-2.6 0-5.4-1-6.8-2.2-.2-.2 0-.5.4-.4z"
        fill="#00A8E1"
      />
      <path
        d="M18.8 16.5c-.2.4-.7.6-1.1.5-.1 0-.1-.1 0-.2.6-.4.9-1.1.9-1.1s.7.2 1.4.2c.2 0 .2.2 0 .2-.4.2-.9.3-1.2.4z"
        fill="#00A8E1"
      />
    </svg>
  );
}

export function HidiveLogo({ className = "w-5 h-5", size = 20 }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="HIDIVE"
    >
      <rect width="24" height="24" rx="4" fill="#04121F" />
      <path
        d="M4.5 7h2.4v3.6h3.2V7h2.4v10h-2.4v-4.2H6.9V17H4.5V7zm9.5 0h2.4v10H14V7zm4.2 0h2.8c2.1 0 3.5 1.4 3.5 3.5v3c0 2.1-1.4 3.5-3.5 3.5h-2.8V7zm2.4 2.2v5.6h.4c.9 0 1.5-.6 1.5-1.5v-2.6c0-.9-.6-1.5-1.5-1.5h-.4z"
        fill="#00AEEF"
      />
    </svg>
  );
}

export function DisneyPlusLogo({ className = "w-5 h-5", size = 20 }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Disney Plus"
    >
      <rect width="24" height="24" rx="4" fill="#040714" />
      {/* Disney Arc */}
      <path
        d="M4.5 16.5C8 9 14.5 6.5 19 6.2c.3 0 .4.3.2.5-3.2 2-7.5 4.5-9.8 9.5-.1.3-.5.4-.7.2l-4.2.1z"
        fill="#113CCF"
      />
      {/* Plus Sign */}
      <path
        d="M17.5 11.5h1.2v-1.2h1v1.2H21v1h-1.3v1.2h-1v-1.2h-1.2v-1z"
        fill="#FFFFFF"
      />
      {/* Disney stylized D */}
      <path
        d="M7 8c3 0 5.5 1.5 5.5 4s-2.5 4-5.5 4H5V8h2zm0 6.2c1.8 0 3.2-1 3.2-2.2S8.8 9.8 7 9.8H6.5v4.4H7z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function BilibiliLogo({ className = "w-5 h-5", size = 20 }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Bilibili TV"
    >
      <rect width="24" height="24" rx="4" fill="#00A1D6" />
      {/* Antennas */}
      <path d="M7.5 5l2 2.5M16.5 5l-2 2.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
      {/* TV Body */}
      <rect x="4" y="7.5" width="16" height="12" rx="3" fill="#FFFFFF" />
      {/* Screen Eyes & Smile */}
      <circle cx="8.5" cy="12.5" r="1.3" fill="#00A1D6" />
      <circle cx="15.5" cy="12.5" r="1.3" fill="#00A1D6" />
      <path d="M10.5 15c.8.6 2.2.6 3 0" stroke="#00A1D6" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function YouTubeLogo({ className = "w-5 h-5", size = 20 }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="YouTube"
    >
      <rect width="24" height="24" rx="4" fill="#181818" />
      <rect x="3.5" y="6" width="17" height="12" rx="3.5" fill="#FF0000" />
      <path d="M10.2 9.2l4.8 2.8-4.8 2.8V9.2z" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Universal Streaming Brand Logo Selector
 */
export function StreamingBrandLogo({
  site,
  className = "w-6 h-6",
}: {
  site: string;
  className?: string;
}) {
  const norm = site.toLowerCase();

  if (norm.includes("crunchyroll")) {
    return <CrunchyrollLogo className={className} />;
  }
  if (norm.includes("netflix")) {
    return <NetflixLogo className={className} />;
  }
  if (norm.includes("hulu")) {
    return <HuluLogo className={className} />;
  }
  if (norm.includes("amazon") || norm.includes("prime")) {
    return <PrimeVideoLogo className={className} />;
  }
  if (norm.includes("hidive")) {
    return <HidiveLogo className={className} />;
  }
  if (norm.includes("disney")) {
    return <DisneyPlusLogo className={className} />;
  }
  if (norm.includes("bilibili")) {
    return <BilibiliLogo className={className} />;
  }
  if (norm.includes("youtube")) {
    return <YouTubeLogo className={className} />;
  }

  // Fallback generic streaming badge
  return (
    <div
      className={`rounded-lg bg-[#202636] border border-[#2c344a] flex items-center justify-center font-bold text-xs text-white ${className}`}
    >
      {site.slice(0, 2).toUpperCase()}
    </div>
  );
}
