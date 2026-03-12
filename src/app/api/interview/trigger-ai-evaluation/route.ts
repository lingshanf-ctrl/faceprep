import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

/**
 * 触发 AI 评估生成（异步）
 * 这个 API 立即返回，在后台处理 AI 生成
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    // 验证会话所有权
    const interviewSession = await db.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId: session.id,
      },
      include: {
        answers: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!interviewSession) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // 检查是否已有 AI 评估
    if (interviewSession.aiEvaluation) {
      return NextResponse.json({
        success: true,
        message: "AI evaluation already exists",
        status: "completed",
      });
    }

    // 触发整体评估（不等待完成）
    // 使用 fire-and-forget 模式
    triggerOverallEvaluation(sessionId, session.id).catch((error) => {
      console.error("Background AI evaluation failed:", error);
    });

    return NextResponse.json({
      success: true,
      message: "AI evaluation triggered",
      status: "processing",
    });
  } catch (error) {
    console.error("Trigger AI evaluation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 后台触发整体评估
 */
async function triggerOverallEvaluation(sessionId: string, userId: string) {
  try {
    // 调用整体评估 API，带上后台处理标记
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/interview/overall-evaluate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          userId,
          background: true, // 标记为后台处理
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Overall evaluation failed: ${response.status}`);
    }

    const result = await response.json();
    console.log("AI evaluation completed:", result.success);
  } catch (error) {
    console.error("Background evaluation error:", error);
    // 这里可以添加重试逻辑或错误通知
  }
}
