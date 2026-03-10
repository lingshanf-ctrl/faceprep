"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ArrowUpCircle,
  BarChart3,
  Target,
  Sparkles,
  Lock,
  ChevronRight,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { UpgradePromptCard } from "./upgrade-prompt-card";
import { useState } from "react";

interface InterviewAnswer {
  questionId: string;
  questionTitle?: string;
  answer: string;
  score: number;
  duration?: number;
  feedback?: {
    totalScore?: number;
    dimensions?: {
      content?: { score: number; feedback?: string; preview?: string };
      structure?: { score: number; feedback?: string; preview?: string };
      expression?: { score: number; feedback?: string; preview?: string };
      highlights?: { score: number; feedback?: string; preview?: string };
    };
    keyFindings?: {
      strengths?: string[];
      weaknesses?: string[];
      criticalMissing?: string;
    };
    quickAdvice?: {
      primary?: string;
      secondary?: string;
    } | string;
    upgradeTeaser?: {
      gapHint?: string;
      optimizedPreview?: string;
      coachInsight?: string;
    };
    good?: string[];
    improve?: string[];
  };
}

interface InterviewSession {
  id: string;
  title: string;
  overallScore: number;
  answers: InterviewAnswer[];
  strengths?: string[];
  improvements?: string[];
}

interface BasicInterviewFeedbackProps {
  session: InterviewSession;
  isUnauthenticated: boolean;
  onLogin: () => void;
  onUpgrade: () => void;
}

const translations = {
  zh: {
    overallScore: "综合评分",
    questionsAnswered: "道题已回答",
    answersOverview: "答题概览",
    generalFeedback: "整体反馈",
    performance: "表现",
    strengths: "亮点",
    improvements: "提升空间",
    dimensionAnalysis: "四维能力分析",
    content: "内容覆盖",
    structure: "结构逻辑",
    expression: "表达专业",
    highlights: "综合亮点",
    keyFindings: "关键发现",
    criticalMissing: "关键缺失",
    coreAdvice: "核心改进建议",
    viewDetails: "查看详情",
    upgradeToUnlock: "升级解锁深度分析",
    previewHint: "专业版包含原文引用分析、修改示例、优化答案等",
    scoreLevel: {
      excellent: "优秀",
      good: "良好",
      pass: "及格",
      needsWork: "需提升",
    },
  },
  en: {
    overallScore: "Overall Score",
    questionsAnswered: "questions answered",
    answersOverview: "Answers Overview",
    generalFeedback: "General Feedback",
    performance: "Performance",
    strengths: "Strengths",
    improvements: "Areas to Improve",
    dimensionAnalysis: "4-Dimension Analysis",
    content: "Content",
    structure: "Structure",
    expression: "Expression",
    highlights: "Highlights",
    keyFindings: "Key Findings",
    criticalMissing: "Critical Missing",
    coreAdvice: "Core Advice",
    viewDetails: "View Details",
    upgradeToUnlock: "Upgrade for Deep Analysis",
    previewHint: "Premium includes quote analysis, modification examples, optimized answers",
    scoreLevel: {
      excellent: "Excellent",
      good: "Good",
      pass: "Pass",
      needsWork: "Needs Work",
    },
  },
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 60) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

function getScoreLevel(score: number, locale: string): string {
  const t = translations[locale === "zh" ? "zh" : "en"];
  if (score >= 90) return t.scoreLevel.excellent;
  if (score >= 80) return t.scoreLevel.good;
  if (score >= 60) return t.scoreLevel.pass;
  return t.scoreLevel.needsWork;
}

