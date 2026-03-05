import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

// 获取用户的自定义题目
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: any = { userId: session.id };
    if (category) {
      where.category = category;
    }

    const questions = await db.customQuestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Failed to fetch custom questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom questions" },
      { status: 500 }
    );
  }
}

// 创建自定义题目
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, category, difficulty } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const question = await db.customQuestion.create({
      data: {
        userId: session.id,
        title,
        content,
        category: category || "OTHER",
        difficulty: difficulty || "MEDIUM",
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("Failed to create custom question:", error);
    return NextResponse.json(
      { error: "Failed to create custom question" },
      { status: 500 }
    );
  }
}

// 删除自定义题目
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing question id" },
        { status: 400 }
      );
    }

    // 验证题目属于当前用户
    const question = await db.customQuestion.findFirst({
      where: { id, userId: session.id },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    await db.customQuestion.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete custom question:", error);
    return NextResponse.json(
      { error: "Failed to delete custom question" },
      { status: 500 }
    );
  }
}
