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

// 解析 JSON 字段
function parseJsonField<T>(value: string | null, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

// 提交答案
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
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
        questionId: newAnswer.questionId,
        answer: newAnswer.answer || "",
        score: newAnswer.score || 0,
        feedback: parseJsonField(newAnswer.feedback, { good: [], improve: [], suggestion: "" }),
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

// 更新答案（用于更新 AI 反馈）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
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
    });

    if (!session) {
      return NextResponse.json(
        { error: "Interview session not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { questionId, score, feedback, duration, evaluationStatus } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "questionId is required" },
        { status: 400 }
      );
    }

    // 查找并更新答案
    const existingAnswer = await db.interviewAnswer.findFirst({
      where: { sessionId, questionId },
    });

    if (!existingAnswer) {
      return NextResponse.json(
        { error: "Answer not found" },
        { status: 404 }
      );
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {};
    if (score !== undefined) updateData.score = score;
    if (feedback) updateData.feedback = JSON.stringify(feedback);
    if (duration !== undefined) updateData.duration = duration;
    if (evaluationStatus) {
      updateData.evaluationStatus = evaluationStatus;
      if (evaluationStatus === "COMPLETED") {
        updateData.evaluationCompletedAt = new Date();
      }
    }

    const updatedAnswer = await db.interviewAnswer.update({
      where: { id: existingAnswer.id },
      data: updateData,
    });

    return NextResponse.json({
      answer: {
        questionId: updatedAnswer.questionId,
        answer: updatedAnswer.answer || "",
        score: updatedAnswer.score || 0,
        feedback: parseJsonField(updatedAnswer.feedback, { good: [], improve: [], suggestion: "" }),
        duration: updatedAnswer.duration || 0,
        startedAt: updatedAnswer.startedAt?.toISOString() || "",
        completedAt: updatedAnswer.completedAt?.toISOString() || "",
      },
    });
  } catch (error) {
    console.error("Failed to update answer:", error);
    return NextResponse.json(
      { error: "Failed to update answer" },
      { status: 500 }
    );
  }
}
