import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;

    // 获取所有练习记录
    const practices = await db.practice.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            category: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 按类型统计平均分
    const typeScores: Record<string, number[]> = {};
    const categoryScores: Record<string, number[]> = {};

    practices.forEach((p) => {
      const type = p.question?.type || "UNKNOWN";
      const category = p.question?.category || "UNKNOWN";

      if (!typeScores[type]) typeScores[type] = [];
      if (!categoryScores[category]) categoryScores[category] = [];

      if (p.score !== null) {
        typeScores[type].push(p.score);
        categoryScores[category].push(p.score);
      }
    });

    // 计算各类型平均分
    const typeAverages = Object.entries(typeScores).map(([type, scores]) => ({
      type,
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
    }));

    const categoryAverages = Object.entries(categoryScores).map(([category, scores]) => ({
      category,
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
    }));

    // 时间趋势（最近30天）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyPractices = practices.filter(
      (p) => new Date(p.createdAt) >= thirtyDaysAgo
    );

    const trend = dailyPractices.map((p) => ({
      date: p.createdAt,
      score: p.score,
    }));

    return NextResponse.json({
      typeAverages,
      categoryAverages,
      trend,
      totalPractices: practices.length,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
