import { Metadata } from "next";
import WatchlistClient from "@/components/WatchlistClient";

export const metadata: Metadata = {
  title: "My Anime Watchlist • Save & Track Anime | AnimeDB",
  description: "Track currently watching, completed, and plan-to-watch anime titles with instant local storage and JSON export.",
};

export default function WatchlistPage() {
  return <WatchlistClient />;
}
