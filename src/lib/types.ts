export interface AnimeMedia {
  id: number;
  idMal?: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  description: string | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration: number | null;
  season: string | null;
  seasonYear: number | null;
  averageScore: number | null;
  meanScore?: number | null;
  popularity: number | null;
  favourites?: number | null;
  countryOfOrigin?: string | null;
  hashtag?: string | null;
  isAdult?: boolean | null;
  source: string | null;
  coverImage: {
    extraLarge: string;
    large: string;
    medium: string;
    color: string | null;
  };
  bannerImage: string | null;
  genres: string[];
  studios: {
    nodes: Array<{
      id: number;
      name: string;
      isAnimationStudio: boolean;
    }>;
    edges?: Array<{
      id?: number;
      isMain: boolean;
      node: {
        id: number;
        name: string;
        isAnimationStudio: boolean;
      };
    }>;
  };
  trailer: {
    id: string;
    site: string;
  } | null;
  nextAiringEpisode: {
    episode: number;
    airingAt: number;
    timeUntilAiring: number;
  } | null;
  externalLinks: Array<{
    id: number;
    site: string;
    url: string;
    type: string;
    icon: string | null;
    color: string | null;
    language?: string | null;
  }>;
  characters?: {
    edges: Array<{
      role: string;
      node: {
        id: number;
        name: {
          full: string;
        };
        image: {
          large: string;
        };
      };
      voiceActors: Array<{
        id: number;
        name: {
          full: string;
        };
        image: {
          large: string;
        };
      }>;
    }>;
  };
  relations?: {
    edges: Array<{
      relationType: string;
      node: {
        id: number;
        title: {
          romaji: string;
          english: string | null;
          native?: string | null;
        };
        format: string | null;
        status: string | null;
        episodes?: number | null;
        seasonYear?: number | null;
        startDate?: {
          year: number | null;
          month: number | null;
          day: number | null;
        } | null;
        averageScore?: number | null;
        coverImage: {
          extraLarge?: string;
          large?: string;
          medium: string;
        };
        bannerImage?: string | null;
      };
    }>;
  };
  startDate?: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  endDate?: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  synonyms?: string[];
  rankings?: Array<{
    id?: number;
    rank: number;
    type: string;
    allTime: boolean;
    context: string;
    season?: string | null;
    year?: number | null;
  }>;
  tags?: Array<{
    id?: number;
    name: string;
    description?: string;
    category?: string;
    rank: number;
    isMediaSpoiler: boolean;
  }>;
  staff?: {
    edges: Array<{
      role: string;
      node: {
        id: number;
        name: {
          full: string;
        };
        image: {
          medium: string;
          large?: string;
        };
      };
    }>;
  };
  recommendations?: {
    nodes: Array<{
      rating: number;
      mediaRecommendation: AnimeMedia | null;
    }>;
  };
  streamingEpisodes?: Array<{
    title: string;
    thumbnail: string | null;
    url: string;
    site: string;
  }>;
  stats?: {
    scoreDistribution: Array<{
      score: number;
      amount: number;
    }>;
    statusDistribution: Array<{
      status: string;
      amount: number;
    }>;
  };
  reviews?: {
    nodes: Array<{
      id: number;
      summary: string;
      score: number;
      rating: number;
      ratingAmount: number;
      user: {
        name: string;
        avatar?: {
          medium?: string;
        };
      };
      body: string;
    }>;
  };
}

export type CatalogTab = "trending" | "seasonal" | "top" | "airing";

export interface FranchiseItem {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native?: string | null;
  };
  description?: string | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration?: number | null;
  seasonYear: number | null;
  startDate?: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  averageScore: number | null;
  relationType: string;
  isPrimary?: boolean;
  tier: "CANON_MAIN" | "CANON_MOVIE" | "CANON_OVA" | "ORIGINAL_SOURCE" | "SPIN_OFF" | "SUMMARY";
  watchTip?: string;
  coverImage: {
    extraLarge?: string;
    large: string;
    medium: string;
    color?: string | null;
  };
  bannerImage?: string | null;
}

export interface FranchiseData {
  primary: AnimeMedia;
  items: FranchiseItem[];
  totalEpisodes: number;
  totalWorks: number;
  earliestYear?: number | null;
  latestYear?: number | null;
}

export interface ScheduleItem {
  id: number;
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
  media: AnimeMedia;
}

export interface StudioShowcase {
  id: number;
  name: string;
  tagline: string;
  founded: string;
  description: string;
  media: AnimeMedia[];
}

export interface CharacterDetail {
  id: number;
  name: {
    full: string;
    native: string | null;
    alternative: string[];
    alternativeSpoiler: string[];
  };
  image: {
    large: string;
    medium: string;
  };
  description: string | null;
  gender: string | null;
  dateOfBirth: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  age: string | null;
  bloodType: string | null;
  favourites: number;
  media?: {
    edges: Array<{
      characterRole: string;
      voiceActors: Array<{
        id: number;
        name: {
          full: string;
          native?: string | null;
        };
        image: {
          large?: string;
          medium: string;
        };
        languageV2: string;
      }>;
      node: AnimeMedia;
    }>;
  };
}

export interface StaffDetail {
  id: number;
  name: {
    full: string;
    native: string | null;
    alternative: string[];
  };
  image: {
    large: string;
    medium: string;
  };
  description: string | null;
  primaryOccupations: string[];
  gender: string | null;
  dateOfBirth: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  dateOfDeath: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  age: number | null;
  yearsActive: number[];
  homeTown: string | null;
  favourites: number;
  characterMedia?: {
    edges: Array<{
      characterRole: string;
      characters: Array<{
        id: number;
        name: {
          full: string;
          native?: string | null;
        };
        image: {
          large?: string;
          medium: string;
        };
      }>;
      node: AnimeMedia;
    }>;
  };
  staffMedia?: {
    edges: Array<{
      staffRole: string;
      node: AnimeMedia;
    }>;
  };
}

export interface OmniSearchResult {
  anime: AnimeMedia[];
  characters: Array<{
    id: number;
    name: {
      full: string;
      native?: string | null;
    };
    image: {
      medium: string;
      large?: string;
    };
    favourites: number;
  }>;
  staff: Array<{
    id: number;
    name: {
      full: string;
      native?: string | null;
    };
    image: {
      medium: string;
      large?: string;
    };
    primaryOccupations: string[];
    favourites: number;
  }>;
}

export interface GlobalReviewItem {
  id: number;
  score: number;
  summary: string;
  rating: number;
  ratingAmount: number;
  createdAt?: number;
  user: {
    id?: number;
    name: string;
    avatar?: {
      medium: string;
      large?: string;
    };
  };
  media: {
    id: number;
    title: {
      english: string | null;
      romaji: string;
    };
    coverImage: {
      medium: string;
      large?: string;
      extraLarge?: string;
    };
    bannerImage?: string | null;
    format?: string;
    averageScore?: number;
  };
}

export interface AnimeNewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  category: string;
  snippet: string;
  imageUrl?: string;
}

export interface ThemeSongItem {
  id: string;
  title: string;
  artist: string;
  type: "OP" | "ED";
  animeId: number;
  animeTitle: string;
  animeCover: string;
  youtubeId: string;
  spotifyUrl?: string;
  seasonTag: string;
}



