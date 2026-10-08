import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FranchiseRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/anime/${id}/franchise`);
}
