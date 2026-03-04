"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import {
  getInterviewSession,
  InterviewSession,
  InterviewAnswer,
} from "@/lib/interview-store";

// 分数颜色
function getScoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-error";
}

function getScoreBgColor(score: number) {
  if (score >= 80) return "bg-success/10";
  if (score >= 60) return "bg-warning/10";
  return "bg-error/10";
}

// 雷达图组件
function RadarChart({ scores }: { scores: InterviewSession["dimensionScores"] }) {
  const dimensions = [
    { key: "technical", label: "技术能力" },
    { key: "project", label: "项目经验" },
    { key: "behavioral", label: "行为面试" },
    { key: "communication", label: "沟通表达" },
  ];

  const maxScore = 100;
  const centerX = 100;
  const centerY = 100;
  const radius = 80;

  // 计算点的位置
  const getPoint = (index: number, score: number) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
    const r = (score / maxScore) * radius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    };
  };

  const points = dimensions.map((dim, idx) =>
    getPoint(idx, scores[dim.key as keyof typeof scores])
  );

  const pathData = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ") + " Z";

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* 背景网格 */}
        {[25, 50, 75, 100].map((level) => (
          <polygon
            key={level}
            points={dimensions
              .map((_, idx) => {
                const p = getPoint(idx, level);
                return `${p.x},${p.y}`;
              })
              .join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-border"
          />
        ))}

        {/* 轴线 */}
        {dimensions.map((_, idx) => {
          const p = getPoint(idx, 100);
          return (
            <line
              key={idx}
              x1={centerX}
              y1={centerY}
              x2={p.x}
              y2={p.y}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-border"
            />
          );
        })}

        {/* 数据区域 */}
        <path
          d={pathData}
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="2"
          className="text-accent"
        />

        {/* 数据点 */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="currentColor"
            className="text-accent"
          />
        ))}
      </svg>

      {/* 维度标签 */}
      <div className="absolute inset-0">
        {dimensions.map((dim, idx) => {
          const angle = (Math.PI * 2 * idx) / dimensions.length - Math.PI / 2;
          const labelRadius = radius + 20;
          const x = centerX + labelRadius * Math.cos(angle);
          const y = centerY + labelRadius * Math.sin(angle);
          return (
            <div
              key={dim.key}
              className="absolute text-xs text-foreground-muted transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(x / 200) * 100}%`,
                top: `${(y / 200) * 100}%`,
              }}
            >
              {dim.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function InterviewReportPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLanguage();
  const interviewId = params.id as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    const loadedSession = getInterviewSession(interviewId);
    if (!loadedSession) {
      router.push("/practice");
      return;
    }

    if (loadedSession.status !== "completed") {
      router.push(`/interview/${interviewId}`);
      return;
    }

    setSession(loadedSession);
  }, [interviewId, router]);

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground-muted">
            {locale === "zh" ? "加载中..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBgColor(
              session.overallScore
            )} mb-6`}
          >
            <span
              className={`font-display text-display-xl font-bold ${getScoreColor(
                session.overallScore
              )}`}
            >
              {session.overallScore}
            </span>
          </div>
          <h1 className="font-display text-display font-bold text-foreground tracking-tight mb-2">
            {session.title}
          </h1>
          <p className="text-foreground-muted">
            {locale === "zh"
              ? `完成于 ${new Date(session.completedAt || "").toLocaleDateString("zh-CN")}`
              : `Completed on ${new Date(session.completedAt || "").toLocaleDateString()}`}
          </p>
        </div>

        {/* Overall Feedback */}
        <div className="bg-surface rounded-3xl p-8 border border-border mb-8">
          <h2 className="font-display text-heading-xl font-semibold text-foreground mb-4">
            {locale === "zh" ? "整体评价" : "Overall Assessment"}
          </h2>
          <p className="text-foreground-muted text-body-lg mb-8">
            {session.overallFeedback}
          </p>

          {/* Radar Chart */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <RadarChart scores={session.dimensionScores} />

            {/* Dimension Scores */}
            <div className="space-y-4">
              <DimensionScore
                label={locale === "zh" ? "技术能力" : "Technical"}
                score={session.dimensionScores.technical}
              />
              <DimensionScore
                label={locale === "zh" ? "项目经验" : "Project Experience"}
                score={session.dimensionScores.project}
              />
              <DimensionScore
                label={locale === "zh" ? "行为面试" : "Behavioral"}
                score={session.dimensionScores.behavioral}
              />
              <DimensionScore
                label={locale === "zh" ? "沟通表达" : "Communication"}
                score={session.dimensionScores.communication}
              />
            </div>
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-success/5 rounded-2xl p-6 border border-success/10">
            <h3 className="font-display text-heading font-semibold text-success mb-4">
              {locale === "zh" ? "优势" : "Strengths"}
            </h3>
            <ul className="space-y-2">
              {session.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground">
                  <svg
                    className="w-5 h-5 text-success flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-warning/5 rounded-2xl p-6 border border-warning/10">
            <h3 className="font-display text-heading font-semibold text-warning mb-4">
              {locale === "zh" ? "改进建议" : "Areas to Improve"}
            </h3>
            <ul className="space-y-2">
              {session.improvements.map((improvement, idx) => (
                <li key={idx} className="flex items-start gap-2 text-foreground">
                  <svg
                    className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-accent/5 rounded-2xl p-6 border border-accent/10 mb-8">
          <h3 className="font-display text-heading font-semibold text-accent mb-4">
            {locale === "zh" ? "后续建议" : "Next Steps"}
          </h3>
          <ul className="space-y-2">
            {session.nextSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2 text-foreground">
                <span className="text-accent">{idx + 1}.</span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* Question Details */}
        <div className="mb-12">
          <h2 className="font-display text-heading-xl font-semibold text-foreground mb-6">
            {locale === "zh" ? "答题详情" : "Question Details"}
          </h2>
          <div className="space-y-4">
            {session.answers.map((answer, idx) => (
              <QuestionDetailCard
                key={answer.questionId}
                index={idx}
                answer={answer}
                question={session.questions.find((q) => q.id === answer.questionId)}
                isExpanded={expandedQuestion === answer.questionId}
                onToggle={() =>
                  setExpandedQuestion(
                    expandedQuestion === answer.questionId ? null : answer.questionId
                  )
                }
                locale={locale}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/practice"
            className="flex-1 py-4 bg-surface border border-border text-foreground rounded-full font-semibold hover:bg-accent/5 transition-all text-center"
          >
            {locale === "zh" ? "返回练习" : "Back to Practice"}
          </Link>
          <Link
            href="/history"
            className="flex-1 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent-dark transition-all text-center"
          >
            {locale === "zh" ? "查看历史" : "View History"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function DimensionScore({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-foreground-muted w-20">{label}</span>
      <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            score >= 80 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-error"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`font-semibold w-12 text-right ${getScoreColor(score)}`}>
        {score}
      </span>
    </div>
  );
}

function QuestionDetailCard({
  index,
  answer,
  question,
  isExpanded,
  onToggle,
  locale,
}: {
  index: number;
  answer: InterviewAnswer;
  question?: { title: string; type: string };
  isExpanded: boolean;
  onToggle: () => void;
  locale: string;
}) {
  if (!question) return null;

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center gap-4 hover:bg-accent/5 transition-colors"
      >
        <span className="flex-shrink-0 w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-sm font-medium text-accent">
          {index + 1}
        </span>
        <div className="flex-1 text-left">
          <p className="font-medium text-foreground line-clamp-1">{question.title}</p>
        </div>
        <span
          className={`font-display text-heading font-bold ${getScoreColor(answer.score)}`}
        >
          {answer.score}
        </span>
        <svg
          className={`w-5 h-5 text-foreground-muted transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-border">
          <div className="pt-4 space-y-4">
            {/* Your Answer */}
            <div>
              <h4 className="text-sm font-medium text-foreground-muted mb-2">
                {locale === "zh" ? "你的回答" : "Your Answer"}
              </h4>
              <div className="p-4 bg-background rounded-xl">
                <p className="text-foreground whitespace-pre-wrap">{answer.answer}</p>
              </div>
            </div>

            {/* Feedback */}
            <div className="grid md:grid-cols-2 gap-4">
              {answer.feedback.good.length > 0 && (
                <div className="p-3 bg-success/5 rounded-xl">
                  <h5 className="text-sm font-medium text-success mb-2">
                    {locale === "zh" ? "优点" : "Strengths"}
                  </h5>
                  <ul className="space-y-1">
                    {answer.feedback.good.map((item, idx) => (
                      <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-success">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {answer.feedback.improve.length > 0 && (
                <div className="p-3 bg-warning/5 rounded-xl">
                  <h5 className="text-sm font-medium text-warning mb-2">
                    {locale === "zh" ? "改进" : "Improvements"}
                  </h5>
                  <ul className="space-y-1">
                    {answer.feedback.improve.map((item, idx) => (
                      <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-warning">!</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Suggestion */}
            <div className="p-3 bg-accent/5 rounded-xl">
              <h5 className="text-sm font-medium text-accent mb-1">
                {locale === "zh" ? "建议" : "Suggestion"}
              </h5>
              <p className="text-sm text-foreground">{answer.feedback.suggestion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
