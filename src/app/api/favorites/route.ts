import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// 获取用户的收藏题目
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeLowScore = searchParams.get("includeLowScore") === "true";
    const scoreThreshold = parseInt(searchParams.get("scoreThreshold") || "60");

    // 基础查询
    const where: any = { userId: session.user.id };

    const favorites = await db.favorite.findMany({
      where,
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
    });

    // 如果需要包含低分题目
    let lowScoreQuestions: any[] = [];
    if (includeLowScore) {
      const practices = await db.practice.findMany({
        where: {
          userId: session.user.id,
          score: { lt: scoreThreshold },
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
      });

      // 过滤掉已收藏的
      const favoriteIds = new Set(favorites.map((f) => f.questionId));
      lowScoreQuestions = practices
        .filter((p) => !favoriteIds.has(p.questionId))
        .map((p) => ({
          ...p,
          isLowScore: true,
          score: p.score,
        }));
    }

    return NextResponse.json({
      favorites,
      lowScoreQuestions: includeLowScore ? lowScoreQuestions : undefined,
      total: favorites.length + lowScoreQuestions.length,
    });
  } catch (error) {
    console.error("Failed to fetch favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

// 添加收藏
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "Missing questionId" },
        { status: 400 }
      );
    }

    // 检查是否已收藏
    const existing = await db.favorite.findUnique({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ favorite: existing });
    }

    const favorite = await db.favorite.create({
      data: {
        userId: session.user.id,
        questionId,
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
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error("Failed to create favorite:", error);
    return NextResponse.json(
      { error: "Failed to create favorite" },
      { status: 500 }
    );
  }
}

// 取消收藏
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json(
        { error: "Missing questionId" },
        { status: 400 }
      );
    }

    await db.favorite.delete({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete favorite:", error);
    return NextResponse.json(
      { error: "Failed to delete favorite" },
      { status: 500 }
    );
  }
}
