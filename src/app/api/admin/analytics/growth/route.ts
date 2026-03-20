import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/growth
 * 增长漏斗分析：激活率、体验卡转化、付费触发点、7日留存
 */
export async function GET(req: NextRequest) {
  try {
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
      activationFunnel,
      trialConversion,
      payTrigger,
      retentionFromFirstPractice,
      dailyActivation,
    ] = await Promise.all([
      getActivationFunnel(start),
      getTrialConversion(),
      getPayTriggerPoint(),
      getRetentionFromFirstPractice(start),
      getDailyActivation(start, period),
    ]);

    return NextResponse.json({
      activationFunnel,
      trialConversion,
      payTrigger,
      retentionFromFirstPractice,
      dailyActivation,
    });
  } catch (error) {
    console.error("[Admin Growth Analytics Error]", error);
    return NextResponse.json({ error: "Failed to fetch growth data" }, { status: 500 });
  }
}

// 激活漏斗：注册 → 首次练习（48小时内）→ 付费
async function getActivationFunnel(start: Date) {
  const newUsers = await db.user.findMany({
    where: { createdAt: { gte: start } },
    select: { id: true, createdAt: true },
  });

  const totalNew = newUsers.length;
  if (totalNew === 0) {
    return { totalNew: 0, activatedCount: 0, activationRate: 0, paidCount: 0, paidRate: 0 };
  }

  // 统计48小时内完成首次练习的用户
  let activatedCount = 0;
  let paidCount = 0;

  const userIds = newUsers.map((u) => u.id);

  // 查这批新用户的首次练习
  const firstPractices = await db.practice.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    distinct: ["userId"],
  });

  const firstPracticeMap = new Map(firstPractices.map((p) => [p.userId, p.createdAt]));

  // 查这批新用户是否购买了会员
  const paidUsers = await db.membershipOrder.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true },
    distinct: ["userId"],
  });
  const paidUserSet = new Set(paidUsers.map((p) => p.userId));

  for (const user of newUsers) {
    const firstPractice = firstPracticeMap.get(user.id);
    if (firstPractice) {
      const diffHours = (firstPractice.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 48) {
        activatedCount++;
      }
    }
    if (paidUserSet.has(user.id)) {
      paidCount++;
    }
  }

  return {
    totalNew,
    activatedCount,
    activationRate: Math.round((activatedCount / totalNew) * 100),
    paidCount,
    paidRate: Math.round((paidCount / totalNew) * 100),
  };
}

// 体验卡转化率
async function getTrialConversion() {
  const totalTrials = await db.trialClaim.count();
  if (totalTrials === 0) {
    return { totalTrials: 0, convertedCount: 0, conversionRate: 0, avgDaysToConvert: 0 };
  }

  const trialUsers = await db.trialClaim.findMany({
    select: { userId: true, claimedAt: true },
  });

  const trialUserIds = trialUsers.map((t) => t.userId);
  const trialClaimedMap = new Map(trialUsers.map((t) => [t.userId, t.claimedAt]));

  // 查哪些体验卡用户购买了会员
  const paidAfterTrial = await db.membershipOrder.findMany({
    where: { userId: { in: trialUserIds } },
    select: { userId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    distinct: ["userId"],
  });

  const convertedCount = paidAfterTrial.length;

  // 计算平均转化天数
  let totalDays = 0;
  for (const order of paidAfterTrial) {
    const claimedAt = trialClaimedMap.get(order.userId);
    if (claimedAt) {
      const days = (order.createdAt.getTime() - claimedAt.getTime()) / (1000 * 60 * 60 * 24);
      totalDays += Math.max(days, 0);
    }
  }

  return {
    totalTrials,
    convertedCount,
    conversionRate: Math.round((convertedCount / totalTrials) * 100),
    avgDaysToConvert: convertedCount > 0 ? Math.round(totalDays / convertedCount) : 0,
  };
}

// 付费触发点：用户平均练习几次后购买会员
async function getPayTriggerPoint() {
  // 取所有有会员订单的用户及其首次购买时间
  const firstOrders = await db.membershipOrder.findMany({
    select: { userId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    distinct: ["userId"],
  });

  if (firstOrders.length === 0) {
    return { avgPracticesBeforePay: 0, distribution: [] };
  }

  const counts: number[] = [];

  for (const order of firstOrders) {
    const practiceCount = await db.practice.count({
      where: {
        userId: order.userId,
        createdAt: { lt: order.createdAt },
      },
    });
    counts.push(practiceCount);
  }

  const avg = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);

  // 分布统计
  const distribution = [
    { range: "0次（直接购买）", count: counts.filter((c) => c === 0).length },
    { range: "1-3次", count: counts.filter((c) => c >= 1 && c <= 3).length },
    { range: "4-10次", count: counts.filter((c) => c >= 4 && c <= 10).length },
    { range: "11-20次", count: counts.filter((c) => c >= 11 && c <= 20).length },
    { range: "20次以上", count: counts.filter((c) => c > 20).length },
  ];

  return { avgPracticesBeforePay: avg, distribution };
}

// 首次练习后的留存率（7日、14日、30日）
async function getRetentionFromFirstPractice(start: Date) {
  const now = new Date();

  // 取在统计周期内完成首次练习的用户
  const firstPractices = await db.practice.findMany({
    where: { createdAt: { gte: start } },
    select: { userId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    distinct: ["userId"],
  });

  const total = firstPractices.length;
  if (total === 0) return { total: 0, day7: 0, day14: 0, day30: 0 };

  const checkDays = [7, 14, 30];
  const results: Record<string, number> = {};

  for (const day of checkDays) {
    // 只统计距今超过该天数的用户（否则留存率没意义）
    const eligibleUsers = firstPractices.filter((p) => {
      const daysSinceFirst = (now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceFirst >= day;
    });

    if (eligibleUsers.length === 0) {
      results[`day${day}`] = 0;
      continue;
    }

    let retained = 0;
    for (const user of eligibleUsers) {
      const retentionStart = new Date(user.createdAt);
      retentionStart.setDate(retentionStart.getDate() + day - 1);
      const retentionEnd = new Date(user.createdAt);
      retentionEnd.setDate(retentionEnd.getDate() + day + 1);

      const practiced = await db.practice.count({
        where: {
          userId: user.userId,
          createdAt: { gte: retentionStart, lte: retentionEnd },
        },
      });
      if (practiced > 0) retained++;
    }

    results[`day${day}`] = Math.round((retained / eligibleUsers.length) * 100);
  }

  return { total, ...results };
}

// 每日新用户激活率趋势
async function getDailyActivation(start: Date, period: number) {
  const result = [];

  for (let i = period - 1; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const newUsers = await db.user.findMany({
      where: { createdAt: { gte: dayStart, lte: dayEnd } },
      select: { id: true, createdAt: true },
    });

    if (newUsers.length === 0) {
      result.push({ date: dayStart.toISOString().split("T")[0], newUsers: 0, activated: 0, rate: 0 });
      continue;
    }

    const userIds = newUsers.map((u) => u.id);
    const firstPractices = await db.practice.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      distinct: ["userId"],
    });

    const firstPracticeMap = new Map(firstPractices.map((p) => [p.userId, p.createdAt]));
    let activated = 0;
    for (const user of newUsers) {
      const fp = firstPracticeMap.get(user.id);
      if (fp) {
        const diffHours = (fp.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60);
        if (diffHours <= 48) activated++;
      }
    }

    result.push({
      date: dayStart.toISOString().split("T")[0],
      newUsers: newUsers.length,
      activated,
      rate: Math.round((activated / newUsers.length) * 100),
    });
  }

  return result;
}
