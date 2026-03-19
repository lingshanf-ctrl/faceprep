import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { processPendingEvaluations, resetStaleEvaluations } from "@/lib/evaluation-service";

// 评估状态摘要类型
interface EvaluationStatusSummary {
  total: number;
  completed: number;
  pending: number;
  processing: number;
  failed: number;
  answers: {
    questionId: string;
    questionTitle: string;
    status: string;
    error: string | null;
    retries: number;
  }[];
}

// GET /api/interview/evaluation-status?sessionId=xxx
// 获取面试会话的评估进度
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId 参数必填" },
      { status: 400 }
    );
  }

  try {
    // 验证会话所有权
    const session = await getSession();
    const userId = session?.id;
    const anonymousId = request.headers.get("x-anonymous-id");

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

    // 获取所有答案的评估状态
    const answers = await db.interviewAnswer.findMany({
      where: { sessionId },
      select: {
        questionId: true,
        questionTitle: true,
        evaluationStatus: true,
        evaluationError: true,
        evaluationRetries: true,
        evaluationStartedAt: true,
      },
      orderBy: { orderIndex: "asc" },
    });

    const summary: EvaluationStatusSummary = {
      total: answers.length,
      completed: answers.filter((a) => a.evaluationStatus === "COMPLETED").length,
      pending: answers.filter((a) => a.evaluationStatus === "PENDING").length,
      processing: answers.filter((a) => a.evaluationStatus === "PROCESSING").length,
      failed: answers.filter((a) => a.evaluationStatus === "FAILED").length,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        questionTitle: a.questionTitle,
        status: a.evaluationStatus,
        error: a.evaluationError,
        retries: a.evaluationRetries,
      })),
    };

    // 自动恢复卡住的评估
    const PROCESSING_STUCK_MS = 5 * 60 * 1000;

    const hasStuckProcessing = answers.some(
      (a) =>
        a.evaluationStatus === "PROCESSING" &&
        a.evaluationStartedAt !== null &&
        Date.now() - new Date(a.evaluationStartedAt).getTime() > PROCESSING_STUCK_MS
    );

    if (hasStuckProcessing) {
      console.log(`[EvalStatus] Session ${sessionId} has stuck PROCESSING answers, resetting and retrying`);
      resetStaleEvaluations(PROCESSING_STUCK_MS)
        .then(() => processPendingEvaluations(sessionId))
        .catch(console.error);
    } else if (summary.pending > 0 && summary.processing === 0) {
      // 有待处理但没有正在处理的 → 触发评估
      console.log(`[EvalStatus] Session ${sessionId} has ${summary.pending} pending answers with no active processing, triggering`);
      processPendingEvaluations(sessionId).catch(console.error);
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("获取评估状态失败:", error);
    return NextResponse.json(
      { error: "获取评估状态失败" },
      { status: 500 }
    );
  }
}

// POST /api/interview/evaluation-status
// 手动重试失败的评估
export async function POST(request: NextRequest) {
  try {
    const { sessionId, questionId, retryAll } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId 参数必填" },
        { status: 400 }
      );
    }

    // 验证会话所有权
    const session = await getSession();
    const userId = session?.id;
    const anonymousId = request.headers.get("x-anonymous-id");

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

    // 重试所有失败的评估
    if (retryAll) {
      const result = await db.interviewAnswer.updateMany({
        where: {
          sessionId,
          evaluationStatus: "FAILED",
        },
        data: {
          evaluationStatus: "PENDING",
          evaluationRetries: 0,
          evaluationError: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: `已重置 ${result.count} 个失败的评估`,
        count: result.count,
      });
    }

    // 重试单个题目的评估
    if (!questionId) {
      return NextResponse.json(
        { error: "questionId 参数必填（或使用 retryAll: true）" },
        { status: 400 }
      );
    }

    const answer = await db.interviewAnswer.findFirst({
      where: {
        sessionId,
        questionId,
        evaluationStatus: "FAILED",
      },
    });

    if (!answer) {
      return NextResponse.json(
        { error: "未找到该题目的失败评估记录" },
        { status: 404 }
      );
    }

    // 重置评估状态
    await db.interviewAnswer.update({
      where: { id: answer.id },
      data: {
        evaluationStatus: "PENDING",
        evaluationRetries: 0,
        evaluationError: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "评估已重新加入队列",
      questionId,
    });
  } catch (error) {
    console.error("重试评估失败:", error);
    return NextResponse.json(
      { error: "重试评估失败" },
      { status: 500 }
    );
  }
}
