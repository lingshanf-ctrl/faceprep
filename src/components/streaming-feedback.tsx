"use client";

import { useState, useEffect, useCallback } from "react";

// 快速反馈类型
interface QuickFeedback {
  totalScore: number;
  quickSummary: string;
  topStrength: string;
  topImprovement: string;
  coachTip: string;
}

interface StreamingFeedbackProps {
  question: string;
  keyPoints: string;
  answer: string;
  onComplete?: (feedback: QuickFeedback) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function StreamingFeedback({
  question,
  keyPoints,
  answer,
  onComplete,
  onError,
  className = "",
}: StreamingFeedbackProps) {
  const [status, setStatus] = useState<"idle" | "streaming" | "complete" | "error">("idle");
  const [streamContent, setStreamContent] = useState("");
  const [feedback, setFeedback] = useState<QuickFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startStream = useCallback(async () => {
    if (!question || !answer) return;

    setStatus("streaming");
    setStreamContent("");
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch("/api/feedback/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, keyPoints, answer }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "请求失败");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法读取响应");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 解析 SSE 数据
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));

            if (data.chunk) {
              setStreamContent((prev) => prev + data.chunk);
            }

            if (data.done && data.feedback) {
              setFeedback(data.feedback);
              setStatus("complete");
              onComplete?.(data.feedback);
            }

            if (data.error) {
              setError(data.error);
              setStatus("error");
              onError?.(data.error);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      setError(errorMessage);
      setStatus("error");
      onError?.(errorMessage);
    }
  }, [question, keyPoints, answer, onComplete, onError]);

  // 自动开始流式请求
  useEffect(() => {
    if (question && answer && status === "idle") {
      startStream();
    }
  }, [question, answer, status, startStream]);

  // 获取分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50 border-emerald-200";
    if (score >= 60) return "bg-amber-50 border-amber-200";
    return "bg-rose-50 border-rose-200";
  };

  if (status === "idle") {
    return null;
  }

  return (
    <div className={`rounded-xl border bg-white overflow-hidden ${className}`}>
      {/* 流式内容显示 */}
      {status === "streaming" && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <span className="text-sm text-foreground-muted">AI 正在分析...</span>
          </div>
          <div className="text-sm text-foreground whitespace-pre-wrap animate-pulse">
            {streamContent || "正在生成评估..."}
          </div>
        </div>
      )}

      {/* 完成状态 - 显示解析后的反馈 */}
      {status === "complete" && feedback && (
        <div className="divide-y divide-slate-100">
          {/* 分数头部 */}
          <div className={`p-4 ${getScoreBgColor(feedback.totalScore)} border-b`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-3xl font-bold ${getScoreColor(feedback.totalScore)}`}>
                  {feedback.totalScore}
                </div>
                <div className="text-sm text-foreground-muted">综合评分</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">{feedback.quickSummary}</div>
              </div>
            </div>
          </div>

          {/* 亮点 */}
          <div className="p-4 bg-emerald-50/50">
            <div className="flex items-start gap-2">
              <span className="text-emerald-500 font-medium">+</span>
              <div>
                <div className="text-xs font-medium text-emerald-700 mb-1">最大亮点</div>
                <div className="text-sm text-foreground">{feedback.topStrength}</div>
              </div>
            </div>
          </div>

          {/* 改进点 */}
          <div className="p-4 bg-amber-50/50">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 font-medium">!</span>
              <div>
                <div className="text-xs font-medium text-amber-700 mb-1">最需改进</div>
                <div className="text-sm text-foreground">{feedback.topImprovement}</div>
              </div>
            </div>
          </div>

          {/* 教练建议 */}
          <div className="p-4 bg-accent/5">
            <div className="flex items-start gap-2">
              <span className="text-accent">💡</span>
              <div>
                <div className="text-xs font-medium text-accent mb-1">教练建议</div>
                <div className="text-sm text-foreground">{feedback.coachTip}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {status === "error" && (
        <div className="p-4 bg-rose-50">
          <div className="flex items-center gap-2 text-rose-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium">{error || "评估失败"}</span>
          </div>
          <button
            onClick={() => {
              setStatus("idle");
              setTimeout(startStream, 100);
            }}
            className="mt-3 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors"
          >
            重试
          </button>
        </div>
      )}
    </div>
  );
}

// Hook 版本，用于更灵活的集成
export function useStreamingFeedback() {
  const [status, setStatus] = useState<"idle" | "streaming" | "complete" | "error">("idle");
  const [streamContent, setStreamContent] = useState("");
  const [feedback, setFeedback] = useState<QuickFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startStream = useCallback(
    async (question: string, keyPoints: string, answer: string) => {
      setStatus("streaming");
      setStreamContent("");
      setFeedback(null);
      setError(null);

      try {
        const response = await fetch("/api/feedback/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, keyPoints, answer }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "请求失败");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("无法读取响应");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(trimmed.slice(6));

              if (data.chunk) {
                setStreamContent((prev) => prev + data.chunk);
              }

              if (data.done && data.feedback) {
                setFeedback(data.feedback);
                setStatus("complete");
                return data.feedback;
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                throw e;
              }
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "未知错误";
        setError(errorMessage);
        setStatus("error");
        throw new Error(errorMessage);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setStreamContent("");
    setFeedback(null);
    setError(null);
  }, []);

  return {
    status,
    streamContent,
    feedback,
    error,
    startStream,
    reset,
  };
}