// 维度预览卡片（带锁）
function DimensionPreviewCard({
  label,
  score,
  preview,
  onUpgrade,
  locale,
}: {
  label: string;
  score: number;
  preview?: string;
  onUpgrade: () => void;
  locale: string;
}) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{label}</span>
        <div className="flex items-center gap-1">
          <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${getScoreBarColor(score)} rounded-full`}
          style={{ width: `${score}%` }}
        />
      </div>
      {preview && (
        <div className="relative">
          <p className="text-xs text-slate-600 line-clamp-2">{preview}</p>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/80" />
          <button
            onClick={onUpgrade}
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 text-xs text-accent hover:text-accent/80 font-medium py-1 bg-slate-50/90"
          >
            <Lock className="w-3 h-3" />
            {locale === "zh" ? "解锁完整分析" : "Unlock full analysis"}
          </button>
        </div>
      )}
    </div>
  );
}

export function BasicInterviewFeedback({
  session,
  isUnauthenticated,
  onLogin,
  onUpgrade,
}: BasicInterviewFeedbackProps) {
  const { locale } = useLanguage();
  const t = translations[locale === "zh" ? "zh" : "en"];
  const [expandedAnswer, setExpandedAnswer] = useState<number | null>(null);

  const overallScore =
    session.overallScore ||
    Math.round(
      session.answers.reduce((sum, a) => sum + (a.score || 0), 0) /
        (session.answers.length || 1)
    );

  // 获取第一个有反馈的答案用于展示4维度预览
  const sampleAnswer = session.answers.find((a) => a.feedback?.dimensions);
  const dimensions = sampleAnswer?.feedback?.dimensions;

  // 收集所有关键发现
  const allStrengths: string[] = [];
  const allWeaknesses: string[] = [];
  const criticalMissings: string[] = [];

  session.answers.forEach((answer) => {
    if (answer.feedback?.keyFindings?.strengths) {
      allStrengths.push(...answer.feedback.keyFindings.strengths.slice(0, 1));
    }
    if (answer.feedback?.keyFindings?.weaknesses) {
      allWeaknesses.push(...answer.feedback.keyFindings.weaknesses.slice(0, 1));
    }
    if (answer.feedback?.keyFindings?.criticalMissing) {
      criticalMissings.push(answer.feedback.keyFindings.criticalMissing);
    }
  });

  // 获取升级预览数据
  const upgradeTeaser = sampleAnswer?.feedback?.upgradeTeaser;

  return (
    <div className="space-y-6">
      {/* 整体评分 */}
      <Card className="border border-slate-200 bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">{t.overallScore}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}
                </span>
                <span className="text-sm text-slate-400">/100</span>
              </div>
              <p className={`text-sm mt-1 ${getScoreColor(overallScore)}`}>
                {getScoreLevel(overallScore, locale)}
              </p>
            </div>
            <div className="text-right">
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium border ${getScoreBgColor(
                  overallScore
                )}`}
              >
                {session.answers?.length} {t.questionsAnswered}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4维度分析预览 */}
      {dimensions && (
        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              {t.dimensionAnalysis}
              <Lock className="w-3 h-3 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <DimensionPreviewCard
                label={t.content}
                score={dimensions.content?.score || 0}
                preview={dimensions.content?.preview}
                onUpgrade={onUpgrade}
                locale={locale}
              />
              <DimensionPreviewCard
                label={t.structure}
                score={dimensions.structure?.score || 0}
                preview={dimensions.structure?.preview}
                onUpgrade={onUpgrade}
                locale={locale}
              />
              <DimensionPreviewCard
                label={t.expression}
                score={dimensions.expression?.score || 0}
                preview={dimensions.expression?.preview}
                onUpgrade={onUpgrade}
                locale={locale}
              />
              <DimensionPreviewCard
                label={t.highlights}
                score={dimensions.highlights?.score || 0}
                preview={dimensions.highlights?.preview}
                onUpgrade={onUpgrade}
                locale={locale}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 关键发现 */}
      <Card className="border border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            {t.keyFindings}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 关键缺失 */}
            {criticalMissings.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                <h4 className="text-xs font-medium text-rose-700 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {t.criticalMissing}
                </h4>
                <ul className="space-y-1">
                  {criticalMissings.slice(0, 2).map((item, idx) => (
                    <li key={idx} className="text-xs text-rose-600 flex items-start gap-1">
                      <span className="text-rose-400 mt-0.5">•</span>
                      <span className="line-clamp-2">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 亮点 */}
            {allStrengths.length > 0 && (
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-medium text-slate-600">{t.strengths}</span>
                  <ul className="mt-1 space-y-1">
                    {allStrengths.slice(0, 2).map((s, i) => (
                      <li key={i} className="text-xs text-slate-600">{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 提升空间 */}
            {allWeaknesses.length > 0 && (
              <div className="flex items-start gap-2">
                <ArrowUpCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-medium text-slate-600">{t.improvements}</span>
                  <ul className="mt-1 space-y-1">
                    {allWeaknesses.slice(0, 2).map((m, i) => (
                      <li key={i} className="text-xs text-slate-600">{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 答题概览 */}
      <Card className="border border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">{t.answersOverview}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {session.answers?.map((answer, idx) => {
              const isExpanded = expandedAnswer === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedAnswer(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-slate-700 truncate max-w-[180px]">
                        {answer.questionTitle || `${locale === "zh" ? "问题" : "Question"} ${idx + 1}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-xs ${
                          answer.score >= 80
                            ? "bg-emerald-100 text-emerald-700"
                            : answer.score >= 60
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {answer.score || "--"}
                      </Badge>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-slate-100 pt-3">
                      <div className="bg-slate-50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-slate-500 mb-1">
                          {locale === "zh" ? "你的回答" : "Your Answer"}
                        </p>
                        <p className="text-sm text-slate-700 line-clamp-3">{answer.answer}</p>
                      </div>
                      {answer.feedback?.good && answer.feedback.good.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-emerald-600 font-medium mb-1">{t.strengths}</p>
                          <ul className="space-y-1">
                            {answer.feedback.good.slice(0, 2).map((g, i) => (
                              <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                {g}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {answer.feedback?.improve && answer.feedback.improve.length > 0 && (
                        <div>
                          <p className="text-xs text-amber-600 font-medium mb-1">{t.improvements}</p>
                          <ul className="space-y-1">
                            {answer.feedback.improve.slice(0, 2).map((m, i) => (
                              <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                                <ArrowUpCircle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                                {m}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <Button
                        onClick={onUpgrade}
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3 text-accent hover:text-accent/80"
                      >
                        <Sparkles className="w-4 h-4 mr-1" />
                        {locale === "zh" ? "查看深度分析" : "View deep analysis"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 升级引导 */}
      <UpgradePromptCard
        isUnauthenticated={isUnauthenticated}
        onLogin={onLogin}
        onUpgrade={onUpgrade}
        teaserData={upgradeTeaser}
      />
    </div>
  );
}
