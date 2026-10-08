import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFranchiseTimeline } from "@/lib/anilist";
import FranchiseTimelineView from "@/components/FranchiseTimelineView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const franchiseData = await getFranchiseTimeline(Number(id));

  if (!franchiseData) {
    return {
      title: "Franchise Not Found - AnimeDB",
    };
  }

  const title = franchiseData.primary.title.english || franchiseData.primary.title.romaji;

  return {
    title: `${title} - Complete Watch Order & Franchise Timeline | AnimeDB`,
    description: `Complete chronological and recommended watch order guide for ${title}. Discover all anime seasons, movies, canon OVAs, and manga adaptations.`,
    openGraph: {
      title: `${title} Watch Order & Timeline - AnimeDB`,
      description: `Complete watch order guide for ${title}.`,
      images: franchiseData.primary.coverImage.extraLarge ? [franchiseData.primary.coverImage.extraLarge] : [],
    },
  };
}

export default async function AnimeFranchisePage({ params }: PageProps) {
  const { id } = await params;
  const animeId = Number(id);

  if (isNaN(animeId)) {
    notFound();
  }

  const franchiseData = await getFranchiseTimeline(animeId);

  if (!franchiseData) {
    notFound();
  }

  return <FranchiseTimelineView franchiseData={franchiseData} />;
}
