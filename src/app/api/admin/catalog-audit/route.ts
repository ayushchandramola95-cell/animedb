import { NextRequest, NextResponse } from "next/server";
import { auditCatalogPage } from "@/lib/catalogAudit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = Math.min(parseInt(searchParams.get("perPage") || "50", 10), 50);
    const scope = (searchParams.get("scope") as "popular" | "recent" | "all") || "popular";
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;

    const result = await auditCatalogPage({
      page,
      perPage,
      scope,
      year,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("GET /api/admin/catalog-audit error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to audit catalog against AniList",
      },
      { status: 500 }
    );
  }
}
