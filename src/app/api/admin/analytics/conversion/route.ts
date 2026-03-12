import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MembershipType, OrderStatus } from "@prisma/client";
import { verifyAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/conversion
 * 获取商业转化分析数据
 */
export async function GET(req: NextRequest) {
  try {
    // 验证管理员身份
    const auth = await verifyAdmin(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const period = parseInt(searchParams.get("period") || "30");
    const start = new Date();
    start.setDate(start.getDate() - period);
    start.setHours(0, 0, 0, 0);

    const [
      membershipStats,
      conversionFunnel,
      membershipTrend,
      usageStats,
      valueMetrics,
      topUsers,
    ] = await Promise.all([
      getMembershipStats(start),
      getConversionFunnel(),
      getMembershipTrend(start, period),
      getUsageStats(start),
      getValueMetrics(start),
      getTopUsersByUsage(),
    ]);

    return NextResponse.json({
      summary: {
        totalMembers: membershipStats.total,
        activeMembers: membershipStats.active,
        conversionRate: conversionFunnel.overallRate,
        avgLTV: valueMetrics.avgLTV,
        mrr: valueMetrics.mrr,
      },
      membership: membershipStats,
      conversionFunnel,
      membershipTrend,
      usage: usageStats,
      value: valueMetrics,
      topUsers,
    });
  } catch (error) {
    console.error("[Admin Conversion Analytics Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch conversion data" },
      { status: 500 }
    );
  }
}

// 会员统计
async function getMembershipStats(start: Date) {
  const [
    totalOrders,
    activeOrders,
    creditOrders,
    monthlyOrders,
    consumedOrders,
    expiredOrders,
  ] = await Promise.all([
    db.membershipOrder.count(),
    db.membershipOrder.count({ where: { status: OrderStatus.ACTIVE } }),
    db.membershipOrder.count({ where: { type: MembershipType.CREDIT } }),
    db.membershipOrder.count({ where: { type: MembershipType.MONTHLY } }),
    db.membershipOrder.count({ where: { status: OrderStatus.CONSUMED } }),
    db.membershipOrder.count({ where: { status: OrderStatus.EXPIRED } }),
  ]);

  // 按类型统计
  const creditStats = await db.membershipOrder.aggregate({
    where: { type: MembershipType.CREDIT },
    _sum: { totalCredits: true, usedCredits: true },
    _avg: { totalCredits: true },
  });

  const monthlyStats = await db.membershipOrder.findMany({
    where: {
      type: MembershipType.MONTHLY,
      status: OrderStatus.ACTIVE,
    },
    select: {
      startDate: true,
      endDate: true,
    },
  });

  // 计算平均有效期
  const avgDuration =
    monthlyStats.length > 0
      ? Math.round(
          monthlyStats.reduce((acc, m) => {
            if (m.startDate && m.endDate) {
              const days =
                (m.endDate.getTime() - m.startDate.getTime()) /
                (1000 * 60 * 60 * 24);
              return acc + days;
            }
            return acc;
          }, 0) / monthlyStats.length
        )
      : 0;

  return {
    total: totalOrders,
    active: activeOrders,
    byType: {
      credit: {
        total: creditOrders,
        avgCredits: Math.round(creditStats._avg.totalCredits || 0),
        totalCreditsSold: creditStats._sum.totalCredits || 0,
        totalCreditsUsed: creditStats._sum.usedCredits || 0,
        usageRate:
          creditStats._sum.totalCredits && creditStats._sum.totalCredits > 0
            ? Math.round(
                ((creditStats._sum.usedCredits || 0) /
                  creditStats._sum.totalCredits) *
                  100
              )
            : 0,
      },
      monthly: {
        total: monthlyOrders,
        active: monthlyStats.length,
        avgDurationDays: avgDuration,
      },
    },
    lifecycle: {
      consumed: consumedOrders,
      expired: expiredOrders,
    },
  };
}

// 转化漏斗
async function getConversionFunnel() {
  // 获取各阶段用户数
  const [totalUsers, usersWithPractice, usersWithMembership] =
    await Promise.all([
      db.user.count(),
      db.user.count({
        where: {
          practices: { some: {} },
        },
      }),
      db.user.count({
        where: {
          memberships: { some: {} },
        },
      }),
    ]);

  // 获取多次购买会员的用户数
  const usersWithMultipleOrders = await db.$queryRaw<
    { userId: string; count: number }[]
  >`
    SELECT "userId", COUNT(*) as count
    FROM "MembershipOrder"
    GROUP BY "userId"
    HAVING COUNT(*) > 1
  `;

  return {
    stages: [
      { name: "注册用户", count: totalUsers, percentage: 100 },
      {
        name: "完成练习",
        count: usersWithPractice,
        percentage: totalUsers > 0 ? Math.round((usersWithPractice / totalUsers) * 100) : 0,
      },
      {
        name: "购买会员",
        count: usersWithMembership,
        percentage:
          usersWithPractice > 0
            ? Math.round((usersWithMembership / usersWithPractice) * 100)
            : 0,
      },
      {
        name: "复购会员",
        count: usersWithMultipleOrders.length,
        percentage:
          usersWithMembership > 0
            ? Math.round((usersWithMultipleOrders.length / usersWithMembership) * 100)
            : 0,
      },
    ],
    overallRate:
      totalUsers > 0 ? Math.round((usersWithMembership / totalUsers) * 100) : 0,
    repeatPurchaseRate:
      usersWithMembership > 0
        ? Math.round((usersWithMultipleOrders.length / usersWithMembership) * 100)
        : 0,
  };
}

// 会员趋势（按天）
async function getMembershipTrend(start: Date, period: number) {
  const orders = await db.membershipOrder.findMany({
    where: { createdAt: { gte: start } },
    select: {
      createdAt: true,
      type: true,
      totalCredits: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const dailyMap = new Map<
    string,
    { date: string; credit: number; monthly: number; total: number }
  >();

  // 初始化所有日期
  for (let i = 0; i <= period; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const key = date.toISOString().split("T")[0];
    dailyMap.set(key, { date: key, credit: 0, monthly: 0, total: 0 });
  }

  orders.forEach((order) => {
    const key = order.createdAt.toISOString().split("T")[0];
    const data = dailyMap.get(key);
    if (data) {
      if (order.type === MembershipType.CREDIT) {
        data.credit++;
      } else {
        data.monthly++;
      }
      data.total++;
    }
  });

  return Array.from(dailyMap.values());
}

// 使用统计
async function getUsageStats(start: Date) {
  // 总体使用情况
  const [totalUsage, creditUsage, monthlyUsage] = await Promise.all([
    db.usageRecord.count({ where: { createdAt: { gte: start } } }),
    db.usageRecord.count({
      where: {
        createdAt: { gte: start },
        membership: { type: MembershipType.CREDIT },
      },
    }),
    db.usageRecord.count({
      where: {
        createdAt: { gte: start },
        membership: { type: MembershipType.MONTHLY },
      },
    }),
  ]);

  // 按来源类型统计
  const sourceStats = await db.usageRecord.groupBy({
    by: ["sourceType"],
    where: { createdAt: { gte: start } },
    _count: true,
  });

  // 使用频率分布
  const userUsageCounts = await db.$queryRaw<
    { usageCount: number; userCount: number }[]
  >`
    SELECT
      COUNT(*) as "usageCount",
      COUNT(DISTINCT "userId") as "userCount"
    FROM "UsageRecord"
    WHERE "createdAt" >= ${start}
    GROUP BY "userId"
  `;

  const usageDistribution = [
    { range: "1-5次", count: 0 },
    { range: "6-20次", count: 0 },
    { range: "21-50次", count: 0 },
    { range: "50次以上", count: 0 },
  ];

  // 统计分布
  return {
    total: totalUsage,
    byType: {
      credit: creditUsage,
      monthly: monthlyUsage,
    },
    bySource: sourceStats.map((s) => ({
      source: s.sourceType,
      count: s._count,
    })),
  };
}

// 价值指标
async function getValueMetrics(start: Date) {
  // 估算平均 LTV (生命周期价值)
  // 基于次卡平均次数 * 预估单价 + 月卡平均天数 / 30 * 预估月费
  const creditOrders = await db.membershipOrder.findMany({
    where: { type: MembershipType.CREDIT },
    select: { totalCredits: true },
  });

  const monthlyOrders = await db.membershipOrder.findMany({
    where: { type: MembershipType.MONTHLY },
    select: {
      startDate: true,
      endDate: true,
    },
  });

  // 估算：假设次卡平均 2元/次，月卡 29元/月
  const avgCreditsPerOrder =
    creditOrders.reduce((acc, o) => acc + (o.totalCredits || 0), 0) /
      creditOrders.length || 0;
  const creditLTV = avgCreditsPerOrder * 2;

  const avgMonthsPerOrder =
    monthlyOrders.length > 0
      ? monthlyOrders.reduce((acc, o) => {
          if (o.startDate && o.endDate) {
            const months =
              (o.endDate.getTime() - o.startDate.getTime()) /
              (1000 * 60 * 60 * 24 * 30);
            return acc + months;
          }
          return acc;
        }, 0) / monthlyOrders.length
      : 0;
  const monthlyLTV = avgMonthsPerOrder * 29;

  // 加权平均
  const totalOrders = creditOrders.length + monthlyOrders.length;
  const avgLTV =
    totalOrders > 0
      ? Math.round(
          (creditLTV * creditOrders.length +
            monthlyLTV * monthlyOrders.length) /
            totalOrders
        )
      : 0;

  // 估算 MRR (月经常性收入)
  const activeMonthly = await db.membershipOrder.count({
    where: {
      type: MembershipType.MONTHLY,
      status: OrderStatus.ACTIVE,
    },
  });
  const mrr = activeMonthly * 29;

  return {
    avgLTV,
    mrr,
    estimatedCreditValue: Math.round(creditLTV),
    estimatedMonthlyValue: Math.round(monthlyLTV),
    activeMonthlyUsers: activeMonthly,
  };
}

// 高价值用户
async function getTopUsersByUsage() {
  const topUsers = await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      _count: {
        select: {
          practices: true,
          sessions: true,
          memberships: true,
          usageRecords: true,
        },
      },
    },
    orderBy: {
      usageRecords: {
        _count: "desc",
      },
    },
    take: 10,
  });

  return topUsers.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    practices: u._count.practices,
    interviews: u._count.sessions,
    memberships: u._count.memberships,
    usageCount: u._count.usageRecords,
  }));
}
