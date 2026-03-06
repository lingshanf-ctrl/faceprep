import { NextRequest, NextResponse } from "next/server";
import { generateFeedback } from "@/lib/ai";
import { AIError } from "@/lib/ai/types";

// Edge Runtime 配置 - 在亚洲节点运行，降低国内访问延迟
export const runtime = 'edge';
export const preferredRegion = ['hkg1', 'sin1', 'kix1', 'icn1']; // 香港、新加坡、大阪、首尔
export const maxDuration = 60; // 最大执行时间 60 秒

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      question,
      keyPoints,
      answer,
      // 新增：完整的题目元数据
      type,
      difficulty,
      referenceAnswer,
      commonMistakes,
      framework,
    } = body;

    // 验证必填字段
    if (!question || !answer) {
      return NextResponse.json(
        { error: "Missing required fields: question and answer" },
        { status: 400 }
      );
    }

    // 检查回答长度
    if (answer.trim().length < 10) {
      return NextResponse.json(
        { error: "Answer is too short. Please provide a more detailed response." },
        { status: 400 }
      );
    }

    // 构建题目元数据
    const metadata = {
      type: type || "GENERAL",
      difficulty: difficulty || 2,
      referenceAnswer: referenceAnswer || "请参考标准回答结构",
      commonMistakes: commonMistakes || "无",
      framework: framework || "使用STAR法则：情境-任务-行动-结果",
    };

    // 生成 AI 点评（传入完整元数据）
    const feedback = await generateFeedback(
      question,
      keyPoints || "综合表达能力",
      answer,
      metadata
    );

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Feedback API error:", error);

    // 处理 AIError 类型错误
    if (error instanceof AIError) {
      const errorMap: Record<string, { message: string; status: number }> = {
        TIMEOUT: {
          message: "AI 服务响应超时，请稍后重试",
          status: 504
        },
        RATE_LIMIT: {
          message: "AI 服务繁忙，请稍后重试",
          status: 429
        },
        INVALID_API_KEY: {
          message: "AI 服务配置错误，请联系管理员",
          status: 503
        },
        INSUFFICIENT_BALANCE: {
          message: "AI 服务额度不足，请联系管理员",
          status: 503
        },
        CONTENT_FILTERED: {
          message: "内容包含敏感信息，请修改后重试",
          status: 400
        },
        NETWORK_ERROR: {
          message: "网络连接失败，请检查网络后重试",
          status: 502
        }
      };

      const mapped = errorMap[error.code];
      if (mapped) {
        return NextResponse.json(
          { error: mapped.message, code: error.code },
          { status: mapped.status }
        );
      }
    }

    // 检查是否是 API Key 问题
    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { error: "AI service not configured. Please check API key." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate feedback. Please try again." },
      { status: 500 }
    );
  }
}
