import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/learning
 * 学习效果分析：用户进步率、低分重做率、分类平均分、得分趋势
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
      improvementRate,
      redoRate,
      categoryScores,
      scoreTrend,
    ] = await Promise.all([
      getImprovementRate(),
      getLowScoreRedoRate(start),
      getCategoryAverageScores(start),
      getScoreTrend(start, period),
    ]);

    return NextResponse.json({
      improvementRate,
      redoRate,
      categoryScores,
      scoreTrend,
    });
  } catch (error) {
    console.error("[Admin Learning Analytics Error]", error);
    return NextResponse.json({ error: "Failed to fetch learning data" }, { status: 500 });
  }
}

// 用户进步率：对比用户前3次 vs 最近3次平均分
async function getImprovementRate() {
  // 取有5次以上练习且有评分记录的用户
  const activeUsers = await db.practice.groupBy({
    by: ["userId"],
    where: { score: { not: null } },
    _count: { id: true },
    having: { id: { _count: { gte: 5 } } },
  });

  if (activeUsers.length === 0) {
    return { eligibleUsers: 0, improvedCount: 0, improvedRate: 0, avgImprovement: 0, distribution: [] };
  }

  const userIds = activeUsers.map((u) => u.userId);
  let improvedCount = 0;
  let totalImprovement = 0;
  const improvements: number[] = [];

  for (const userId of userIds) {
    const practices = await db.practice.findMany({
      where: { userId, score: { not: null } },
      select: { score: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    if (practices.length < 5) continue;

    const early = practices.slice(0, 3);
    const recent = practices.slice(-3);

    const earlyAvg = early.reduce((sum, p) => sum + (p.score || 0), 0) / early.length;
    const recentAvg = recent.reduce((sum, p) => sum + (p.score || 0), 0) / recent.length;

    const improvement = recentAvg - earlyAvg;
    improvements.push(improvement);
    totalImprovement += improvement;
    if (improvement > 0) improvedCount++;
  }

  const eligibleUsers = improvements.length;

  const distribution = [
    { label: "进步显著 (>10分)", count: improvements.filter((i) => i > 10).length },
    { label: "略有进步 (1-10分)", count: improvements.filter((i) => i >= 1 && i <= 10).length },
    { label: "基本持平 (-1~1分)", count: improvements.filter((i) => i > -1 && i < 1).length },
    { label: "有所退步 (<-1分)", count: improvements.filter((i) => i < -1).length },
  ];

  return {
    eligibleUsers,
    improvedCount,
    improvedRate: eligibleUsers > 0 ? Math.round((improvedCount / eligibleUsers) * 100) : 0,
    avgImprovement: eligibleUsers > 0 ? Math.round((totalImprovement / eligibleUsers) * 10) / 10 : 0,
    distribution,
  };
}

// 低分重做率：得分<60的练习，用户是否重新练了同一题
async function getLowScoreRedoRate(start: Date) {
  const lowScorePractices = await db.practice.findMany({
    where: {
      createdAt: { gte: start },
      score: { lt: 60, not: null },
      questionId: { not: null },
    },
    select: { userId: true, questionId: true, createdAt: true },
  });

  const total = lowScorePractices.length;
  if (total === 0) return { total: 0, redoCount: 0, redoRate: 0 };

  let redoCount = 0;

  for (const practice of lowScorePractices) {
    const redo = await db.practice.count({
      where: {
        userId: practice.userId,
        questionId: practice.questionId,
        createdAt: { gt: practice.createdAt },
      },
    });
    if (redo > 0) redoCount++;
  }

  return {
    total,
    redoCount,
    redoRate: Math.round((redoCount / total) * 100),
  };
}

// 各分类平均得分
async function getCategoryAverageScores(start: Date) {
  const results = await db.practice.groupBy({
    by: ["questionCategory"],
    where: {
      createdAt: { gte: start },
      score: { not: null },
      questionCategory: { not: null },
    },
    _avg: { score: true },
    _count: { id: true },
  });

  const categoryNames: Record<string, string> = {
    FRONTEND: "前端",
    BACKEND: "后端",
    PRODUCT: "产品",
    DESIGN: "设计",
    OPERATION: "运营",
    GENERAL: "通用",
    DATA: "数据分析",
    AI: "算法/AI",
    MARKETING: "市场/品牌",
    MANAGEMENT: "管理",
  };

  return results
    .filter((r) => r.questionCategory)
    .map((r) => ({
      category: r.questionCategory!,
      categoryName: categoryNames[r.questionCategory!] || r.questionCategory!,
      avgScore: Math.round(r._avg.score || 0),
      count: r._count.id,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);
}

// 得分趋势（按天平均分）
async function getScoreTrend(start: Date, period: number) {
  const result = [];

  // 每7天为一个点，避免数据太密集
  const interval = period <= 30 ? 1 : 7;

  for (let i = period - 1; i >= 0; i -= interval) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + interval - 1);
    dayEnd.setHours(23, 59, 59, 999);

    const agg = await db.practice.aggregate({
      where: {
        createdAt: { gte: dayStart, lte: dayEnd },
        score: { not: null },
      },
      _avg: { score: true },
      _count: { id: true },
    });

    result.push({
      date: dayStart.toISOString().split("T")[0],
      avgScore: agg._avg.score ? Math.round(agg._avg.score) : null,
      count: agg._count.id,
    });
  }

  return result;
}
