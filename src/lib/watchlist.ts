"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimeMedia } from "./types";

export type WatchStatus = "WATCHING" | "PLAN_TO_WATCH" | "COMPLETED" | "DROPPED";

export interface WatchlistItem {
  anime: AnimeMedia;
  status: WatchStatus;
  updatedAt: number;
  progress?: number;
  userScore?: number;
  notes?: string;
}

const STORAGE_KEY = "animedb_watchlist_v1";

export function getStoredWatchlist(): Record<number, WatchlistItem> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to read watchlist from localStorage:", e);
    return {};
  }
}

export function saveStoredWatchlist(items: Record<number, WatchlistItem>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("animedb_watchlist_updated"));
  } catch (e) {
    console.error("Failed to save watchlist to localStorage:", e);
  }
}

export function bulkImportItems(newItems: Record<number, WatchlistItem>) {
  if (typeof window === "undefined") return;
  const current = getStoredWatchlist();
  const merged = { ...current, ...newItems };
  saveStoredWatchlist(merged);
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Record<number, WatchlistItem>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(() => {
    setWatchlist(getStoredWatchlist());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();

    const handleUpdate = () => refresh();
    window.addEventListener("animedb_watchlist_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("animedb_watchlist_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  const setItemStatus = useCallback(
    (anime: AnimeMedia, status: WatchStatus | null, initialProgress?: number) => {
      const current = getStoredWatchlist();
      if (status === null) {
        delete current[anime.id];
      } else {
        const existing = current[anime.id];
        current[anime.id] = {
          anime,
          status,
          updatedAt: Date.now(),
          progress:
            initialProgress !== undefined
              ? initialProgress
              : existing?.progress ?? (status === "COMPLETED" ? anime.episodes || 0 : 0),
          userScore: existing?.userScore,
          notes: existing?.notes,
        };
      }
      saveStoredWatchlist(current);
    },
    []
  );

  const updateProgress = useCallback((animeId: number, progress: number) => {
    const current = getStoredWatchlist();
    if (!current[animeId]) return;
    const anime = current[animeId].anime;
    const maxEps = anime.episodes || 9999;
    const newProgress = Math.max(0, Math.min(progress, maxEps));

    current[animeId] = {
      ...current[animeId],
      progress: newProgress,
      updatedAt: Date.now(),
      status:
        anime.episodes && newProgress >= anime.episodes ? "COMPLETED" : current[animeId].status,
    };
    saveStoredWatchlist(current);
  }, []);

  const updateUserScore = useCallback((animeId: number, userScore: number) => {
    const current = getStoredWatchlist();
    if (!current[animeId]) return;
    current[animeId] = {
      ...current[animeId],
      userScore: Math.max(1, Math.min(10, userScore)),
      updatedAt: Date.now(),
    };
    saveStoredWatchlist(current);
  }, []);

  const removeItem = useCallback((animeId: number) => {
    const current = getStoredWatchlist();
    if (current[animeId]) {
      delete current[animeId];
      saveStoredWatchlist(current);
    }
  }, []);

  const getStatus = useCallback(
    (animeId: number): WatchStatus | null => {
      return watchlist[animeId]?.status || null;
    },
    [watchlist]
  );

  return {
    watchlist,
    isLoaded,
    setItemStatus,
    updateProgress,
    updateUserScore,
    removeItem,
    getStatus,
    count: Object.keys(watchlist).length,
  };
}
