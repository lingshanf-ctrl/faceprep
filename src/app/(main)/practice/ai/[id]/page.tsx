"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { VoiceTextarea } from "@/components/voice-textarea";
import { savePracticeRecord } from "@/lib/practice-store";
import { LoadingState } from "@/components/ui/loading-state";
import { AlertCircle } from "lucide-react";
import { AIGeneratedQuestion } from "@prisma/client";

// 与 /questions/[id]/page.tsx 保持一致的题型配色
const typeConfig: Record<string, { label: string; labelZh: string; color: string }> = {
  INTRO:      { label: "Intro",      labelZh: "自我介绍", color: "bg-blue-50 text-blue-600 border-blue-100" },
  PROJECT:    { label: "Project",    labelZh: "项目经历", color: "bg-violet-50 text-violet-600 border-violet-100" },
  TECHNICAL:  { label: "Technical",  labelZh: "技术问题", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  BEHAVIORAL: { label: "Behavioral", labelZh: "行为面试", color: "bg-amber-50 text-amber-600 border-amber-100" },
  HR:         { label: "HR",         labelZh: "HR 问题",  color: "bg-rose-50 text-rose-600 border-rose-100" },
};

const difficultyDots = (difficulty: string) => {
  const n = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
  return Array.from({ length: 3 }, (_, i) => (
    <span
      key={i}
      className={`inline-block w-1.5 h-1.5 rounded-full ${i < n ? "bg-accent" : "bg-border"}`}
    />
  ));
};

export default function AIPracticePage() {
  const params = useParams();
  const router = useRouter();
  const { locale, t } = useLanguage();
  const questionId = params.id as string;

  const [question, setQuestion] = useState<AIGeneratedQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<"zh" | "en">("zh");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showKeyPoints, setShowKeyPoints] = useState(false);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // 计时器（答题中持续计时）
  useEffect(() => {
    const timer = setInterval(() => setElapsedTime(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 从数据库加载题目
  useEffect(() => {
    async function loadQuestion() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/ai-questions/${questionId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setLoadError(locale === "zh" ? "题目不存在或无权访问" : "Question not found or access denied");
          } else if (response.status === 401) {
            setLoadError(locale === "zh" ? "请先登录" : "Please login first");
          } else {
            setLoadError(locale === "zh" ? "加载题目失败" : "Failed to load question");
          }
          return;
        }

        const data = await response.json();
        setQuestion(data.question);
      } catch (err) {
        console.error("加载题目失败:", err);
        setLoadError(locale === "zh" ? "加载题目失败，请重试" : "Failed to load question");
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestion();
  }, [questionId, locale]);

  const handleSubmit = async () => {
    if (!answer.trim() || !question) return;
    if (answer.trim().length < 10) return;
    setIsSubmitting(true);

    try {
      const savedPractice = await savePracticeRecord({
        questionId: question.id,
        questionTitle: question.title,
        questionType: question.type,
        answer,
        score: 60,
        feedback: {
          good: ["回答已提交，AI 正在分析中…"],
          improve: ["请稍后在练习回顾页查看详细反馈"],
          suggestion: "正在生成个性化建议…",
        },
        duration: elapsedTime,
      }, { asyncEvaluate: true });

      if (!savedPractice) throw new Error("保存失败");
      router.push(`/practice/review/${savedPractice.id}`);
    } catch (err) {
      console.error("[AI Practice Submit Error]", err);
      setIsSubmitting(false);
    }
  };

  // ── Loading / Error ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState variant="spinner" fullScreen message={locale === "zh" ? "加载题目中..." : "Loading question..."} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">{loadError}</h2>
          <p className="text-sm text-foreground-muted mb-4">
            {locale === "zh"
              ? "该题目可能已被删除或您没有权限访问"
              : "This question may have been deleted or you don't have permission to access it"}
          </p>
          <Link
            href="/practice/ai-custom"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
          >
            {locale === "zh" ? "返回 AI 定制面试" : "Back to AI Custom Interview"}
          </Link>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState variant="spinner" fullScreen message={locale === "zh" ? "加载题目中..." : "Loading question..."} />
      </div>
    );
  }

  const typeInfo = typeConfig[question.type] ?? { label: question.type, labelZh: question.type, color: "bg-surface text-foreground-muted border-border" };

  // ── Render ──
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* 与 /questions/[id]/page.tsx 完全一致的背景光晕 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-accent/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-32 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-success/4 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">

        {/* ── 导航栏（与单题页完全一致）── */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            {locale === "zh" ? "返回" : "Back"}
          </button>

          <div className="flex items-center gap-1.5 text-xs text-foreground-muted font-mono tabular-nums">
            <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(elapsedTime)}
          </div>
        </div>

        {/* ── 题目区（无卡片，直接在页面上）── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          {/* Meta row */}
          <div className="flex items-center gap-3 mb-5">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${typeInfo.color}`}>
              {locale === "zh" ? typeInfo.labelZh : typeInfo.label}
            </span>
            <span className="flex items-center gap-1">
              {difficultyDots(question.difficulty)}
            </span>
          </div>

          {/* 题目标题 */}
          <h1 className="font-display text-2xl sm:text-3xl md:text-heading-xl font-semibold text-foreground leading-snug tracking-tight">
            {question.title}
          </h1>

          {/* 查看考察点（可折叠）*/}
          {question.keyPoints && (
            <div className="mt-5">
              <button
                onClick={() => setShowKeyPoints(!showKeyPoints)}
                className="inline-flex items-center gap-2 text-xs text-foreground-muted hover:text-foreground transition-colors group"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${showKeyPoints ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="group-hover:underline underline-offset-2">
                  {showKeyPoints
                    ? (locale === "zh" ? "收起考察点" : "Hide key points")
                    : (locale === "zh" ? "查看考察点" : "Show key points")}
                </span>
              </button>

              <AnimatePresence>
                {showKeyPoints && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-2xl border border-border bg-surface/60 backdrop-blur-sm px-4 py-3.5">
                      <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-widest mb-1.5">
                        {locale === "zh" ? "考察重点" : "Key Points"}
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">{question.keyPoints}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* ── 答题区 ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <div className="bg-white rounded-2xl border border-border shadow-subtle p-6 md:p-8">
              <VoiceTextarea
                value={answer}
                onChange={setAnswer}
                placeholder={
                  locale === "zh"
                    ? "在此输入你的回答，尽可能完整地表达你的想法..."
                    : "Type your answer here, express your thoughts as completely as possible..."
                }
                minHeight="240px"
                label={
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-sm font-semibold text-foreground">
                      {t.question?.yourAnswer || (locale === "zh" ? "你的回答" : "Your Answer")}
                    </span>
                    <span className={`text-xs tabular-nums transition-colors ${answer.length > 10 ? "text-foreground-muted" : "text-border"}`}>
                      {answer.length}
                    </span>
                  </div>
                }
                disabled={isSubmitting}
                language={voiceLanguage}
                onLanguageChange={setVoiceLanguage}
              />
            </div>

            {/* 提交行 */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-foreground-muted hidden sm:block">
                {locale === "zh" ? "提交后 AI 将在后台生成深度反馈" : "AI will generate deep feedback after submission"}
              </p>
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || answer.trim().length < 10 || isSubmitting}
                className="ml-auto flex items-center gap-2 px-7 py-3 bg-accent text-white text-sm font-medium rounded-full
                  hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-200 hover:shadow-glow active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {locale === "zh" ? "提交中..." : "Submitting..."}
                  </>
                ) : (
                  <>
                    {t.question?.getFeedback || (locale === "zh" ? "获取反馈" : "Get Feedback")}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
