import { Metadata } from "next";
import { getWeeklySchedule } from "@/lib/anilist";
import ScheduleView from "@/components/ScheduleView";

export const revalidate = 1800; // Cache on edge for 30 minutes

export const metadata: Metadata = {
  title: "Weekly Anime Airing Schedule & Simulcast Calendar | AnimeDB",
  description:
    "Track live anime broadcasts across Monday to Sunday with automatic local timezone conversion and official streaming availability.",
};

export default async function SchedulePage() {
  const schedule = await getWeeklySchedule();

  return <ScheduleView initialSchedule={schedule} />;
}
