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

// 获取同一题目的练习历史
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    const { questionId } = await params;

    // 获取该题目的所有练习记录
    const practices = await db.practice.findMany({
      where: { userId, questionId },
      orderBy: { createdAt: "asc" }, // 按时间升序，方便看进步
    });

    // 映射为前端期望格式
    const mappedPractices = practices.map((p) => {
      let parsedFeedback = null;
      if (p.feedback) {
        try {
          parsedFeedback = JSON.parse(p.feedback);
        } catch {
          parsedFeedback = p.feedback;
        }
      }

      return {
        id: p.id,
        answer: p.answer,
        score: p.score ?? 0,
        feedback: parsedFeedback,
        duration: p.duration,
        createdAt: p.createdAt.toISOString(),
      };
    });

    // 计算进步统计
    const progress = {
      totalAttempts: practices.length,
      firstScore: practices.length > 0 ? practices[0].score ?? 0 : 0,
      lastScore: practices.length > 0 ? practices[practices.length - 1].score ?? 0 : 0,
      bestScore: Math.max(...practices.map((p) => p.score ?? 0), 0),
      averageScore: practices.length > 0
        ? Math.round(practices.reduce((sum, p) => sum + (p.score ?? 0), 0) / practices.length)
        : 0,
      improvement: practices.length > 1
        ? (practices[practices.length - 1].score ?? 0) - (practices[0].score ?? 0)
        : 0,
    };

    return NextResponse.json({
      practices: mappedPractices,
      progress,
    });
  } catch (error) {
    console.error("Failed to fetch question practices:", error);
    return NextResponse.json(
      { error: "Failed to fetch practice history" },
      { status: 500 }
    );
  }
}
