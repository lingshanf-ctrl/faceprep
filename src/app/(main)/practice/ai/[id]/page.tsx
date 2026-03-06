"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { VoiceTextarea } from "@/components/voice-textarea";
import { savePracticeRecord } from "@/lib/practice-store";

interface GeneratedQuestion {
  id: string;
  title: string;
  type: string;
  keyPoints: string;
  difficulty: string;
}

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

export default function AIPracticePage() {
  const params = useParams();
  const router = useRouter();
  const { locale, t } = useLanguage();
  const questionId = params.id as string;

  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [allQuestions, setAllQuestions] = useState<GeneratedQuestion[]>([]);
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

  // Load questions from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("ai-generated-questions");
    if (stored) {
      const questions: GeneratedQuestion[] = JSON.parse(stored);
      setAllQuestions(questions);
      const current = questions.find((q) => q.id === questionId);
      if (current) {
        setQuestion(current);
      }
    }
  }, [questionId]);

  // Get current index and next question
  const currentIndex = allQuestions.findIndex((q) => q.id === questionId);
  const nextQuestion = allQuestions[currentIndex + 1];

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

    // Save record (使用 await 确保保存完成)
    try {
      await savePracticeRecord({
        questionId: question.id,
        questionTitle: question.title,
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

  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/practice"
            className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {locale === "zh" ? "返回练习" : "Back to Practice"}
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-small text-foreground-muted">
              {currentIndex + 1} / {allQuestions.length}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                question.type === "INTRO"
                  ? "bg-blue-500/10 text-blue-600"
                  : question.type === "PROJECT"
                  ? "bg-purple-500/10 text-purple-600"
                  : question.type === "TECHNICAL"
                  ? "bg-orange-500/10 text-orange-600"
                  : question.type === "BEHAVIORAL"
                  ? "bg-green-500/10 text-green-600"
                  : "bg-pink-500/10 text-pink-600"
              }`}
            >
              {locale === "zh" ? getTypeLabel(question.type) : question.type}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                question.difficulty === "easy"
                  ? "bg-green-500/10 text-green-600"
                  : question.difficulty === "medium"
                  ? "bg-yellow-500/10 text-yellow-600"
                  : "bg-red-500/10 text-red-600"
              }`}
            >
              {locale === "zh" ? getDifficultyLabel(question.difficulty) : question.difficulty}
            </span>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-surface rounded-3xl p-8 md:p-10 border border-border mb-8">
          <h1 className="font-display text-display-sm md:text-display font-bold text-foreground tracking-tight mb-6">
            {question.title}
          </h1>
          <div className="flex flex-wrap gap-4">
            <div className="px-4 py-2 bg-accent/5 rounded-xl">
              <span className="text-small text-foreground-muted block mb-1">
                {locale === "zh" ? "考察点" : "Key Points"}
              </span>
              <span className="text-foreground">{question.keyPoints}</span>
            </div>
          </div>
        </div>

        {!feedback ? (
          // Answer Input Section
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
                  {t.question?.yourAnswer || "Your Answer"}
                  <span className="text-foreground-muted ml-2">
                    ({answer.length} {locale === "zh" ? "字" : "chars"})
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
                  className="px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                {isSubmitting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {locale === "zh" ? "分析中..." : "Analyzing..."}
                  </>
                ) : (
                  <>
                    {t.question?.getFeedback || "Get Feedback"}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
              }
            />
          </div>
        ) : (
          // Feedback Section
          <div className="space-y-6">
            {/* Score */}
            <div className="bg-surface rounded-3xl p-8 md:p-10 border border-border text-center">
              <div className={`font-display text-display-xl md:text-[8rem] font-bold mb-4 ${getScoreColor(feedback.score)}`}>
                {feedback.score}
              </div>
              <div className="text-foreground-muted text-body">
                {getScoreLabel(feedback.score, locale)}
              </div>
            </div>

            {/* Feedback Details */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="bg-success/5 rounded-2xl p-6 border border-success/10">
                <h3 className="font-display text-heading font-semibold text-success mb-4">
                  {t.question?.strengths || "Strengths"}
                </h3>
                <ul className="space-y-2">
                  {feedback.good.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-foreground">
                      <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="bg-warning/5 rounded-2xl p-6 border border-warning/10">
                <h3 className="font-display text-heading font-semibold text-warning mb-4">
                  {t.question?.improvements || "Areas to Improve"}
                </h3>
                {feedback.improve.length > 0 ? (
                  <ul className="space-y-2">
                    {feedback.improve.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-foreground">
                        <svg className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-foreground-muted">{locale === "zh" ? "继续保持！" : "Keep it up!"}</p>
                )}
              </div>
            </div>

            {/* Suggestion */}
            <div className="bg-accent/5 rounded-2xl p-6 border border-accent/10">
              <h3 className="font-display text-heading font-semibold text-accent mb-2">
                {t.question?.suggestions || "Suggestions"}
              </h3>
              <p className="text-foreground">{feedback.suggestion}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setFeedback(null);
                  setAnswer("");
                }}
                className="flex-1 py-4 bg-surface border border-border text-foreground rounded-full font-semibold hover:bg-accent/5 transition-all"
              >
                {t.question?.retry || "Retry"}
              </button>
              {nextQuestion ? (
                <Link
                  href={`/practice/ai/${nextQuestion.id}`}
                  className="flex-1 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent-dark transition-all text-center"
                >
                  {t.question?.nextQuestion || "Next Question"}
                </Link>
              ) : (
                <Link
                  href="/practice"
                  className="flex-1 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent-dark transition-all text-center"
                >
                  {locale === "zh" ? "完成练习" : "Complete Practice"}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getTypeLabel(type: string) {
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
