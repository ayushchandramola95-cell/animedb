"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  // Construct Schema.org JSON-LD for Google Rich Results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://animedb.org",
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.label,
        item: item.href ? `https://animedb.org${item.href}` : undefined,
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav
        aria-label="Breadcrumbs"
        className={`flex items-center flex-wrap gap-1.5 text-xs text-gray-400 ${className}`}
      >
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-white transition-colors"
          title="Home"
        >
          <Home className="w-3.5 h-3.5 text-gray-400" />
          <span className="hidden sm:inline">Home</span>
        </Link>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <div key={idx} className="flex items-center gap-1.5 min-w-0">
              <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-white transition-colors truncate max-w-[150px] sm:max-w-[200px]"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-200 font-semibold truncate max-w-[180px] sm:max-w-[300px]">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}
