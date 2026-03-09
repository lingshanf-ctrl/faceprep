import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  generateQuestionsWithAI,
  getAIGenerationTips,
} from "@/lib/ai/question-generator";
import {
  generateInterviewQuestions,
  getGenerationTips,
} from "@/lib/question-generator";

// 获取匿名ID
function getAnonymousId(request: NextRequest): string | null {
  return request.headers.get("X-Anonymous-Id");
}

// 获取用户ID
async function getUserId(
  request: NextRequest
): Promise<{ userId: string; isAnonymous: boolean }> {
  const session = await getSession();
  if (session?.id) {
    return { userId: session.id, isAnonymous: false };
  }
  const anonymousId = getAnonymousId(request);
  if (anonymousId) {
    return { userId: anonymousId, isAnonymous: true };
  }
  return { userId: "", isAnonymous: true };
}

// POST /api/interview/generate-questions
// 生成面试题目（支持 AI 和规则引擎两种模式）
export async function POST(request: NextRequest) {
  try {
    const { userId } = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      jdText,
      resumeText,
      questionCount = 5,
      mode = "ai", // 'ai' | 'rule'
      fallback = true, // AI 失败时是否降级到规则引擎
    } = body;

    if (!jdText?.trim()) {
      return NextResponse.json(
        { error: "岗位描述（JD）不能为空" },
        { status: 400 }
      );
    }

    let questions;
    let tips;
    let usedMode = mode;

    if (mode === "ai") {
      try {
        // 使用 AI 生成
        const [aiQuestions, aiTips] = await Promise.all([
          generateQuestionsWithAI({
            jdText,
            resumeText,
            questionCount,
          }),
          getAIGenerationTips(jdText, resumeText),
        ]);

        questions = aiQuestions;
        tips = aiTips;
      } catch (error) {
        console.error("AI 生成失败:", error);

        if (fallback) {
          // 降级到规则引擎
          console.log("降级到规则引擎生成题目");
          questions = generateInterviewQuestions({
            jdText,
            resumeText,
            questionCount,
          });
          tips = getGenerationTips(jdText, resumeText);
          usedMode = "rule";
        } else {
          return NextResponse.json(
            {
              error: "AI 生成失败",
              detail: error instanceof Error ? error.message : "未知错误",
            },
            { status: 500 }
          );
        }
      }
    } else {
      // 使用规则引擎
      questions = generateInterviewQuestions({
        jdText,
        resumeText,
        questionCount,
      });
      tips = getGenerationTips(jdText, resumeText);
    }

    return NextResponse.json({
      questions,
      tips,
      mode: usedMode,
      isFallback: usedMode !== mode,
    });
  } catch (error) {
    console.error("生成面试题目失败:", error);
    return NextResponse.json(
      {
        error: "生成面试题目失败",
        detail: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
