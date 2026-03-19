"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle, AlertCircle, Brain, Zap } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface EvaluationStatus {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  score?: number;
  feedback?: { aiUpgrading?: boolean; evaluationModel?: string; [key: string]: unknown } | null;
  error?: string;
}

interface AIEvaluationProgressProps {
  practiceId: string;
  onCompleted?: (data: EvaluationStatus) => void;
  onFailed?: () => void;
  /** Phase-1 规则引擎完成时回调（aiUpgrading=true），可用于立即显示基础反馈 */
  onPhase1Completed?: (data: EvaluationStatus) => void;
  /** "card" — 无反馈时的居中卡片；"banner" — 有基础反馈时的顶部细条 */
  variant?: "card" | "banner";
  /** 下一题链接（banner 模式下展示"继续练习"入口） */
  nextQuestionHref?: string;
}

export function AIEvaluationProgress({
  practiceId,
  onCompleted,
  onFailed,
  onPhase1Completed,
  variant = "card",
  nextQuestionHref,
}: AIEvaluationProgressProps) {
  const { locale } = useLanguage();
  const [status, setStatus] = useState<EvaluationStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [justCompleted, setJustCompleted] = useState(false);
  const phase1CalledRef = useRef(false);

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

          if (data.status === "COMPLETED") {
            if (data.feedback?.aiUpgrading) {
              // Phase-1 完成，Phase-2 仍在运行：回显基础反馈（只触发一次）
              if (!phase1CalledRef.current) {
                phase1CalledRef.current = true;
                onPhase1Completed?.(data);
              }
              return;
            }
            setIsPolling(false);
            setJustCompleted(true);
            // 短暂展示"完成"状态后通知父组件
            setTimeout(() => onCompleted?.(data), 800);
          } else if (data.status === "FAILED") {
            setIsPolling(false);
            onFailed?.();
          }
        }
      } catch (error) {
        console.error("Failed to fetch evaluation status:", error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceId, isPolling]);

  // 触发评估（已完成的记录 API 会直接返回，为 no-op）
  useEffect(() => {
    if (!practiceId) return;
    fetch("/api/practices/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ practiceId }),
    }).catch(console.error);
  }, [practiceId]);

  const isAIUpgrading = status?.status === "COMPLETED" && status.feedback?.aiUpgrading;
  const isRunning = !justCompleted && (status?.status === "PENDING" || status?.status === "PROCESSING" || isAIUpgrading);
  const progress = status?.progress ?? 0;

  // ─── Banner 模式（有基础反馈时的顶部细条） ────────────────────────────
  if (variant === "banner") {
    return (
      <AnimatePresence>
        {(isRunning || justCompleted) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={`mb-5 rounded-2xl border px-4 py-3 ${
              justCompleted
                ? "bg-emerald-50 border-emerald-200"
                : "bg-accent/5 border-accent/15"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* 状态图标 */}
              <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                justCompleted ? "bg-emerald-100" : "bg-accent/10"
              }`}>
                {justCompleted ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  >
                    <Brain className="w-4 h-4 text-accent" />
                  </motion.div>
                )}
              </div>

              {/* 文字 */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${justCompleted ? "text-emerald-700" : "text-accent"}`}>
                  {justCompleted
                    ? (locale === "zh" ? "深度分析完成，正在更新报告…" : "Deep analysis done, updating report…")
                    : (isAIUpgrading
                        ? (locale === "zh" ? "AI 深度分析中，完成后自动更新" : "AI deep analysis in progress, auto-updating when done")
                        : (locale === "zh" ? "AI 正在分析您的回答…" : "AI is analyzing your answer…")
                      )
                  }
                </p>

                {/* 进度条 */}
                {!justCompleted && (
                  <div className="mt-1.5 h-1 bg-accent/15 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: isAIUpgrading ? "70%" : `${progress}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                    {/* 流光 */}
                    <motion.div
                      className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ["-100%", "400%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                )}
              </div>

              {/* 右侧操作 */}
              {!justCompleted && nextQuestionHref && (
                <a
                  href={nextQuestionHref}
                  className="shrink-0 text-xs text-foreground-muted hover:text-foreground border border-border rounded-lg px-3 py-1.5 bg-white transition-colors whitespace-nowrap"
                >
                  {locale === "zh" ? "先去练习" : "Practice now"}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ─── Card 模式（无任何反馈时的居中加载卡） ──────────────────────────────
  return (
    <div className="mb-6">
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        {/* 图标和标题 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            {justCompleted ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center"
              >
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </motion.div>
            ) : status?.status === "FAILED" ? (
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-rose-500" />
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
                <span className="absolute inset-0 rounded-xl bg-accent/15 animate-ping" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-medium text-foreground">
              {justCompleted
                ? (locale === "zh" ? "分析完成！" : "Analysis complete!")
                : status?.status === "FAILED"
                  ? (locale === "zh" ? "分析失败" : "Analysis failed")
                  : status?.status === "PROCESSING"
                    ? (locale === "zh" ? "AI 正在分析您的回答…" : "AI is analyzing your answer…")
                    : (locale === "zh" ? "准备中…" : "Preparing…")
              }
            </h3>
            <p className="text-sm text-foreground-muted mt-0.5">
              {justCompleted
                ? (locale === "zh" ? "正在加载结果…" : "Loading results…")
                : status?.status === "FAILED"
                  ? (status.error ?? (locale === "zh" ? "请刷新页面重试" : "Please refresh to retry"))
                  : status?.status === "PROCESSING"
                    ? (locale === "zh" ? `正在生成个性化反馈… ${progress}%` : `Generating feedback… ${progress}%`)
                    : (locale === "zh" ? "正在启动 AI 分析引擎…" : "Starting AI analysis engine…")
              }
            </p>
          </div>
        </div>

        {/* 进度条 */}
        {!justCompleted && status?.status !== "FAILED" && (
          <div className="relative h-1.5 bg-surface rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent-light rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            {status?.status === "PROCESSING" && (
              <motion.div
                className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>
        )}

        {/* 底部提示 + 跳过操作 */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-foreground-muted">
            {status?.status === "PROCESSING"
              ? (locale === "zh" ? "预计还需 10–15 秒" : "~10–15 seconds remaining")
              : status?.status === "PENDING"
                ? (locale === "zh" ? "正在排队等待…" : "Queued for analysis…")
                : (locale === "zh" ? "分析完成后将自动显示结果" : "Results will appear automatically")
            }
          </p>
          {nextQuestionHref && (
            <a
              href={nextQuestionHref}
              className="flex items-center gap-1.5 text-xs text-foreground-muted hover:text-accent transition-colors"
            >
              <Zap className="w-3 h-3" />
              {locale === "zh" ? "先去练习其他题" : "Practice another question"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
