import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { QuestionType } from "@prisma/client";

/**
 * GET /api/ai-questions
 * 获取当前用户的所有 AI 生成题目
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questions = await db.aIGeneratedQuestion.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[AI Questions GET Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch AI generated questions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-questions
 * 保存 AI 生成的题目（批量）
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      questions,
      jdText,
      resumeText,
      generationMode = "ai",
    }: {
      questions: Array<{
        title: string;
        type: string;
        difficulty: string;
        keyPoints: string;
      }>;
      jdText?: string;
      resumeText?: string;
      generationMode?: string;
    } = body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Questions array is required" },
        { status: 400 }
      );
    }

    const MAX_QUESTIONS = 20;
    if (questions.length > MAX_QUESTIONS) {
      return NextResponse.json(
        { error: `一次最多保存 ${MAX_QUESTIONS} 道题目` },
        { status: 400 }
      );
    }

    // 字段长度校验
    for (const q of questions) {
      if (!q.title || typeof q.title !== "string" || q.title.trim().length === 0) {
        return NextResponse.json({ error: "题目标题不能为空" }, { status: 400 });
      }
      if (q.title.length > 500) {
        return NextResponse.json({ error: "题目标题不能超过 500 字符" }, { status: 400 });
      }
      if (q.keyPoints && typeof q.keyPoints === "string" && q.keyPoints.length > 2000) {
        return NextResponse.json({ error: "考察点内容不能超过 2000 字符" }, { status: 400 });
      }
    }

    // 批量创建题目
    const createdQuestions = await db.$transaction(
      questions.map((q) =>
        db.aIGeneratedQuestion.create({
          data: {
            userId: user.id,
            title: q.title.trim(),
            type: q.type as QuestionType,
            difficulty: q.difficulty,
            keyPoints: Array.isArray(q.keyPoints) ? (q.keyPoints as string[]).join("、") : q.keyPoints,
            jdText,
            resumeText,
            generationMode,
          },
        })
      )
    );

    return NextResponse.json({
      questions: createdQuestions,
      count: createdQuestions.length,
    });
  } catch (error) {
    console.error("[AI Questions POST Error]", error);
    return NextResponse.json(
      { error: "Failed to save AI generated questions" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai-questions
 * 删除用户的 AI 生成题目（批量或单个）
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const deleteAll = searchParams.get("all") === "true";

    if (deleteAll) {
      // 删除所有
      const result = await db.aIGeneratedQuestion.deleteMany({
        where: { userId: user.id },
      });
      return NextResponse.json({ deleted: result.count });
    }

    if (id) {
      // 删除单个
      const question = await db.aIGeneratedQuestion.findFirst({
        where: { id, userId: user.id },
      });

      if (!question) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      await db.aIGeneratedQuestion.delete({
        where: { id },
      });

      return NextResponse.json({ deleted: 1 });
    }

    return NextResponse.json(
      { error: "Either id or all=true is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[AI Questions DELETE Error]", error);
    return NextResponse.json(
      { error: "Failed to delete AI generated questions" },
      { status: 500 }
    );
  }
}
