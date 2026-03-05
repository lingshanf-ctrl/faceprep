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

    // 获取所有练习记录
    const practices = await db.practice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        score: true,
        createdAt: true,
      },
    });

    // 基础统计
    const totalPractices = practices.length;
    const scores = practices
      .map((p) => p.score)
      .filter((s): s is number => s !== null);

    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

    // 最近7次趋势
    const recentTrend = practices.slice(0, 7).map((p) => p.score || 0).reverse();

    // 计算连续练习天数
    const streak = calculateStreak(practices.map((p) => p.createdAt));

    // 匿名用户添加警告头
    const headers = new Headers();
    if (isAnonymous) {
      headers.set("X-Anonymous-User", "true");
    }

    return NextResponse.json({
      totalPractices,
      averageScore,
      highestScore,
      recentTrend,
      streak,
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
