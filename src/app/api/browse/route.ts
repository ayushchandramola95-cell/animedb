import { NextRequest, NextResponse } from "next/server";
import { getAdvancedBrowseAnime } from "@/lib/anilist";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const genresParam = searchParams.get("genres") || searchParams.get("genre");
  const genres = genresParam ? genresParam.split(",").filter(Boolean) : undefined;

  const format = searchParams.get("format") || undefined;
  const status = searchParams.get("status") || undefined;
  const season = searchParams.get("season") || undefined;
  const country = searchParams.get("country") || undefined;
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : undefined;
  const minScoreParam = searchParams.get("minScore");
  const minScore = minScoreParam ? parseInt(minScoreParam, 10) : undefined;
  const sort = searchParams.get("sort") || "POPULARITY_DESC";
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const perPage = parseInt(searchParams.get("perPage") || "36", 10);
  const provider = searchParams.get("provider") || searchParams.get("platform") || "ALL";

  try {
    const result = await getAdvancedBrowseAnime({
      genres,
      format,
      status,
      season,
      year,
      country,
      minScore,
      sort,
      search,
      page,
      perPage,
    });

    let media = result.media;

    // Filter by streaming provider if selected
    if (provider !== "ALL") {
      media = media.filter((item) =>
        item.externalLinks?.some((l) =>
          l.site.toLowerCase().includes(provider.toLowerCase())
        )
      );
    }

    return NextResponse.json({
      page,
      count: media.length,
      hasNextPage: result.hasNextPage,
      media,
    });
  } catch (error) {
    console.error("Browse API Error:", error);
    return NextResponse.json(
      { error: "Failed to browse anime catalog" },
      { status: 500 }
    );
  }
}
