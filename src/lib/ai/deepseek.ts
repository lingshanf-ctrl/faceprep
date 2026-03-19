import { AIProvider, AICompletionOptions, AICompletionResult, AIError, classifyAIError } from "./types";

const API_TIMEOUT = 30000; // 30秒超时
const MAX_RETRIES = 2;     // 最大重试次数

export class DeepSeekProvider implements AIProvider {
  name = "deepseek";
  private apiKey: string;
  private baseUrl = "https://api.deepseek.com/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || "";
  }

  async complete(
    options: AICompletionOptions,
    abortSignal?: AbortSignal
  ): Promise<AICompletionResult> {
    if (!this.apiKey) {
      throw new AIError("DeepSeek API key not configured", "INVALID_API_KEY", false);
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
          model: "deepseek-chat",
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
          `DeepSeek API error: ${response.status} - ${errorText}`,
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
        `DeepSeek request failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "NETWORK_ERROR",
        true
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
