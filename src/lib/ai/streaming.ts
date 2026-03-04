// AI 流式响应支持

import { AIProvider, AIMessage } from "./types";

export interface StreamOptions {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  onChunk: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

// 流式完成（打字机效果）
export async function streamComplete(
  provider: AIProvider,
  options: StreamOptions
): Promise<void> {
  const { messages, temperature = 0.7, maxTokens = 2000, onChunk } = options;

  // 创建 AbortController 用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    // 注意：这需要 AI 服务支持流式输出
    // 目前先用模拟流式效果
    const result = await provider.complete({
      messages,
      temperature,
      maxTokens,
    });

    clearTimeout(timeoutId);

    // 模拟打字机效果
    const content = result.content;
    const chunkSize = 3; // 每次显示3个字符

    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.slice(i, i + chunkSize);
      onChunk(chunk);
      // 随机延迟模拟打字
      await new Promise((resolve) =>
        setTimeout(resolve, 30 + Math.random() * 50)
      );
    }

    options.onComplete?.();
  } catch (error) {
    clearTimeout(timeoutId);
    options.onError?.(error as Error);
  }
}

// 解析流式响应（SSE 格式）
export function parseSSEChunk(chunk: string): string {
  const lines = chunk.split("\n");
  let content = "";

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6);
      if (data === "[DONE]") break;

      try {
        const parsed = JSON.parse(data);
        content += parsed.choices?.[0]?.delta?.content || "";
      } catch {
        // 忽略解析错误
      }
    }
  }

  return content;
}
