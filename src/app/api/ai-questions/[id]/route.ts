import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * GET /api/ai-questions/:id
 * 获取单个 AI 生成题目（仅自己的）
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const question = await db.aIGeneratedQuestion.findFirst({
      where: {
        id,
        userId: user.id, // 只能访问自己的题目
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error("[AI Question GET Error]", error);
    return NextResponse.json(
      { error: "Failed to fetch AI generated question" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai-questions/:id
 * 更新 AI 生成题目
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // 检查题目是否存在且属于当前用户
    const existing = await db.aIGeneratedQuestion.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const updated = await db.aIGeneratedQuestion.update({
      where: { id },
      data: {
        title: body.title,
        type: body.type,
        difficulty: body.difficulty,
        keyPoints: body.keyPoints,
      },
    });

    return NextResponse.json({ question: updated });
  } catch (error) {
    console.error("[AI Question PATCH Error]", error);
    return NextResponse.json(
      { error: "Failed to update AI generated question" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai-questions/:id
 * 删除单个 AI 生成题目
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 检查题目是否存在且属于当前用户
    const existing = await db.aIGeneratedQuestion.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    await db.aIGeneratedQuestion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AI Question DELETE Error]", error);
    return NextResponse.json(
      { error: "Failed to delete AI generated question" },
      { status: 500 }
    );
  }
}
