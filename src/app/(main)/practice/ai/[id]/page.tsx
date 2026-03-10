"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { VoiceTextarea } from "@/components/voice-textarea";
import { savePracticeRecord } from "@/lib/practice-store";
import { LoadingState } from "@/components/ui/loading-state";
import { LargeScoreBadge } from "@/components/ui/score-badge";
import { QuestionTypeBadge, DifficultyBadge } from "@/components/ui/type-badge";
import { getScoreColor, getScoreLabel } from "@/lib/ui-helpers";
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle, Lightbulb, RotateCcw, ArrowRight, CheckCheck } from "lucide-react";
import { AIGeneratedQuestion } from "@prisma/client";

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
  const [feedback, setFeedback] = useState<{
    score: number;
    good: string[];
    improve: string[];
    suggestion: string;
  } | null>(null);
  const [startTime] = useState(Date.now());
  const [voiceLanguage, setVoiceLanguage] = useState<"zh" | "en">("zh");

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

  // Handle submit
  const handleSubmit = async () => {
    if (!answer.trim() || !question) return;
    setIsSubmitting(true);

    // Simulate AI evaluation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock feedback based on answer length and content
    const wordCount = answer.length;
    const hasStructure = answer.includes("首先") || answer.includes("第一") || answer.includes("1.");
    const hasExample = answer.includes("比如") || answer.includes("例如");

    let score = 70;
    if (wordCount > 200) score += 10;
    if (hasStructure) score += 10;
    if (hasExample) score += 5;
    score = Math.min(95, Math.max(60, score));

    setFeedback({
      score,
      good: hasStructure ? ["回答结构清晰", "内容完整"] : ["内容完整"],
      improve: hasExample ? [] : ["可以加入更多具体例子"],
      suggestion: hasStructure
        ? "回答得很好，继续保持！"
        : "建议按照 STAR 法则组织回答：情境、任务、行动、结果",
    });

    // Save record (关联到 AI 生成的题目)
    try {
      await savePracticeRecord({
        questionId: question.id,
        questionTitle: question.title,
        questionType: question.type,
        answer,
        score,
        feedback: {
          good: hasStructure ? ["回答结构清晰", "内容完整"] : ["内容完整"],
          improve: hasExample ? [] : ["可以加入更多具体例子"],
          suggestion: hasStructure
            ? "回答得很好，继续保持！"
            : "建议按照 STAR 法则组织回答：情境、任务、行动、结果",
        },
      });
      console.log("[Practice Saved] Record saved successfully");
    } catch (saveError) {
      console.error("[Practice Save Error]", saveError);
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState
          variant="spinner"
          fullScreen
          message={locale === "zh" ? "加载题目中..." : "Loading question..."}
        />
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
            <ArrowLeft className="w-4 h-4" />
            {locale === "zh" ? "返回 AI 定制面试" : "Back to AI Custom Interview"}
          </Link>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState
          variant="spinner"
          fullScreen
          message={locale === "zh" ? "加载题目中..." : "Loading question..."}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-40 left-20 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-[300px] h-[300px] bg-success/5 rounded-full blur-[80px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-12 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-up">
          <Link
            href="/practice/ai-custom"
            className="group flex items-center gap-2 text-foreground-muted hover:text-foreground transition-all duration-300"
          >
            <div className="p-2 rounded-full bg-surface border border-border group-hover:border-accent/30 group-hover:bg-accent/5 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">{locale === "zh" ? "返回" : "Back"}</span>
          </Link>

          <div className="flex items-center gap-3">
            <QuestionTypeBadge
              type={question.type}
              locale={locale as "zh" | "en"}
              showIcon={true}
            />
            <DifficultyBadge
              difficulty={question.difficulty === "easy" ? 1 : question.difficulty === "medium" ? 2 : 3}
              locale={locale as "zh" | "en"}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="relative bg-white rounded-3xl p-8 md:p-10 border-2 border-border mb-8 shadow-soft-sm animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {/* Left accent gradient bar */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-accent via-accent-light to-accent rounded-l-3xl" />

          <h1 className="font-display text-xl md:text-2xl font-bold text-foreground tracking-tight mb-6 leading-relaxed">
            {question.title}
          </h1>

          <div className="flex flex-wrap gap-4">
            <div className="px-4 py-3 bg-gradient-to-r from-accent/5 to-transparent rounded-2xl border border-accent/10">
              <span className="text-xs font-medium text-foreground-muted block mb-1">
                {locale === "zh" ? "考察点" : "Key Points"}
              </span>
              <span className="text-sm text-foreground font-medium">{question.keyPoints}</span>
            </div>
          </div>
        </div>

        {!feedback ? (
          // Answer Input Section
          <div className="space-y-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
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
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {t.question?.yourAnswer || "Your Answer"}
                  <span className="text-xs px-2 py-0.5 bg-surface border border-border rounded-full text-foreground-muted font-medium">
                    {answer.length} {locale === "zh" ? "字" : "chars"}
                  </span>
                </span>
              }
              disabled={isSubmitting}
              language={voiceLanguage}
              onLanguageChange={setVoiceLanguage}
              footer={
                <button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || isSubmitting}
                  className="group relative px-8 py-4 bg-gradient-to-r from-accent to-accent-light text-white rounded-full font-semibold
                    hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                    transition-all duration-300 flex items-center gap-2 overflow-hidden"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                      <span className="relative z-10">{locale === "zh" ? "AI分析中..." : "Analyzing..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 relative z-10" />
                      <span className="relative z-10">{t.question?.getFeedback || "Get Feedback"}</span>
                      <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              }
            />
          </div>
        ) : (
          // Feedback Section
          <div className="space-y-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            {/* Score Card */}
            <div className="relative bg-white rounded-3xl p-8 md:p-12 border-2 border-border text-center shadow-soft-sm overflow-hidden">
              {/* Background glow based on score */}
              <div className={`absolute inset-0 opacity-10 ${
                feedback.score >= 80
                  ? 'bg-gradient-to-br from-success to-success-light'
                  : feedback.score >= 60
                  ? 'bg-gradient-to-br from-warning to-warning-light'
                  : 'bg-gradient-to-br from-error to-error-light'
              }`} />

              <div className="relative z-10">
                <p className="text-sm font-medium text-foreground-muted mb-4">
                  {locale === "zh" ? "本次得分" : "Your Score"}
                </p>

                {/* Large Score Badge */}
                <div className="flex justify-center mb-4">
                  <LargeScoreBadge score={feedback.score} />
                </div>

                <p className={`text-lg font-semibold ${getScoreColor(feedback.score)}`}>
                  {getScoreLabel(feedback.score, locale as "zh" | "en")}
                </p>
              </div>
            </div>

            {/* Feedback Details */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-2xl p-6 border border-success/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-success/20 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <h3 className="font-display text-base font-bold text-success">
                    {t.question?.strengths || "Strengths"}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {feedback.good.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="bg-gradient-to-br from-warning/10 to-warning/5 rounded-2xl p-6 border border-warning/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-warning/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-warning" />
                  </div>
                  <h3 className="font-display text-base font-bold text-warning">
                    {t.question?.improvements || "Areas to Improve"}
                  </h3>
                </div>
                {feedback.improve.length > 0 ? (
                  <ul className="space-y-3">
                    {feedback.improve.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertCircle className="w-3 h-3 text-warning" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center gap-3 text-sm text-foreground-muted">
                    <CheckCheck className="w-5 h-5 text-success" />
                    <span>{locale === "zh" ? "表现很棒，继续保持！" : "Great job, keep it up!"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Suggestion */}
            <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-2xl p-6 border border-accent/20">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-accent/20 rounded-xl flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-accent mb-2">
                    {t.question?.suggestions || "Suggestions"}
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed">{feedback.suggestion}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => {
                  setFeedback(null);
                  setAnswer("");
                }}
                className="group flex-1 py-4 bg-white border-2 border-border text-foreground rounded-full font-semibold
                  hover:border-accent/30 hover:bg-accent/5 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 transition-transform group-hover:-rotate-90" />
                {t.question?.retry || "Retry"}
              </button>

              <Link
                href="/practice/ai-custom"
                className="group relative flex-1 py-4 bg-gradient-to-r from-accent to-accent-light text-white rounded-full font-semibold
                  hover:shadow-glow transition-all duration-300 text-center flex items-center justify-center gap-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                <span className="relative z-10">{locale === "zh" ? "返回专属题库" : "Back to Custom Questions"}</span>
                <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
