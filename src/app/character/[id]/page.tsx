import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCharacterDetails } from "@/lib/anilist";
import CharacterDetailClient from "@/components/CharacterDetailClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const character = await getCharacterDetails(Number(id));

  if (!character) {
    return {
      title: "Character Not Found • AnimeDB",
    };
  }

  const name = character.name.full;
  const desc = character.description
    ? character.description.replace(/<[^>]*>?/gm, "").slice(0, 160) + "..."
    : `Explore voice actors, anime appearances, and biography for ${name}.`;

  return {
    title: `${name} • Character Profile & Voice Actors | AnimeDB`,
    description: desc,
    openGraph: {
      title: `${name} - AnimeDB`,
      description: desc,
      images: character.image.large ? [character.image.large] : [],
    },
  };
}

export default async function CharacterPage({ params }: PageProps) {
  const { id } = await params;
  const charId = Number(id);

  if (isNaN(charId)) {
    notFound();
  }

  const character = await getCharacterDetails(charId);

  if (!character) {
    notFound();
  }

  return <CharacterDetailClient character={character} />;
}
