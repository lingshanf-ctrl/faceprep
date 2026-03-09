import { AIProvider, InterviewFeedback, AIError } from "./types";
import { DeepSeekProvider } from "./deepseek";
import { OpenAICompatibleProvider } from "./openai-compatible";
import { FAST_EVAL_SYSTEM_PROMPT, FAST_EVAL_USER_PROMPT } from "./prompts";

export * from "./types";
export { FAST_EVAL_SYSTEM_PROMPT, FAST_EVAL_USER_PROMPT } from "./prompts";

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

    case "kimi":
      return new OpenAICompatibleProvider({
        name: "kimi",
        apiKey: process.env.KIMI_API_KEY || "",
        baseUrl: "https://api.moonshot.ai/v1",
        model: "kimi-k2.5",
      });

    case "kimi-code":
      return new OpenAICompatibleProvider({
        name: "kimi-code",
        apiKey: process.env.KIMI_CODE_API_KEY || "",
        baseUrl: "https://api.kimi.com/coding/v1",
        model: "kimi-k2.5",
      });

    default:
      return new DeepSeekProvider();
  }
}

// 面试教练级 Prompt
const COACH_SYSTEM_PROMPT = `你是一位拥有15年经验的顶级面试教练，曾帮助数千名候选人进入谷歌、阿里、字节等顶级公司。

你的 coaching 风格：
1. 像朋友一样真诚，但像教练一样严格
2. 不说"还不错"，而是说"这个地方可以加个数据，效果会好很多"
3. 每次反馈都让用户有具体的收获，不是泛泛而谈
4. 相信每个人都有潜力，用发展的眼光看待回答

你的评估基于国际通用的能力模型，从四个维度进行专业评估。`;

const COACH_USER_PROMPT = `请作为专业面试教练，对以下回答进行深度评估。

===== 题目信息 =====
【题目】{question}
【题型】{type}
【难度】{difficulty}/3
【考察要点】{keyPoints}

===== 参考答案标准 =====
{referenceAnswer}

===== 常见错误（供参考） =====
{commonMistakes}

===== 答题框架指导 =====
{framework}

===== 用户回答 =====
{userAnswer}

===== 评估任务 =====

## 1. 四维能力评估（0-100分）

请从以下四个维度评估，并给出具体理由：

### 内容完整性（30分权重）
- 得分：？
- 评价：是否覆盖所有考察点？是否有具体案例和数据？
- 缺失点：哪些考察点没有覆盖？（用数组列出）

### 结构逻辑性（25分权重）
- 得分：？
- 评价：是否使用了正确的答题框架（如STAR法则）？
- 问题：结构混乱的地方在哪里？（用数组列出）

### 表达专业性（25分权重）
- 得分：？
- 评价：用词是否准确？有无冗余或模糊表述？自信度如何？
- 具体建议：哪些词可以改得更专业？（用数组列出）

### 差异化亮点（20分权重）
- 得分：？
- 评价：有没有超出预期的洞察或个人特色？
- 亮点提炼：最闪光的1-2个点是什么？（用数组列出）

### 总分
总分 = 上述四项加权得分（四舍五入到整数）

## 2. 差距分析（Gap Analysis）

对比参考答案，逐段分析：

🔴 缺失（完全没有）：
- location: "第几段或整体"
- description: "具体缺失什么内容"

🟡 不足（有但不够）：
- location: "第几段"
- description: "当前状况"
- suggestion: "如何改进"

🟢 良好（达到标准）：
- location: "第几段"
- description: "做得好的地方"

🌟 亮点（超出预期）：
- location: "第几段"
- description: "亮点内容"

## 3. 个性化改进建议

给出3条可执行的改进建议：
- priority: "high" | "medium" | "low"
- action: "具体行动描述"
- expectedGain: "预期提升多少分或什么效果"

## 4. 优化版回答示例

基于用户的表达风格，给出一个改进后的版本（保留用户原意和风格，只做优化）：

## 5. 教练寄语

给用户一句鼓励的话（50字以内），同时指出下一步重点练习方向。

===== 输出格式 =====

严格按照以下JSON格式返回，不要包含其他内容：

{
  "totalScore": 整数,
  "dimensions": {
    "content": { "score": 整数, "feedback": "评价", "missing": ["缺失1", "缺失2"] },
    "structure": { "score": 整数, "feedback": "评价", "issues": ["问题1", "问题2"] },
    "expression": { "score": 整数, "feedback": "评价", "suggestions": ["建议1", "建议2"] },
    "highlights": { "score": 整数, "feedback": "评价", "strongPoints": ["亮点1", "亮点2"] }
  },
  "gapAnalysis": {
    "missing": [{ "location": "位置", "description": "描述" }],
    "insufficient": [{ "location": "位置", "description": "描述", "suggestion": "建议" }],
    "good": [{ "location": "位置", "description": "描述" }],
    "excellent": [{ "location": "位置", "description": "描述" }]
  },
  "improvements": [
    { "priority": "high|medium|low", "action": "行动", "expectedGain": "预期收益" }
  ],
  "optimizedAnswer": "优化后的回答",
  "coachMessage": "教练寄语"
}`;

