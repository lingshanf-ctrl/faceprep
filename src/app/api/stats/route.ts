import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

// 获取匿名ID
function getAnonymousId(request: NextRequest): string | null {
  return request.headers.get("X-Anonymous-Id");
}

// 获取用户ID（登录用户优先，否则使用匿名ID）
async function getUserId(request: NextRequest): Promise<{ userId: string; isAnonymous: boolean }> {
  const session = await getSession();
  if (session?.id) {
    return { userId: session.id, isAnonymous: false };
  }
  const anonymousId = getAnonymousId(request);
  if (anonymousId) {
    return { userId: anonymousId, isAnonymous: true };
  }
  return { userId: "", isAnonymous: true };
}

export async function GET(request: NextRequest) {
  try {
    const { userId, isAnonymous } = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 使用数据库聚合函数（高性能）
    const [aggregation, recentPractices, streakData, categoryStats] = await Promise.all([
      // 聚合统计：总数、平均分、最高分
      db.practice.aggregate({
        where: { userId },
        _count: { id: true },
        _avg: { score: true },
        _max: { score: true },
      }),
      // 只取最近7条用于趋势图
      db.practice.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 7,
        select: {
          score: true,
        },
      }),
      // 只取最近60天的日期用于计算连续天数
      db.practice.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60天内
          },
        },
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
        },
        distinct: ["createdAt"], // 去重日期
      }),
      // 按分类统计平均分（用于能力雷达图）
      db.practice.groupBy({
        by: ["questionCategory"],
        where: { userId },
        _avg: { score: true },
        _count: { id: true },
      }),
    ]);

    const totalPractices = aggregation._count.id;
    const averageScore = Math.round(aggregation._avg.score || 0);
    const highestScore = aggregation._max.score || 0;

    // 最近7次趋势（倒序排列）
    const recentTrend = recentPractices
      .map((p) => p.score || 0)
      .reverse();

    // 计算连续练习天数
    const streak = calculateStreak(streakData.map((p) => p.createdAt));

    // 匿名用户添加警告头
    const headers = new Headers();
    if (isAnonymous) {
      headers.set("X-Anonymous-User", "true");
    }

    // 添加缓存头（统计数据5分钟内有效）
    headers.set("Cache-Control", "private, max-age=300");

    // 将分类统计转换为能力维度数据
    const categoryScores = categoryStats.map((stat) => ({
      category: stat.questionCategory,
      avgScore: Math.round(stat._avg.score || 0),
      count: stat._count.id,
    }));

    return NextResponse.json({
      totalPractices,
      averageScore,
      highestScore,
      recentTrend,
      streak,
      categoryScores,
      isAnonymous,
    }, { headers });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // 获取所有练习日期（去重）
  const practiceDates = new Set<string>();
  dates.forEach((d) => {
    practiceDates.add(new Date(d).toDateString());
  });

  // 按日期排序
  const sortedDates = Array.from(practiceDates).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // 检查今天或昨天是否有练习
  const today = new Date().toDateString();
  const yesterday = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toDateString();

  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0; // 连续练习已中断
  }

  // 计算连续天数
  let streak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i + 1]);
    const diffDays = Math.round(
      (current.getTime() - next.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
