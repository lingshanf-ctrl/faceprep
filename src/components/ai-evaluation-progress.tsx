"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, CheckCircle, AlertCircle, Brain } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface EvaluationStatus {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  score?: number;
  error?: string;
}

interface AIEvaluationProgressProps {
  practiceId: string;
  onCompleted?: () => void;
  onFailed?: () => void;
}

export function AIEvaluationProgress({
  practiceId,
  onCompleted,
  onFailed,
}: AIEvaluationProgressProps) {
  const { locale } = useLanguage();
  const [status, setStatus] = useState<EvaluationStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // 轮询获取评估状态
  useEffect(() => {
    if (!practiceId || !isPolling) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `/api/practices/evaluation-status?practiceId=${practiceId}`
        );
        if (response.ok) {
          const data = await response.json();
          setStatus(data);

          // 评估完成
          if (data.status === "COMPLETED") {
            setIsPolling(false);
            onCompleted?.();
          }
          // 评估失败
          else if (data.status === "FAILED") {
            setIsPolling(false);
            onFailed?.();
          }
        }
      } catch (error) {
        console.error("Failed to fetch evaluation status:", error);
      }
    };

    // 立即获取一次
    fetchStatus();

    // 每3秒轮询一次
    const interval = setInterval(fetchStatus, 3000);

    return () => clearInterval(interval);
  }, [practiceId, isPolling, onCompleted, onFailed]);

  // 触发评估
  useEffect(() => {
    if (!practiceId) return;

    const startEvaluation = async () => {
      try {
        await fetch("/api/practices/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ practiceId }),
        });
      } catch (error) {
        console.error("Failed to start evaluation:", error);
      }
    };

    startEvaluation();
  }, [practiceId]);

  const getStatusText = () => {
    switch (status?.status) {
      case "PENDING":
        return locale === "zh" ? "等待评估..." : "Waiting...";
      case "PROCESSING":
        return locale === "zh" ? "AI正在分析您的回答..." : "AI is analyzing...";
      case "COMPLETED":
        return locale === "zh" ? "分析完成！" : "Analysis completed!";
      case "FAILED":
        return locale === "zh" ? "分析失败" : "Analysis failed";
      default:
        return locale === "zh" ? "准备中..." : "Preparing...";
    }
  };

  const getStatusSubtext = () => {
    switch (status?.status) {
      case "PENDING":
        return locale === "zh"
          ? "正在排队等待AI评估"
          : "Queued for AI evaluation";
      case "PROCESSING":
        return locale === "zh"
          ? `正在生成个性化反馈和建议... ${status.progress}%`
          : `Generating personalized feedback... ${status.progress}%`;
      case "COMPLETED":
        return locale === "zh" ? "正在加载结果..." : "Loading results...";
      case "FAILED":
        return status.error || (locale === "zh" ? "请稍后重试" : "Please try again later");
      default:
        return locale === "zh" ? "初始化中..." : "Initializing...";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-border p-6 shadow-soft-md">
        {/* 图标和标题 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            {status?.status === "COMPLETED" ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center"
              >
                <CheckCircle className="w-6 h-6 text-success" />
              </motion.div>
            ) : status?.status === "FAILED" ? (
              <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-error" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  {status?.status === "PROCESSING" ? (
                    <Brain className="w-6 h-6 text-accent" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-accent" />
                  )}
                </motion.div>
              </div>
            )}

            {/* 脉冲动画 */}
            {status?.status !== "COMPLETED" && status?.status !== "FAILED" && (
              <span className="absolute inset-0 rounded-xl bg-accent/20 animate-ping" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-medium text-foreground">{getStatusText()}</h3>
            <p className="text-sm text-foreground-muted">{getStatusSubtext()}</p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="relative h-2 bg-surface rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent-light rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${status?.progress || 0}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          {/* 闪光效果 */}
          {status?.status === "PROCESSING" && (
            <motion.div
              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          )}
        </div>

        {/* 预计时间提示 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-foreground-muted">
            {status?.status === "PROCESSING"
              ? locale === "zh"
                ? "预计还需10-15秒"
                : "About 10-15 seconds left"
              : status?.status === "PENDING"
              ? locale === "zh"
                ? "正在启动AI分析引擎..."
                : "Starting AI analysis engine..."
              : status?.status === "FAILED"
              ? locale === "zh"
                ? "您可以刷新页面重试"
                : "You can refresh to retry"
              : locale === "zh"
              ? "分析完成后将自动显示结果"
              : "Results will be displayed automatically"}
          </p>
        </div>
      </div>
    </div>
  );
}
