import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/analytics/content
 * 内容健康分析：题目覆盖率、新分类采用、题目表现排行
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

    const [coverage, newCategoryAdoption, questionPerformance] = await Promise.all([
      getQuestionCoverage(),
      getNewCategoryAdoption(start),
      getQuestionPerformance(start),
    ]);

    return NextResponse.json({ coverage, newCategoryAdoption, questionPerformance });
  } catch (error) {
    console.error("[Admin Content Analytics Error]", error);
    return NextResponse.json({ error: "Failed to fetch content data" }, { status: 500 });
  }
}

// 题目覆盖率：有多少题被练习过
async function getQuestionCoverage() {
  const totalQuestions = await db.question.count();

  // 有练习记录的题目数
  const practicedQuestions = await db.practice.groupBy({
    by: ["questionId"],
    where: { questionId: { not: null } },
  });

  const practicedCount = practicedQuestions.length;
  const neverPracticedCount = totalQuestions - practicedCount;

  // 各分类覆盖情况
  const categoryQuestions = await db.question.groupBy({
    by: ["category"],
    _count: { id: true },
  });

  const categoryPracticed = await db.practice.groupBy({
    by: ["questionCategory"],
    where: { questionCategory: { not: null } },
    _count: { id: true },
    _min: { createdAt: true },
  });

  const categoryPracticedMap = new Map(
    categoryPracticed.map((c) => [c.questionCategory, c._count.id])
  );

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

  const byCategoryBreakdown = categoryQuestions.map((cq) => ({
    category: cq.category,
    categoryName: categoryNames[cq.category] || cq.category,
    totalQuestions: cq._count.id,
    practiceCount: categoryPracticedMap.get(cq.category) || 0,
  }));

  return {
    totalQuestions,
    practicedCount,
    neverPracticedCount,
    coverageRate: totalQuestions > 0 ? Math.round((practicedCount / totalQuestions) * 100) : 0,
    byCategoryBreakdown,
  };
}

// 新分类采用情况（DATA/AI/MARKETING/MANAGEMENT）
async function getNewCategoryAdoption(start: Date) {
  const newCategories = ["DATA", "AI", "MARKETING", "MANAGEMENT"];

  const categoryNames: Record<string, string> = {
    DATA: "数据分析",
    AI: "算法/AI",
    MARKETING: "市场/品牌",
    MANAGEMENT: "管理",
  };

  const result = await Promise.all(
    newCategories.map(async (cat) => {
      const [totalPractices, uniqueUsers, recentPractices] = await Promise.all([
        db.practice.count({ where: { questionCategory: cat as any } }),
        db.practice
          .groupBy({
            by: ["userId"],
            where: { questionCategory: cat as any },
          })
          .then((r) => r.length),
        db.practice.count({
          where: {
            questionCategory: cat as any,
            createdAt: { gte: start },
          },
        }),
      ]);

      return {
        category: cat,
        categoryName: categoryNames[cat],
        totalPractices,
        uniqueUsers,
        recentPractices,
      };
    })
  );

  return result;
}

// 题目表现排行：高分题 vs 低分题，练习最多题 vs 从未被练
async function getQuestionPerformance(start: Date) {
  // 高分题 TOP 5（平均分最高，且有足够练习量）
  const topScoredRaw = await db.practice.groupBy({
    by: ["questionId", "questionTitle"],
    where: {
      score: { not: null },
      questionId: { not: null },
      createdAt: { gte: start },
    },
    _avg: { score: true },
    _count: { id: true },
    having: { id: { _count: { gte: 3 } } },
    orderBy: { _avg: { score: "desc" } },
    take: 5,
  });

  // 低分题 TOP 5（平均分最低，且有足够练习量）
  const lowScoredRaw = await db.practice.groupBy({
    by: ["questionId", "questionTitle"],
    where: {
      score: { not: null },
      questionId: { not: null },
      createdAt: { gte: start },
    },
    _avg: { score: true },
    _count: { id: true },
    having: { id: { _count: { gte: 3 } } },
    orderBy: { _avg: { score: "asc" } },
    take: 5,
  });

  // 练习最多的题 TOP 5
  const mostPracticedRaw = await db.practice.groupBy({
    by: ["questionId", "questionTitle"],
    where: {
      questionId: { not: null },
      createdAt: { gte: start },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const format = (items: typeof topScoredRaw) =>
    items.map((item) => ({
      questionId: item.questionId,
      title: item.questionTitle || "未知题目",
      avgScore: item._avg.score ? Math.round(item._avg.score) : null,
      practiceCount: item._count.id,
    }));

  const formatMostPracticed = (items: typeof mostPracticedRaw) =>
    items.map((item) => ({
      questionId: item.questionId,
      title: item.questionTitle || "未知题目",
      practiceCount: item._count.id,
    }));

  // 从未被练习过的题目
  const practicedQuestionIds = await db.practice.findMany({
    where: { questionId: { not: null } },
    select: { questionId: true },
    distinct: ["questionId"],
  });

  const practicedIds = practicedQuestionIds
    .map((p) => p.questionId)
    .filter((id): id is string => id !== null);

  const neverPracticed = await db.question.findMany({
    where: { id: { notIn: practicedIds } },
    select: { id: true, title: true, category: true, difficulty: true },
    take: 10,
  });

  return {
    topScored: format(topScoredRaw),
    lowScored: format(lowScoredRaw),
    mostPracticed: formatMostPracticed(mostPracticedRaw),
    neverPracticed: neverPracticed.map((q) => ({
      id: q.id,
      title: q.title,
      category: q.category,
      difficulty: q.difficulty,
    })),
  };
}
