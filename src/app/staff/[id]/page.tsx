import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaffDetails } from "@/lib/anilist";
import StaffDetailClient from "@/components/StaffDetailClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const staff = await getStaffDetails(Number(id));

  if (!staff) {
    return {
      title: "Voice Actor / Staff Not Found • AnimeDB",
    };
  }

  const name = staff.name.full;
  const occupations = (staff.primaryOccupations || []).join(", ");
  const desc = staff.description
    ? staff.description.replace(/<[^>]*>?/gm, "").slice(0, 160) + "..."
    : `Explore voice acting roles, characters, and anime productions by ${name}.`;

  return {
    title: `${name} (${occupations || "Voice Actor"}) • Career & Roles | AnimeDB`,
    description: desc,
    openGraph: {
      title: `${name} - AnimeDB`,
      description: desc,
      images: staff.image.large ? [staff.image.large] : [],
    },
  };
}

export default async function StaffPage({ params }: PageProps) {
  const { id } = await params;
  const staffId = Number(id);

  if (isNaN(staffId)) {
    notFound();
  }

  const staff = await getStaffDetails(staffId);

  if (!staff) {
    notFound();
  }

  return <StaffDetailClient staff={staff} />;
}
