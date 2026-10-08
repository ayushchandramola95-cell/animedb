import { Metadata } from "next";
import AdminSyncClient from "@/components/AdminSyncClient";

export const metadata: Metadata = {
  title: "1-Click AniList Ingestion Engine & Database Sync | AnimeDB Admin",
  description:
    "Automated batch ingestion control center for AnimeDB. Sync thousands of anime, characters, Seiyuu voice actors, and streaming links directly from AniList GraphQL.",
};

export default function AdminSyncPage() {
  return <AdminSyncClient />;
}
