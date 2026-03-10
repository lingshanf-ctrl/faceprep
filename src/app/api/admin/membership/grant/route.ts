import { NextRequest, NextResponse } from "next/server";
import { grantMembership } from "@/lib/membership-service";
import { MembershipType } from "@prisma/client";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "admin-secret-token";

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  return token === ADMIN_TOKEN;
}

interface GrantRequestBody {
  userId: string;
  type: "CREDIT" | "MONTHLY";
  credits?: number;
  durationDays?: number;
  note?: string;
}

/**
 * POST /api/admin/membership/grant
 * 为用户开通会员
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: GrantRequestBody = await req.json();
    const { userId, type, credits, durationDays, note } = body;

    if (!userId || !type) {
      return NextResponse.json(
        { error: "Missing userId or type" },
        { status: 400 }
      );
    }

    if (type !== "CREDIT" && type !== "MONTHLY") {
      return NextResponse.json(
        { error: "Invalid type. Must be CREDIT or MONTHLY" },
        { status: 400 }
      );
    }

    if (type === "CREDIT" && (!credits || credits <= 0)) {
      return NextResponse.json(
        { error: "Credits must be a positive number for CREDIT type" },
        { status: 400 }
      );
    }

    if (type === "MONTHLY" && (!durationDays || durationDays <= 0)) {
      return NextResponse.json(
        { error: "DurationDays must be a positive number for MONTHLY type" },
        { status: 400 }
      );
    }

    const result = await grantMembership({
      userId,
      type: type as MembershipType,
      credits,
      durationDays,
      note,
      createdBy: "admin", // 可以改为从 session 获取管理员 ID
    });

    if (!result.success) {
      const errorMessages: Record<string, string> = {
        USER_NOT_FOUND: "用户不存在",
        INVALID_CREDITS: "无效的次数",
        INVALID_DURATION: "无效的有效期",
        INVALID_TYPE: "无效的会员类型",
      };

      return NextResponse.json(
        { error: errorMessages[result.error || ""] || result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      membershipId: result.membership?.id,
      message:
        type === "CREDIT"
          ? `成功开通 ${credits} 次的次卡`
          : `成功开通 ${durationDays} 天的月卡`,
    });
  } catch (error) {
    console.error("[Admin Grant Membership Error]", error);
    return NextResponse.json(
      { error: "Failed to grant membership" },
      { status: 500 }
    );
  }
}
