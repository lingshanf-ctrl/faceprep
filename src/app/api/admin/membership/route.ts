import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/membership?userId=xxx
 * 获取用户的会员订单列表
 */
export async function GET(req: NextRequest) {
  try {
    // 验证管理员身份
    const auth = await verifyAdmin(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const memberships = await db.membershipOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { usageRecords: true },
        },
      },
    });

    // 获取用户基本信息
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
      },
    });

    return NextResponse.json({
      user,
      memberships: memberships.map((m) => ({
        id: m.id,
        type: m.type,
        status: m.status,
        totalCredits: m.totalCredits,
        usedCredits: m.usedCredits,
        startDate: m.startDate,
        endDate: m.endDate,
        note: m.note,
        createdBy: m.createdBy,
        createdAt: m.createdAt,
        usageCount: m._count.usageRecords,
      })),
    });
  } catch (error) {
    console.error("[Admin Membership Error]", error);
    return NextResponse.json(
      { error: "Failed to get memberships" },
      { status: 500 }
    );
  }
}
