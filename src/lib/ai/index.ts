import { AIProvider, InterviewFeedback, AIError } from "./types";
import { DeepSeekProvider } from "./deepseek";
import { OpenAICompatibleProvider } from "./openai-compatible";
import {
  FAST_EVAL_SYSTEM_PROMPT,
  FAST_EVAL_USER_PROMPT,
  BASIC_EVAL_SYSTEM_PROMPT,
  BASIC_EVAL_USER_PROMPT,
  ADVANCED_EVAL_SYSTEM_PROMPT,
  ADVANCED_EVAL_USER_PROMPT,
} from "./prompts";
import { generateRuleBasedFeedback } from "../rule-engine-feedback";

export * from "./types";
export {
  FAST_EVAL_SYSTEM_PROMPT,
  FAST_EVAL_USER_PROMPT,
  BASIC_EVAL_SYSTEM_PROMPT,
  BASIC_EVAL_USER_PROMPT,
  ADVANCED_EVAL_SYSTEM_PROMPT,
  ADVANCED_EVAL_USER_PROMPT,
} from "./prompts";

// 获取 AI 提供商
// 获取 AI 提供商（按场景）
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
        baseUrl: "https://api.moonshot.cn/v1",
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

// 双模型配置
const AI_CONFIG = {
  // 基础分析（免费场景）- Qwen-turbo
  basic: {
    provider: "qwen" as const,
    model: "qwen-turbo",
    maxTokens: 1500,
    temperature: 0.3,
    timeout: 15000, // 15秒超时
  },
  // 深度分析（付费场景）- DeepSeek-v3（主）
  advanced: {
    provider: "deepseek" as const,
    model: "deepseek-chat",
    maxTokens: 3000,
    temperature: 0.5,
    timeout: 30000, // DeepSeek 更快，30s 足够
  },
};

// 付费用户备用配置 - Kimi K2.5
const ADVANCED_FALLBACK_CONFIG = {
  provider: "kimi" as const,
  model: "kimi-k2.5",
  maxTokens: 3000,
  temperature: 0.5,
  timeout: 45000, // Kimi 较慢，45s
};

