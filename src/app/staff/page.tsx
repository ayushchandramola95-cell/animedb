import { Metadata } from "next";
import { getTopStaff } from "@/lib/anilist";
import TopStaffClient from "@/components/TopStaffClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Top Voice Actors & Production Staff Leaderboard | AnimeDB",
  description:
    "Explore the top Japanese voice actors (Seiyuu), visionary anime directors, music composers, and studio creators.",
};

export default async function StaffPage() {
  const data = await getTopStaff(1, 32);

  return (
    <TopStaffClient
      initialStaff={data.staff}
      initialHasNextPage={data.hasNextPage}
    />
  );
}
