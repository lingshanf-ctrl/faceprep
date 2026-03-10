"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowUpCircle, BarChart3 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { UpgradePromptCard } from "./upgrade-prompt-card";

interface InterviewAnswer {
  questionId: string;
  questionTitle?: string;
  answer: string;
  score: number;
  duration?: number;
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
  },
  en: {
    overallScore: "Overall Score",
    questionsAnswered: "questions answered",
    answersOverview: "Answers Overview",
    generalFeedback: "General Feedback",
    performance: "Performance",
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

export function BasicInterviewFeedback({
  session,
  isUnauthenticated,
  onLogin,
  onUpgrade,
}: BasicInterviewFeedbackProps) {
  const { locale } = useLanguage();
  const t = translations[locale === "zh" ? "zh" : "en"];

  const overallScore =
    session.overallScore ||
    Math.round(
      session.answers.reduce((sum, a) => sum + (a.score || 0), 0) /
        (session.answers.length || 1)
    );

  return (
    <div className="space-y-6">
      {/* 整体评分 - 简洁版 */}
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
            </div>
            <div className="text-right">
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium border ${getScoreBgColor(
                  overallScore
                )}`}
              >
                {getScoreLevel(overallScore, locale)}
              </div>
              <p className="text-sm text-slate-400 mt-2">
                {session.answers?.length} {t.questionsAnswered}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 答题概览 - 仅显示列表 */}
      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            {t.answersOverview}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {session.answers?.map((answer, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-slate-700 truncate max-w-[200px]">
                    {answer.questionTitle || `${locale === "zh" ? "问题" : "Question"} ${idx + 1}`}
                  </p>
                </div>
                <Badge
                  variant={answer.score && answer.score >= 60 ? "default" : "destructive"}
                  className={`text-xs ${
                    answer.score >= 80
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                      : answer.score >= 60
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                      : "bg-rose-100 text-rose-700 hover:bg-rose-100"
                  }`}
                >
                  {answer.score || "--"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 基础建议 */}
      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">{t.generalFeedback}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {session.strengths?.slice(0, 2).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-slate-700">{s}</span>
              </li>
            ))}
            {session.improvements?.slice(0, 2).map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <ArrowUpCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-slate-700">{m}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 升级引导 */}
      <UpgradePromptCard
        isUnauthenticated={isUnauthenticated}
        onLogin={onLogin}
        onUpgrade={onUpgrade}
      />
    </div>
  );
}
