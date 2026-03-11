import { NextRequest, NextResponse } from "next/server";
import { getUserUsageRecords } from "@/lib/membership-service";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "hellodata";

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  return token === ADMIN_TOKEN;
}

/**
 * GET /api/admin/usage?userId=xxx&page=1&limit=20
 * 获取用户的消费记录
 */
export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const result = await getUserUsageRecords(userId, page, limit);

    return NextResponse.json({
      records: result.records.map((r) => ({
        id: r.id,
        sourceType: r.sourceType,
        sourceId: r.sourceId,
        sourceTitle: r.sourceTitle,
        membershipType: r.membership.type,
        createdAt: r.createdAt,
      })),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error("[Admin Usage Error]", error);
    return NextResponse.json(
      { error: "Failed to get usage records" },
      { status: 500 }
    );
  }
}
