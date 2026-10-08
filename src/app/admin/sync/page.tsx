import { Metadata } from "next";
import AdminDashboardClient from "@/components/AdminDashboardClient";

export const metadata: Metadata = {
  title: "1-Click AniList Ingestion Engine & Database Sync | AnimeDB Admin",
  description:
    "Automated batch ingestion control center for AnimeDB. Sync thousands of anime, characters, Seiyuu voice actors, and streaming links directly into Google Cloud SQL PostgreSQL.",
};

export default function AdminSyncPage() {
  return <AdminDashboardClient />;
}
