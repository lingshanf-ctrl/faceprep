import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

// 获取错题统计
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;

    // 获取低分练习记录（错题）
    const lowScorePractices = await db.practice.findMany({
      where: {
        userId,
        score: { lt: 60 },
      },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            category: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 按题目分组统计
    const questionStats = new Map();
    lowScorePractices.forEach((practice) => {
      const qid = practice.questionId;
      if (!questionStats.has(qid)) {
        questionStats.set(qid, {
          question: practice.question,
          attempts: 0,
          lowestScore: practice.score || 100,
          latestPractice: practice.createdAt,
        });
      }
      const stat = questionStats.get(qid);
      stat.attempts++;
      stat.lowestScore = Math.min(stat.lowestScore, practice.score || 100);
    });

    // 按类型统计
    const typeStats: Record<string, number> = {};
    // 按分类统计
    const categoryStats: Record<string, number> = {};

    lowScorePractices.forEach((p) => {
      const type = p.question?.type || "UNKNOWN";
      const category = p.question?.category || "UNKNOWN";

      typeStats[type] = (typeStats[type] || 0) + 1;
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    return NextResponse.json({
      totalMistakes: lowScorePractices.length,
      uniqueQuestions: questionStats.size,
      questionStats: Array.from(questionStats.values()),
      typeStats,
      categoryStats,
    });
  } catch (error) {
    console.error("Failed to fetch mistake stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch mistake stats" },
      { status: 500 }
    );
  }
}
