import { NextRequest, NextResponse } from "next/server";
import { generateFeedback, QuestionMetadata } from "@/lib/ai";

// 面试答案评估 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, answer, metadata } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Missing required fields: question and answer" },
        { status: 400 }
      );
    }

    // 构建题目元数据
    const questionMetadata: QuestionMetadata = {
      type: metadata?.type || "GENERAL",
      difficulty: metadata?.difficulty || 2,
      referenceAnswer: metadata?.referenceAnswer,
      commonMistakes: metadata?.commonMistakes,
      framework: metadata?.framework,
    };

    // 调用 AI 生成反馈
    const feedback = await generateFeedback(
      question.title,
      question.keyPoints || "",
      answer,
      questionMetadata
    );

    // 转换为模拟面试需要的简单格式
    const simpleFeedback = {
      score: feedback.totalScore,
      good: [
        ...(feedback.dimensions.content.missing.length === 0 ? ["内容完整，覆盖考察要点"] : []),
        ...(feedback.dimensions.structure.score >= 70 ? ["结构清晰，逻辑连贯"] : []),
        ...(feedback.dimensions.expression.score >= 70 ? ["表达专业，用词准确"] : []),
        ...(feedback.dimensions.highlights.score >= 70 ? ["回答有亮点，展现个人特色"] : []),
        // 添加亮点具体描述
        ...feedback.dimensions.highlights.strongPoints.slice(0, 2),
      ],
      improve: [
        ...(feedback.dimensions.content.missing.length > 0
          ? [`内容可补充：${feedback.dimensions.content.missing.join("、")}`]
          : []),
        ...(feedback.dimensions.structure.issues.length > 0
          ? [`结构优化：${feedback.dimensions.structure.issues[0]}`]
          : []),
        ...(feedback.dimensions.expression.suggestions.length > 0
          ? [`表达改进：${feedback.dimensions.expression.suggestions[0]}`]
          : []),
      ],
      suggestion: feedback.coachMessage || feedback.dimensions.content.feedback,
      // 保留完整的维度数据供报告使用
      dimensions: feedback.dimensions,
      improvements: feedback.improvements,
      optimizedAnswer: feedback.optimizedAnswer,
    };

    // 确保至少有一些改进建议
    if (simpleFeedback.improve.length === 0) {
      simpleFeedback.improve.push("继续保持，可以尝试加入更多具体数据支撑");
    }
    if (simpleFeedback.good.length === 0) {
      simpleFeedback.good.push("回答基本完整，表达清晰");
    }

    return NextResponse.json({
      feedback: simpleFeedback,
      fullFeedback: feedback,
    });
  } catch (error) {
    console.error("Interview evaluation error:", error);

    // 根据错误类型返回不同的错误信息
    if (error instanceof Error) {
      if (error.message.includes("RATE_LIMIT")) {
        return NextResponse.json(
          { error: "AI 服务繁忙，请稍后重试", code: "RATE_LIMIT" },
          { status: 429 }
        );
      }
      if (error.message.includes("INVALID_API_KEY") || error.message.includes("INSUFFICIENT_BALANCE")) {
        return NextResponse.json(
          { error: "AI 服务配置错误，请联系管理员", code: "AI_CONFIG_ERROR" },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "评估失败，请稍后重试" },
      { status: 500 }
    );
  }
}
