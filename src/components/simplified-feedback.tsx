"use client";

import React from "react";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SimplifiedFeedback } from "@/lib/rule-engine-feedback";

interface SimplifiedFeedbackProps {
  feedback: SimplifiedFeedback;
  onUpgrade: () => void;
  isUnauthenticated?: boolean;
  onLogin?: () => void;
}

const translations = {
  zh: {
    title: "基础评估报告",
    subtitle: "基于规则引擎的智能分析",
    score: "基础评分",
    strengthSummary: "已展现优势",
    improvementPriority: "优先改进",
    keyPointsCovered: "已覆盖关键点",
    keyPointsMissed: "缺失关键点",
    lengthAssessment: "长度评估",
    structureHints: "结构建议",
    generalTips: "实用建议",
    starCompleteness: "STAR结构完整性",
    upgradeTitle: "想要更深入的分析？",
    upgradeButton: "解锁 AI 深度分析",
    noKeyPoints: "暂无关键点信息",
    loginTitle: "登录解锁完整分析",
    loginSubtitle: "登录后可查看 AI 深度分析和完整反馈",
    loginButton: "立即登录",
    loginHint: "还没有账号？登录后可开通会员享受更多权益",
  },
  en: {
    title: "Basic Assessment Report",
    subtitle: "Intelligent analysis based on rule engine",
    score: "Basic Score",
    strengthSummary: "Strengths Demonstrated",
    improvementPriority: "Priority Improvements",
    keyPointsCovered: "Key Points Covered",
    keyPointsMissed: "Key Points Missed",
    lengthAssessment: "Length Assessment",
    structureHints: "Structure Suggestions",
    generalTips: "Practical Tips",
    starCompleteness: "STAR Structure Completeness",
    upgradeTitle: "Want deeper analysis?",
    upgradeButton: "Unlock AI Deep Analysis",
    noKeyPoints: "No key points available",
    loginTitle: "Login for Full Analysis",
    loginSubtitle: "View AI deep analysis and complete feedback after login",
    loginButton: "Login Now",
    loginHint: "No account yet? Login to activate membership for more benefits",
  },
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-rose-500";
}

function getScoreBgColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

function getScoreLevel(score: number, locale: string) {
  if (score >= 90) return locale === "zh" ? "优秀" : "Excellent";
  if (score >= 80) return locale === "zh" ? "良好" : "Good";
  if (score >= 60) return locale === "zh" ? "及格" : "Fair";
  return locale === "zh" ? "需提升" : "Needs Work";
}

