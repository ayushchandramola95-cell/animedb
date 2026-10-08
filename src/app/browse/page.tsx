import { Metadata } from "next";
import { getAdvancedBrowseAnime } from "@/lib/anilist";
import BrowseMatrixClient from "@/components/BrowseMatrixClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Advanced Anime Discovery Matrix • Multi-Genre & Score Filter | AnimeDB",
  description:
    "Filter through 15,000+ anime titles using multi-genre intersections, rating thresholds, format types, and official streaming platforms.",
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  const genres = typeof resolvedParams.genres === "string" ? resolvedParams.genres.split(",").filter(Boolean) : undefined;
  const format = typeof resolvedParams.format === "string" ? resolvedParams.format : undefined;
  const status = typeof resolvedParams.status === "string" ? resolvedParams.status : undefined;
  const season = typeof resolvedParams.season === "string" ? resolvedParams.season : undefined;
  const country = typeof resolvedParams.country === "string" ? resolvedParams.country : undefined;
  const year = typeof resolvedParams.year === "string" ? parseInt(resolvedParams.year, 10) : undefined;
  const minScore = typeof resolvedParams.minScore === "string" ? parseInt(resolvedParams.minScore, 10) : undefined;
  const sort = typeof resolvedParams.sort === "string" ? resolvedParams.sort : "POPULARITY_DESC";
  const search = typeof resolvedParams.search === "string" ? resolvedParams.search : undefined;
  const provider = typeof resolvedParams.provider === "string" ? resolvedParams.provider : undefined;

  const initialData = await getAdvancedBrowseAnime({
    genres,
    format,
    status,
    season,
    year,
    country,
    minScore,
    sort,
    search,
    page: 1,
    perPage: 36,
  });

  return (
    <BrowseMatrixClient
      initialMedia={initialData.media}
      initialHasNextPage={initialData.hasNextPage}
      initialFilters={{
        genres: genres || [],
        format: format || "ALL",
        status: status || "ALL",
        season: season || "ALL",
        year: year ? year.toString() : "",
        country: country || "ALL",
        minScore: minScore || 0,
        sort: sort || "POPULARITY_DESC",
        provider: provider || "ALL",
        search: search || "",
      }}
    />
  );
}
