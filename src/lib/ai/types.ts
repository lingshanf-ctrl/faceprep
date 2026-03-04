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
  if (status === 403 && errorText.includes("content")) return "CONTENT_FILTERED";
  if (status === 0 || !navigator.onLine) return "NETWORK_ERROR";
  return "UNKNOWN";
}

// 面试点评结果
export interface InterviewFeedback {
  score: number;
  good: string[];
  improve: string[];
  suggestion: string;
  starAnswer?: string;
}
