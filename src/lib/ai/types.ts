// AI 服务类型定义

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AICompletionResult {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProvider {
  name: string;
  complete(options: AICompletionOptions, abortSignal?: AbortSignal): Promise<AICompletionResult>;
  // 流式响应支持（可选）
  stream?(options: AIStreamOptions, abortSignal?: AbortSignal): Promise<void>;
}

// 流式响应选项
export interface AIStreamOptions extends AICompletionOptions {
  onChunk: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: AIError) => void;
}

// AI 错误类型
export class AIError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public retryable: boolean = false,
    public retryAfter?: number
  ) {
    super(message);
    this.name = "AIError";
  }
}

export type AIErrorCode =
  | "TIMEOUT"           // 请求超时
  | "RATE_LIMIT"        // 速率限制
  | "INVALID_API_KEY"   // API 密钥无效
  | "INSUFFICIENT_BALANCE" // 余额不足
  | "CONTENT_FILTERED"  // 内容被过滤
  | "NETWORK_ERROR"     // 网络错误
  | "PARSE_ERROR"       // 响应解析错误
  | "UNKNOWN";          // 未知错误

export function classifyAIError(status: number, errorText: string): AIErrorCode {
  if (status === 401) return "INVALID_API_KEY";
  if (status === 429) return "RATE_LIMIT";
  if (status === 402) return "INSUFFICIENT_BALANCE";
  // 400错误可能是欠费（如阿里云 qwen）
  if (status === 400 && errorText.includes("Arrearage")) return "INSUFFICIENT_BALANCE";
  if (status === 400 && errorText.includes("Access denied")) return "INVALID_API_KEY";
  if (status === 403 && errorText.includes("content")) return "CONTENT_FILTERED";
  if (status === 0) return "NETWORK_ERROR";
  // Only check navigator.onLine in browser environment
  if (typeof navigator !== "undefined" && !navigator.onLine) return "NETWORK_ERROR";
  return "UNKNOWN";
}

// 多维度评分项
export interface DimensionScore {
  score: number;
  feedback: string;
}

// 内容完整性维度（覆盖考察点、具体案例、数据支撑）
export interface ContentDimension extends DimensionScore {
  missing: string[];
}

// 结构逻辑性维度（STAR法则、条理清晰）
export interface StructureDimension extends DimensionScore {
  issues: string[];
}

// 表达专业性维度（用词准确、无冗余、自信度）
export interface ExpressionDimension extends DimensionScore {
  suggestions: string[];
}

// 差异化亮点维度（独特洞察、超预期表现）
export interface HighlightsDimension extends DimensionScore {
  strongPoints: string[];
}

// 四维能力评估
export interface DimensionScores {
  content: ContentDimension;
  structure: StructureDimension;
  expression: ExpressionDimension;
  highlights: HighlightsDimension;
}

// 差距分析项
export interface GapItem {
  location: string;
  description: string;
  suggestion?: string;
}

// 差距分析结果
export interface GapAnalysis {
  missing: GapItem[];
  insufficient: GapItem[];
  good: GapItem[];
  excellent: GapItem[];
}

// 可执行改进建议
export interface ImprovementAction {
  priority: "high" | "medium" | "low";
  action: string;
  expectedGain: string;
}

// 面试点评结果（新版 - 面试教练级）
export interface InterviewFeedback {
  // 总分（0-100）
  totalScore: number;

  // 四维能力评估
  dimensions: DimensionScores;

  // 差距分析（对比参考答案）
  gapAnalysis: GapAnalysis;

  // 可执行改进清单
  improvements: ImprovementAction[];

  // 优化版回答示例（基于用户风格改进）
  optimizedAnswer: string;

  // 教练寄语
  coachMessage: string;

  // 兼容旧版字段
  score?: number;
  good?: string[];
  improve?: string[];
  suggestion?: string;
  starAnswer?: string;

  // 双模型架构新增字段
  evaluationModel?: "qwen" | "kimi" | "deepseek" | "rule-engine";
  evaluationDepth?: "basic" | "advanced";

  // 目标用户类型（标识这个反馈是为哪种类型的用户生成的）
  targetUserType?: "free" | "paid";

  // ============================================================
  // 基础版新增字段（免费用户 - 钩子策略）
  // ============================================================

  // 关键发现（增强版）
  keyFindings?: {
    strengths: string[];
    weaknesses: string[];
    criticalMissing?: string; // 最关键的缺失点
  };

  // 快速建议（结构化）
  quickAdvice?: {
    primary: string; // 主要建议
    secondary?: string; // 次要建议
  };

  // 升级预告（钩子）
  upgradeTeaser?: UpgradeTeaser;

  // ============================================================
  // 高级版新增字段（付费用户 - 深度分析）
  // ============================================================

  // 修改前后对比示例
  modificationExamples?: ModificationExample[];
}

// ============================================================
// 基础版反馈新增类型（免费用户 - 钩子策略）
// ============================================================

// 维度评分（基础版 - 带预览钩子）
export interface BasicDimensionScore extends DimensionScore {
  preview?: string; // 深度分析预览（钩子）
  potential?: string; // 潜力挖掘方向（仅 highlights 维度）
}

// 升级预告（激发付费意愿）
export interface UpgradeTeaser {
  gapHint: string; // 差距提示（如："对比优秀回答，你在XX方面存在差距"）
  optimizedPreview: string; // 优化版预览（前20字）
  coachInsight: string; // 教练洞察（模糊但吸引人的点评）
}

// ============================================================
// 高级版反馈新增类型（付费用户 - 深度分析）
// ============================================================

// 引用分析（针对用户原文）
export interface QuoteAnalysis {
  original: string; // 用户原文摘录
  analysis: string; // 问题分析
  suggestion: string; // 改进建议
}

// 用词改进示例
export interface WordChoiceExample {
  original: string; // 原用词/表达
  improved: string; // 改进后的表达
  reason: string; // 为什么这样改更好
}

// 修改前后对比示例
export interface ModificationExample {
  original: string; // 用户原文摘录
  problem: string; // 存在的问题
  improved: string; // 修改后的文本
  impact: string; // 修改后的效果提升
}

// 增强版差距分析项（带原文引用）
export interface EnhancedGapItem extends GapItem {
  userQuote?: string; // 用户原文引用
  referenceQuote?: string; // 参考答案引用
  referenceContent?: string; // 参考答案内容摘要
  why?: string; // 为什么出色/重要
}

// 增强版内容维度（带引用分析）
export interface EnhancedContentDimension extends ContentDimension {
  quotes?: QuoteAnalysis[];
}

// 增强版结构维度（带框架分析）
export interface EnhancedStructureDimension extends StructureDimension {
  frameworkAnalysis?: string; // 答题框架使用分析
}

// 增强版表达维度（带用词改进示例）
export interface EnhancedExpressionDimension extends ExpressionDimension {
  wordChoiceExamples?: WordChoiceExample[];
}

// 增强版亮点维度
export interface EnhancedHighlightsDimension extends HighlightsDimension {
  uniqueInsights?: string; // 独特见解
  potentialToExplore?: string; // 可挖掘的方向
}

// 增强版差距分析
export interface EnhancedGapAnalysis {
  missing: EnhancedGapItem[];
  insufficient: EnhancedGapItem[];
  good: EnhancedGapItem[];
  excellent: EnhancedGapItem[];
}

// 增强版改进建议
export interface EnhancedImprovementAction extends ImprovementAction {
  example?: string; // 示例或说明
}
