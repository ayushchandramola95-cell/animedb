import { redirect } from "next/navigation";
import { getRandomAnimeId } from "@/lib/anilist";

export const dynamic = "force-dynamic";

export default function RandomPage() {
  const id = getRandomAnimeId();
  redirect(`/anime/${id}`);
}
