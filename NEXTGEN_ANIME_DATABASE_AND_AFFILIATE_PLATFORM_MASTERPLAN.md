# 🌟 Next-Gen Anime Database & Streaming Discovery Platform
## Architectural Blueprint, Competitor Teardown & 1-Click Automated Ingestion Plan

> **Project Vision**:  
> Build the internet's cleanest, fastest, and most visually stunning anime database and legal streaming guide. A platform that takes the best elements of **MyAnimeList** (depth of database), **AniList** (modern aesthetics), **LiveChart.me** (airing countdowns), and **JustWatch** (where to watch affiliate links) — while eliminating the clutter, slow speeds, and ugly ads that ruin those sites.

---

## 1. Competitor Teardown: How We Will Make a Far Better Version

| Feature | MyAnimeList (MAL) | AniList | LiveChart.me | **Our Next-Gen Platform** 🚀 |
| :--- | :--- | :--- | :--- | :--- |
| **Design & Aesthetic** | ❌ Dated 2008 Web 1.0; cluttered text tables | ⚠️ Clean but flat and minimalist | ❌ Basic grid without visual flair | ✅ **Sleek AniWave Cyber-Dark Theme**: Glassmorphism, glowing badges, full-width cinematic hero banners. |
| **Speed & Performance** | ❌ Very slow (heavy ad bloat, 5s+ load times) | ⚠️ Decent single-page app | ⚠️ Medium | ✅ **Sub-100ms Edge SSR**: Next.js 15, instant server rendering, 100/100 Google PageSpeed score. |
| **Official Trailers** | ⚠️ Hidden in tabs, poor player | ⚠️ Basic link | ⚠️ Small thumb | ✅ **1-Click 1080p YouTube Modal**: Instant cinematic trailer player right on hover or click. |
| **"Where to Watch" & Affiliates** | ❌ Inconsistent and cluttered | ❌ No dedicated streaming hub | ⚠️ Simple text links | ✅ **Integrated Multi-Platform Streaming Hub**: Direct affiliate buttons for Crunchyroll, Netflix, Hulu, Prime + VPN Unblocker callouts ($40+ CPA). |
| **Cast & Voice Actors** | ⚠️ Cluttered table | ⚠️ Simple list | ❌ Missing | ✅ **Interactive Seiyuu Visualizer**: Character cards paired with Japanese voice actor photos and other famous roles. |
| **Airing Countdown** | ❌ Not available | ⚠️ Hidden | ⚠️ Good text schedule | ✅ **Live Real-Time Countdown Ticker**: Visual cards showing *"Episode 4 drops in 2h 15m"*. |
| **Legal Status** | ✅ 100% Legal | ✅ 100% Legal | ✅ 100% Legal | ✅ **100% Legal & Safe**: Zero piracy, zero DMCA risks, clean corporate ad monetization. |

---

## 2. ⚡ The 1-Click Automated Ingestion Engine (AniList GraphQL API)

You do **not** need to manually type thousands of anime, characters, and synopses. 

By leveraging the free, open **AniList GraphQL API** (`https://graphql.anilist.co`), you can fetch **thousands of anime complete with characters, studios, synopses, YouTube trailer IDs, and official streaming links in automated batches**!

### The Automated Sync Query
With just one GraphQL query, AniList returns up to 50 anime per page with all required metadata:

```graphql
query GetBulkAnime($page: Int, $perPage: Int, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
      currentPage
    }
    media(type: ANIME, sort: $sort) {
      id
      idMal
      title {
        romaji
        english
        native
      }
      description(asHtml: false)
      format
      status
      episodes
      duration
      season
      seasonYear
      averageScore
      popularity
      coverImage {
        extraLarge
        large
        color
      }
      bannerImage
      genres
      studios(isMain: true) {
        nodes {
          id
          name
          isAnimationStudio
        }
      }
      trailer {
        id
        site
      }
      streamingEpisodes {
        title
        url
        site
      }
      characters(perPage: 8, sort: ROLE) {
        edges {
          role
          node {
            id
            name {
              full
            }
            image {
              large
            }
          }
          voiceActors(language: JAPANESE) {
            id
            name {
              full
            }
            image {
              large
            }
          }
        }
      }
      nextAiringEpisode {
        episode
        airingAt
        timeUntilAiring
      }
    }
  }
}
```

### Ingestion Throughput:
* AniList allows **90 requests per minute**.
* At 50 anime per request, you can import **4,500 complete anime in just 60 seconds**!
* In your admin dashboard, you can click **`[⚡ Sync Top 1,000 Anime]`** or **`[⚡ Sync Seasonal Releases]`**, and an automated route handler (`/api/admin/sync-anilist`) writes directly to Supabase.