export function SimplifiedFeedbackView({
  feedback,
  onUpgrade,
  isUnauthenticated = false,
  onLogin,
}: SimplifiedFeedbackProps) {
  const { locale } = useLanguage();
  const t = translations[locale === "zh" ? "zh" : "en"];

  return (
    <div className="space-y-6">
      {/* 评分卡片 - 更突出 */}
      <Card className="border-2 border-slate-200">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="text-left">
                <p className="text-xs text-foreground-muted mb-1">{t.score}</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold font-display ${getScoreColor(feedback.basicScore)}`}>
                    {feedback.basicScore}
                  </span>
                  <span className="text-sm text-foreground-muted">/ 100</span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full ${getScoreBgColor(feedback.basicScore)} bg-opacity-10`}>
                <span className={`text-sm font-medium ${getScoreColor(feedback.basicScore)}`}>
                  {getScoreLevel(feedback.basicScore, locale)}
                </span>
              </div>
            </div>
          </div>

          {/* 优势总结 */}
          {feedback.strengthSummary && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-emerald-700 mb-1">
                    {t.strengthSummary}
                  </h4>
                  <p className="text-sm text-emerald-600">{feedback.strengthSummary}</p>
                </div>
              </div>
            </div>
          )}

          {/* 优先改进点 */}
          {feedback.improvementPriority && feedback.improvementPriority.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-700 mb-2">
                    {t.improvementPriority}
                  </h4>
                  <ul className="space-y-1.5">
                    {feedback.improvementPriority.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-amber-700">
                        <span className="font-bold mt-0.5">{index + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* STAR结构完整性（如果有） */}
      {feedback.starCompleteness && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {t.starCompleteness}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border ${feedback.starCompleteness.situation ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  {feedback.starCompleteness.situation ? (
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm font-medium ${feedback.starCompleteness.situation ? 'text-emerald-700' : 'text-slate-500'}`}>
                    Situation (情境)
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${feedback.starCompleteness.task ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  {feedback.starCompleteness.task ? (
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm font-medium ${feedback.starCompleteness.task ? 'text-emerald-700' : 'text-slate-500'}`}>
                    Task (任务)
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${feedback.starCompleteness.action ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  {feedback.starCompleteness.action ? (
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm font-medium ${feedback.starCompleteness.action ? 'text-emerald-700' : 'text-slate-500'}`}>
                    Action (行动)
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${feedback.starCompleteness.result ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2">
                  {feedback.starCompleteness.result ? (
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm font-medium ${feedback.starCompleteness.result ? 'text-emerald-700' : 'text-slate-500'}`}>
                    Result (结果)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Points Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            {locale === "zh" ? "关键点分析" : "Key Points Analysis"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedback.keyPointsCovered.length === 0 &&
          feedback.keyPointsMissed.length === 0 ? (
            <p className="text-foreground-muted text-sm">{t.noKeyPoints}</p>
          ) : (
            <>
              {/* Covered */}
              {feedback.keyPointsCovered.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-emerald-600 mb-2 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
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
                    {t.keyPointsCovered} ({feedback.keyPointsCovered.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {feedback.keyPointsCovered.map((point, index) => (
                      <span
                        key={index}
                        className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium"
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missed */}
              {feedback.keyPointsMissed.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-rose-600 mb-2 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
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
                    {t.keyPointsMissed} ({feedback.keyPointsMissed.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {feedback.keyPointsMissed.map((point, index) => (
                      <span
                        key={index}
                        className="text-xs px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full font-medium"
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Length Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t.lengthAssessment}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${
              feedback.lengthAssessment === "good"
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-amber-50 border border-amber-200"
            }`}
          >
            {feedback.lengthAssessment === "good" ? (
              <svg
                className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5"
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
            ) : (
              <svg
                className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
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
            )}
            <p
              className={`text-sm flex-1 ${
                feedback.lengthAssessment === "good"
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              {feedback.lengthMessage}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Structure Hints */}
      {feedback.structureHints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {t.structureHints}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {feedback.structureHints.map((hint, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <span className="text-accent font-bold text-sm mt-0.5">{index + 1}.</span>
                  <span className="text-sm text-foreground flex-1">{hint}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Tips */}
      {feedback.generalTips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {t.generalTips}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {feedback.generalTips.map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-blue-700 flex-1">{tip}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade/Login CTA */}
      {isUnauthenticated ? (
        /* 未登录用户 - 显示登录引导 */
        <Card className="border-2 border-accent/30 bg-gradient-to-r from-accent/5 to-accent/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {t.loginTitle}
              </h3>
              <p className="text-sm text-foreground-muted mb-6 max-w-md mx-auto">
                {t.loginSubtitle}
              </p>
              <Button
                size="lg"
                className="bg-accent hover:bg-accent-dark"
                onClick={onLogin}
              >
                {t.loginButton}
              </Button>
              <p className="text-xs text-foreground-muted mt-4">
                {t.loginHint}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* 已登录但未开通会员 - 显示升级引导 */
        <Card className="border-2 border-accent/30 bg-gradient-to-r from-accent/5 to-accent/10">
          <CardContent className="pt-6 pb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {t.upgradeTitle}
              </h3>
              <div className="text-left max-w-md mx-auto mb-6">
                <p className="text-sm text-foreground-muted whitespace-pre-line">
                  {feedback.upgradePrompt}
                </p>
              </div>
              <Button
                size="lg"
                className="bg-accent hover:bg-accent-dark"
                onClick={onUpgrade}
              >
                {t.upgradeButton}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
