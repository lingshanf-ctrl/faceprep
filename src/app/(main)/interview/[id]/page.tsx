"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { VoiceTextarea } from "@/components/voice-textarea";
import { LoadingState } from "@/components/ui/loading-state";
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
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<"zh" | "en">("zh");

  // 加载面试会话
  useEffect(() => {
    async function loadSession() {
      const loadedSession = await getInterviewSessionAsync(interviewId);
      if (!loadedSession) {
        router.push("/practice");
        return;
      }

      // 如果是pending状态，开始面试
      if (loadedSession.status === "pending") {
        await startInterviewAsync(interviewId);
        loadedSession.status = "in_progress";
      }

      // 如果已完成，跳转到报告页
      if (loadedSession.status === "completed") {
        router.push(`/interview/${interviewId}/report`);
        return;
      }

      setSession(loadedSession);
      setCurrentQuestionIndex(loadedSession.answers.length);
      setQuestionStartTime(Date.now());
    }

    loadSession();
  }, [interviewId, router]);

  // 自动调整textarea高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [answer]);

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
          alert(locale === "zh" ? "完成面试失败，请重试" : "Failed to complete interview, please retry");
        }
      } catch (error) {
        console.error("Complete interview error:", error);
        setIsCompleting(false);
        alert(locale === "zh" ? "完成面试失败，请重试" : "Failed to complete interview, please retry");
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
          alert(locale === "zh" ? "完成面试失败，请重试" : "Failed to complete interview, please retry");
        }
      } catch (error) {
        console.error("Complete interview error:", error);
        setIsCompleting(false);
        alert(locale === "zh" ? "完成面试失败，请重试" : "Failed to complete interview, please retry");
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
  const progress = ((currentQuestionIndex) / session.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowExitConfirm(true)}
                className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">{locale === "zh" ? "退出" : "Exit"}</span>
              </button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="font-display font-semibold text-foreground">{session.title}</h1>
                <p className="text-xs text-foreground-muted">
                  {locale === "zh" ? `第 ${currentQuestionIndex + 1} / ${session.questions.length} 题` : `Question ${currentQuestionIndex + 1} / ${session.questions.length}`}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 max-w-xs mx-4 hidden sm:block">
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="text-sm text-foreground-muted">
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Question Card */}
        <div className="bg-surface rounded-3xl p-8 md:p-10 border border-border mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
              {locale === "zh" ? getTypeLabel(currentQuestion.type, locale) : currentQuestion.type}
            </span>
            <span className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${currentQuestion.difficulty === 'easy' ? 'bg-green-500/10 text-green-600' : ''}
              ${currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-600' : ''}
              ${currentQuestion.difficulty === 'hard' ? 'bg-red-500/10 text-red-600' : ''}
            `}>
              {locale === "zh" ? getDifficultyLabel(currentQuestion.difficulty) : currentQuestion.difficulty}
            </span>
          </div>

          <h2 className="font-display text-heading-xl md:text-display-sm font-bold text-foreground tracking-tight mb-6">
            {currentQuestion.title}
          </h2>

          <div className="px-4 py-3 bg-background rounded-xl">
            <span className="text-small text-foreground-muted block mb-1">
              {locale === "zh" ? "考察点" : "Key Points"}
            </span>
            <span className="text-foreground">{currentQuestion.keyPoints}</span>
          </div>
        </div>

        {/* Answer Section */}
        <div className="space-y-6">
          <VoiceTextarea
            value={answer}
            onChange={setAnswer}
            placeholder={
              locale === "zh"
                ? "在此输入你的回答，尽可能完整地表达你的想法..."
                : "Type your answer here, express your thoughts as completely as possible..."
            }
            minHeight="200px"
            label={
              <span className="text-sm font-medium text-foreground">
                {locale === "zh" ? "你的回答" : "Your Answer"}
                <span className="text-foreground-muted ml-2">
                  ({answer.length} {locale === "zh" ? "字" : "chars"})
                </span>
              </span>
            }
            disabled={isSubmitting || isCompleting}
            language={voiceLanguage}
            onLanguageChange={setVoiceLanguage}
            footer={
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSkip}
                  disabled={isSubmitting || isCompleting}
                  className="px-6 py-3 text-foreground-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting || isCompleting
                    ? (locale === "zh" ? "处理中..." : "Processing...")
                    : (locale === "zh" ? "跳过" : "Skip")
                  }
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || isSubmitting || isCompleting}
                  className="px-8 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {isSubmitting || isCompleting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {isCompleting
                        ? (locale === "zh" ? "完成中..." : "Completing...")
                        : (locale === "zh" ? "提交中..." : "Submitting...")}
                    </>
                  ) : (
                    <>
                      {currentQuestionIndex < session.questions.length - 1 ? (
                        <>
                          {locale === "zh" ? "下一题" : "Next"}
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </>
                      ) : (
                        <>
                          {locale === "zh" ? "完成面试" : "Complete"}
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            }
          />

        </div>
      </main>

      {/* Exit Confirmation Modal */}
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

function getTypeLabel(type: string, locale: string) {
  const typeMap: Record<string, string> = {
    INTRO: "自我介绍",
    PROJECT: "项目经历",
    TECHNICAL: "技术问题",
    BEHAVIORAL: "行为面试",
    HR: "HR面试",
  };
  return typeMap[type] || type;
}

function getDifficultyLabel(difficulty: string) {
  const difficultyMap: Record<string, string> = {
    easy: "简单",
    medium: "中等",
    hard: "困难",
  };
  return difficultyMap[difficulty] || difficulty;
}
