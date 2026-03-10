import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { consumeCredit } from "@/lib/membership-service";
import { UsageSourceType } from "@prisma/client";

interface ConsumeRequestBody {
  sourceType: "PRACTICE" | "INTERVIEW_SESSION";
  sourceId: string;
  sourceTitle?: string;
}

/**
 * POST /api/membership/consume
 * 消费一次权益
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ConsumeRequestBody = await req.json();
    const { sourceType, sourceId, sourceTitle } = body;

    if (!sourceType || !sourceId) {
      return NextResponse.json(
        { error: "Missing sourceType or sourceId" },
        { status: 400 }
      );
    }

    // 验证类型
    if (sourceType !== "PRACTICE" && sourceType !== "INTERVIEW_SESSION") {
      return NextResponse.json(
        { error: "Invalid sourceType. Must be PRACTICE or INTERVIEW_SESSION" },
        { status: 400 }
      );
    }

    const result = await consumeCredit(
      session.id,
      sourceType as UsageSourceType,
      sourceId,
      sourceTitle
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message:
            result.error === "NO_MEMBERSHIP"
              ? "您没有有效的会员权益，请先开通会员"
              : "消费失败",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyConsumed: result.alreadyConsumed,
      membershipUsed: result.membershipUsed,
      creditsRemaining: result.creditsRemaining,
      message: result.alreadyConsumed
        ? "已付费，无需重复扣费"
        : result.membershipUsed === "MONTHLY"
        ? "使用月卡权益"
        : `使用次卡权益，剩余 ${result.creditsRemaining} 次`,
    });
  } catch (error) {
    console.error("[Consume Credit Error]", error);
    return NextResponse.json(
      { error: "Failed to consume credit" },
      { status: 500 }
    );
  }
}
