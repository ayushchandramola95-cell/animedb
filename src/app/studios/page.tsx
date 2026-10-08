import { Metadata } from "next";
import { PREMIER_STUDIOS, getStudioShowcase } from "@/lib/anilist";
import StudiosDirectoryClient from "@/components/StudiosDirectoryClient";

export const revalidate = 86400; // Edge ISR cache for 24 hours

export const metadata: Metadata = {
  title: "Legendary Anime Studios Showcase - MAPPA, ufotable, Madhouse, KyoAni, Bones | AnimeDB",
  description:
    "Explore the visionary animation powerhouses behind the greatest anime productions in history, including MAPPA, ufotable, Madhouse, Kyoto Animation, Bones, Wit Studio, Trigger, CloverWorks, A-1 Pictures, and Production I.G.",
};

export default async function StudiosPage() {
  const studiosData = await Promise.all(
    PREMIER_STUDIOS.map(async (studio) => {
      const media = await getStudioShowcase(studio.id, 18);
      return {
        ...studio,
        media,
      };
    })
  );

  return <StudiosDirectoryClient studiosData={studiosData} />;
}