---

## 3. Technology Stack & Infrastructure

```
                  [ Web & Mobile Visitors ]
                             │
                             ▼
                    [ Cloudflare DNS & CDN ]
                             │
                             ▼
                  [ Google Cloud Run / Coolify ]
             (Next.js 15 Standalone Serverless Container)
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ Supabase PostgreSQL ]        [ AniList & Jikan APIs ]
   (Relational DB & Search)     (Automated 1-Click Sync Engine)
            │
            ▼
 [ Official YouTube Player ] ───► [ Streaming Affiliates ]
   (100% Legal Embeds)           (Crunchyroll, Netflix, VPN)
```

| Component | Choice | Why |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15 (App Router, React 19, TypeScript)** | Dynamic SSR, ISR (Incremental Static Regeneration), and unmatched SEO capabilities. |
| **Styling** | **Tailwind CSS + Lucide Icons** | Ultra-responsive, dark cyber-aesthetic with rapid prototyping. |
| **Database** | **Supabase (PostgreSQL 16)** | Complex relational joins between Anime, Characters, Studios, and Episodes. |
| **Hosting** | **Google Cloud Run** | Scalable container hosting, pay only when pages are requested ($0-$5/mo for high traffic). |
| **Video Engine** | **YouTube Iframe API** | Embed official 1080p anime trailers with zero bandwidth and zero storage costs. |

---

## 4. Complete Database Schema (Supabase PostgreSQL)

Execute this complete schema in your Supabase SQL editor:

```sql
-- 1. Anime Core Table
CREATE TABLE anime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anilist_id INTEGER UNIQUE,
    mal_id INTEGER,
    title_english VARCHAR(255),
    title_romaji VARCHAR(255) NOT NULL,
    title_native VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    synopsis TEXT,
    format VARCHAR(30) DEFAULT 'TV', -- 'TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL'
    status VARCHAR(30) DEFAULT 'FINISHED', -- 'FINISHED', 'RELEASING', 'NOT_YET_RELEASED'
    season VARCHAR(20),             -- 'WINTER', 'SPRING', 'SUMMER', 'FALL'
    season_year INTEGER,
    episodes_count INTEGER,
    episode_duration INTEGER,
    score NUMERIC(3, 1),            -- e.g. 8.9
    popularity INTEGER,
    cover_image_url TEXT,
    banner_image_url TEXT,
    accent_color VARCHAR(10),       -- Hex color from AniList for dynamic styling
    youtube_trailer_id VARCHAR(50), -- Official YouTube trailer key
    next_airing_episode INTEGER,
    next_airing_at TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Studios Table
CREATE TABLE studios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anilist_id INTEGER UNIQUE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    is_animation_studio BOOLEAN DEFAULT true
);

-- Anime <-> Studio Junction
CREATE TABLE anime_studios (
    anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
    studio_id UUID REFERENCES studios(id) ON DELETE CASCADE,
    PRIMARY KEY (anime_id, studio_id)
);

-- 3. Genres Table
CREATE TABLE genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL
);

-- Anime <-> Genre Junction
CREATE TABLE anime_genres (
    anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
    genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (anime_id, genre_id)
);

-- 4. Characters & Voice Actors (Seiyuu)
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anilist_id INTEGER UNIQUE,
    name VARCHAR(255) NOT NULL,
    image_url TEXT
);

CREATE TABLE voice_actors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anilist_id INTEGER UNIQUE,
    name VARCHAR(255) NOT NULL,
    image_url TEXT,
    language VARCHAR(50) DEFAULT 'Japanese'
);

CREATE TABLE anime_characters (
    anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    voice_actor_id UUID REFERENCES voice_actors(id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'MAIN', -- 'MAIN', 'SUPPORTING'
    PRIMARY KEY (anime_id, character_id)
);

-- 5. Streaming Links (Where to Watch & Affiliates)
CREATE TABLE streaming_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anime_id UUID REFERENCES anime(id) ON DELETE CASCADE,
    platform_name VARCHAR(100) NOT NULL, -- 'Crunchyroll', 'Netflix', 'Hulu', 'Amazon Prime'
    target_url TEXT NOT NULL,            -- Base URL or affiliate link
    region VARCHAR(10) DEFAULT 'US',
    is_free BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Performance Indexes
CREATE INDEX idx_anime_slug ON anime(slug);
CREATE INDEX idx_anime_score ON anime(score DESC NULLS LAST);
CREATE INDEX idx_anime_popularity ON anime(popularity DESC NULLS LAST);
CREATE INDEX idx_anime_season ON anime(season_year DESC, season);
CREATE INDEX idx_anime_airing ON anime(next_airing_at ASC) WHERE next_airing_at IS NOT NULL;
```

