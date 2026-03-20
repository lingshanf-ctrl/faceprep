"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getQuestionById, questions as staticQuestions } from "@/data/questions";
import { savePracticeRecord } from "@/lib/practice-store";
import { isFavorite, toggleFavorite } from "@/lib/favorites-store";
import { checkAndUnlockAchievements } from "@/lib/achievement-store";
import { VoiceTextarea } from "@/components/voice-textarea";
import { useLanguage } from "@/components/language-provider";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

// Type config
const typeConfig: Record<string, { label: string; labelZh: string; color: string }> = {
  INTRO:      { label: "Intro",      labelZh: "自我介绍", color: "bg-blue-50 text-blue-600 border-blue-100" },
  PROJECT:    { label: "Project",    labelZh: "项目经历", color: "bg-violet-50 text-violet-600 border-violet-100" },
  TECHNICAL:  { label: "Technical",  labelZh: "技术问题", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  BEHAVIORAL: { label: "Behavioral", labelZh: "行为面试", color: "bg-amber-50 text-amber-600 border-amber-100" },
  HR:         { label: "HR",         labelZh: "HR 问题",  color: "bg-rose-50 text-rose-600 border-rose-100" },
};

const frequencyDots = (n: number) =>
  Array.from({ length: 3 }, (_, i) => (
    <span
      key={i}
      className={`inline-block w-1.5 h-1.5 rounded-full ${i < n ? "bg-accent" : "bg-border"}`}
    />
  ));

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

  const staticQuestion = useMemo(() => getQuestionById(questionId), [questionId]);

  const [question, setQuestion] = useState(staticQuestion);
  const [loading, setLoading] = useState(!staticQuestion);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (staticQuestion) { setQuestion(staticQuestion); return; }
    async function fetchQuestion() {
      try {
        const res = await fetch(`/api/questions/${questionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.question) setQuestion(data.question);
          else setLoadError(true);
        } else setLoadError(true);
      } catch { setLoadError(true); }
      finally { setLoading(false); }
    }
    fetchQuestion();
  }, [questionId, staticQuestion]);

  const questionIndex = useMemo(
    () => staticQuestions.findIndex(q => q.id === questionId) + 1,
    [questionId]
  );

  const nextQuestionId = useMemo(() => {
    const idx = staticQuestions.findIndex(q => q.id === questionId);
    return idx < staticQuestions.length - 1 ? staticQuestions[idx + 1].id : null;
  }, [questionId]);

  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    totalScore?: number;
    dimensions?: {
      content:    { score: number; feedback: string; missing?: string[] };
      structure:  { score: number; feedback: string; issues?: string[] };
      expression: { score: number; feedback: string; suggestions?: string[] };
      highlights: { score: number; feedback: string; strongPoints?: string[] };
    };
    gapAnalysis?: {
      missing:     Array<{ location: string; description: string; suggestion?: string }>;
      insufficient:Array<{ location: string; description: string; suggestion?: string }>;
      good:        Array<{ location: string; description: string }>;
      excellent:   Array<{ location: string; description: string }>;
    };
    improvements?: Array<{ priority: "high" | "medium" | "low"; action: string; expectedGain: string }>;
    optimizedAnswer?: string;
    coachMessage?: string;
    score: number;
    good: string[];
    improve: string[];
    suggestion: string;
    starAnswer?: string;
  } | null>(null);

  const [showPrep, setShowPrep] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<"zh" | "en">("zh");

  const [practiceHistory, setPracticeHistory] = useState<Array<{
    id: string; answer: string; score: number; createdAt: string;
  }>>([]);

  useEffect(() => { setFavorited(isFavorite(questionId)); }, [questionId]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/practices?questionId=${questionId}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          if (data.practices) setPracticeHistory(data.practices.map((p: { id: string; answer: string; score: number; createdAt: string }) => ({
            id: p.id, answer: p.answer, score: p.score, createdAt: p.createdAt,
          })));
        }
      } catch {}
    }
    loadHistory();
  }, [questionId]);

  useEffect(() => {
    if (feedback) return;
    const timer = setInterval(() => setElapsedTime(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [startTime, feedback]);

  const handleToggleFavorite = () => setFavorited(toggleFavorite(questionId));

  const handleSelectHistory = (historyId: string) => {
    const h = practiceHistory.find(h => h.id === historyId);
    if (h) {
      setAnswer(h.answer);
      setSelectedHistory(historyId);
      setShowHistory(false);
      textareaRef.current?.focus();
    }
  };

  const handleClearSelection = () => { setSelectedHistory(null); setAnswer(""); };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // ──────────── Loading / Error ────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState variant="spinner" fullScreen message={locale === "zh" ? "加载题目中…" : "Loading…"} />
      </div>
    );
  }

  if (loadError || !question) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <EmptyState
            icon="❓"
            title={locale === "zh" ? "题目不存在" : "Question Not Found"}
            description={locale === "zh" ? "该题目可能已被删除或 ID 无效" : "This question may have been deleted or the ID is invalid"}
            action={{ label: locale === "zh" ? "返回题库" : "Back to Questions", href: "/questions" }}
          />
        </div>
      </div>
    );
  }

  // ──────────── Handlers ────────────
  const handleSubmit = async () => {
    if (!answer.trim()) return;
    if (answer.trim().length < 10) {
      setError(locale === "zh" ? "回答太短，请至少输入 10 个字符" : "Answer too short, please enter at least 10 characters");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const savedPractice = await savePracticeRecord({
        questionId: question.id,
        questionTitle: question.title,
        answer,
        score: 60,
        feedback: {
          good: ["回答已提交，AI 正在分析中…"],
          improve: ["请稍后在练习回顾页查看详细反馈"],
          suggestion: "正在生成个性化建议…",
        },
        duration: elapsedTime,
      }, { asyncEvaluate: true });

      if (!savedPractice) throw new Error("Failed to save");
      router.push(`/practice/review/${savedPractice.id}`);
      checkAndUnlockAchievements().catch(console.error);
    } catch (err) {
      setError(locale === "zh" ? `提交失败，请稍后重试` : `Failed to submit, please try again`);
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswer(""); setFeedback(null); setShowReference(false); setError(null);
    textareaRef.current?.focus();
  };

  const typeInfo = typeConfig[question.type] ?? { label: question.type, labelZh: question.type, color: "bg-surface text-foreground-muted border-border" };
  const bestScore = practiceHistory.length > 0 ? Math.max(...practiceHistory.map(h => h.score)) : null;
  const hasPrep = question.keyPoints || question.tips || question.framework;

  // ──────────── Render ────────────
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background orbs — consistent with other pages */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-accent/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-32 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-success/4 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">

        {/* ── Navigation bar ── */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            {t.question.back}
          </button>

          <div className="flex items-center gap-4">
            {questionIndex > 0 && (
              <span className="text-xs text-foreground-muted tabular-nums">
                {questionIndex} <span className="text-border mx-0.5">/</span> {staticQuestions.length}
              </span>
            )}
            {!feedback && (
              <div className="flex items-center gap-1.5 text-xs text-foreground-muted font-mono tabular-nums">
                <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(elapsedTime)}
              </div>
            )}
          </div>
        </div>

        {/* ── Question section ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          {/* Meta row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${typeInfo.color}`}>
                {locale === "zh" ? typeInfo.labelZh : typeInfo.label}
              </span>
              <span className="flex items-center gap-1" title={`${locale === "zh" ? "出现频率" : "Frequency"}`}>
                {frequencyDots(question.frequency)}
              </span>
            </div>

            <button
              onClick={handleToggleFavorite}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                favorited
                  ? "bg-foreground text-white"
                  : "text-foreground-muted hover:text-foreground border border-border hover:border-foreground-muted"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={favorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              {favorited ? t.question.saved : t.question.save}
            </button>
          </div>

          {/* Title */}
          <h1 className="font-display text-2xl sm:text-3xl md:text-heading-xl font-semibold text-foreground leading-snug tracking-tight">
            {question.title}
          </h1>

          {/* Practice history — compact motivational badge */}
          {practiceHistory.length > 0 && !feedback && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-accent transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {locale === "zh"
                  ? `已练习 ${practiceHistory.length} 次`
                  : `${practiceHistory.length} attempt${practiceHistory.length > 1 ? "s" : ""}`}
                {bestScore !== null && (
                  <span className={`font-semibold ${getScoreColor(bestScore)}`}>
                    · {locale === "zh" ? `最佳 ${bestScore}` : `Best ${bestScore}`}
                  </span>
                )}
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${showHistory ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}

          {/* History dropdown */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 p-3 bg-surface/80 backdrop-blur-sm rounded-2xl border border-border overflow-hidden"
              >
                <p className="text-xs text-foreground-muted mb-2.5 px-1">
                  {locale === "zh" ? "加载历史答案继续改进" : "Load a previous answer to improve on"}
                </p>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {practiceHistory.map((h, i) => (
                    <button
                      key={h.id}
                      onClick={() => handleSelectHistory(h.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all text-sm ${
                        selectedHistory === h.id
                          ? "bg-accent/8 border border-accent/20"
                          : "bg-background hover:bg-border/40 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-foreground-muted">
                          {locale === "zh" ? `第 ${i + 1} 次` : `Attempt ${i + 1}`}
                          <span className="text-border mx-1.5">·</span>
                          {new Date(h.createdAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span className={`text-sm font-semibold ${getScoreColor(h.score)}`}>{h.score}</span>
                      </div>
                      <p className="text-xs text-foreground-muted line-clamp-1">{h.answer.slice(0, 80)}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Preparation hints — single unified disclosure ── */}
          {hasPrep && !feedback && (
            <div className="mt-5">
              <button
                onClick={() => setShowPrep(!showPrep)}
                className="inline-flex items-center gap-2 text-xs text-foreground-muted hover:text-foreground transition-colors group"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${showPrep ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="group-hover:underline underline-offset-2">
                  {showPrep
                    ? (locale === "zh" ? "收起备考参考" : "Hide preparation")
                    : (locale === "zh" ? "查看备考参考" : "Show preparation hints")}
                </span>
              </button>

              <AnimatePresence>
                {showPrep && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-2xl border border-border bg-surface/60 backdrop-blur-sm divide-y divide-border/60">
                      {question.keyPoints && (
                        <div className="px-4 py-3.5">
                          <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-widest mb-1.5">
                            {locale === "zh" ? "考察重点" : "Key Points"}
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">{question.keyPoints}</p>
                        </div>
                      )}
                      {question.tips && (
                        <div className="px-4 py-3.5">
                          <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-widest mb-1.5">
                            {locale === "zh" ? "备考提示" : "Tips"}
                          </p>
                          <p className="text-sm text-foreground-muted leading-relaxed">{question.tips}</p>
                        </div>
                      )}
                      {question.framework && (
                        <div className="px-4 py-3.5">
                          <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-widest mb-1.5">
                            {locale === "zh" ? "答题框架" : "Framework"}
                          </p>
                          <pre className="text-sm text-foreground-muted whitespace-pre-wrap font-sans leading-relaxed">{question.framework}</pre>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* ── Answer / Feedback area ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          {!feedback ? (
            /* ───── Answer input ───── */
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-border shadow-subtle p-6 md:p-8">
                {/* History loaded banner */}
                <AnimatePresence>
                  {selectedHistory && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mb-4 px-3 py-2.5 bg-accent/5 rounded-xl border border-accent/15 flex items-center justify-between"
                    >
                      <span className="text-xs text-accent flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {locale === "zh" ? "已加载历史答案，在此基础上改进" : "Loaded previous answer — improve on it"}
                      </span>
                      <button onClick={handleClearSelection} className="text-xs text-foreground-muted hover:text-foreground transition-colors">
                        {locale === "zh" ? "清除" : "Clear"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <VoiceTextarea
                  value={answer}
                  onChange={setAnswer}
                  placeholder={t.question.placeholder}
                  minHeight="240px"
                  label={
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-sm font-semibold text-foreground">{t.question.yourAnswer}</span>
                      <span className={`text-xs tabular-nums transition-colors ${
                        answer.length > 10 ? "text-foreground-muted" : "text-border"
                      }`}>
                        {answer.length}
                      </span>
                    </div>
                  }
                  disabled={isSubmitting}
                  language={voiceLanguage}
                  onLanguageChange={setVoiceLanguage}
                />

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 flex items-start gap-2.5 text-sm text-error bg-error/5 rounded-xl px-4 py-3"
                    >
                      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit row */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-foreground-muted hidden sm:block">
                  {locale === "zh" ? "提交后 AI 将在后台生成深度反馈" : "AI will generate deep feedback after submission"}
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || isSubmitting}
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
            </div>
          ) : (
            /* ───── Feedback results ───── */
            <div className="space-y-5">

              {/* Score hero */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-center py-10"
              >
                <div className={`font-display text-[7rem] sm:text-[9rem] font-bold leading-none tracking-tighter ${getScoreColor(feedback.totalScore ?? feedback.score)}`}>
                  {feedback.totalScore ?? feedback.score}
                </div>
                <p className="text-base text-foreground-muted mt-1">{getScoreLabel(feedback.totalScore ?? feedback.score, locale)}</p>
                <div className="w-48 mx-auto mt-6 h-0.5 bg-surface rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-current rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${feedback.totalScore ?? feedback.score}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </motion.div>

              {/* 4D dimensions */}
              {feedback.dimensions && (
                <div className="bg-surface/60 rounded-2xl border border-border p-5">
                  <p className="text-xs font-semibold text-foreground-muted uppercase tracking-widest mb-4">
                    {locale === "zh" ? "四维评估" : "4D Assessment"}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "content",    label: locale === "zh" ? "内容" : "Content",    color: "bg-emerald-500", score: feedback.dimensions.content.score,    text: feedback.dimensions.content.feedback },
                      { key: "structure",  label: locale === "zh" ? "结构" : "Structure",  color: "bg-blue-500",    score: feedback.dimensions.structure.score,  text: feedback.dimensions.structure.feedback },
                      { key: "expression", label: locale === "zh" ? "表达" : "Expression", color: "bg-amber-500",   score: feedback.dimensions.expression.score, text: feedback.dimensions.expression.feedback },
                      { key: "highlights", label: locale === "zh" ? "亮点" : "Highlights", color: "bg-violet-500",  score: feedback.dimensions.highlights.score, text: feedback.dimensions.highlights.feedback },
                    ].map(dim => (
                      <div key={dim.key} className="bg-white rounded-xl p-3.5">
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs font-medium text-foreground-muted">{dim.label}</span>
                          <span className="text-base font-bold text-foreground">{dim.score}</span>
                        </div>
                        <div className="h-1 bg-surface rounded-full overflow-hidden mb-2">
                          <motion.div
                            className={`h-full ${dim.color} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${dim.score}%` }}
                            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                        <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">{dim.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Your answer */}
              <div className="bg-surface/60 rounded-2xl border border-border p-5">
                <p className="text-xs font-semibold text-foreground-muted uppercase tracking-widest mb-3">{t.question.yourAnswerTitle}</p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{answer}</p>
              </div>

              {/* Strengths */}
              <div className="bg-white rounded-2xl border border-border p-5">
                <p className="text-xs font-semibold text-foreground-muted uppercase tracking-widest mb-3">{t.question.strengths}</p>
                <ul className="space-y-2.5">
                  {feedback.good.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-success mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="bg-white rounded-2xl border border-border p-5">
                <p className="text-xs font-semibold text-foreground-muted uppercase tracking-widest mb-3">{t.question.improvements}</p>
                <ul className="space-y-2.5">
                  {feedback.improve?.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gap analysis */}
              {feedback.gapAnalysis && (
                <div className="bg-white rounded-2xl border border-border p-5">
                  <p className="text-xs font-semibold text-foreground-muted uppercase tracking-widest mb-4">
                    {locale === "zh" ? "差距分析" : "Gap Analysis"}
                  </p>
                  <div className="space-y-3">
                    {[
                      { items: feedback.gapAnalysis.missing,      label: locale === "zh" ? "缺失" : "Missing",      bg: "bg-rose-50",   text: "text-rose-700",   dot: "bg-rose-400" },
                      { items: feedback.gapAnalysis.insufficient,  label: locale === "zh" ? "不足" : "Insufficient",  bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400" },
                      { items: feedback.gapAnalysis.good,          label: locale === "zh" ? "良好" : "Good",          bg: "bg-emerald-50",text: "text-emerald-700",dot: "bg-emerald-400" },
                      { items: feedback.gapAnalysis.excellent,     label: locale === "zh" ? "亮点" : "Excellent",     bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-400" },
                    ].filter(g => g.items?.length > 0).map(g => (
                      <div key={g.label} className={`${g.bg} rounded-xl p-3.5`}>
                        <p className={`text-xs font-semibold ${g.text} mb-2`}>{g.label}</p>
                        <ul className="space-y-1.5">
                          {g.items.map((item, i) => (
                            <li key={i} className={`text-sm ${g.text} flex items-start gap-2`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${g.dot} mt-1.5 shrink-0`} />
                              <span><span className="font-medium">{item.location}:</span> {item.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable improvements */}
              {feedback.improvements && feedback.improvements.length > 0 && (
                <div className="bg-white rounded-2xl border border-border p-5">
                  <p className="text-xs font-semibold text-foreground-muted uppercase tracking-widest mb-4">
                    {locale === "zh" ? "改进清单" : "Action Items"}
                  </p>
                  <ul className="space-y-3.5">
                    {feedback.improvements.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                          item.priority === "high"   ? "bg-rose-100 text-rose-600"   :
                          item.priority === "medium" ? "bg-amber-100 text-amber-600" :
                          "bg-blue-100 text-blue-600"
                        }`}>
                          {item.priority === "high"   ? (locale === "zh" ? "高" : "High") :
                           item.priority === "medium" ? (locale === "zh" ? "中" : "Med")  :
                           (locale === "zh" ? "低" : "Low")}
                        </span>
                        <div>
                          <p className="text-sm text-foreground">{item.action}</p>
                          <p className="text-xs text-foreground-muted mt-0.5">{item.expectedGain}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Optimized answer */}
              {feedback.optimizedAnswer && (
                <div className="bg-accent/5 rounded-2xl border border-accent/15 p-5">
                  <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">
                    {locale === "zh" ? "优化版回答" : "Optimized Answer"}
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{feedback.optimizedAnswer}</p>
                </div>
              )}

              {/* Coach message */}
              {feedback.coachMessage && (
                <div className="flex items-start gap-3 px-5 py-4 bg-surface/60 rounded-2xl border border-border">
                  <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed italic">"{feedback.coachMessage}"</p>
                </div>
              )}

              {/* Star answer (legacy) */}
              {feedback.starAnswer && !feedback.optimizedAnswer && (
                <div className="bg-surface/60 rounded-2xl border border-border p-5">
                  <p className="text-xs font-semibold text-foreground-muted uppercase tracking-widest mb-3">{t.question.starExample}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{feedback.starAnswer}</p>
                </div>
              )}

              {/* Reference answer */}
              <div className="rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => setShowReference(!showReference)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-surface/60 hover:bg-surface transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">{t.question.referenceAnswer}</span>
                  <svg
                    className={`w-4 h-4 text-foreground-muted transition-transform duration-200 ${showReference ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {showReference && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="px-5 py-4 space-y-4">
                        <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{question.referenceAnswer}</pre>
                        {question.commonMistakes && (
                          <div className="pt-4 border-t border-border">
                            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-widest mb-2">{t.question.commonMistakes}</p>
                            <pre className="text-sm text-foreground-muted whitespace-pre-wrap font-sans leading-relaxed">{question.commonMistakes}</pre>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-foreground-muted bg-surface hover:bg-border/60 rounded-full transition-all border border-border"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t.question.retry}
                </button>
                {nextQuestionId ? (
                  <Link
                    href={`/questions/${nextQuestionId}`}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium bg-accent text-white rounded-full hover:bg-accent-dark transition-all hover:shadow-glow"
                  >
                    {t.question.nextQuestion}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                ) : (
                  <Link
                    href="/questions"
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium bg-accent text-white rounded-full hover:bg-accent-dark transition-all hover:shadow-glow"
                  >
                    {t.question.backToQuestions}
                  </Link>
                )}
              </div>

            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
