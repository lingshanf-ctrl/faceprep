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

    // 获取用户的练习记录
    const practices = await db.practice.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            id: true,
            category: true,
            type: true,
            difficulty: true,
          },
        },
      },
    });

    // 计算薄弱类型和分类
    const typeScores: Record<string, { count: number; totalScore: number }> = {};
    const categoryScores: Record<string, { count: number; totalScore: number }> = {};

    practices.forEach((p) => {
      const score = p.score ?? 0;
      const type = p.question?.type || "UNKNOWN";
      const category = p.question?.category || "GENERAL";

      if (!typeScores[type]) typeScores[type] = { count: 0, totalScore: 0 };
      typeScores[type].count++;
      typeScores[type].totalScore += score;

      if (!categoryScores[category]) categoryScores[category] = { count: 0, totalScore: 0 };
      categoryScores[category].count++;
      categoryScores[category].totalScore += score;
    });

    // 找出平均分最低的类型和分类
    const weakTypes = Object.entries(typeScores)
      .filter(([_, data]) => data.count >= 1)
      .map(([type, data]) => ({ type, avgScore: data.totalScore / data.count }))
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 2)
      .map((t) => t.type);

    const weakCategories = Object.entries(categoryScores)
      .filter(([_, data]) => data.count >= 1)
      .map(([category, data]) => ({ category, avgScore: data.totalScore / data.count }))
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 2)
      .map((c) => c.category);

    // 获取已练习的题目ID
    const practicedQuestionIds = new Set(practices.map((p) => p.questionId));

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
