import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

// 获取匿名ID
function getAnonymousId(request: NextRequest): string | null {
  return request.headers.get("X-Anonymous-Id");
}

// 获取用户ID
async function getUserId(request: NextRequest): Promise<string | null> {
  const session = await getSession();
  if (session?.id) {
    return session.id;
  }
  return getAnonymousId(request);
}

// 基于盲点推荐题目
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    // 获取数量参数，默认5道
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get("count") || "5", 10);
    const limit = Math.min(Math.max(count, 1), 10); // 限制1-10道

    // 使用 groupBy 直接在数据库聚合，避免 N+1 查询
    const [typeStats, categoryStats, practicedQuestions] = await Promise.all([
      // 按类型统计平均分
      db.practice.groupBy({
        by: ['questionType'],
        where: { userId },
        _avg: { score: true },
        _count: { id: true },
      }),
      // 按分类统计平均分
      db.practice.groupBy({
        by: ['questionCategory'],
        where: { userId },
        _avg: { score: true },
        _count: { id: true },
      }),
      // 获取已练习的题目ID
      db.practice.findMany({
        where: { userId },
        select: { questionId: true },
        distinct: ['questionId'],
      }),
    ]);

    // 找出薄弱类型（平均分最低的2个）
    const weakTypes = typeStats
      .filter((s) => s._count.id >= 1 && s.questionType)
      .map((s) => ({ type: s.questionType!, avgScore: s._avg.score || 0 }))
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 2)
      .map((t) => t.type);

    // 找出薄弱分类（平均分最低的2个）
    const weakCategories = categoryStats
      .filter((s) => s._count.id >= 1 && s.questionCategory)
      .map((s) => ({ category: s.questionCategory!, avgScore: s._avg.score || 0 }))
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 2)
      .map((c) => c.category);

    // 已练习的题目ID集合
    const practicedQuestionIds = new Set(practicedQuestions.map((p) => p.questionId));

    // 推荐逻辑
    let recommendations: Array<{
      id: string;
      title: string;
      category: string;
      type: string;
      difficulty: number;
      reason: string;
    }> = [];

    // 1. 优先推荐薄弱类型且未练习过的题目
    if (weakTypes.length > 0) {
      const typeRecommendations = await db.question.findMany({
        where: {
          type: { in: weakTypes as any },
          id: { notIn: Array.from(practicedQuestionIds).filter((id): id is string => !!id) },
        },
        take: Math.min(3, limit),
        orderBy: { difficulty: "asc" },
      });

      recommendations.push(
        ...typeRecommendations.map((q) => ({
          ...q,
          reason: `针对薄弱题型：${q.type}`,
        }))
      );
    }

    // 2. 推荐薄弱分类的题目
    if (weakCategories.length > 0 && recommendations.length < limit) {
      const categoryRecommendations = await db.question.findMany({
        where: {
          category: { in: weakCategories as any },
          id: { notIn: [...Array.from(practicedQuestionIds), ...recommendations.map((r) => r.id)].filter((id): id is string => !!id) },
        },
        take: limit - recommendations.length,
        orderBy: { difficulty: "asc" },
      });

      recommendations.push(
        ...categoryRecommendations.map((q) => ({
          ...q,
          reason: `针对薄弱领域：${q.category}`,
        }))
      );
    }

    // 3. 如果还不够，推荐随机题目（难度适中的）
    if (recommendations.length < limit) {
      const randomRecommendations = await db.question.findMany({
        where: {
          id: { notIn: [...Array.from(practicedQuestionIds), ...recommendations.map((r) => r.id)].filter((id): id is string => !!id) },
          difficulty: { lte: 2 },
        },
        take: limit - recommendations.length,
        orderBy: { frequency: "desc" },
      });

      recommendations.push(
        ...randomRecommendations.map((q) => ({
          ...q,
          reason: "高频经典题目",
        }))
      );
    }

    return NextResponse.json({
      recommendations,
      weakAreas: {
        types: weakTypes,
        categories: weakCategories,
      },
    });
  } catch (error) {
    console.error("Failed to get recommendations:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