// 题目元数据
export interface QuestionMetadata {
  type?: string;
  difficulty?: number;
  referenceAnswer?: string;
  commonMistakes?: string;
  framework?: string;
}

// 快速生成面试点评（用于模拟面试场景，5-10秒响应）
export async function generateQuickFeedback(
  question: string,
  keyPoints: string,
  userAnswer: string,
  metadata?: QuestionMetadata,
  provider?: string
): Promise<InterviewFeedback> {
  const ai = getAIProvider(provider);

  // 构建精简 prompt
  const prompt = FAST_EVAL_USER_PROMPT
    .replace("{question}", question)
    .replace("{keyPoints}", keyPoints)
    .replace("{userAnswer}", userAnswer);

  const result = await ai.complete({
    messages: [
      { role: "system", content: FAST_EVAL_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    maxTokens: 800, // 从3000降至800，大幅减少响应时间
  });

  // 解析 JSON 响应
  try {
    let jsonStr = result.content;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    // 构建标准反馈格式（简化版）
    const feedback: InterviewFeedback = {
      totalScore: Math.min(100, Math.max(0, Number(parsed.totalScore) || 60)),
      dimensions: {
        content: {
          score: Math.min(100, Math.max(0, Number(parsed.dimensions?.content?.score) || 60)),
          feedback: parsed.dimensions?.content?.feedback || "内容评估",
          missing: [],
        },
        structure: {
          score: Math.min(100, Math.max(0, Number(parsed.dimensions?.structure?.score) || 60)),
          feedback: parsed.dimensions?.structure?.feedback || "结构评估",
          issues: [],
        },
        expression: {
          score: Math.min(100, Math.max(0, Number(parsed.dimensions?.expression?.score) || 60)),
          feedback: parsed.dimensions?.expression?.feedback || "表达评估",
          suggestions: [],
        },
        highlights: {
          score: Math.min(100, Math.max(0, Number(parsed.dimensions?.highlights?.score) || 60)),
          feedback: parsed.dimensions?.highlights?.feedback || "亮点评估",
          strongPoints: Array.isArray(parsed.good) ? parsed.good : [],
        },
      },
      gapAnalysis: {
        missing: [],
        insufficient: [],
        good: [],
        excellent: [],
      },
      improvements: Array.isArray(parsed.improve)
        ? parsed.improve.map((item: string) => ({
            priority: "medium" as const,
            action: item,
            expectedGain: "提升回答质量",
          }))
        : [],
      optimizedAnswer: "",
      coachMessage: parsed.suggestion || "继续加油！",
      // 兼容旧版字段
      score: Math.min(100, Math.max(0, Number(parsed.totalScore) || 60)),
      good: Array.isArray(parsed.good) ? parsed.good : ["已完成回答"],
      improve: Array.isArray(parsed.improve) ? parsed.improve : ["请继续努力"],
      suggestion: parsed.suggestion || "请根据建议改进",
      starAnswer: "",
    };

    return feedback;
  } catch (error) {
    console.error("Failed to parse AI quick feedback:", error, result.content);
    // 返回默认反馈
    return {
      totalScore: 60,
      dimensions: {
        content: { score: 60, feedback: "AI解析出错", missing: [] },
        structure: { score: 60, feedback: "AI解析出错", issues: [] },
        expression: { score: 60, feedback: "AI解析出错", suggestions: [] },
        highlights: { score: 60, feedback: "AI解析出错", strongPoints: [] },
      },
      gapAnalysis: { missing: [], insufficient: [], good: [], excellent: [] },
      improvements: [],
      optimizedAnswer: "",
      coachMessage: "AI解析出错，请重试",
      // 兼容旧版
      score: 60,
      good: ["已收到你的回答"],
      improve: ["AI 解析出错，请重试"],
      suggestion: "请重新提交回答",
    };
  }
}

// 生成面试点评（新版 - 面试教练级）
export async function generateFeedback(
  question: string,
  keyPoints: string,
  userAnswer: string,
  metadata?: QuestionMetadata,
  provider?: string
): Promise<InterviewFeedback> {
  const ai = getAIProvider(provider);

  // 构建完整的 prompt，传入所有元数据
  const prompt = COACH_USER_PROMPT
    .replace("{question}", question)
    .replace("{type}", metadata?.type || "GENERAL")
    .replace("{difficulty}", String(metadata?.difficulty || 2))
    .replace("{keyPoints}", keyPoints)
    .replace("{referenceAnswer}", metadata?.referenceAnswer || "请参考标准回答结构")
    .replace("{commonMistakes}", metadata?.commonMistakes || "无")
    .replace("{framework}", metadata?.framework || "使用STAR法则：情境-任务-行动-结果")
    .replace("{userAnswer}", userAnswer);

  const result = await ai.complete({
    messages: [
      { role: "system", content: COACH_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    maxTokens: 3000, // 增加token以支持更详细的反馈
  });

  // 解析 JSON 响应
  try {
    // 尝试提取 JSON（处理可能的 markdown 代码块）
    let jsonStr = result.content;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    // 构建标准反馈格式
    const feedback: InterviewFeedback = {
      totalScore: Math.min(100, Math.max(0, Number(parsed.totalScore) || 60)),
      dimensions: {
        content: {
          score: Math.min(100, Math.max(0, Number(parsed.dimensions?.content?.score) || 60)),
          feedback: parsed.dimensions?.content?.feedback || "内容评估",
          missing: Array.isArray(parsed.dimensions?.content?.missing)
            ? parsed.dimensions.content.missing
            : [],
        },
        structure: {
          score: Math.min(100, Math.max(0, Number(parsed.dimensions?.structure?.score) || 60)),
          feedback: parsed.dimensions?.structure?.feedback || "结构评估",
          issues: Array.isArray(parsed.dimensions?.structure?.issues)
            ? parsed.dimensions.structure.issues
            : [],
        },
        expression: {
          score: Math.min(100, Math.max(0, Number(parsed.dimensions?.expression?.score) || 60)),
          feedback: parsed.dimensions?.expression?.feedback || "表达评估",
          suggestions: Array.isArray(parsed.dimensions?.expression?.suggestions)
            ? parsed.dimensions.expression.suggestions
            : [],
        },
        highlights: {
          score: Math.min(100, Math.max(0, Number(parsed.dimensions?.highlights?.score) || 60)),
          feedback: parsed.dimensions?.highlights?.feedback || "亮点评估",
          strongPoints: Array.isArray(parsed.dimensions?.highlights?.strongPoints)
            ? parsed.dimensions.highlights.strongPoints
            : [],
        },
      },
      gapAnalysis: {
        missing: Array.isArray(parsed.gapAnalysis?.missing) ? parsed.gapAnalysis.missing : [],
        insufficient: Array.isArray(parsed.gapAnalysis?.insufficient)
          ? parsed.gapAnalysis.insufficient
          : [],
        good: Array.isArray(parsed.gapAnalysis?.good) ? parsed.gapAnalysis.good : [],
        excellent: Array.isArray(parsed.gapAnalysis?.excellent) ? parsed.gapAnalysis.excellent : [],
      },
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      optimizedAnswer: parsed.optimizedAnswer || "",
      coachMessage: parsed.coachMessage || "继续加油！",
      // 兼容旧版字段
      score: Math.min(100, Math.max(0, Number(parsed.totalScore) || 60)),
      good: parsed.dimensions?.highlights?.strongPoints || ["已完成回答"],
      improve:
        parsed.dimensions?.content?.missing?.concat(parsed.dimensions?.structure?.issues || []) ||
        [],
      suggestion: parsed.improvements?.[0]?.action || "请根据建议改进",
      starAnswer: parsed.optimizedAnswer || "",
    };

    return feedback;
  } catch (error) {
    console.error("Failed to parse AI feedback:", error, result.content);
    // 返回默认反馈
    return {
      totalScore: 60,
      dimensions: {
        content: { score: 60, feedback: "AI解析出错", missing: [] },
        structure: { score: 60, feedback: "AI解析出错", issues: [] },
        expression: { score: 60, feedback: "AI解析出错", suggestions: [] },
        highlights: { score: 60, feedback: "AI解析出错", strongPoints: [] },
      },
      gapAnalysis: { missing: [], insufficient: [], good: [], excellent: [] },
      improvements: [],
      optimizedAnswer: "",
      coachMessage: "AI解析出错，请重试",
      // 兼容旧版
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
  metadata?: QuestionMetadata,
  provider?: string
): Promise<
  | { success: true; feedback: InterviewFeedback }
  | { success: false; error: string; errorCode?: string; retryable: boolean }
> {
  try {
    const feedback = await generateFeedback(question, keyPoints, userAnswer, metadata, provider);
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
