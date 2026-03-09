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

// 格式化面试会话
function formatSession(session: any) {
  return {
    id: session.id,
    title: session.title,
    jdText: session.jdText || "",
    resumeText: session.resumeText || "",
    jobInfo: {
      company: session.jobCompany || undefined,
      position: session.jobPosition || undefined,
      level: session.jobLevel || undefined,
    },
    questions: parseJsonField(session.questions, []),
    status: session.status === "IN_PROGRESS" ? "in_progress" : session.status.toLowerCase(),
    createdAt: session.createdAt.toISOString(),
    completedAt: session.completedAt?.toISOString() || undefined,
    answers: session.answers?.map((a: any) => ({
      questionId: a.questionId,
      answer: a.answer || "",
      score: a.score || 0,
      feedback: parseJsonField(a.feedback, { good: [], improve: [], suggestion: "" }),
      duration: a.duration || 0,
      startedAt: a.startedAt?.toISOString() || "",
      completedAt: a.completedAt?.toISOString() || "",
    })) || [],
    overallScore: session.overallScore || 0,
    dimensionScores: parseJsonField(session.dimensionScores, {
      technical: 0,
      behavioral: 0,
      project: 0,
      communication: 0,
    }),
    overallFeedback: session.overallFeedback || "",
    strengths: parseJsonField(session.strengths, []),
    improvements: parseJsonField(session.improvements, []),
    nextSteps: parseJsonField(session.nextSteps, []),
    aiEvaluation: parseJsonField(session.aiEvaluation, null),
  };
}

// 获取单个面试会话
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    const session = await db.interviewSession.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        answers: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Interview session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ session: formatSession(session) });
  } catch (error) {
    console.error("Failed to fetch interview session:", error);
    return NextResponse.json(
      { error: "Failed to fetch interview session" },
      { status: 500 }
    );
  }
}

// 更新面试会话
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    // 验证会话所有权
    const existing = await db.interviewSession.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Interview session not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      status,
      overallScore,
      dimensionScores,
      overallFeedback,
      strengths,
      improvements,
      nextSteps,
      aiEvaluation,
      completedAt,
    } = body;

    // 构建更新数据
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (status !== undefined) {
      updateData.status = status === "in_progress" ? "IN_PROGRESS" : status.toUpperCase();
    }
    if (overallScore !== undefined) updateData.overallScore = overallScore;
    if (dimensionScores !== undefined) {
      updateData.dimensionScores = JSON.stringify(dimensionScores);
    }
    if (overallFeedback !== undefined) updateData.overallFeedback = overallFeedback;
    if (strengths !== undefined) updateData.strengths = JSON.stringify(strengths);
    if (improvements !== undefined) updateData.improvements = JSON.stringify(improvements);
    if (nextSteps !== undefined) updateData.nextSteps = JSON.stringify(nextSteps);
    if (aiEvaluation !== undefined) updateData.aiEvaluation = JSON.stringify(aiEvaluation);
    if (completedAt !== undefined) updateData.completedAt = new Date(completedAt);

    const session = await db.interviewSession.update({
      where: { id },
      data: updateData,
      include: {
        answers: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return NextResponse.json({ session: formatSession(session) });
  } catch (error) {
    console.error("Failed to update interview session:", error);
    return NextResponse.json(
      { error: "Failed to update interview session" },
      { status: 500 }
    );
  }
}

// 删除面试会话
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    // 验证会话所有权
    const existing = await db.interviewSession.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Interview session not found" },
        { status: 404 }
      );
    }

    await db.interviewSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete interview session:", error);
    return NextResponse.json(
      { error: "Failed to delete interview session" },
      { status: 500 }
    );
  }
}
