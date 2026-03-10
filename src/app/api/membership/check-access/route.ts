import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { checkAccess } from "@/lib/membership-service";
import { UsageSourceType } from "@prisma/client";

/**
 * GET /api/membership/check-access?type=PRACTICE&id=xxx
 * 检查特定资源的访问权限
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json(
        { error: "Missing type or id parameter" },
        { status: 400 }
      );
    }

    // 验证类型
    if (type !== "PRACTICE" && type !== "INTERVIEW_SESSION") {
      return NextResponse.json(
        { error: "Invalid type. Must be PRACTICE or INTERVIEW_SESSION" },
        { status: 400 }
      );
    }

    const sourceType = type as UsageSourceType;
    const result = await checkAccess(session.id, sourceType, id);

    return NextResponse.json({
      hasAccess: result.hasAccess,
      alreadyPaid: result.alreadyPaid,
      membershipStatus: {
        hasAccess: result.membershipStatus.hasAccess,
        membershipType: result.membershipStatus.membershipType,
        creditsRemaining: result.membershipStatus.creditsRemaining,
        monthlyExpiresAt: result.membershipStatus.monthlyExpiresAt,
      },
    });
  } catch (error) {
    console.error("[Check Access Error]", error);
    return NextResponse.json(
      { error: "Failed to check access" },
      { status: 500 }
    );
  }
}
