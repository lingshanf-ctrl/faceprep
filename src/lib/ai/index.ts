import { AIProvider, InterviewFeedback, AIError } from "./types";
import { DeepSeekProvider } from "./deepseek";
import { OpenAICompatibleProvider } from "./openai-compatible";

export * from "./types";

// 获取 AI 提供商
export function getAIProvider(provider?: string): AIProvider {
  const selectedProvider = provider || process.env.AI_PROVIDER || "deepseek";

  switch (selectedProvider) {
    case "deepseek":
      return new DeepSeekProvider();

    case "openai":
      return new OpenAICompatibleProvider({
        name: "openai",
        apiKey: process.env.OPENAI_API_KEY || "",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini",
      });

    case "qwen":
      return new OpenAICompatibleProvider({
        name: "qwen",
        apiKey: process.env.QWEN_API_KEY || "",
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        model: "qwen-turbo",
      });

    default:
      return new DeepSeekProvider();
  }
}

// 面试点评 Prompt
const FEEDBACK_SYSTEM_PROMPT = `你是一位资深的面试辅导专家，专门帮助应届毕业生准备面试。
你的点评风格：友善但直接，给出具体可操作的建议。`;

const FEEDBACK_USER_PROMPT = `请对以下面试回答进行点评。

【面试问题】
{question}

【考察点】
{keyPoints}

【用户回答】
{userAnswer}

请严格按照以下 JSON 格式返回（不要包含其他内容）：
{
  "score": 评分（0-100的整数）,
  "good": ["做得好的点1", "做得好的点2"],
  "improve": ["需要改进的点1", "需要改进的点2", "需要改进的点3"],
  "suggestion": "具体的改进建议，包括如何用 STAR 法则组织回答",
  "starAnswer": "用 STAR 法则重新组织的示例回答（可选，100字以内）"
}

评分标准：
- 90-100：回答完整、结构清晰、有具体案例和数据
- 70-89：回答基本完整，但缺少亮点或具体细节
- 50-69：回答不够完整，结构混乱或偏题
- 50以下：回答过于简短或完全偏题`;

// 生成面试点评
export async function generateFeedback(
  question: string,
  keyPoints: string,
  userAnswer: string,
  provider?: string
): Promise<InterviewFeedback> {
  const ai = getAIProvider(provider);

  const prompt = FEEDBACK_USER_PROMPT
    .replace("{question}", question)
    .replace("{keyPoints}", keyPoints)
    .replace("{userAnswer}", userAnswer);

  const result = await ai.complete({
    messages: [
      { role: "system", content: FEEDBACK_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    maxTokens: 1500,
  });

  // 解析 JSON 响应
  try {
    // 尝试提取 JSON（处理可能的 markdown 代码块）
    let jsonStr = result.content;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const feedback = JSON.parse(jsonStr.trim());

    return {
      score: Math.min(100, Math.max(0, Number(feedback.score) || 60)),
      good: Array.isArray(feedback.good) ? feedback.good : [],
      improve: Array.isArray(feedback.improve) ? feedback.improve : [],
      suggestion: feedback.suggestion || "请提供更详细的回答",
      starAnswer: feedback.starAnswer,
    };
  } catch (error) {
    console.error("Failed to parse AI feedback:", error, result.content);
    // 返回默认反馈
    return {
      score: 60,
      good: ["已收到你的回答"],
      improve: ["AI 解析出错，请重试"],
      suggestion: "请重新提交回答",
    };
  }
}

// 生成面试点评（带详细错误处理）
export async function generateFeedbackWithError(
  question: string,
  keyPoints: string,
  userAnswer: string,
  provider?: string
): Promise<
  | { success: true; feedback: InterviewFeedback }
  | { success: false; error: string; errorCode?: string; retryable: boolean }
> {
  try {
    const feedback = await generateFeedback(question, keyPoints, userAnswer, provider);
    return { success: true, feedback };
  } catch (error) {
    if (error instanceof AIError) {
      let userMessage: string;
      switch (error.code) {
        case "TIMEOUT":
          userMessage = "AI 响应超时，请稍后重试";
          break;
        case "RATE_LIMIT":
          userMessage = "请求过于频繁，请稍后再试";
          break;
        case "INVALID_API_KEY":
          userMessage = "AI 服务配置错误，请联系管理员";
          break;
        case "INSUFFICIENT_BALANCE":
          userMessage = "AI 服务余额不足，请联系管理员";
          break;
        case "CONTENT_FILTERED":
          userMessage = "回答内容被过滤，请调整后再试";
          break;
        case "NETWORK_ERROR":
          userMessage = "网络连接失败，请检查网络后重试";
          break;
        default:
          userMessage = "AI 服务暂时不可用，请稍后重试";
      }
      return {
        success: false,
        error: userMessage,
        errorCode: error.code,
        retryable: error.retryable,
      };
    }

    return {
      success: false,
      error: "未知错误，请稍后重试",
      retryable: true,
    };
  }
}
