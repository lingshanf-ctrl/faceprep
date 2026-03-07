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
}
