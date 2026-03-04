"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getQuestionById, questions } from "@/data/questions";
import { savePracticeRecord } from "@/lib/practice-store";
import { isFavorite, toggleFavorite } from "@/lib/favorites-store";
import { checkAndUnlockAchievements } from "@/lib/achievement-store";
import { VoiceTextarea } from "@/components/voice-textarea";
import { useLanguage } from "@/components/language-provider";

// Type config
const typeConfig: Record<string, { label: string; labelZh: string }> = {
  INTRO: { label: "Intro", labelZh: "自我介绍" },
  PROJECT: { label: "Project", labelZh: "项目经历" },
  TECHNICAL: { label: "Technical", labelZh: "技术问题" },
  BEHAVIORAL: { label: "Behavioral", labelZh: "行为面试" },
  HR: { label: "HR", labelZh: "HR问题" },
};

// Frequency labels
const frequencyLabels = {
  zh: ["低", "中", "高"],
  en: ["Low", "Medium", "High"],
};

// Score color
function getScoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-error";
}

function getScoreLabel(score: number, locale: string) {
  if (locale === "zh") {
    if (score >= 90) return "优秀";
    if (score >= 80) return "良好";
    if (score >= 70) return "一般";
    if (score >= 60) return "及格";
    return "需改进";
  }
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Average";
  if (score >= 60) return "Pass";
  return "Needs Work";
}

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { locale, t } = useLanguage();

  const question = useMemo(() => getQuestionById(questionId), [questionId]);

  // 如果题目不存在，显示错误
  if (!question) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-display text-heading-xl font-semibold text-foreground mb-3">
            {locale === 'zh' ? '题目不存在' : 'Question Not Found'}
          </h1>
          <p className="text-foreground-muted mb-8">
            {locale === 'zh' ? '该题目可能已被删除或ID无效' : 'This question may have been deleted or the ID is invalid'}
          </p>
          <Link href="/questions" className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent-dark transition-all">
            {locale === 'zh' ? '返回题库' : 'Back to Questions'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate question index and total
  const questionIndex = useMemo(() => {
    return questions.findIndex(q => q.id === questionId) + 1;
  }, [questionId]);

  const nextQuestionId = useMemo(() => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (currentIndex < questions.length - 1) {
      return questions[currentIndex + 1].id;
    }
    return null;
  }, [questionId]);

  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    score: number;
    good: string[];
    improve: string[];
    suggestion: string;
    starAnswer?: string;
  } | null>(null);
  const [showReference, setShowReference] = useState(false);
  const [showFramework, setShowFramework] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [favorited, setFavorited] = useState(false);

  // Load favorite status
  useEffect(() => {
    setFavorited(isFavorite(questionId));
  }, [questionId]);

  // Toggle favorite
  const handleToggleFavorite = () => {
    const newState = toggleFavorite(questionId);
    setFavorited(newState);
  };

  // Timer
  useEffect(() => {
    if (feedback) return;

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, feedback]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Question not found
  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-display text-heading-xl font-semibold text-foreground mb-3">
            {locale === "zh" ? "题目未找到" : "Question Not Found"}
          </h1>
          <p className="text-foreground-muted mb-8">
            {locale === "zh" ? "该题目可能已被删除或链接不正确" : "The question may have been removed or the link is incorrect"}
          </p>
          <Link
            href="/questions"
            className="inline-flex px-8 py-4 bg-accent text-white rounded-full font-medium hover:bg-accent-dark transition-all hover:shadow-glow"
          >
            {t.question.backToQuestions}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    // 验证回答长度
    if (answer.trim().length < 10) {
      setError(locale === 'zh' ? '回答太短，请至少输入10个字符' : 'Answer is too short, please enter at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.title,
          keyPoints: question.keyPoints,
          answer: answer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setFeedback(data);

      savePracticeRecord({
        questionId: question.id,
        questionTitle: question.title,
        answer: answer,
        score: data.score,
        feedback: {
          good: data.good,
          improve: data.improve,
          suggestion: data.suggestion,
          starAnswer: data.starAnswer,
        },
      });

      checkAndUnlockAchievements();
    } catch (err) {
      console.error("Feedback error:", err);
      setError(err instanceof Error ? err.message : "Failed to get feedback, please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswer("");
    setFeedback(null);
    setShowReference(false);
    setError(null);
    textareaRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">{t.question.back}</span>
          </button>

          <div className="flex items-center gap-4">
            {/* Progress indicator */}
            <span className="text-sm text-foreground-muted">
              {questionIndex} / {questions.length}
            </span>

            {/* Timer */}
            {!feedback && (
              <div className="flex items-center gap-1.5 text-sm text-foreground-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono tabular-nums">{formatTime(elapsedTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Question Card */}
        <div className="mb-10">
          {/* Tags row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent/5 text-accent">
                {locale === "zh" ? typeConfig[question.type]?.labelZh : typeConfig[question.type]?.label}
              </span>
              <span className="text-xs text-foreground-muted uppercase tracking-wider">
                {frequencyLabels[locale][question.frequency - 1]} {locale === "zh" ? "频率" : "frequency"}
              </span>
            </div>
            {/* Favorite button */}
            <button
              onClick={handleToggleFavorite}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                favorited
                  ? "bg-foreground text-white"
                  : "bg-surface text-foreground-muted hover:text-foreground border border-border"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill={favorited ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              {favorited ? t.question.saved : t.question.save}
            </button>
          </div>

          {/* Question title */}
          <h1 className="font-display text-heading-xl md:text-display-sm font-semibold text-foreground mb-6 leading-tight">
            {question.title}
          </h1>

          {/* Key points */}
          <div className="flex items-start gap-3 p-5 bg-surface rounded-2xl">
            <svg className="w-5 h-5 text-foreground-muted mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="text-xs text-foreground-muted uppercase tracking-wider block mb-1">{t.question.keyPoints}</span>
              <span className="text-sm text-foreground">{question.keyPoints}</span>
            </div>
          </div>
        </div>

        {/* Answer area */}
        {!feedback ? (
          <div className="space-y-4">
            {/* Answer input */}
            <div className="bg-surface rounded-2xl p-6 md:p-8">
              <VoiceTextarea
                value={answer}
                onChange={setAnswer}
                placeholder={t.question.placeholder}
                minHeight="224px"
                label={
                  <div className="flex items-center justify-between w-full">
                    <h3 className="font-display text-heading font-semibold text-foreground">{t.question.yourAnswer}</h3>
                    <span className="text-sm text-foreground-muted">
                      {t.question.chars.replace("{count}", String(answer.length))}
                    </span>
                  </div>
                }
                disabled={isSubmitting}
              />

              {/* Error message */}
              {error && (
                <div className="mt-5 p-5 bg-error/5 rounded-2xl text-error text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
            </div>

            {/* Bottom toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-2">
                {/* Tips button */}
                {question.tips && (
                  <button
                    onClick={() => setShowTips(!showTips)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      showTips
                        ? "bg-accent text-white"
                        : "bg-surface text-foreground-muted hover:text-foreground border border-border"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {t.question.tips}
                  </button>
                )}

                {/* Framework button */}
                {question.framework && (
                  <button
                    onClick={() => setShowFramework(!showFramework)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      showFramework
                        ? "bg-accent text-white"
                        : "bg-surface text-foreground-muted hover:text-foreground border border-border"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    {t.question.framework}
                  </button>
                )}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || isSubmitting}
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-accent text-white rounded-full font-medium hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-glow"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t.question.analyzing}
                  </>
                ) : (
                  <>
                    {t.question.getFeedback}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            {/* Tips expand */}
            {showTips && question.tips && (
              <div className="bg-surface rounded-2xl p-5 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{question.tips}</p>
                </div>
              </div>
            )}

            {/* Framework expand */}
            {showFramework && question.framework && (
              <div className="bg-surface rounded-2xl p-5 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{question.framework}</pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========== AI Feedback Results ========== */
          <div className="space-y-6">
            {/* Large score display */}
            <div className="text-center py-12">
              <div className={`font-display text-[8rem] md:text-[10rem] font-bold leading-none tracking-tighter ${getScoreColor(feedback.score)} animate-score-reveal`}>
                {feedback.score}
              </div>
              <div className="text-body-lg text-foreground-muted mt-2">{getScoreLabel(feedback.score, locale)}</div>

              {/* Progress bar */}
              <div className="w-full max-w-xs mx-auto mt-8">
                <div className="h-1 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-current transition-all duration-1000"
                    style={{ width: `${feedback.score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* My answer */}
            <div className="bg-surface rounded-2xl p-6 md:p-8">
              <h3 className="text-small text-foreground-muted mb-4 flex items-center gap-2 uppercase tracking-wider">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t.question.yourAnswerTitle}
              </h3>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{answer}</p>
            </div>

            {/* Strengths */}
            <div className="bg-surface rounded-2xl p-6 md:p-8">
              <h4 className="font-display text-heading font-semibold text-foreground mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {t.question.strengths}
              </h4>
              <ul className="space-y-4">
                {feedback.good.map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-foreground">
                    <span className="w-2 h-2 bg-success rounded-full mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas to improve */}
            <div className="bg-surface rounded-2xl p-6 md:p-8">
              <h4 className="font-display text-heading font-semibold text-foreground mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                {t.question.improvements}
              </h4>
              <ul className="space-y-4">
                {feedback.improve.map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-foreground">
                    <span className="w-2 h-2 bg-warning rounded-full mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggestions */}
            <div className="bg-surface rounded-2xl p-6 md:p-8">
              <h4 className="font-display text-heading font-semibold text-foreground mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                {t.question.suggestions}
              </h4>
              <p className="text-foreground leading-relaxed">{feedback.suggestion}</p>
            </div>

            {/* STAR example */}
            {feedback.starAnswer && (
              <div className="bg-surface rounded-2xl p-6 md:p-8">
                <h4 className="font-display text-heading font-semibold text-foreground mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  {t.question.starExample}
                </h4>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{feedback.starAnswer}</p>
              </div>
            )}

            {/* Reference answer */}
            <div className="bg-surface rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowReference(!showReference)}
                className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-accent/5 transition-colors"
              >
                <span className="font-display text-heading font-semibold text-foreground">{t.question.referenceAnswer}</span>
                <svg
                  className={`w-5 h-5 text-foreground-muted transition-transform duration-200 ${showReference ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showReference && (
                <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-6 border-t border-border">
                  <div className="pt-6">
                    <pre className="text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                      {question.referenceAnswer}
                    </pre>
                  </div>
                  {question.commonMistakes && (
                    <div className="pt-6 border-t border-border">
                      <h4 className="text-small font-medium text-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <div className="w-6 h-6 bg-error/10 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        {t.question.commonMistakes}
                      </h4>
                      <pre className="text-foreground-muted whitespace-pre-wrap font-sans leading-relaxed">
                        {question.commonMistakes}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-4 pt-6">
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-surface text-foreground rounded-full font-medium hover:bg-border transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t.question.retry}
              </button>
              {nextQuestionId ? (
                <Link
                  href={`/questions/${nextQuestionId}`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-accent text-white rounded-full font-medium hover:bg-accent-dark transition-all hover:shadow-glow"
                >
                  {t.question.nextQuestion}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              ) : (
                <Link
                  href="/questions"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-accent text-white rounded-full font-medium hover:bg-accent-dark transition-all hover:shadow-glow"
                >
                  {t.question.backToQuestions}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
