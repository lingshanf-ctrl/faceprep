import { NextResponse } from "next/server";
import { questions } from "@/data/questions";

export const revalidate = 3600;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const question = questions.find((q) => q.id === id);

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { question },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch question:", error);
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}
