"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { getPracticeRecordById, PracticeRecord } from "@/lib/practice-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Skeleton } from "@/components/ui/skeleton";

const translations = {
  zh: {
    title: "练习回顾",
    subtitle: "查看你的回答和 AI 反馈",
    loading: "加载中...",
    notFound: "练习记录不存在",
    backToHistory: "返回历史",
    questionTitle: "题目",
    yourAnswer: "你的回答",
    score: "得分",
    feedback: "AI 反馈",
    goodPoints: "亮点",
    improvements: "改进建议",
    suggestion: "优化建议",
    starAnswer: "优秀回答参考",
    practiceAgain: "再练一次",
    questionNotAvailable: "原题目不可用",
    questionDeleted: "该题目可能已被删除或无法访问",
    // Phase 2: 对比学习
    compareView: "对比视图",
    normalView: "普通视图",
    compareLearning: "对比学习",
    yourAnswerLabel: "你的回答",
    optimizedAnswerLabel: "AI 优化版",
    differences: "差异对比",
    added: "新增",
    removed: "删除",
    unchanged: "未变",
    compareHint: "通过对比你的回答和 AI 优化版，学习如何改进表达方式",
  },
  en: {
    title: "Practice Review",
    subtitle: "Review your answer and AI feedback",
    loading: "Loading...",
    notFound: "Practice record not found",
    backToHistory: "Back to History",
    questionTitle: "Question",
    yourAnswer: "Your Answer",
    score: "Score",
    feedback: "AI Feedback",
    goodPoints: "Highlights",
    improvements: "Areas to Improve",
    suggestion: "Optimization Suggestions",
    starAnswer: "Reference Answer",
    practiceAgain: "Practice Again",
    questionNotAvailable: "Question Not Available",
    questionDeleted: "This question may have been deleted or is inaccessible",
    // Phase 2: Compare Learning
    compareView: "Compare View",
    normalView: "Normal View",
    compareLearning: "Compare Learning",
    yourAnswerLabel: "Your Answer",
    optimizedAnswerLabel: "AI Optimized",
    differences: "Differences",
    added: "Added",
    removed: "Removed",
    unchanged: "Unchanged",
    compareHint: "Compare your answer with the AI optimized version to learn how to improve",
  },
};

// 简单的差异对比算法
function computeDiff(original: string, optimized: string): Array<{type: 'same' | 'added' | 'removed', text: string}> {
  const result: Array<{type: 'same' | 'added' | 'removed', text: string}> = [];

  // 按行分割
  const origLines = original.split('\n');
  const optLines = optimized.split('\n');

  // 使用简单的 LCS（最长公共子序列）算法
  const m = origLines.length;
  const n = optLines.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // 构建 DP 表
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origLines[i - 1].trim() === optLines[j - 1].trim()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯找出差异
  let i = m, j = n;
  const temp: Array<{type: 'same' | 'added' | 'removed', text: string}> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1].trim() === optLines[j - 1].trim()) {
      temp.unshift({ type: 'same', text: origLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      temp.unshift({ type: 'added', text: optLines[j - 1] });
      j--;
    } else if (i > 0) {
      temp.unshift({ type: 'removed', text: origLines[i - 1] });
      i--;
    }
  }

  // 合并连续的相同类型
  for (const item of temp) {
    if (result.length > 0 && result[result.length - 1].type === item.type) {
      result[result.length - 1].text += '\n' + item.text;
    } else {
      result.push({ ...item });
    }
  }

  return result;
}

// 差异高亮组件
function DiffView({ original, optimized, locale }: { original: string; optimized: string; locale: string }) {
  const t = translations[locale === "zh" ? "zh" : "en"];
  const diff = computeDiff(original, optimized);

  return (
    <div className="space-y-4">
      {/* 图例 */}
      <div className="flex items-center gap-4 text-sm text-foreground-muted mb-4">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded" />
          {t.added}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-rose-100 border border-rose-300 rounded" />
          {t.removed}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-surface border border-border rounded" />
          {t.unchanged}
        </span>
      </div>

      {/* 差异内容 */}
      <div className="bg-surface rounded-xl p-4 space-y-1 font-mono text-sm leading-relaxed whitespace-pre-wrap">
        {diff.map((item, index) => (
          <div
            key={index}
            className={`px-2 py-1 rounded ${
              item.type === 'added'
                ? 'bg-emerald-50 border-l-4 border-emerald-400 text-emerald-800'
                : item.type === 'removed'
                ? 'bg-rose-50 border-l-4 border-rose-400 text-rose-800 line-through opacity-70'
                : 'text-foreground'
            }`}
          >
            {item.text || ' '}
          </div>
        ))}
      </div>
    </div>
  );
}

