import { NextRequest, NextResponse } from "next/server";
import { applyApprovedCatalogChanges } from "@/lib/catalogAudit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const approvedChanges = body.approvedChanges || [];

    if (!Array.isArray(approvedChanges) || approvedChanges.length === 0) {
      return NextResponse.json(
        { success: false, error: "No changes provided for approval." },
        { status: 400 }
      );
    }

    const result = await applyApprovedCatalogChanges(approvedChanges);

    return NextResponse.json({
      success: true,
      message: `Successfully applied ${result.appliedCount} anime updates (${result.count} total field changes) to PostgreSQL Cloud SQL.`,
      result,
    });
  } catch (error: any) {
    console.error("POST /api/admin/catalog-audit/apply error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to apply approved catalog updates to database",
      },
      { status: 500 }
    );
  }
}
