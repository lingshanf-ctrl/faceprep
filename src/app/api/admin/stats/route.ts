import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 简单的管理员验证（通过 header token）
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "admin-secret-token";

function isAdmin(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  return token === ADMIN_TOKEN;
}

// 获取今日开始时间
function getTodayStart() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

// 获取本周开始时间
function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

// 获取本月开始时间
function getMonthStart() {
  const now = new Date();
  now.setDate(1);
  now.setHours(0, 0, 0, 0);
  return now;
}

export async function GET(req: NextRequest) {
  try {
    // 验证管理员权限
    if (!isAdmin(req)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const todayStart = getTodayStart();
    const weekStart = getWeekStart();
    const monthStart = getMonthStart();

    // 并行查询所有统计数据
    const [
      // 用户统计
      totalUsers,
      todayNewUsers,
      weekNewUsers,
      monthNewUsers,
      activeUsersToday,

      // 练习统计
      totalPractices,
      todayPractices,
      weekPractices,
      monthPractices,

      // 重复练习统计
      practiceWithRepeats,

      // 平均得分
      avgScore,

      // 模拟面试统计
      totalInterviews,
      completedInterviews,
      abandonedInterviews,

      // Bug反馈统计
      totalBugs,
      openBugs,
      resolvedBugs,

      // 热门题目TOP10
      popularQuestions,

      // 语音使用统计
      practicesWithDuration,
    ] = await Promise.all([
      // 用户统计
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: todayStart } } }),
      db.user.count({ where: { createdAt: { gte: weekStart } } }),
      db.user.count({ where: { createdAt: { gte: monthStart } } }),
      db.practice.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: todayStart } },
      }).then(users => users.length),

      // 练习统计
      db.practice.count(),
      db.practice.count({ where: { createdAt: { gte: todayStart } } }),
      db.practice.count({ where: { createdAt: { gte: weekStart } } }),
      db.practice.count({ where: { createdAt: { gte: monthStart } } }),

      // 重复练习统计（同一题目练习多次的用户数）
      db.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*) as count FROM (
          SELECT "userId", "questionId", COUNT(*) as practice_count
          FROM "Practice"
          GROUP BY "userId", "questionId"
          HAVING COUNT(*) > 1
        ) as repeats
      `,

      // 平均得分
      db.practice.aggregate({
        _avg: { score: true },
        where: { score: { not: null } },
      }),

      // 模拟面试统计
      db.interviewSession.count(),
      db.interviewSession.count({ where: { status: 'COMPLETED' } }),
      db.interviewSession.count({ where: { status: 'ABANDONED' } }),

      // Bug反馈统计
      db.bugReport.count(),
      db.bugReport.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      db.bugReport.count({ where: { status: 'RESOLVED' } }),

      // 热门题目TOP10
      db.practice.groupBy({
        by: ['questionId'],
        _count: { questionId: true },
        orderBy: { _count: { questionId: 'desc' } },
        take: 10,
      }).then(async (results) => {
        const questionIds = results.map(r => r.questionId);
        const questions = await db.question.findMany({
          where: { id: { in: questionIds } },
          select: { id: true, title: true, category: true },
        });
        return results.map(r => ({
          ...r,
          question: questions.find(q => q.id === r.questionId),
        }));
      }),

      // 有duration的练习数（使用语音的指标）
      db.practice.count({ where: { duration: { not: null } } }),
    ]);

    // 计算衍生指标
    const repeatPracticeCount = Array.isArray(practiceWithRepeats)
      ? Number(practiceWithRepeats[0]?.count || 0)
      : 0;

    const voiceUsageRate = totalPractices > 0
      ? Math.round((practicesWithDuration / totalPractices) * 100)
      : 0;

    const interviewCompletionRate = totalInterviews > 0
      ? Math.round((completedInterviews / totalInterviews) * 100)
      : 0;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      users: {
        total: totalUsers,
        today: todayNewUsers,
        week: weekNewUsers,
        month: monthNewUsers,
        activeToday: activeUsersToday,
      },
      practices: {
        total: totalPractices,
        today: todayPractices,
        week: weekPractices,
        month: monthPractices,
        avgScore: avgScore._avg.score ? Math.round(avgScore._avg.score) : null,
        repeatCount: repeatPracticeCount,
        voiceUsageRate,
      },
      interviews: {
        total: totalInterviews,
        completed: completedInterviews,
        abandoned: abandonedInterviews,
        completionRate: interviewCompletionRate,
      },
      bugs: {
        total: totalBugs,
        open: openBugs,
        resolved: resolvedBugs,
      },
      popularQuestions,
    });
  } catch (error) {
    console.error("[Admin Stats Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
