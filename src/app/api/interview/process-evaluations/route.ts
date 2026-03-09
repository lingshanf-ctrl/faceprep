import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  evaluateAnswer,
  EvaluationTask,
  resetStaleEvaluations,
} from "@/lib/evaluation-service";

// 配置 Edge Runtime 以支持更长的执行时间
export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/interview/process-evaluations
// 处理待评估的答案
export async function POST(request: NextRequest) {
  try {
    const { sessionId, answerId, resetStale } = await request.json();

    // 验证会话所有权
    const session = await getSession();
    const userId = session?.id;
    const anonymousId = request.headers.get("x-anonymous-id");

    // 重置超时的评估（可选操作）
    if (resetStale) {
      const resetCount = await resetStaleEvaluations();
      return NextResponse.json({
        success: true,
        message: `已重置 ${resetCount} 个超时的评估`,
        resetCount,
      });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId 参数必填" },
        { status: 400 }
      );
    }

    // 验证面试会话
    const interviewSession = await db.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId: userId || anonymousId || "",
      },
    });

    if (!interviewSession) {
      return NextResponse.json(
        { error: "面试会话不存在或无权访问" },
        { status: 404 }
      );
    }

    // 如果指定了 answerId，只处理单个答案
    if (answerId) {
      const answer = await db.interviewAnswer.findFirst({
        where: {
          id: answerId,
          sessionId,
          evaluationStatus: { in: ["PENDING", "FAILED"] },
        },
      });

      if (!answer) {
        return NextResponse.json(
          { error: "未找到待评估的答案" },
          { status: 404 }
        );
      }

      // 构建评估任务
      const task: EvaluationTask = {
        answerId: answer.id,
        sessionId: answer.sessionId,
        questionId: answer.questionId,
        questionTitle: answer.questionTitle,
        questionKeyPoints: answer.questionKeyPoints || "",
        answer: answer.answer || "",
        metadata: {
          type: answer.questionType || "GENERAL",
          difficulty: parseDifficulty(answer.questionDifficulty),
        },
      };

      const result = await evaluateAnswer(task);

      return NextResponse.json({
        success: result.success,
        answerId,
        score: result.score,
        error: result.error,
        errorCode: result.errorCode,
        retryable: result.retryable,
      });
    }

    // 处理所有待评估的答案
    const pendingAnswers = await db.interviewAnswer.findMany({
      where: {
        sessionId,
        evaluationStatus: "PENDING",
        answer: { not: "（跳过）" },
      },
      orderBy: { orderIndex: "asc" },
      take: 5, // 限制单次处理数量，避免超时
    });

    if (pendingAnswers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "没有待评估的答案",
        processed: 0,
      });
    }

    const results: Array<{
      answerId: string;
      questionId: string;
      success: boolean;
      score?: number;
      error?: string;
    }> = [];

    for (const answer of pendingAnswers) {
      const task: EvaluationTask = {
        answerId: answer.id,
        sessionId: answer.sessionId,
        questionId: answer.questionId,
        questionTitle: answer.questionTitle,
        questionKeyPoints: answer.questionKeyPoints || "",
        answer: answer.answer || "",
        metadata: {
          type: answer.questionType || "GENERAL",
          difficulty: parseDifficulty(answer.questionDifficulty),
        },
      };

      const result = await evaluateAnswer(task);

      results.push({
        answerId: answer.id,
        questionId: answer.questionId,
        success: result.success,
        score: result.score,
        error: result.error,
      });

      // 500ms 间隔避免限流
      if (pendingAnswers.indexOf(answer) < pendingAnswers.length - 1) {
        await delay(500);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error("处理评估失败:", error);
    return NextResponse.json(
      { error: "处理评估失败", detail: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    );
  }
}

function parseDifficulty(difficulty: string | null): number {
  if (!difficulty) return 2;
  if (difficulty === "easy" || difficulty === "1") return 1;
  if (difficulty === "hard" || difficulty === "3") return 3;
  return 2;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
