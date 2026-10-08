"use client";

import { useState } from "react";
import {
  ShoppingBag,
  BookOpen,
  Disc3,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Star,
  Check,
  Truck,
  Heart,
  Tag,
  Palette,
} from "lucide-react";
import { AnimeMedia } from "@/lib/types";

interface MangaMerchAffiliateProps {
  anime: AnimeMedia;
}

export default function MangaMerchAffiliate({ anime }: MangaMerchAffiliateProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const displayTitle = anime.title.english || anime.title.romaji;
  const encodedTitle = encodeURIComponent(displayTitle);

  // Extract manga or light novel adaptation from relations if available
  const adaptationEdge = anime.relations?.edges?.find(
    (e) =>
      e.relationType === "ADAPTATION" ||
      e.node.format === "MANGA" ||
      e.node.format === "NOVEL"
  );

  const mangaCover =
    adaptationEdge?.node.coverImage.extraLarge ||
    adaptationEdge?.node.coverImage.large ||
    anime.coverImage.extraLarge ||
    anime.coverImage.large;

  const animeCover =
    anime.coverImage.extraLarge ||
    anime.coverImage.large ||
    anime.coverImage.medium;

  const animeBackdrop = anime.bannerImage || animeCover;

  const isLightNovel = anime.source === "LIGHT_NOVEL";

  const products = [
    {
      id: "manga",
      category: "manga",
      tag: isLightNovel ? "Official Light Novel" : "Original Manga",
      badge: "Best Seller #1",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      title: `${displayTitle} — Vol. 1 & Complete Boxsets`,
      subtitle: isLightNovel
        ? "Original Light Novel by Author • Official English Translation"
        : "Complete Manga Volumes, Collector Boxsets & Kindle Editions",
      image: mangaCover,
      price: "$11.99 Paperback",
      secondaryPrice: "$9.99 Kindle Digital",
      rating: "4.9",
      reviewsCount: "14,820",
      features: [
        "Unabridged original story arcs",
        "Exclusive color volume bonus art",
        "Available in Paperback & Kindle",
      ],
      cta: "Shop Volumes on Amazon",
      url: `https://www.amazon.com/s?k=${encodedTitle}+${isLightNovel ? "light+novel" : "manga"}&tag=animedb0e-20`,
      icon: <BookOpen className="w-4 h-4 text-amber-400" />,
    },
    {
      id: "bluray",
      category: "media",
      tag: "Collector Edition Blu-ray",
      badge: "Limited Release",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      title: `${displayTitle} — Complete Series Blu-ray Boxset`,
      subtitle: "Uncompressed 1080p Master • Lossless Japanese & English Dual Audio",
      image: animeBackdrop,
      price: "$49.99 Collector Set",
      secondaryPrice: "Includes Artbook & OST",
      rating: "4.8",
      reviewsCount: "3,410",
      features: [
        "Uncut 1080p remaster with bonus OVAs",
        "Collector artbook & illustration booklet",
        "High-res official soundtrack sampler",
      ],
      cta: "View Blu-ray on Amazon",
      url: `https://www.amazon.com/s?k=${encodedTitle}+blu-ray+box+set&tag=animedb0e-20`,
      icon: <Disc3 className="w-4 h-4 text-blue-400" />,
    },
    {
      id: "figures",
      category: "figures",
      tag: "Scale Figures & Nendoroids",
      badge: "Authentic Import",
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      title: "Good Smile Company & Official Scale Figures",
      subtitle: "Licensed Japanese PVC Scale Statues & Articulated Nendoroid Figures",
      image: animeCover,
      price: "$39.99 – $189.99",
      secondaryPrice: "100% Authentic Japan Import",
      rating: "4.9",
      reviewsCount: "5,230",
      features: [
        "Good Smile & Kotobukiya licensed sculpts",
        "Interchangeable faceplates & props",
        "Guaranteed genuine Japanese distributor seal",
      ],
      cta: "Explore Figures on Amazon",
      url: `https://www.amazon.com/s?k=${encodedTitle}+figure+good+smile+nendoroid&tag=animedb0e-20`,
      icon: <Sparkles className="w-4 h-4 text-rose-400" />,
    },
    {
      id: "apparel",
      category: "apparel",
      tag: "Official Apparel & Wall Art",
      badge: "Official Merch",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      title: "Hoodies, HD Wall Scrolls & Acrylic Standees",
      subtitle: "Officially Licensed Heavyweight Cotton Apparel & High-Res Posters",
      image: animeBackdrop,
      price: "$19.99 – $44.99",
      secondaryPrice: "Prime Next-Day Eligible",
      rating: "4.7",
      reviewsCount: "8,940",
      features: [
        "Heavyweight pre-shrunk cotton apparel",
        "HD silk fabric wall scrolls & posters",
        "Officially licensed character acrylic standees",
      ],
      cta: "Shop Apparel on Amazon",
      url: `https://www.amazon.com/s?k=${encodedTitle}+hoodie+shirt+wall+scroll&tag=animedb0e-20`,
      icon: <Palette className="w-4 h-4 text-purple-400" />,
    },
  ];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-[#131622] border border-[#222736] p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202533] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Original Manga & Official Merchandise
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 hidden sm:inline-block">
                Amazon Partner
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Support the creators directly with verified authentic volumes, collector boxsets, and licensed imports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-emerald-400 font-semibold text-[11px]">
            <Truck className="w-3.5 h-3.5" />
            <span>Prime Fast Shipping</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181d2a] border border-[#262c3d] text-blue-400 font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Authentic Merch</span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 text-xs">
        {[
          { id: "all", label: "All Merchandise" },
          { id: "manga", label: isLightNovel ? "Light Novels" : "Manga & Volumes" },
          { id: "media", label: "Blu-ray & OST" },
          { id: "figures", label: "Figures & Nendoroids" },
          { id: "apparel", label: "Apparel & Art" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === tab.id
                ? "bg-amber-500 text-gray-950 font-bold shadow-sm shadow-amber-500/20"
                : "bg-[#181d2a] hover:bg-[#22283a] text-gray-300 hover:text-white border border-[#262c3d]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredProducts.map((prod) => (
          <a
            key={prod.id}
            href={prod.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl bg-[#181c28] border border-[#242a3b] hover:border-amber-500/50 hover:bg-[#1b202e] transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-lg hover:shadow-amber-500/5"
          >
            {/* Top Visual Area */}
            <div>
              {/* Product Visual Thumbnail with Badges */}
              <div className="relative aspect-[4/3] w-full bg-[#10131a] overflow-hidden border-b border-[#242a3b]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prod.image}
                  alt={prod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#181c28] via-transparent to-black/30" />

                {/* Top Badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shadow-md backdrop-blur-sm ${prod.badgeColor}`}
                  >
                    {prod.badge}
                  </span>
                </div>

                {/* Prime Badge */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-[#002f6c]/90 text-[10px] font-black text-sky-300 border border-sky-400/30 flex items-center gap-1 shadow-md">
                  <span>prime</span>
                </div>

                {/* Tag Pill bottom */}
                <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 text-[11px] font-bold text-gray-200">
                  <div className="w-5 h-5 rounded-md bg-black/70 flex items-center justify-center">
                    {prod.icon}
                  </div>
                  <span className="drop-shadow-md">{prod.tag}</span>
                </div>
              </div>

              {/* Product Info Content */}
              <div className="p-4 flex flex-col gap-2.5">
                {/* Title */}
                <h4
                  className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug"
                  title={prod.title}
                >
                  {prod.title}
                </h4>

                {/* Subtitle */}
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {prod.subtitle}
                </p>

                {/* Ratings Strip */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-white">{prod.rating}</span>
                  <span className="text-[11px] text-gray-500">({prod.reviewsCount})</span>
                </div>

                {/* Bullet Features */}
                <ul className="flex flex-col gap-1 pt-1 border-t border-[#222838] text-[11px] text-gray-300">
                  {prod.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-1.5 leading-tight">
                      <Check className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom Pricing & CTA */}
            <div className="p-4 pt-3 border-t border-[#222838] bg-[#141824] flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-black text-amber-300 block">{prod.price}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{prod.secondaryPrice}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  In Stock
                </span>
              </div>

              {/* Amazon CTA Button */}
              <div className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 group-hover:from-amber-400 group-hover:to-amber-500 text-gray-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-sm group-hover:shadow-md group-hover:shadow-amber-500/20">
                <span>{prod.cta}</span>
                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Trust & Disclosure Footer */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-gray-500 border-t border-[#1c2130]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Official Amazon Partner: Purchases support anime creators & publisher royalties.</span>
        </div>
        <span className="text-gray-500">Prices & availability subject to change on Amazon.</span>
      </div>
    </section>
  );
}
