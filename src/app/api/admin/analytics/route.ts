import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "admin-secret-token";

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  return token === ADMIN_TOKEN;
}

// 获取日期范围
function getDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

// 获取某天的开始和结束
function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * GET /api/admin/analytics
 * 获取综合数据分析（用户增长、留存、活跃度、产品使用）
 */
export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const period = parseInt(searchParams.get("period") || "30"); // 默认30天
    const { start, end } = getDateRange(period);

    // 并行查询所有数据
    const [
      // 1. 用户增长趋势
      userGrowthData,
      // 2. 活跃用户数（按天）
      dailyActiveUsers,
      // 3. 用户留存数据
      retentionData,
      // 4. 练习数据统计
      practiceStats,
      // 5. 面试数据统计
      interviewStats,
      // 6. 功能使用情况
      featureUsage,
      // 7. 用户分群统计
      userSegments,
      // 8. 热门时段分析
      hourlyDistribution,
    ] = await Promise.all([
      // 1. 用户增长趋势
      getUserGrowthTrend(start, end),
      // 2. 活跃用户
      getDailyActiveUsers(start, end),
      // 3. 留存数据
      getRetentionData(period),
      // 4. 练习统计
      getPracticeStats(start, end),
      // 5. 面试统计
      getInterviewStats(start, end),
      // 6. 功能使用
      getFeatureUsage(start, end),
      // 7. 用户分群
      getUserSegments(),
      // 8. 时段分布
      getHourlyDistribution(start, end),
    ]);

    // 计算关键指标
    const totalUsers = await db.user.count();
    const newUsersInPeriod = await db.user.count({
      where: { createdAt: { gte: start } },
    });
    const activeUsersInPeriod = await getUniqueActiveUsers(start, end);

    // 计算留存率
    const retentionRate = calculateRetentionRate(retentionData);

    return NextResponse.json({
      summary: {
        totalUsers,
        newUsersInPeriod,
        activeUsersInPeriod,
        retentionRate,
        avgPracticesPerUser: practiceStats.avgPerUser,
        avgScore: practiceStats.avgScore,
      },
      userGrowth: userGrowthData,
      dailyActiveUsers,
      retention: retentionData,
      practiceStats,
      interviewStats,
      featureUsage,
      userSegments,
      hourlyDistribution,
    });
  } catch (error) {
    console.error("[Admin Analytics Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}

// 用户增长趋势（按天）
async function getUserGrowthTrend(start: Date, end: Date) {
  const users = await db.user.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // 按天分组
  const dailyMap = new Map<string, number>();
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  for (let i = 0; i <= days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const key = date.toISOString().split("T")[0];
    dailyMap.set(key, 0);
  }

  users.forEach((user) => {
    const key = user.createdAt.toISOString().split("T")[0];
    dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
  });

  return Array.from(dailyMap.entries()).map(([date, count]) => ({
    date,
    newUsers: count,
  }));
}

// 每日活跃用户（DAU）
async function getDailyActiveUsers(start: Date, end: Date) {
  const practices = await db.practice.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: start, lte: end } },
    _count: { userId: true },
  });

  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const result = [];

  for (let i = 0; i <= days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    // 获取当天的活跃用户
    const activeUsers = await db.practice.groupBy({
      by: ["userId"],
      where: {
        createdAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
    });

    result.push({
      date: dateStr,
      dau: activeUsers.length,
    });
  }

  return result;
}

// 留存数据
async function getRetentionData(period: number) {
  // 获取不同批次的新用户留存
  const cohorts = [];
  const now = new Date();

  for (let i = 0; i < Math.min(period, 30); i += 7) {
    const cohortDate = new Date(now);
    cohortDate.setDate(cohortDate.getDate() - i - 7);
    const cohortEnd = new Date(cohortDate);
    cohortEnd.setDate(cohortEnd.getDate() + 7);

    const newUsers = await db.user.findMany({
      where: {
        createdAt: {
          gte: cohortDate,
          lt: cohortEnd,
        },
      },
      select: { id: true },
    });

    const userIds = newUsers.map((u) => u.id);

    if (userIds.length === 0) continue;

    // 计算各日留存
    const retention = [];
    for (let day of [1, 3, 7, 14, 30]) {
      const checkDate = new Date(cohortDate);
      checkDate.setDate(checkDate.getDate() + day);

      if (checkDate > now) break;

      const activeUsers = await db.practice.groupBy({
        by: ["userId"],
        where: {
          userId: { in: userIds },
          createdAt: {
            gte: new Date(checkDate.setHours(0, 0, 0, 0)),
            lte: new Date(checkDate.setHours(23, 59, 59, 999)),
          },
        },
      });

      retention.push({
        day,
        rate: Math.round((activeUsers.length / userIds.length) * 100),
      });
    }

    cohorts.push({
      cohort: cohortDate.toISOString().split("T")[0],
      users: userIds.length,
      retention,
    });
  }

  return cohorts;
}

