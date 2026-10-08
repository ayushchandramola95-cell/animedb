import { Metadata } from "next";
import WatchlistImporter from "@/components/WatchlistImporter";

export const metadata: Metadata = {
  title: "Import Watchlist from AniList & MyAnimeList | AnimeDB",
  description:
    "Seamlessly import your entire anime watch history and scores from AniList username or MyAnimeList XML file into AnimeDB without creating an account.",
};

export default function ImportPage() {
  return <WatchlistImporter />;
}
