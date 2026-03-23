"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { VoiceTextarea } from "@/components/voice-textarea";
import { LoadingState } from "@/components/ui/loading-state";

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
import {
  getInterviewSessionAsync,
  startInterviewAsync,
  submitAnswerAsync,
  completeInterviewAsync,
  InterviewSession,
} from "@/lib/interview-store";

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLanguage();
  const interviewId = params.id as string;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<"zh" | "en">("zh");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showKeyPoints, setShowKeyPoints] = useState(false);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // 加载面试会话
  useEffect(() => {
    async function loadSession() {
      const loadedSession = await getInterviewSessionAsync(interviewId);
      if (!loadedSession) {
        router.push("/practice");
        return;
      }

      // 如果是pending状态，开始面试
      let sessionToSet = loadedSession;
      if (loadedSession.status === "pending") {
        await startInterviewAsync(interviewId);
        sessionToSet = { ...loadedSession, status: "in_progress" as const };
      }

      // 如果已完成，跳转到报告页
      if (sessionToSet.status === "completed") {
        router.push(`/interview/${interviewId}/report`);
        return;
      }

      setSession(sessionToSet);
      setCurrentQuestionIndex(loadedSession.answers.length);
      setQuestionStartTime(Date.now());
    }

    loadSession();
  }, [interviewId, router]);

  // 计时器
  useEffect(() => {
    const timer = setInterval(() => setElapsedTime(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 切换题目时重置计时器和考察点展开状态
  useEffect(() => {
    setElapsedTime(0);
    setShowKeyPoints(false);
  }, [currentQuestionIndex]);

  // 后台异步评估答案 - 使用新的评估队列系统
  const evaluateInBackground = useCallback(async (answerId?: string) => {
    try {
      // 调用评估处理 API
      await fetch("/api/interview/process-evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: interviewId,
          answerId, // 如果指定了 answerId，只处理单个答案
        }),
      });
    } catch (error) {
      console.error("Background evaluation failed:", error);
    }
  }, [interviewId]);

  // 提交当前答案并进入下一题（异步优化版）
  const handleSubmit = async () => {
    if (!answer.trim() || !session) return;

    const currentQuestion = session.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setIsSubmitting(true);

    // 计算用时
    const duration = Math.floor((Date.now() - questionStartTime) / 1000);

    // 先提交答案（使用默认分数，不等待AI评估）
    const interviewAnswer = {
      questionId: currentQuestion.id,
      answer,
      score: 70, // 默认分数，等待AI评估后更新
      feedback: {
        good: ["回答已提交，AI正在分析中..."],
        improve: ["请稍后在报告中查看详细反馈"],
        suggestion: "正在生成个性化建议...",
      },
      duration,
      startedAt: new Date(questionStartTime).toISOString(),
      completedAt: new Date().toISOString(),
    };

    await submitAnswerAsync(interviewId, interviewAnswer);

    // 立即进入下一题（不等待AI评估）
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < session.questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setAnswer("");
      setQuestionStartTime(Date.now());
      setIsSubmitting(false);

      // 后台异步触发 AI 评估（使用评估队列系统）
      evaluateInBackground();
    } else {
      // 完成面试 - 标记为正在完成，防止重复点击
      setIsCompleting(true);

      try {
        // 先触发后台评估（不等待完成）
        evaluateInBackground();

        // 完成面试并跳转到报告页
        const completed = await completeInterviewAsync(interviewId);

        if (completed) {
          // 使用 replace 而不是 push，防止用户返回到面试页面
          router.replace(`/interview/${interviewId}/report`);
        } else {
          // 完成失败，允许用户重试
          setIsCompleting(false);
          setSubmitError(locale === "zh" ? "完成面试失败，请重试" : "Failed to complete interview, please retry");
        }
      } catch (error) {
        console.error("Complete interview error:", error);
        setIsCompleting(false);
        setSubmitError(locale === "zh" ? "完成面试失败，请重试" : "Failed to complete interview, please retry");
      }
    }
  };

  // 跳过当前题目
  const handleSkip = async () => {
    if (!session || isSubmitting) return;

    // 防止重复提交
    setIsSubmitting(true);

    const currentQuestion = session.questions[currentQuestionIndex];
    const duration = Math.floor((Date.now() - questionStartTime) / 1000);

    const interviewAnswer = {
      questionId: currentQuestion.id,
      answer: "（跳过）",
      score: 0,
      feedback: {
        good: [],
        improve: ["建议认真准备此类问题"],
        suggestion: "面试中不建议跳过问题，可以尝试回答哪怕是不完整的答案。",
      },
      duration,
      startedAt: new Date(questionStartTime).toISOString(),
      completedAt: new Date().toISOString(),
    };

    await submitAnswerAsync(interviewId, interviewAnswer);

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < session.questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setAnswer("");
      setQuestionStartTime(Date.now());
      setIsSubmitting(false);
    } else {
      // 立即完成面试并跳转
      setIsCompleting(true);

      try {
        const completed = await completeInterviewAsync(interviewId);

        if (completed) {
          router.replace(`/interview/${interviewId}/report`);
        } else {
          setIsCompleting(false);
          setSubmitError(locale === "zh" ? "完成面试失败，请重试" : "Failed to complete interview, please retry");
        }
      } catch (error) {
        console.error("Complete interview error:", error);
        setIsCompleting(false);
        setSubmitError(locale === "zh" ? "完成面试失败，请重试" : "Failed to complete interview, please retry");
      }
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState
          variant="spinner"
          fullScreen
          message={locale === "zh" ? "加载面试中..." : "Loading interview..."}
        />
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const typeInfo = typeConfig[currentQuestion.type] ?? { label: currentQuestion.type, labelZh: currentQuestion.type, color: "bg-surface text-foreground-muted border-border" };

  return (
    <div className="min-h-screen bg-background">
      {/* Immersive Top Bar */}
      <nav className="fixed top-0 left-0 md:left-64 right-0 z-40 flex justify-between items-center px-6 md:px-8 py-4 bg-[#fcf9f8]/80 backdrop-blur-md border-b border-[#c3c6d7]/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-gradient flex items-center justify-center">
            <span className="text-white text-xs font-bold font-display">FP</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#f6f3f2] rounded-full">
            <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-[#5f5e5e] uppercase tracking-widest">
              {locale === "zh" ? "进行中" : "Live"}: {formatTime(elapsedTime)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Mobile progress */}
          <div className="flex sm:hidden items-center gap-2 text-xs text-[#5f5e5e]">
            {currentQuestionIndex + 1} / {session.questions.length}
          </div>
          <button
            onClick={() => setShowExitConfirm(true)}
            className="px-4 py-2 bg-[#eae7e7] text-foreground text-sm font-bold rounded-lg hover:bg-[#e5e2e1] transition-all active:scale-95"
          >
            {locale === "zh" ? "退出面试" : "Exit Interview"}
          </button>
        </div>
      </nav>

      <div className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left: Main interview area (9 cols) */}
        <div className="lg:col-span-9">

        {/* Mobile progress */}
        <div className="lg:hidden flex items-center gap-2 mb-6 text-sm">
          <span className="text-[#5f5e5e]">{locale === "zh" ? "进度" : "Progress"}</span>
          <span className="font-bold text-[#004ac6]">{currentQuestionIndex + 1} / {session.questions.length}</span>
          <div className="flex-1 h-1 bg-[#eae7e7] rounded-full">
            <div
              className="h-full bg-[#004ac6] rounded-full transition-all duration-500"
              style={{ width: `${((currentQuestionIndex + 1) / session.questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* ── 题目区（Stitch style: border-l-4）── */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 bg-[#f6f3f2] rounded-xl p-6 md:p-10 border-l-4 border-[#004ac6]"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#004ac6] font-display font-extrabold text-lg">
              {String(currentQuestionIndex + 1).padStart(2, "0")}
            </span>
            <span className="h-px w-8 bg-[#c3c6d7]" />
          {/* Meta row：题型徽章 + 难度点 */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${typeInfo.color}`}>
              {locale === "zh" ? typeInfo.labelZh : typeInfo.label}
            </span>
            <span className="flex items-center gap-1">
              {difficultyDots(currentQuestion.difficulty)}
            </span>
          </div>
          </div>

          {/* 题目标题 */}
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-snug tracking-tight mb-0">
            {currentQuestion.title}
          </h1>

          {/* 查看考察点（可折叠，与单题页"查看备考参考"一致） */}
          {currentQuestion.keyPoints && (
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
                      <p className="text-sm text-foreground leading-relaxed">{currentQuestion.keyPoints}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* ── 答题区（白色卡片，与单题页一致）── */}
        <motion.div
          key={`answer-${currentQuestionIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
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
                    {locale === "zh" ? "你的回答" : "Your Answer"}
                  </span>
                  <span className={`text-xs tabular-nums transition-colors ${
                    answer.length > 10 ? "text-foreground-muted" : "text-border"
                  }`}>
                    {answer.length}
                  </span>
                </div>
              }
              disabled={isSubmitting || isCompleting}
              language={voiceLanguage}
              onLanguageChange={setVoiceLanguage}
            />
          </div>

          {/* 错误提示 */}
          {submitError && (
            <div className="mt-3 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {submitError}
            </div>
          )}

          {/* ── 底部行（与单题页 submit row 完全一致）── */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={handleSkip}
              disabled={isSubmitting || isCompleting}
              className="text-xs text-foreground-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting || isCompleting
                ? (locale === "zh" ? "处理中..." : "Processing...")
                : (locale === "zh" ? "跳过此题" : "Skip")}
            </button>

            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || isSubmitting || isCompleting}
              className="ml-auto flex items-center gap-2 px-7 py-3 bg-accent text-white text-sm font-medium rounded-full
                hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200 hover:shadow-glow active:scale-95"
            >
              {isSubmitting || isCompleting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isCompleting
                    ? (locale === "zh" ? "完成中..." : "Completing...")
                    : (locale === "zh" ? "提交中..." : "Submitting...")}
                </>
              ) : (
                <>
                  {currentQuestionIndex < session.questions.length - 1
                    ? (locale === "zh" ? "下一题" : "Next")
                    : (locale === "zh" ? "完成面试" : "Complete")}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </motion.div>

        </div>{/* end lg:col-span-9 */}

        {/* Right: Interview Roadmap (3 cols) */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-6 sticky top-24">
          <div className="bg-[#f6f3f2] rounded-xl p-6 flex flex-col gap-6 border border-[#c3c6d7]/20">
            <div className="flex flex-col gap-1">
              <h3 className="font-display font-bold text-foreground">{locale === "zh" ? "面试路线图" : "Interview Roadmap"}</h3>
              <p className="text-xs text-[#5f5e5e] uppercase tracking-wider">
                {locale === "zh"
                  ? `进度: ${currentQuestionIndex + 1} / ${session.questions.length}`
                  : `Session Progress: ${currentQuestionIndex + 1} of ${session.questions.length}`}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {session.questions.map((q, idx) => {
                const isCompleted = idx < currentQuestionIndex;
                const isCurrent = idx === currentQuestionIndex;
                const qTypeInfo = typeConfig[q.type] ?? { labelZh: q.type, label: q.type };
                return (
                  <div key={q.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isCurrent ? "bg-white shadow-sm" : isCompleted ? "opacity-50" : "opacity-40"
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isCompleted ? "bg-[#004ac6] text-white" : isCurrent ? "border-2 border-[#004ac6] text-[#004ac6]" : "bg-[#eae7e7] text-[#5f5e5e]"
                    }`}>
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{locale === "zh" ? qTypeInfo.labelZh : qTypeInfo.label}</p>
                      <p className="text-[10px] text-[#5f5e5e] truncate">{q.title.slice(0, 30)}...</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        </div>{/* end grid */}
      </div>{/* end pt-16 */}

      {/* 退出确认弹窗 */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl p-8 max-w-md mx-4">
            <div className="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-display text-heading font-semibold text-foreground mb-2">
              {locale === "zh" ? "确认退出面试？" : "Exit Interview?"}
            </h3>
            <p className="text-foreground-muted mb-6">
              {locale === "zh"
                ? "退出后面试进度将不会保存，你确定要退出吗？"
                : "Your progress will not be saved. Are you sure you want to exit?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 bg-background border border-border text-foreground rounded-xl font-medium hover:bg-accent/5 transition-all"
              >
                {locale === "zh" ? "继续面试" : "Continue"}
              </button>
              <Link
                href="/practice"
                className="flex-1 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all text-center"
              >
                {locale === "zh" ? "确认退出" : "Exit"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