// 对比视图组件
function CompareView({ record, locale }: { record: PracticeRecord; locale: string }) {
  const t = translations[locale === "zh" ? "zh" : "en"];
  const optimized = record.feedback?.optimizedAnswer || record.feedback?.starAnswer || '';

  return (
    <div className="space-y-6">
      {/* 提示 */}
      <div className="bg-accent/5 rounded-xl p-4 border border-accent/10">
        <p className="text-sm text-foreground-muted flex items-center gap-2">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t.compareHint}
        </p>
      </div>

      {/* 左右对比 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 左侧：用户原答案 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t.yourAnswerLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-surface rounded-lg p-4 whitespace-pre-wrap text-foreground text-sm leading-relaxed max-h-96 overflow-y-auto">
              {record.answer}
            </div>
          </CardContent>
        </Card>

        {/* 右侧：AI 优化版 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t.optimizedAnswerLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-accent/5 rounded-lg p-4 whitespace-pre-wrap text-foreground text-sm leading-relaxed border border-accent/10 max-h-96 overflow-y-auto">
              {optimized || (
                <span className="text-foreground-muted italic">
                  {locale === "zh" ? "暂无优化版本" : "No optimized version available"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 差异对比 */}
      {optimized && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {t.differences}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DiffView original={record.answer} optimized={optimized} locale={locale} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

function getScoreTextColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
}

export default function PracticeReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLanguage();
  const [record, setRecord] = useState<PracticeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionExists, setQuestionExists] = useState(true);
  const [showCompare, setShowCompare] = useState(false);

  const t = translations[locale === "zh" ? "zh" : "en"];
  const recordId = params.id as string;

  useEffect(() => {
    async function loadRecord() {
      try {
        const data = await getPracticeRecordById(recordId);
        if (data) {
          setRecord(data);
          // 检查题目是否存在
          try {
            const response = await fetch(`/api/questions/${data.questionId}`);
            setQuestionExists(response.ok);
          } catch {
            setQuestionExists(false);
          }
        }
      } catch (error) {
        console.error("Failed to load record:", error);
      } finally {
        setLoading(false);
      }
    }

    loadRecord();
  }, [recordId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="h-10 bg-surface rounded w-48 mb-4 animate-pulse" />
          <div className="h-6 bg-surface rounded w-96 mb-8 animate-pulse" />
          <div className="space-y-6">
            <div className="h-32 bg-surface rounded w-full animate-pulse" />
            <div className="h-48 bg-surface rounded w-full animate-pulse" />
            <div className="h-64 bg-surface rounded w-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-display text-heading-xl font-semibold text-foreground mb-3">{t.notFound}</h2>
            <Link href="/history">
              <Button className="mt-4">
                {t.backToHistory}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/history" className="text-foreground-muted hover:text-foreground transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <span className="text-foreground-muted">/</span>
            <span className="text-foreground font-medium">{t.title}</span>
          </div>
          <h1 className="font-display text-display-sm font-bold text-foreground tracking-tight mb-2">
            {record.questionTitle}
          </h1>
          <p className="text-foreground-muted">
            {new Date(record.createdAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Score Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground-muted text-sm mb-1">{t.score}</p>
                <div className="flex items-baseline gap-2">
                  <span className={`font-display text-5xl font-bold ${getScoreTextColor(record.score)}`}>
                    {record.score}
                  </span>
                  <span className="text-foreground-muted">/ 100</span>
                </div>
              </div>
              <div className={`w-20 h-20 rounded-full ${getScoreColor(record.score)} flex items-center justify-center text-white font-bold text-2xl`}>
                {record.score >= 80 ? "A" : record.score >= 60 ? "B" : "C"}
              </div>
            </div>
            <div className="mt-4 w-full bg-border rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getScoreColor(record.score)}`}
                style={{ width: `${record.score}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* View Toggle */}
        {(record.feedback?.optimizedAnswer || record.feedback?.starAnswer) && (
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompare(!showCompare)}
              className="flex items-center gap-2"
            >
              {showCompare ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  {t.normalView}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  {t.compareView}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Compare View or Normal View */}
        {showCompare && (record.feedback?.optimizedAnswer || record.feedback?.starAnswer) ? (
          <CompareView record={record} locale={locale} />
        ) : (
          <React.Fragment>
            {/* Your Answer */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {t.yourAnswer}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-surface rounded-xl p-4 whitespace-pre-wrap text-foreground leading-relaxed">
                  {record.answer}
                </div>
              </CardContent>
            </Card>

            {/* AI Feedback */}
            {record.feedback && (
              <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {t.feedback}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Good Points */}
              {record.feedback.good && record.feedback.good.length > 0 && (
                <div>
                  <h4 className="font-medium text-emerald-600 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t.goodPoints}
                  </h4>
                  <ul className="space-y-2">
                    {record.feedback.good.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-foreground">
                        <span className="text-emerald-500 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {record.feedback.improve && record.feedback.improve.length > 0 && (
                <div>
                  <h4 className="font-medium text-amber-600 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {t.improvements}
                  </h4>
                  <ul className="space-y-2">
                    {record.feedback.improve.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-foreground">
                        <span className="text-amber-500 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestion */}
              {record.feedback.suggestion && (
                <div className="bg-accent/5 rounded-xl p-4 border border-accent/10">
                  <h4 className="font-medium text-accent mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {t.suggestion}
                  </h4>
                  <p className="text-foreground leading-relaxed">{record.feedback.suggestion}</p>
                </div>
              )}

              {/* Star Answer */}
              {record.feedback.starAnswer && (
                <div>
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {t.starAnswer}
                  </h4>
                  <div className="bg-surface rounded-xl p-4 text-foreground-muted text-sm leading-relaxed border border-border">
                    {record.feedback.starAnswer}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
            )}
          </React.Fragment>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/history" className="flex-1">
            <Button variant="outline" className="w-full">
              {t.backToHistory}
            </Button>
          </Link>
          {questionExists ? (
            <Link href={`/questions/${record.questionId}`} className="flex-1">
              <Button className="w-full bg-accent hover:bg-accent-dark">
                {t.practiceAgain}
              </Button>
            </Link>
          ) : (
            <div className="flex-1">
              <Button className="w-full" disabled variant="secondary">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {t.questionNotAvailable}
                </span>
              </Button>
              <p className="text-xs text-foreground-muted text-center mt-2">{t.questionDeleted}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
