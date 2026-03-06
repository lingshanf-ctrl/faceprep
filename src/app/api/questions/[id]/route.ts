import { NextResponse } from "next/server";
import { questions } from "@/data/questions";
import { db } from "@/lib/db";

export const revalidate = 3600;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 首先尝试从内存数组查找（字符串 ID）
    const memoryQuestion = questions.find((q) => q.id === id);
    if (memoryQuestion) {
      return NextResponse.json(
        { question: memoryQuestion },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600",
          },
        }
      );
    }

    // 然后尝试从数据库查找（支持字符串 ID，包括 CUID 和自定义 ID）
    const dbQuestion = await db.question.findUnique({
      where: { id },
    });

    if (dbQuestion) {
      return NextResponse.json(
        { question: dbQuestion },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600",
          },
        }
      );
    }

    return NextResponse.json(
      { error: "Question not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Failed to fetch question:", error);
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}
