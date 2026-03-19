import { AIProvider, AICompletionOptions, AICompletionResult, AIError, AIStreamOptions, classifyAIError } from "./types";

const API_TIMEOUT = 60000; // 60秒超时（支持kimi-k2.5深度分析）
const MAX_RETRIES = 2;     // 最大重试次数

// 通用 OpenAI 兼容适配器（支持通义千问、文心一言等）
export class OpenAICompatibleProvider implements AIProvider {
  name: string;
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: {
    name: string;
    apiKey: string;
    baseUrl: string;
    model: string;
  }) {
    this.name = config.name;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.model = config.model;
  }

  async complete(
    options: AICompletionOptions,
    abortSignal?: AbortSignal
  ): Promise<AICompletionResult> {
    if (!this.apiKey) {
      throw new AIError(`${this.name} API key not configured`, "INVALID_API_KEY", false);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.makeRequest(options, abortSignal);
      } catch (error) {
        lastError = error as Error;

        // 检查是否应该重试
        if (error instanceof AIError) {
          // 不重试的错误类型（超时说明服务慢，重试只会更慢）
          if (!error.retryable ||
              error.code === "INVALID_API_KEY" ||
              error.code === "INSUFFICIENT_BALANCE" ||
              error.code === "CONTENT_FILTERED" ||
              error.code === "TIMEOUT") {
            throw error;
          }

          // 速率限制时等待后重试
          if (error.code === "RATE_LIMIT" && error.retryAfter) {
            await this.delay(error.retryAfter * 1000);
            continue;
          }
        }

        // 最后一次尝试失败，抛出错误
        if (attempt === MAX_RETRIES) {
          throw error;
        }

        // 指数退避重试
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw lastError || new AIError("Unknown error", "UNKNOWN");
  }

  private async makeRequest(
    options: AICompletionOptions,
    externalSignal?: AbortSignal
  ): Promise<AICompletionResult> {
    const controller = new AbortController();
    const effectiveTimeout = options.timeoutMs ?? API_TIMEOUT;
    const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

    // 合并外部 signal（如果提供）
    if (externalSignal) {
      externalSignal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const errorCode = classifyAIError(response.status, errorText);

        // 解析重试时间
        let retryAfter: number | undefined;
        const retryHeader = response.headers.get("retry-after");
        if (retryHeader) {
          retryAfter = parseInt(retryHeader, 10);
        }

        throw new AIError(
          `${this.name} API error: ${response.status} - ${errorText}`,
          errorCode,
          errorCode === "RATE_LIMIT" || errorCode === "NETWORK_ERROR" || errorCode === "TIMEOUT",
          retryAfter
        );
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      };

      return {
        content: data.choices?.[0]?.message?.content || "",
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens ?? 0,
              completionTokens: data.usage.completion_tokens ?? 0,
              totalTokens: data.usage.total_tokens ?? 0,
            }
          : undefined,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AIError) {
        throw error;
      }

      // 处理 AbortError（超时或取消）
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new AIError("Request timeout after 30s", "TIMEOUT", true);
        }
      }

      throw new AIError(
        `${this.name} request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "NETWORK_ERROR",
        true
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 流式响应方法
  async stream(
    options: AIStreamOptions,
    abortSignal?: AbortSignal
  ): Promise<void> {
    if (!this.apiKey) {
      const error = new AIError(`${this.name} API key not configured`, "INVALID_API_KEY", false);
      options.onError?.(error);
      throw error;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT * 2); // 流式请求双倍超时

    if (abortSignal) {
      abortSignal.addEventListener("abort", () => controller.abort());
    }

    let fullContent = "";

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000,
          stream: true, // 启用流式响应
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const errorCode = classifyAIError(response.status, errorText);
        const error = new AIError(
          `${this.name} API error: ${response.status} - ${errorText}`,
          errorCode,
          errorCode === "RATE_LIMIT" || errorCode === "NETWORK_ERROR"
        );
        options.onError?.(error);
        throw error;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        const error = new AIError("No response body", "NETWORK_ERROR", true);
        options.onError?.(error);
        throw error;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 解析 SSE 数据
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // 保留未完成的行

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const chunk = json.choices?.[0]?.delta?.content || "";
              if (chunk) {
                fullContent += chunk;
                options.onChunk(chunk);
              }
            } catch {
              // 忽略解析错误的行
            }
          }
        }
      }

      options.onComplete?.(fullContent);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AIError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        const timeoutError = new AIError("Stream request timeout", "TIMEOUT", true);
        options.onError?.(timeoutError);
        throw timeoutError;
      }

      const networkError = new AIError(
        `${this.name} stream failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "NETWORK_ERROR",
        true
      );
      options.onError?.(networkError);
      throw networkError;
    }
  }
}
