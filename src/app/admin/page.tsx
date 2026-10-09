import { Metadata } from "next";
import AdminDashboardClient from "@/components/AdminDashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Command Center & Cloud SQL Monitor | AnimeDB",
  description:
    "Google Cloud SQL PostgreSQL database monitor, automated AniList batch ingestion crawler, and anime records management console.",
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
