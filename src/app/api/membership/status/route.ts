import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getMembershipStatus, getUserMemberships } from "@/lib/membership-service";

/**
 * GET /api/membership/status
 * 获取当前用户的会员状态
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getMembershipStatus(session.id);
    const orders = await getUserMemberships(session.id);

    return NextResponse.json({
      status,
      orders: orders.map((order) => ({
        id: order.id,
        type: order.type,
        status: order.status,
        totalCredits: order.totalCredits,
        usedCredits: order.usedCredits,
        startDate: order.startDate,
        endDate: order.endDate,
        usageCount: order._count.usageRecords,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error("[Membership Status Error]", error);
    return NextResponse.json(
      { error: "Failed to get membership status" },
      { status: 500 }
    );
  }
}