---

## 5. Monetization & Affiliate Engine

### 1. The "Where to Watch" Box (High-Intent Conversion)
On every anime page, place a prominent, high-converting streaming widget:

```
┌─────────────────────────────────────────────────────────────┐
│ 📺 WHERE TO WATCH [ANIME TITLE] OFFICIALLY                  │
├─────────────────────────────────────────────────────────────┤
│  [🟧 Crunchyroll]  HD • Sub / Dub • Watch with Free Trial    │
│  [🟥 Netflix]      HD • 4K • Stream Now                     │
│  [🟩 Hulu]         TV Episodes • Watch Now                  │
│                                                             │
│  🌍 Blocked in your region?                                 │
│  👉 [Unblock all regions with NordVPN] (70% Off + 3 Mo Free)│
└─────────────────────────────────────────────────────────────┘
```

* **Crunchyroll Affiliate**: Earn $3 to $8 per free trial signup via Impact/Rakuten.
* **VPN Affiliates**: Earn **$35 to $50 per sale** from users wanting to unlock Japanese/US catalogs.
* **Amazon Associates**: Earn commissions on Manga volumes, Blu-ray boxsets, and scale figures linked under a *"Merchandise & Original Manga"* tab.
* **Google AdSense / Mediavine**: 100% legal, clean banner placements that earn premium corporate ad rates without risk of bans.

---

## 6. Page Architecture & Design Breakdown

### 1. Homepage (`/`)
* **Hero Spotlight Banner**:
  * Autoplaying muted official YouTube trailer in the background.
  * Big bold title, score badge (e.g. `★ 9.1`), studio pill (`ufotable`), synopsis.
  * Buttons: `▶ Watch Trailer` and `ℹ View Details & Streaming Links`.
* **"Airing Today" Live Ticker**:
  * Real-time countdown cards showing exactly when today's episodes drop in Japan and globally.
* **Seasonal Top Charts**:
  * Tabs for `Winter 2026`, `Trending Now`, `All-Time Greatest`.
* **Studio Showcases**:
  * Carousels highlighting legendary studios: *MAPPA*, *Kyoto Animation*, *Madhouse*, *Bones*.