// 按场景获取提供商
export function getProviderForScenario(scenario: "basic" | "advanced"): AIProvider {
  const config = AI_CONFIG[scenario];

  switch (config.provider) {
    case "qwen":
      return new OpenAICompatibleProvider({
        name: "qwen-basic",
        apiKey: process.env.QWEN_API_KEY || "",
        baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        model: config.model,
      });

    case "deepseek":
      return new DeepSeekProvider();

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
  keyPoints?: string;
}

// 评估选项
export interface EvaluationOptions {
  depth: "basic" | "advanced";
  userType: "free" | "paid";
  question?: string;
  forceProvider?: "qwen" | "kimi" | "deepseek"; // 强制指定提供商（用于降级场景）
}

// 构建基础分析 Prompt
function buildBasicPrompt(answer: string, metadata: QuestionMetadata): string {
  return BASIC_EVAL_USER_PROMPT
    .replace("{question}", metadata.keyPoints || "面试题")
    .replace("{type}", metadata?.type || "GENERAL")
    .replace("{keyPoints}", metadata?.keyPoints || "无")
    .replace("{userAnswer}", answer);
}

// 构建深度分析 Prompt
function buildAdvancedPrompt(answer: string, metadata: QuestionMetadata): string {
  return ADVANCED_EVAL_USER_PROMPT
    .replace("{question}", metadata.keyPoints || "面试题")
    .replace("{type}", metadata?.type || "GENERAL")
    .replace("{difficulty}", String(metadata?.difficulty || 2))
    .replace("{keyPoints}", metadata?.keyPoints || "无")
    .replace("{referenceAnswer}", metadata?.referenceAnswer || "请参考标准回答结构")
    .replace("{commonMistakes}", metadata?.commonMistakes || "无")
    .replace("{framework}", metadata?.framework || "使用STAR法则：情境-任务-行动-结果")
    .replace("{userAnswer}", answer);
}

// 双模型反馈生成（核心函数）
export async function generateFeedbackDualModel(
  answer: string,
  metadata: QuestionMetadata,
  options: EvaluationOptions
): Promise<InterviewFeedback> {
  const { depth, userType, forceProvider } = options;

  console.log(`[DualModel] Starting: depth=${depth}, userType=${userType}, forceProvider=${forceProvider || 'none'}`);

  // 根据深度选择提供商和配置
  let provider: AIProvider;
  let config = AI_CONFIG[depth];

  if (forceProvider) {
    // 强制指定提供商（用于降级场景）
    provider = getAIProvider(forceProvider);
    console.log(`[DualModel] Using forced provider: ${forceProvider}`);
  } else {
    // 正常场景：根据 depth 选择
    provider = getProviderForScenario(depth);
  }

  const actualProviderName = forceProvider || config.provider;
  const actualModelName = forceProvider === 'qwen' ? 'qwen-turbo'
    : forceProvider === 'kimi' ? 'kimi-k2.5'
    : forceProvider === 'deepseek' ? 'deepseek-chat'
    : config.model;
  // Use forceProvider timeout from fallback config, otherwise use depth config timeout
  const effectiveTimeout = forceProvider === 'kimi' ? ADVANCED_FALLBACK_CONFIG.timeout : config.timeout;
  console.log(`[DualModel] Provider: ${actualProviderName}, Model: ${actualModelName}, Depth: ${depth}`);
  console.log(`[DualModel] Timeout: ${effectiveTimeout}ms, MaxTokens: ${config.maxTokens}`);

  // 构建对应提示词
  const prompt =
    depth === "advanced"
      ? buildAdvancedPrompt(answer, metadata)
      : buildBasicPrompt(answer, metadata);

  const systemPrompt =
    depth === "advanced" ? ADVANCED_EVAL_SYSTEM_PROMPT : BASIC_EVAL_SYSTEM_PROMPT;

  console.log(`[DualModel] Prompt length: ${prompt.length} chars, System prompt length: ${systemPrompt.length} chars`);
  console.log(`[DualModel] Calling provider.complete...`);

  const result = await provider.complete({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    timeoutMs: effectiveTimeout,
  });

  console.log(`[DualModel] Provider response received. Content length: ${result.content.length} chars`);

  // 解析 JSON 响应
  try {
    console.log(`[DualModel] Parsing response...`);
    let jsonStr = result.content;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
      console.log(`[DualModel] Extracted JSON from markdown code block`);
    }

    const parsed = JSON.parse(jsonStr.trim());
    console.log(`[DualModel] JSON parsed successfully. totalScore: ${parsed.totalScore}`);

    // 根据深度构建不同格式的反馈
    const isAdvanced = depth === "advanced";
    console.log(`[DualModel] isAdvanced: ${isAdvanced}, building feedback structure...`);

    const feedback: InterviewFeedback = {
      totalScore: Math.min(100, Math.max(0, Number(parsed.totalScore) || 60)),
      dimensions: {
        content: {
          score: Math.min(100, Math.max(0, Number(parsed.dimensions?.content?.score) || 60)),
          feedback: parsed.dimensions?.content?.feedback || "内容评估",
          missing: isAdvanced
            ? (parsed.dimensions?.content?.missing || [])
            : (parsed.keyFindings?.weaknesses || []),
        },
        structure: {
          score: Math.min(100, Math.max(0, Number(parsed.dimensions?.structure?.score) || 60)),
          feedback: parsed.dimensions?.structure?.feedback || "结构评估",
          issues: isAdvanced ? (parsed.dimensions?.structure?.issues || []) : [],
        },
        expression: {
          score: Math.min(100, Math.max(0, Number(parsed.dimensions?.expression?.score) || 60)),
          feedback: parsed.dimensions?.expression?.feedback || "表达评估",
          suggestions: isAdvanced
            ? (parsed.dimensions?.expression?.suggestions || [])
            : (parsed.keyFindings?.weaknesses || []),
        },
        highlights: {
          score: Math.min(100, Math.max(0, Number(parsed.dimensions?.highlights?.score) || 60)),
          feedback: parsed.dimensions?.highlights?.feedback || "亮点评估",
          strongPoints: isAdvanced
            ? (parsed.dimensions?.highlights?.strongPoints || [])
            : (parsed.keyFindings?.strengths || []),
        },
      },
      gapAnalysis: isAdvanced
        ? {
            missing: parsed.gapAnalysis?.missing || [],
            insufficient: parsed.gapAnalysis?.insufficient || [],
            good: parsed.gapAnalysis?.good || [],
            excellent: parsed.gapAnalysis?.excellent || [],
          }
        : {
            missing: [],
            insufficient: [],
            good: [],
            excellent: [],
          },
      improvements: isAdvanced
        ? (parsed.improvements || [])
        : parsed.quickAdvice
          ? [{
              priority: "medium" as const,
              action: typeof parsed.quickAdvice === "string"
                ? parsed.quickAdvice
                : (parsed.quickAdvice?.primary || JSON.stringify(parsed.quickAdvice)),
              expectedGain: "提升回答质量",
            }]
          : [],
      optimizedAnswer: isAdvanced ? (parsed.optimizedAnswer || "") : "",
      coachMessage: isAdvanced
        ? (parsed.coachMessage || parsed.suggestion || "继续加油！")
        : typeof parsed.quickAdvice === "string"
          ? parsed.quickAdvice
          : (parsed.quickAdvice?.primary || parsed.coachTip || "继续加油！"),
      // 兼容旧版字段
      score: Math.min(100, Math.max(0, Number(parsed.totalScore) || 60)),
      good: isAdvanced
        ? (parsed.dimensions?.highlights?.strongPoints || ["已完成回答"])
        : (parsed.keyFindings?.strengths || ["已完成回答"]),
      improve: isAdvanced
        ? (parsed.dimensions?.content?.missing?.concat(parsed.dimensions?.structure?.issues || []) ||
          ["请继续努力"])
        : (parsed.keyFindings?.weaknesses || ["请继续努力"]),
      suggestion: isAdvanced
        ? (parsed.improvements?.[0]?.action || parsed.suggestion || "请根据建议改进")
        : (parsed.quickAdvice || "请根据建议改进"),
      starAnswer: isAdvanced ? (parsed.optimizedAnswer || "") : "",
      // 新增：记录使用的模型信息
      evaluationModel: forceProvider || config.provider,
      evaluationDepth: depth,
      // 记录目标用户类型
      targetUserType: options.userType,
    };

    console.log(`[DualModel] Feedback built. evaluationModel: ${feedback.evaluationModel}, evaluationDepth: ${feedback.evaluationDepth}`);
    console.log(`[DualModel] Dimensions: content=${feedback.dimensions.content.score}, structure=${feedback.dimensions.structure.score}, expression=${feedback.dimensions.expression.score}, highlights=${feedback.dimensions.highlights.score}`);

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
      starAnswer: "",
      evaluationModel: forceProvider || config.provider,
      evaluationDepth: depth,
      targetUserType: options.userType,
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

// 降级策略：将规则引擎反馈转换为 InterviewFeedback 格式
function convertRuleEngineToFeedback(
  ruleFeedback: import("../rule-engine-feedback").SimplifiedFeedback
): InterviewFeedback {
  return {
    totalScore: ruleFeedback.basicScore,
    dimensions: {
      content: {
        score: Math.round(ruleFeedback.basicScore * 0.4),
        feedback: ruleFeedback.keyPointsCovered.join("、") || "内容评估",
        missing: ruleFeedback.keyPointsMissed,
      },
      structure: {
        score: Math.round(ruleFeedback.basicScore * 0.3),
        feedback: ruleFeedback.structureHints.join("、") || "结构评估",
        issues: ruleFeedback.structureHints,
      },
      expression: {
        score: Math.round(ruleFeedback.basicScore * 0.3),
        feedback: ruleFeedback.lengthMessage || "表达评估",
        suggestions: ruleFeedback.generalTips,
      },
      highlights: {
        score: 60,
        feedback: "亮点评估",
        strongPoints: ruleFeedback.keyPointsCovered.slice(0, 2),
      },
    },
    gapAnalysis: {
      missing: [],
      insufficient: [],
      good: [],
      excellent: [],
    },
    improvements: ruleFeedback.improvementPriority?.map((item) => ({
      priority: "medium" as const,
      action: item,
      expectedGain: "提升回答质量",
    })) || [],
    optimizedAnswer: "",
    coachMessage: ruleFeedback.upgradePrompt,
    // 兼容旧版字段
    score: ruleFeedback.basicScore,
    good: ruleFeedback.keyPointsCovered,
    improve: ruleFeedback.keyPointsMissed,
    suggestion: ruleFeedback.upgradePrompt,
    starAnswer: "",
    // 标记为规则引擎生成
    evaluationModel: "rule-engine",
    evaluationDepth: "basic",
    targetUserType: "free",
  };
}

// 双模型反馈生成（带降级策略）
export async function generateFeedbackWithFallback(
  answer: string,
  metadata: QuestionMetadata,
  options: EvaluationOptions
): Promise<InterviewFeedback> {
  const { depth, userType } = options;

  console.log(`[Feedback] Starting generation: depth=${depth}, userType=${userType}`);
  console.log(`[Feedback] AI Config: provider=${AI_CONFIG[depth].provider}, model=${AI_CONFIG[depth].model}`);
  console.log(`[Feedback] Env check: KIMI_API_KEY=${process.env.KIMI_API_KEY ? 'set (length=' + process.env.KIMI_API_KEY.length + ')' : 'NOT SET'}, QWEN_API_KEY=${process.env.QWEN_API_KEY ? 'set' : 'NOT SET'}`);

  try {
    // 先尝试指定模型
    console.log(`[Feedback] Attempting ${depth} model (${AI_CONFIG[depth].provider})`);
    const result = await generateFeedbackDualModel(answer, metadata, options);
    console.log(`[Feedback] ${depth} model succeeded. evaluationModel=${result.evaluationModel}, evaluationDepth=${result.evaluationDepth}`);
    return result;
  } catch (error) {
    console.error(`[Feedback] AI model failed for ${depth}:`, error);
    console.error(`[Feedback] Error details:`, error instanceof Error ? error.message : String(error));

    if (depth === "advanced") {
      // 付费用户：DeepSeek 失败，尝试 Kimi 作为高质量备份
      console.log("[Feedback] DeepSeek failed, trying Kimi as fallback...");
      try {
        const kimiResult = await generateFeedbackDualModel(answer, metadata, {
          depth: "advanced",
          userType,
          forceProvider: "kimi",
        });
        console.log(`[Feedback] Kimi fallback succeeded. evaluationModel=${kimiResult.evaluationModel}`);
        return kimiResult;
      } catch (kimiError) {
        // Kimi 也失败 → 抛出错误，由外层重试机制处理，最终标记 FAILED 不扣次数
        console.error("[Feedback] Kimi fallback also failed, marking as FAILED");
        throw kimiError;
      }
    }

    // 基础模型失败，使用规则引擎
    console.log("[Feedback] Falling back to rule engine");
    const ruleFeedback = generateRuleBasedFeedback(answer, {
      keyPoints: metadata.keyPoints,
      type: metadata.type,
    });

    return convertRuleEngineToFeedback(ruleFeedback);
  }
}

// 保持向后兼容的 generateFeedback 函数
export async function generateFeedback(
  question: string,
  keyPoints: string,
  userAnswer: string,
  metadata?: QuestionMetadata,
  provider?: string
): Promise<InterviewFeedback> {
  // 如果指定了 provider，使用旧模式
  if (provider) {
    const ai = getAIProvider(provider);

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
      maxTokens: 3000,
    });

    // 解析 JSON 响应（复用原有逻辑）
    try {
      let jsonStr = result.content;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr.trim());

      return {
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
        score: Math.min(100, Math.max(0, Number(parsed.totalScore) || 60)),
        good: parsed.dimensions?.highlights?.strongPoints || ["已完成回答"],
        improve:
          parsed.dimensions?.content?.missing?.concat(parsed.dimensions?.structure?.issues || []) ||
          [],
        suggestion: parsed.improvements?.[0]?.action || "请根据建议改进",
        starAnswer: parsed.optimizedAnswer || "",
      };
    } catch (error) {
      console.error("Failed to parse AI feedback:", error, result.content);
      throw error;
    }
  }

  // 新模式：使用双模型架构（默认深度分析）
  return generateFeedbackWithFallback(
    userAnswer,
    {
      ...metadata,
      keyPoints: keyPoints,
    },
    {
      depth: "advanced",
      userType: "paid",
    }
  );
}

// 快速生成面试点评（保持向后兼容）
export async function generateQuickFeedback(
  question: string,
  keyPoints: string,
  userAnswer: string,
  metadata?: QuestionMetadata,
  provider?: string
): Promise<InterviewFeedback> {
  // 使用双模型的基础分析
  return generateFeedbackWithFallback(
    userAnswer,
    {
      ...metadata,
      keyPoints: keyPoints,
    },
    {
      depth: "basic",
      userType: "free",
    }
  );
}
