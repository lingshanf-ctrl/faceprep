import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

// 获取单个练习记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    const { id } = await params;

    const practice = await db.practice.findUnique({
      where: { id },
      include: {
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
      return NextResponse.json(
        { error: "练习记录不存在" },
        { status: 404 }
      );
    }

    // 检查权限（只能查看自己的记录）
    if (practice.userId !== session.id) {
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
    };

    return NextResponse.json({ practice: mappedPractice });
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
    const session = await getSession();
    if (!session?.id) {
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

    if (practice.userId !== session.id) {
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
