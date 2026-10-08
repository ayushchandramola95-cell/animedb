import { Metadata } from "next";
import { getTopCharacters } from "@/lib/anilist";
import TopCharactersClient from "@/components/TopCharactersClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Top Anime Characters Leaderboard & Voice Actors | AnimeDB",
  description:
    "Explore the top favorited anime characters, legendary heroes, villains, and their iconic Japanese voice actors (Seiyuu).",
};

export default async function CharactersPage() {
  const data = await getTopCharacters(1, 32);

  return (
    <TopCharactersClient
      initialCharacters={data.characters}
      initialHasNextPage={data.hasNextPage}
    />
  );
}