// 练习统计
async function getPracticeStats(start: Date, end: Date) {
  const [
    totalPractices,
    periodPractices,
    avgScoreResult,
    scoreDistribution,
    categoryDistribution,
    typeDistribution,
  ] = await Promise.all([
    db.practice.count(),
    db.practice.count({ where: { createdAt: { gte: start, lte: end } } }),
    db.practice.aggregate({
      where: { score: { not: null } },
      _avg: { score: true },
    }),
    db.practice.groupBy({
      by: ["score"],
      where: { createdAt: { gte: start, lte: end }, score: { not: null } },
      _count: true,
    }),
    db.practice.groupBy({
      by: ["questionCategory"],
      where: { createdAt: { gte: start, lte: end } },
      _count: true,
    }),
    db.practice.groupBy({
      by: ["questionType"],
      where: { createdAt: { gte: start, lte: end } },
      _count: true,
    }),
  ]);

  const activeUsers = await db.practice.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: start, lte: end } },
  });

  return {
    total: totalPractices,
    inPeriod: periodPractices,
    avgPerUser: activeUsers.length > 0 ? Math.round(periodPractices / activeUsers.length * 10) / 10 : 0,
    avgScore: Math.round(avgScoreResult._avg.score || 0),
    scoreDistribution: [
      { range: "90-100", count: scoreDistribution.filter((s) => s.score && s.score >= 90).reduce((a, b) => a + b._count, 0) },
      { range: "80-89", count: scoreDistribution.filter((s) => s.score && s.score >= 80 && s.score < 90).reduce((a, b) => a + b._count, 0) },
      { range: "60-79", count: scoreDistribution.filter((s) => s.score && s.score >= 60 && s.score < 80).reduce((a, b) => a + b._count, 0) },
      { range: "0-59", count: scoreDistribution.filter((s) => s.score && s.score < 60).reduce((a, b) => a + b._count, 0) },
    ],
    categoryDistribution: categoryDistribution.map((c) => ({
      category: c.questionCategory || "UNKNOWN",
      count: c._count,
    })),
    typeDistribution: typeDistribution.map((t) => ({
      type: t.questionType || "UNKNOWN",
      count: t._count,
    })),
  };
}

// 面试统计
async function getInterviewStats(start: Date, end: Date) {
  const [total, completed, abandoned, avgScore] = await Promise.all([
    db.interviewSession.count({ where: { createdAt: { gte: start, lte: end } } }),
    db.interviewSession.count({
      where: { createdAt: { gte: start, lte: end }, status: "COMPLETED" },
    }),
    db.interviewSession.count({
      where: { createdAt: { gte: start, lte: end }, status: "ABANDONED" },
    }),
    db.interviewSession.aggregate({
      where: { createdAt: { gte: start, lte: end } },
      _avg: { overallScore: true },
    }),
  ]);

  return {
    total,
    completed,
    abandoned,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    avgScore: Math.round(avgScore._avg.overallScore || 0),
  };
}

// 功能使用情况
async function getFeatureUsage(start: Date, end: Date) {
  // 语音输入使用率
  const practicesWithVoice = await db.practice.count({
    where: {
      createdAt: { gte: start, lte: end },
      duration: { not: null },
    },
  });
  const totalPractices = await db.practice.count({
    where: { createdAt: { gte: start, lte: end } }},
  );

  // AI 评估使用率
  const practicesWithAI = await db.practice.count({
    where: {
      createdAt: { gte: start, lte: end },
      evaluationStatus: "COMPLETED",
    },
  });

  // 收藏功能使用
  const favoritesCount = await db.favorite.count({
    where: { createdAt: { gte: start, lte: end } }},
  );

  // 自定义题目创建
  const customQuestions = await db.customQuestion.count({
    where: { createdAt: { gte: start, lte: end } }},
  );

  return {
    voiceUsageRate: totalPractices > 0 ? Math.round((practicesWithVoice / totalPractices) * 100) : 0,
    aiEvaluationRate: totalPractices > 0 ? Math.round((practicesWithAI / totalPractices) * 100) : 0,
    favoritesCount,
    customQuestionsCount: customQuestions,
  };
}

// 用户分群
async function getUserSegments() {
  // 按练习频率分群
  const allUsers = await db.user.findMany({
    select: {
      id: true,
      _count: {
        select: { practices: true, sessions: true },
      },
    },
  });

  const segments = {
    highlyActive: 0, // 练习 > 20次
    moderatelyActive: 0, // 练习 5-20次
    lightlyActive: 0, // 练习 1-5次
    inactive: 0, // 练习 0次
  };

  allUsers.forEach((user) => {
    const practiceCount = user._count.practices;
    if (practiceCount > 20) segments.highlyActive++;
    else if (practiceCount >= 5) segments.moderatelyActive++;
    else if (practiceCount >= 1) segments.lightlyActive++;
    else segments.inactive++;
  });

  return {
    segments: [
      { name: "高活跃用户", count: segments.highlyActive, percentage: Math.round((segments.highlyActive / allUsers.length) * 100) },
      { name: "中等活跃用户", count: segments.moderatelyActive, percentage: Math.round((segments.moderatelyActive / allUsers.length) * 100) },
      { name: "轻度活跃用户", count: segments.lightlyActive, percentage: Math.round((segments.lightlyActive / allUsers.length) * 100) },
      { name: "未活跃用户", count: segments.inactive, percentage: Math.round((segments.inactive / allUsers.length) * 100) },
    ],
    total: allUsers.length,
  };
}

// 时段分布
async function getHourlyDistribution(start: Date, end: Date) {
  const practices = await db.practice.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { createdAt: true },
  });

  const hourlyMap = new Map<number, number>();
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, 0);
  }

  practices.forEach((p) => {
    const hour = p.createdAt.getHours();
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
  });

  return Array.from(hourlyMap.entries()).map(([hour, count]) => ({
    hour: `${hour}:00`,
    count,
  }));
}

// 获取指定时间段的独立活跃用户数
async function getUniqueActiveUsers(start: Date, end: Date) {
  const result = await db.practice.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: start, lte: end } },
  });
  return result.length;
}

// 计算平均留存率
function calculateRetentionRate(retentionData: any[]) {
  if (retentionData.length === 0) return 0;

  const day1Rates = retentionData
    .map((c) => c.retention.find((r: any) => r.day === 1)?.rate)
    .filter((r) => r !== undefined);

  if (day1Rates.length === 0) return 0;

  return Math.round(day1Rates.reduce((a, b) => a + b, 0) / day1Rates.length);
}