### 2. Anime Detail Page (`/anime/[slug]`)
* **Cinematic Header**:
  * Backdrop banner with dynamic accent color lighting (pulled from AniList's `accent_color`).
  * Big high-res poster with bookmarking and rating controls.
* **Trailer Cinema Modal**:
  * Floating 1080p YouTube player modal with high-fidelity audio.
* **Where to Watch Streaming Grid**:
  * Direct affiliate buttons with platform logos.
* **Cast & Seiyuu Gallery**:
  * Two-column cards: Character portrait on left, Japanese Voice Actor portrait on right, with full names.
* **Episodes & Airing Guide**:
  * Air dates, episode titles, and countdown for upcoming releases.

### 3. Seasonal Schedule Calendar (`/schedule`)
* Clean day-by-day weekly tabs: `Monday` | `Tuesday` | `Wednesday` | `Thursday` | `Friday` | `Saturday` | `Sunday`.
* Shows exact air times adjusted to the user's local timezone.

---

## 7. Step-by-Step Prompt Roadmap for Your New Project

When you open a new chat to build this project, copy and paste these exact phased prompts:

### Phase 1: Setup & Database Connect
> "Let's create a Next.js 15 anime database and streaming discovery platform with TypeScript and Tailwind CSS. First, configure the Supabase PostgreSQL database client using the schema from our masterplan, set up the AniWave cyber-dark color tokens (`#0b0c10`), and build the global layout with header and navigation."

### Phase 2: 1-Click AniList Ingestion Route
> "Create an API route `/api/admin/sync-anilist` that executes the AniList GraphQL query to batch-import seasonal anime, top-ranked anime, characters, voice actors, studios, and YouTube trailer IDs directly into our Supabase database. Add an admin button to trigger this with 1 click."

### Phase 3: Homepage with Hero Trailer & Airing Countdown
> "Build the homepage (`/`) featuring a full-width cinematic hero spotlight with YouTube trailer embed, an 'Airing Today' live countdown ticker, and a 'Top 10 Trending Anime' ranking widget with Day/Week/Month tabs."

### Phase 4: Anime Detail Page & 'Where to Watch' Affiliate Box
> "Build the dynamic anime details page at `/anime/[slug]` with cinematic backdrop, full metadata, 1080p YouTube trailer modal, interactive Character & Voice Actor gallery, and the 'Where to Watch' streaming affiliate box."

### Phase 5: Seasonal Schedule & Search
> "Build the weekly airing calendar at `/schedule` with local timezone conversion, and add a live debounced search bar in the header that queries anime titles with instant autocomplete results."

---

## 8. 🚀 Live Implementation Status & Features Ready on http://localhost:3005

| Page / Feature | Route | Key Capabilities | Status |
| :--- | :--- | :--- | :--- |
| **Homepage** | `/` | Hero trailer spotlight, live second-by-second airing ticker, streaming platform filters, category discovery catalog | ✅ Live & Operational |
| **Anime Detail Hub** | `/anime/[id]` | Where to watch affiliate hub, Seiyuu character-VA visualizer, franchise timeline, Amazon manga/merch, official rankings, community tags, key staff & recommendations | ✅ Live & Operational |
| **Weekly Airing Calendar** | `/schedule` | 7-day tabbed calendar, auto-detected local timezone, release countdowns, provider filtering | ✅ Live & Operational |
| **Seasonal Archive Explorer** | `/seasons` | Instant year (2000-2026) & season switcher (Winter, Spring, Summer, Fall), format filtering, in-season search | ✅ Live & Operational |
| **Personal Watchlist** | `/watchlist` | Private browser storage (no login required), 5 watch states, JSON export/backup, 1-click card actions | ✅ Live & Operational |
| **Legal Streaming Discovery** | `/watch` | Multi-provider catalog (Crunchyroll, Netflix, Hulu, Prime Video, HIDIVE), NordVPN geo-unlocker CTA | ✅ Live & Operational |
| **Studios Directory & Showcase Hub** | `/studios` | 10 legendary powerhouses (MAPPA, ufotable, KyoAni, Madhouse, Bones, WIT, Trigger, CloverWorks, A-1, Production I.G) + dynamic ambient glow, studio vital metrics, omni-search, 3 view modes (Poster Grid, Detailed, Compact Table), NordVPN unblocker, and Head-to-Head Comparison Showdown | ✅ Live & Operational |
| **Top Voice Actors Leaderboard** | `/staff` | Hall of fame for top Japanese voice actors (Seiyuu), directors, composers, and studio animators with role previews | ✅ Live & Operational |
| **Character Profile Hub** | `/character/[id]` | Full biography, aliases, age, birthday, blood type, favorites count, complete anime appearances paired with Japanese voice actors | ✅ Live & Operational |
| **Staff & Voice Actor Hub** | `/staff/[id]` | Complete career filmography, voiced character pairings, occupations (VA, Director, Music), age, hometown, and award history | ✅ Live & Operational |
| **Community Stats & Distribution** | `/anime/[id]` | Real-time score distribution histogram (10-100%) and color-coded watchlist status breakdown (Watching, Completed, Planning, Dropped, Paused) | ✅ Live & Operational |
| **Community Reviews & Critiques** | `/anime/[id]` | Editorial community reviews with scores, user avatars, helpful endorsement counts, and expandable critique text | ✅ Live & Operational |
| **Episode Guide Hub** | `/anime/[id]` | Official legal streaming episode guide with 1080p thumbnails, episode names, and direct platform stream links | ✅ Live & Operational |
| **Multi-Entity Omni-Search** | `Ctrl + K` | Unified search across Anime, Characters, and Voice Actors with tab filters, image previews, and direct navigation | ✅ Live & Operational |
| **Surprise Me (Random Anime)** | `/random` | 1-Click dice roll instant discovery navigating directly to a highly-rated, popular anime | ✅ Live & Operational |
| **Responsive Mobile Drawer** | Navbar | Full-featured slide-down dark matte drawer ensuring 100% mobile accessibility across all routes on phones & tablets | ✅ Live & Operational |
| **Cross-Reference & Social Share** | `/anime/[id]` | 1-Click link copy to clipboard with toast notification, plus direct outbound verification links to AniList & MyAnimeList | ✅ Live & Operational |
| **Head-to-Head Compare Engine** | `/compare` | Side-by-side metric comparison (Score, Popularity, Studio, Episodes) + **Shared Voice Actor Cast Overlap** calculation | ✅ Live & Operational |
| **Anime Taste Quiz & Recommender** | `/quiz` | 3-step personalized taste quiz (Mood, Time Commitment, Streaming Subs) with dynamic match % scores | ✅ Live & Operational |
| **Watchlist Importer Hub** | `/import` | 1-Click public AniList username sync, MyAnimeList XML export parser, and JSON backup restore | ✅ Live & Operational |
| **PWA Mobile App Experience** | `/manifest.json` | Web App Manifest, dark matte theme color, SVG app icon, and standalone home screen installability | ✅ Live & Operational |
| **PC/Tablet/Mobile Responsive Nav** | Navbar | Grouped hover/tap dropdowns (Explore, Cast, Tools), tablet-friendly layout, and sticky mobile bottom app navigation bar | ✅ Live & Operational |
| **Universal Multi-Column Footer** | Global | 4-column rich sitemap, system operational health badge, legal partner verification, and Ctrl+K search shortcut prompt | ✅ Live & Operational |
| **Homepage Multi-Spotlight Carousel** | `/` | 5-item auto-rotating hero spotlight with trailer player, direct watchlist bookmarking, and streaming provider pills | ✅ Live & Operational |
| **Personalized Watchlist Shelf** | `/` | Instant client-side continuing shelf for saved titles or 1-click AniList/MAL onboarding prompt | ✅ Live & Operational |
| **Live Airing & Top 10 Split Hub** | `/` | Responsive 2-column layout pairing a live chronological broadcast schedule (~65%) with a stylized Top 10 Weekly Leaderboard (~35%) — eliminates horizontal scroll fatigue & browser scrollbars | ✅ Live & Operational |
| **Interactive Discovery Launchpad** | `/` | Positioned at bottom right before trust banner: Live Matchup of the Day, 60-Sec Taste Quiz with mood chips, 1-click list importer, and random dice roll | ✅ Live & Operational |
| **Curated Taste Collections** | `/` | Letterboxd-style binge playlists (Psychological Thrillers, Sakuga Battles, Cozy Comfort, Epic Fantasy) | ✅ Live & Operational |
| **Seiyuu & Characters Showcase** | `/` | Dual-tabbed switcher previewing top characters & legendary Japanese voice actors with favorite counts | ✅ Live & Operational |
| **Premier Studios Showcase** | `/` | Flagship showcase for MAPPA, ufotable, WIT Studio, Kyoto Animation, and Bones | ✅ Live & Operational |
| **Open Anime Web Trust Banner** | `/` | Sub-100ms speed, 100% legal streams, live GraphQL sync, and client-side privacy credentials | ✅ Live & Operational |
| **Most Anticipated Upcoming Section** | `/` | Grid of top future release titles (Cyberpunk 2, Dandadan S3, etc.) with release timeframe, member hype count, teasers, and watchlist buttons | ✅ Live & Operational |
| **Weekly Community Poll: Anime of the Week** | `/` | Interactive live voting poll with animated percentage bars, leader badge, vote storage in localStorage, and countdown | ✅ Live & Operational |
| **Viral Anime Openings & Themes Jukebox** | `/` | Chart-topping anime OP/ED jukebox (YOASOBI, King Gnu, Creepy Nuts, LiSA, Ado) with 1-click video modal play and Spotify links | ✅ Live & Operational |
| **Top Community Reviews & Critiques** | `/` | Global editorial appraisals from AniList community with scores out of 100, reviewer avatars, endorsement counters, and quotes | ✅ Live & Operational |
| **1-Click .ICS & Calendar Airing Export** | `/schedule`, `/` | 1-Click iCalendar (.ics) download & Google Calendar link generation for weekly anime broadcast countdowns | ✅ Live & Operational |
| **Interactive Anime Tier List Maker** | `/tierlist` | S to D tier rankings with live AniList search pool, 1-click chip placement, and canvas PNG image export | ✅ Live & Operational |
| **Browser Airing Broadcast Alerts** | `/schedule`, `/` | Native browser desktop notifications alerting users 10m before an anime episode drops in Japan | ✅ Live & Operational |
| **Structured Breadcrumbs & Schema** | Detail pages | Google Rich Snippet BreadcrumbList schema with responsive breadcrumb trails across all detail views | ✅ Live & Operational |
| **Shareable Watchlist Passport Modal** | `/watchlist` | Generates 1200x630 social share graphic & text breakdown of watch hours, completed anime, and top genres | ✅ Live & Operational |
| **Streaming Region & Territory Selector** | Global Nav, `/watch` | Multi-country selector (🇺🇸 US, 🇬🇧 UK, 🇨🇦 CA, 🇦🇺 AU, 🌐 Global) with regional catalog licensing tips & VPN advice | ✅ Live & Operational |
| **Comprehensive Homepage UI & Design Elevation** | `/` | Polished sizing, card padding, typography contrast, glassmorphic badges, hover elevations, and responsive column grids across all 14 homepage body sections | ✅ Live & Operational |


