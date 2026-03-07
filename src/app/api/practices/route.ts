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

// 获取用户的练习记录
export async function GET(request: NextRequest) {
  try {
    const { userId, isAnonymous } = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const questionId = searchParams.get("questionId");

    const practices = await db.practice.findMany({
      where: {
        userId,
        ...(questionId && { questionId }),
      },
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
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // 映射为前端期望格式，解析 feedback JSON 并优先使用题目快照
    const mappedPractices = practices.map((p) => {
      // 解析 feedback JSON
      let parsedFeedback = null;
      if (p.feedback) {
        try {
          parsedFeedback = JSON.parse(p.feedback);
        } catch {
          // 如果解析失败，保持原样
          parsedFeedback = p.feedback;
        }
      }

      // 优先使用题目快照，如果不存在则使用关联的 question 数据
      const questionTitle = p.questionTitle || p.question?.title || "未知题目";
      const questionCategory = p.questionCategory || p.question?.category;
      const questionType = p.questionType || p.question?.type;
      const questionDifficulty = p.questionDifficulty ?? p.question?.difficulty;

      return {
        id: p.id,
        questionId: p.questionId,
        questionTitle,
        questionCategory,
        questionType,
        questionDifficulty,
        answer: p.answer,
        score: p.score ?? 0,
        feedback: parsedFeedback,
        duration: p.duration,
        createdAt: p.createdAt.toISOString(),
        // 保留原始 question 数据（如果有）
        question: p.question,
      };
    });

    const total = await db.practice.count({
      where: { userId },
    });

    // 匿名用户添加警告头
    const headers = new Headers();
    if (isAnonymous) {
      headers.set("X-Anonymous-User", "true");
    }

    return NextResponse.json({ practices: mappedPractices, total, isAnonymous }, { headers });
  } catch (error) {
    console.error("Failed to fetch practices:", error);
    return NextResponse.json(
      { error: "Failed to fetch practices" },
      { status: 500 }
    );
  }
}

// 创建练习记录
export async function POST(request: NextRequest) {
  try {
    const { userId, isAnonymous } = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { questionId, questionTitle, answer, score, feedback, duration } = body;

    if (!questionId || !answer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 检查是否已存在相同题目的记录（匿名用户限制）
    if (isAnonymous) {
      const existingCount = await db.practice.count({
        where: { userId, questionId },
      });
      if (existingCount >= 3) {
        return NextResponse.json(
          {
            error: "匿名用户每题最多保存3条记录，请登录以保存更多",
            requireLogin: true,
          },
          { status: 403 }
        );
      }

      // 匿名用户总记录数限制
      const totalCount = await db.practice.count({ where: { userId } });
      if (totalCount >= 20) {
        return NextResponse.json(
          {
            error: "匿名用户最多保存20条记录，请登录以继续",
            requireLogin: true,
          },
          { status: 403 }
        );
      }
    }

    // 检查 questionId 是否存在于 Question 表中
    const existingQuestion = await db.question.findUnique({
      where: { id: questionId },
    });

    // 如果不存在，使用系统预设题目的第一个作为占位（或创建一个虚拟关联）
    let finalQuestionId = questionId;
    if (!existingQuestion) {
      // 对于自定义题目，使用一个特殊的系统题目作为占位
      const systemQuestion = await db.question.findFirst({
        where: { category: "GENERAL" },
      });
      if (systemQuestion) {
        finalQuestionId = systemQuestion.id;
      }
    }

    // 创建练习记录，同时存储题目快照
    // 优先使用传入的 questionTitle，如果不存在则从数据库题目获取
    const finalQuestionTitle = questionTitle || existingQuestion?.title || "未知题目";
    const practice = await db.practice.create({
      data: {
        userId,
        questionId: finalQuestionId,
        answer,
        score,
        feedback,
        duration,
        // 存储题目快照
        questionTitle: finalQuestionTitle,
        questionCategory: existingQuestion?.category,
        questionType: existingQuestion?.type,
        questionDifficulty: existingQuestion?.difficulty,
      },
    });

    // 匿名用户添加警告头
    const headers = new Headers();
    if (isAnonymous) {
      headers.set("X-Anonymous-User", "true");
      headers.set("X-Anonymous-Warning", "数据仅保存在当前设备，登录后可永久保存");
    }

    return NextResponse.json({ practice, isAnonymous }, { headers, status: 201 });
  } catch (error) {
    console.error("Failed to create practice:", error);
    return NextResponse.json(
      { error: "Failed to create practice" },
      { status: 500 }
    );
  }
}
