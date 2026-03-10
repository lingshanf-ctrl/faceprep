"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Lightbulb } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { DimensionBar } from "./dimension-bar";
import { UpgradePromptCard } from "./upgrade-prompt-card";

interface FeedbackDimensions {
  content?: { score: number; feedback?: string };
  structure?: { score: number; feedback?: string };
  expression?: { score: number; feedback?: string };
  highlights?: { score: number; feedback?: string };
}

interface PracticeFeedback {
  totalScore?: number;
  score?: number;
  dimensions?: FeedbackDimensions;
  good?: string[];
  improve?: string[];
  suggestion?: string;
}

interface BasicFeedbackViewProps {
  feedback: PracticeFeedback | null;
  isUnauthenticated: boolean;
  onLogin: () => void;
  onUpgrade: () => void;
}

const translations = {
  zh: {
    overallScore: "综合评分",
    coreDimensions: "核心维度",
    content: "内容覆盖",
    structure: "结构逻辑",
    expression: "表达专业",
    quickTips: "快速建议",
    strengths: "表现亮点",
    improvements: "提升空间",
  },
  en: {
    overallScore: "Overall Score",
    coreDimensions: "Core Dimensions",
    content: "Content Coverage",
    structure: "Structure Logic",
    expression: "Expression",
    quickTips: "Quick Tips",
    strengths: "Strengths",
    improvements: "Areas to Improve",
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

function getScoreLevel(score: number, locale: string): string {
  if (locale === "zh") {
    if (score >= 90) return "优秀";
    if (score >= 80) return "良好";
    if (score >= 60) return "及格";
    return "需提升";
  }
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Pass";
  return "Needs Improvement";
}

export function BasicFeedbackView({
  feedback,
  isUnauthenticated,
  onLogin,
  onUpgrade,
}: BasicFeedbackViewProps) {
  const { locale } = useLanguage();
  const t = translations[locale === "zh" ? "zh" : "en"];

  if (!feedback) return null;

  const score = feedback.totalScore || feedback.score || 0;
  const dimensions = feedback.dimensions || {};
  const goodPoints = feedback.good || [];
  const improvePoints = feedback.improve || [];

  return (
    <div className="space-y-4">
      {/* 评分卡片 - 简洁版 */}
      <Card className="border border-slate-200 bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">{t.overallScore}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </span>
                <span className="text-sm text-slate-400">/100</span>
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium border ${getScoreBgColor(
                score
              )}`}
            >
              {getScoreLevel(score, locale)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 核心维度 - 仅显示3个基础维度 */}
      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {t.coreDimensions}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <DimensionBar
              label={t.content}
              score={dimensions.content?.score || 0}
              color="blue"
            />
            <DimensionBar
              label={t.structure}
              score={dimensions.structure?.score || 0}
              color="purple"
            />
            <DimensionBar
              label={t.expression}
              score={dimensions.expression?.score || 0}
              color="amber"
            />
          </div>
        </CardContent>
      </Card>

      {/* 快速建议 - 简洁列表 */}
      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">{t.quickTips}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {goodPoints.slice(0, 2).map((item, idx) => (
              <li key={`good-${idx}`} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-slate-700">{item}</span>
              </li>
            ))}
            {improvePoints.slice(0, 2).map((item, idx) => (
              <li
                key={`improve-${idx}`}
                className="flex items-start gap-2 text-sm"
              >
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 升级引导卡片 - 底部强引导 */}
      <UpgradePromptCard
        isUnauthenticated={isUnauthenticated}
        onLogin={onLogin}
        onUpgrade={onUpgrade}
      />
    </div>
  );
}
