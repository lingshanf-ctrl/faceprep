import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { EvaluationStatus } from "@prisma/client";
import { triggerPracticeEvaluation } from "@/lib/practice-evaluation";

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

/**
 * GET /api/practices/evaluation-status?practiceId=xxx
 * 获取练习记录的AI评估状态
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", requireLogin: true },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const practiceId = searchParams.get("practiceId");

    if (!practiceId) {
      return NextResponse.json(
        { error: "Practice ID is required" },
        { status: 400 }
      );
    }

    // 获取练习记录
    const practice = await db.practice.findUnique({
      where: { id: practiceId },
      select: {
        id: true,
        userId: true,
        score: true,
        feedback: true,
        evaluationStatus: true,
        evaluationError: true,
        evaluationRetries: true,
        evaluationStartedAt: true,
        evaluationCompletedAt: true,
        createdAt: true,
      },
    });

    if (!practice) {
      return NextResponse.json(
        { error: "Practice not found" },
        { status: 404 }
      );
    }

    if (practice.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 检测卡住的评估，自动恢复
    const PENDING_STUCK_MS = 2 * 60 * 1000;    // PENDING 超过 2 分钟
    const PROCESSING_STUCK_MS = 5 * 60 * 1000; // PROCESSING 超过 5 分钟

    const isPendingStuck =
      practice.evaluationStatus === EvaluationStatus.PENDING &&
      Date.now() - new Date(practice.createdAt).getTime() > PENDING_STUCK_MS;

    const isProcessingStuck =
      practice.evaluationStatus === EvaluationStatus.PROCESSING &&
      practice.evaluationStartedAt !== null &&
      Date.now() - new Date(practice.evaluationStartedAt).getTime() > PROCESSING_STUCK_MS;

    if (isPendingStuck || isProcessingStuck) {
      console.log(`[EvalStatus] Practice ${practice.id} is stuck (${practice.evaluationStatus}), auto-triggering recovery`);
      triggerPracticeEvaluation(practice.id).catch(console.error);
      return NextResponse.json({
        id: practice.id,
        status: "PROCESSING",
        progress: 5,
        score: null,
        feedback: null,
        error: null,
        retries: practice.evaluationRetries,
        startedAt: new Date().toISOString(),
        completedAt: null,
        createdAt: practice.createdAt,
      });
    }

    // 解析feedback
    let parsedFeedback = null;
    if (practice.feedback) {
      try {
        parsedFeedback = JSON.parse(practice.feedback);
      } catch (e) {
        // 兼容旧格式
        parsedFeedback = {
          suggestion: practice.feedback,
          good: [],
          improve: [],
        };
      }
    }

    // 计算进度（模拟进度，实际可根据时间估算）
    let progress = 100;
    if (practice.evaluationStatus === EvaluationStatus.PENDING) {
      progress = 0;
    } else if (practice.evaluationStatus === EvaluationStatus.PROCESSING) {
      // 根据开始时间估算进度（假设平均15秒完成）
      if (practice.evaluationStartedAt) {
        const elapsed = Date.now() - new Date(practice.evaluationStartedAt).getTime();
        progress = Math.min(90, Math.round((elapsed / 15000) * 100));
      } else {
        progress = 10;
      }
    }

    return NextResponse.json({
      id: practice.id,
      status: practice.evaluationStatus,
      progress,
      score: practice.score,
      feedback: parsedFeedback,
      error: practice.evaluationError,
      retries: practice.evaluationRetries,
      startedAt: practice.evaluationStartedAt,
      completedAt: practice.evaluationCompletedAt,
      createdAt: practice.createdAt,
    });
  } catch (error) {
    console.error("Failed to get evaluation status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/practices/evaluation-status
 * 重试失败的评估
 */
export async function POST(request: NextRequest) {
  try {
    const { practiceId, retry } = await request.json();

    if (!practiceId) {
      return NextResponse.json(
        { error: "Practice ID is required" },
        { status: 400 }
      );
    }

    // 验证用户权限
    const { userId } = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", requireLogin: true },
        { status: 401 }
      );
    }

    const practice = await db.practice.findUnique({
      where: { id: practiceId },
      select: {
        id: true,
        userId: true,
        evaluationStatus: true,
        evaluationStartedAt: true,
      },
    });

    if (!practice) {
      return NextResponse.json(
        { error: "Practice not found" },
        { status: 404 }
      );
    }

    if (practice.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // 只能重试失败的评估，或者卡住超过5分钟的PROCESSING记录
    const STUCK_THRESHOLD_MS = 5 * 60 * 1000; // 5分钟
    const isStuckProcessing =
      practice.evaluationStatus === EvaluationStatus.PROCESSING &&
      practice.evaluationStartedAt &&
      Date.now() - new Date(practice.evaluationStartedAt).getTime() > STUCK_THRESHOLD_MS;

    if (practice.evaluationStatus !== EvaluationStatus.FAILED && !isStuckProcessing) {
      return NextResponse.json(
        { error: "Only failed or stuck evaluations can be retried" },
        { status: 400 }
      );
    }

    // 重置评估状态
    await db.practice.update({
      where: { id: practiceId },
      data: {
        evaluationStatus: EvaluationStatus.PENDING,
        evaluationRetries: 0,
        evaluationError: null,
        evaluationStartedAt: null,
        evaluationCompletedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "评估已重新加入队列",
    });
  } catch (error) {
    console.error("重试评估失败:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
