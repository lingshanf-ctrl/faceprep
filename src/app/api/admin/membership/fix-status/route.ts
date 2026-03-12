import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OrderStatus, MembershipType } from "@prisma/client";
import { verifyAdmin } from "@/lib/admin-auth";

/**
 * 修复会员订单状态
 * - 将用完的次卡状态从 EXPIRED 修正为 CONSUMED
 * - 清理异常状态
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员身份
    const auth = await verifyAdmin(request);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { userId, membershipId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // 如果只指定了特定会员ID，只修复该会员
    if (membershipId) {
      const membership = await db.membershipOrder.findFirst({
        where: {
          id: membershipId,
          userId,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "Membership not found" },
          { status: 404 }
        );
      }

      let newStatus: OrderStatus | null = null;

      // 次卡：检查是否用完
      if (membership.type === MembershipType.CREDIT) {
        if (membership.totalCredits !== null &&
            membership.usedCredits >= membership.totalCredits &&
            membership.status !== OrderStatus.CONSUMED) {
          newStatus = OrderStatus.CONSUMED;
        }
      }
      // 月卡：检查是否过期
      else if (membership.type === MembershipType.MONTHLY) {
        const now = new Date();
        if (membership.endDate &&
            membership.endDate < now &&
            membership.status !== OrderStatus.EXPIRED) {
          newStatus = OrderStatus.EXPIRED;
        }
      }

      if (newStatus) {
        await db.membershipOrder.update({
          where: { id: membershipId },
          data: { status: newStatus },
        });

        return NextResponse.json({
          success: true,
          message: `已修复：状态更新为 ${newStatus}`,
          fixed: true,
          oldStatus: membership.status,
          newStatus,
        });
      }

      return NextResponse.json({
        success: true,
        message: "状态正常，无需修复",
        fixed: false,
      });
    }

    // 修复该用户的所有异常状态会员订单
    const memberships = await db.membershipOrder.findMany({
      where: {
        userId,
        status: {
          in: [OrderStatus.ACTIVE, OrderStatus.EXPIRED],
        },
      },
    });

    const fixed: Array<{
      id: string;
      type: string;
      oldStatus: string;
      newStatus: string;
    }> = [];

    const now = new Date();

    for (const m of memberships) {
      let newStatus: OrderStatus | null = null;

      // 次卡：次数用完应该是 CONSUMED，不是 EXPIRED
      if (m.type === MembershipType.CREDIT) {
        if (m.totalCredits !== null && m.usedCredits >= m.totalCredits) {
          if (m.status !== OrderStatus.CONSUMED) {
            newStatus = OrderStatus.CONSUMED;
          }
        }
      }
      // 月卡：到期应该是 EXPIRED
      else if (m.type === MembershipType.MONTHLY) {
        if (m.endDate && m.endDate < now) {
          if (m.status !== OrderStatus.EXPIRED) {
            newStatus = OrderStatus.EXPIRED;
          }
        }
      }

      if (newStatus) {
        await db.membershipOrder.update({
          where: { id: m.id },
          data: { status: newStatus },
        });

        fixed.push({
          id: m.id,
          type: m.type,
          oldStatus: m.status,
          newStatus,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `修复完成：共修复 ${fixed.length} 个订单`,
      fixed,
      totalChecked: memberships.length,
    });
  } catch (error) {
    console.error("Fix membership status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
