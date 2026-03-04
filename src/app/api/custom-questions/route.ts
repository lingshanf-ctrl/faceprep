import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// 获取用户的自定义题目
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const type = searchParams.get("type");

    const where: any = { userId: session.user.id };
    if (category) where.category = category;
    if (type) where.type = type;

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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, category, type, difficulty, keyPoints, referenceAnswer } = body;

    if (!title || !category || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const question = await db.customQuestion.create({
      data: {
        userId: session.user.id,
        title,
        category,
        type,
        difficulty: difficulty || 1,
        keyPoints,
        referenceAnswer,
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

// 批量创建自定义题目
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questions } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Invalid questions array" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const created = await db.$transaction(
      questions.map((q) =>
        db.customQuestion.create({
          data: {
            userId,
            title: q.title,
            category: q.category,
            type: q.type,
            difficulty: q.difficulty || 1,
            keyPoints: q.keyPoints,
            referenceAnswer: q.referenceAnswer,
          },
        })
      )
    );

    return NextResponse.json({ questions: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to batch create custom questions:", error);
    return NextResponse.json(
      { error: "Failed to create custom questions" },
      { status: 500 }
    );
  }
}
