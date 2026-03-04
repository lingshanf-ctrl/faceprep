import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// 获取匿名ID
function getAnonymousId(request: NextRequest): string | null {
  return request.headers.get("X-Anonymous-Id");
}

// 获取用户ID（登录用户优先，否则使用匿名ID）
async function getUserId(request: NextRequest): Promise<{ userId: string; isAnonymous: boolean }> {
  const session = await auth();
  if (session?.user?.id) {
    return { userId: session.user.id, isAnonymous: false };
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const practices = await db.practice.findMany({
      where: { userId },
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

    const total = await db.practice.count({
      where: { userId },
    });

    // 匿名用户添加警告头
    const headers = new Headers();
    if (isAnonymous) {
      headers.set("X-Anonymous-User", "true");
    }

    return NextResponse.json({ practices, total, isAnonymous }, { headers });
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, answer, score, feedback, duration } = body;

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

    const practice = await db.practice.create({
      data: {
        userId,
        questionId,
        answer,
        score,
        feedback,
        duration,
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
