import { Metadata } from "next";
import { getStreamingCatalog } from "@/lib/anilist";
import WatchHubClient from "@/components/WatchHubClient";

export const revalidate = 3600; // Edge ISR cache for 1 hour

export const metadata: Metadata = {
  title: "Where to Watch Anime Online Legally - Official Streaming Guide | AnimeDB",
  description:
    "Find official, verified legal streaming destinations for thousands of anime series across Crunchyroll, Netflix, Hulu, Amazon Prime Video, and HIDIVE.",
};

export default async function WatchPage() {
  const catalog = await getStreamingCatalog(60);

  return <WatchHubClient initialCatalog={catalog} />;
}

