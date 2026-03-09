import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 分页参数
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    // 筛选参数
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");

    // 构建 where 条件
    const where: any = {};
    if (category) where.category = category;
    if (type) where.type = type;
    if (difficulty) where.difficulty = parseInt(difficulty);
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { keyPoints: { contains: search, mode: "insensitive" } },
      ];
    }

    // 获取总数
    const total = await db.question.count({ where });

    // 获取分页数据
    const questions = await db.question.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        type: true,
        difficulty: true,
        frequency: true,
        keyPoints: true,
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
