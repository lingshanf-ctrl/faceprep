import { NextRequest } from "next/server";
import { getAIProvider } from "@/lib/ai";
import { QUICK_COACH_SYSTEM_PROMPT, QUICK_COACH_USER_PROMPT } from "@/lib/ai/prompts";

export const runtime = "edge";
export const maxDuration = 60;
export const preferredRegion = ["hkg1", "sin1", "nrt1", "icn1"];

// 快速评估 Prompt（精简版，用于流式响应）
const QUICK_SYSTEM_PROMPT = QUICK_COACH_SYSTEM_PROMPT || `你是一位经验丰富的面试教练，擅长快速给出精准、可操作的反馈。
你的评价应该友善但诚恳，既肯定优点也直指改进空间。
请用简洁有力的语言给出评估。`;

const QUICK_USER_PROMPT = QUICK_COACH_USER_PROMPT || `请快速评估以下面试回答：

【题目】{question}
【考察点】{keyPoints}
【用户回答】{userAnswer}

请返回一个JSON对象，包含以下字段：
{
  "totalScore": 0-100的整数分数,
  "quickSummary": "一句话评价（30字内）",
  "topStrength": "最大亮点（一句话）",
  "topImprovement": "最需改进（一句话）",
  "coachTip": "教练建议（30字内）"
}

请直接返回JSON，不要包含markdown代码块。`;

// POST /api/feedback/stream - 流式反馈生成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, keyPoints, answer } = body;

    if (!question || !answer) {
      return new Response(
        JSON.stringify({ error: "question 和 answer 参数必填" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (answer.length < 10) {
      return new Response(
        JSON.stringify({ error: "回答内容太短，请至少输入 10 个字符" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const ai = getAIProvider();

    // 检查是否支持流式响应
    if (!ai.stream) {
      return new Response(
        JSON.stringify({ error: "当前 AI 提供商不支持流式响应" }),
        { status: 501, headers: { "Content-Type": "application/json" } }
      );
    }

    // 构建 Prompt
    const userPrompt = QUICK_USER_PROMPT
      .replace("{question}", question)
      .replace("{keyPoints}", keyPoints || "综合评估")
      .replace("{userAnswer}", answer);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = "";

        try {
          await ai.stream!({
            messages: [
              { role: "system", content: QUICK_SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
            maxTokens: 500,
            onChunk: (chunk) => {
              fullContent += chunk;
              // 发送 SSE 格式的数据
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
              );
            },
            onComplete: () => {
              // 尝试解析完整响应为 JSON
              try {
                // 清理可能的 markdown 代码块
                let jsonStr = fullContent.trim();
                const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (jsonMatch) {
                  jsonStr = jsonMatch[1].trim();
                }

                const feedback = JSON.parse(jsonStr);
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ done: true, feedback })}\n\n`)
                );
              } catch {
                // 解析失败，返回原始内容
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ done: true, raw: fullContent })}\n\n`)
                );
              }
              controller.close();
            },
            onError: (error) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
              );
              controller.close();
            },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "流式请求失败";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream feedback error:", error);
    return new Response(
      JSON.stringify({ error: "服务器错误" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
