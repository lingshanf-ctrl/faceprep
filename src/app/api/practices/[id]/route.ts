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

// 获取单个练习记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, isAnonymous } = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    const { id } = await params;

    const practice = await db.practice.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        questionId: true,
        answer: true,
        score: true,
        feedback: true,
        duration: true,
        createdAt: true,
        // 题目快照
        questionTitle: true,
        questionCategory: true,
        questionType: true,
        questionDifficulty: true,
        // AI 评估状态
        evaluationStatus: true,
        evaluationError: true,
        evaluationRetries: true,
        evaluationStartedAt: true,
        evaluationCompletedAt: true,
        // 关联题目
        question: {
          select: {
            id: true,
            title: true,
            category: true,
            type: true,
            difficulty: true,
          },
        },
      },
    });

    if (!practice) {
      console.log(`[Debug] Practice not found: ${id}`);
      return NextResponse.json(
        { error: "练习记录不存在" },
        { status: 404 }
      );
    }

    // 检查权限（只能查看自己的记录）
    if (practice.userId !== userId) {
      console.log(`[Debug] Permission denied: practice.userId=${practice.userId}, request.userId=${userId}`);
      return NextResponse.json(
        { error: "无权访问此记录" },
        { status: 403 }
      );
    }

    // 解析 feedback JSON
    let parsedFeedback = null;
    if (practice.feedback) {
      try {
        parsedFeedback = JSON.parse(practice.feedback);
      } catch {
        parsedFeedback = practice.feedback;
      }
    }

    // 优先使用题目快照，如果不存在则使用关联的 question 数据
    const questionTitle = practice.questionTitle || practice.question?.title || "未知题目";
    const questionCategory = practice.questionCategory || practice.question?.category;
    const questionType = practice.questionType || practice.question?.type;
    const questionDifficulty = practice.questionDifficulty ?? practice.question?.difficulty;

    const mappedPractice = {
      id: practice.id,
      questionId: practice.questionId,
      questionTitle,
      questionCategory,
      questionType,
      questionDifficulty,
      answer: practice.answer,
      score: practice.score ?? 0,
      feedback: parsedFeedback,
      duration: practice.duration,
      createdAt: practice.createdAt.toISOString(),
      question: practice.question,
      // AI 评估状态
      evaluationStatus: practice.evaluationStatus,
      evaluationError: practice.evaluationError,
      evaluationRetries: practice.evaluationRetries,
      evaluationStartedAt: practice.evaluationStartedAt?.toISOString(),
      evaluationCompletedAt: practice.evaluationCompletedAt?.toISOString(),
    };

    // 匿名用户添加警告头
    const headers = new Headers();
    if (isAnonymous) {
      headers.set("X-Anonymous-User", "true");
    }

    return NextResponse.json({ practice: mappedPractice }, { headers });
  } catch (error) {
    console.error("Failed to fetch practice:", error);
    return NextResponse.json(
      { error: "Failed to fetch practice" },
      { status: 500 }
    );
  }
}

// 删除单个练习记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 先检查记录是否存在且属于当前用户
    const practice = await db.practice.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!practice) {
      return NextResponse.json(
        { error: "练习记录不存在" },
        { status: 404 }
      );
    }

    if (practice.userId !== userId) {
      return NextResponse.json(
        { error: "无权删除此记录" },
        { status: 403 }
      );
    }

    await db.practice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete practice:", error);
    return NextResponse.json(
      { error: "Failed to delete practice" },
      { status: 500 }
    );
  }
}
