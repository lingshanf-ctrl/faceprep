import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

// 获取匿名ID
function getAnonymousId(request: NextRequest): string | null {
  return request.headers.get("X-Anonymous-Id");
}

// 获取用户ID
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

// 提交答案 - 使用查询参数避免路由冲突
// POST /api/interview/answers?sessionId=xxx
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const { userId } = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    // 验证会话所有权
    const session = await db.interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: { answers: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Interview session not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      questionId,
      questionTitle,
      questionType,
      questionDifficulty,
      questionKeyPoints,
      answer,
      score,
      feedback,
      duration,
      startedAt,
      completedAt,
    } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 }
      );
    }

    // 计算答题顺序
    const orderIndex = session.answers.length;

    // 判断是否为跳过的答案
    const isSkipped = answer === "（跳过）" || !answer?.trim();

    const newAnswer = await db.interviewAnswer.create({
      data: {
        sessionId,
        questionId,
        questionTitle: questionTitle || "未知题目",
        questionType: questionType || null,
        questionDifficulty: questionDifficulty || null,
        questionKeyPoints: questionKeyPoints || null,
        answer: answer || "",
        score: score || 0,
        feedback: feedback ? JSON.stringify(feedback) : null,
        orderIndex,
        duration: duration || 0,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        completedAt: completedAt ? new Date(completedAt) : new Date(),
        // 评估状态：跳过的答案直接标记为完成，其他标记为待评估
        evaluationStatus: isSkipped ? "COMPLETED" : "PENDING",
      },
    });

    // 更新会话状态为进行中
    if (session.status === "PENDING") {
      await db.interviewSession.update({
        where: { id: sessionId },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json({
      answer: {
        id: newAnswer.id,
        questionId: newAnswer.questionId,
        answer: newAnswer.answer || "",
        score: newAnswer.score || 0,
        feedback: feedback || { good: [], improve: [], suggestion: "" },
        duration: newAnswer.duration || 0,
        startedAt: newAnswer.startedAt?.toISOString() || "",
        completedAt: newAnswer.completedAt?.toISOString() || "",
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit answer:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
