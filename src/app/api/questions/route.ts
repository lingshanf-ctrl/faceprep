import { NextRequest, NextResponse } from "next/server";
import { questions } from "@/data/questions";

// 缓存控制 - 题目数据不常变化，可以缓存
export const revalidate = 3600; // 1小时重新验证

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

    // 排序参数
    const sortBy = searchParams.get("sortBy") || "id"; // id, difficulty, frequency
    const order = searchParams.get("order") || "asc"; // asc, desc

    // 筛选
    let filtered = questions.filter((q) => {
      if (category && q.category !== category) return false;
      if (type && q.type !== type) return false;
      if (difficulty && q.difficulty !== parseInt(difficulty)) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        const matchTitle = q.title.toLowerCase().includes(searchLower);
        const matchKeyPoints = q.keyPoints.toLowerCase().includes(searchLower);
        if (!matchTitle && !matchKeyPoints) return false;
      }
      return true;
    });

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "difficulty":
          comparison = a.difficulty - b.difficulty;
          break;
        case "frequency":
          comparison = a.frequency - b.frequency;
          break;
        case "id":
        default:
          comparison = parseInt(a.id) - parseInt(b.id);
      }
      return order === "desc" ? -comparison : comparison;
    });

    // 分页
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    // 返回精简数据（不包含完整的参考答案，减少体积）
    const lightweight = paginated.map((q) => ({
      id: q.id,
      title: q.title,
      category: q.category,
      type: q.type,
      difficulty: q.difficulty,
      frequency: q.frequency,
      keyPoints: q.keyPoints,
    }));

    return NextResponse.json(
      {
        questions: lightweight,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
