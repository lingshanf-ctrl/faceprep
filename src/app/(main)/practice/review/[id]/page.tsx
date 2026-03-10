"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { getPracticeRecordById, PracticeRecord } from "@/lib/practice-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { AIEvaluationProgress } from "@/components/ai-evaluation-progress";
import { UpgradeModal } from "@/components/upgrade-modal";
import { SimplifiedFeedbackView } from "@/components/simplified-feedback";
import { generateRuleBasedFeedback, type SimplifiedFeedback } from "@/lib/rule-engine-feedback";
import { BasicFeedbackView, PremiumFeedbackView } from "@/components/feedback";
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
    // 多维度评估
    multiDimensionalAssessment: "多维能力评估",
    contentCompleteness: "内容完整性",
    structureLogic: "结构逻辑性",
    expressionProfession: "表达专业性",
    differentiationHighlights: "差异化亮点",
    gapAnalysis: "差距分析",
    missing: "缺失",
    insufficient: "不足",
    good: "良好",
    excellent: "亮点",
    actionItems: "改进行动清单",
    highPriority: "高优先级",
    mediumPriority: "中优先级",
    lowPriority: "低优先级",
    coachMessage: "教练寄语",
    // Phase 3: 进步曲线
    progressCurve: "进步曲线",
    practiceCount: "练习次数",
    bestScore: "最佳分数",
    averageScore: "平均分数",
    improvement: "进步幅度",
    firstScore: "首次分数",
    latestScore: "最新分数",
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
    // Multi-dimensional Assessment
    multiDimensionalAssessment: "Multi-dimensional Assessment",
    contentCompleteness: "Content Completeness",
    structureLogic: "Structure & Logic",
    expressionProfession: "Expression Professionalism",
    differentiationHighlights: "Differentiation Highlights",
    gapAnalysis: "Gap Analysis",
    missing: "Missing",
    insufficient: "Insufficient",
    good: "Good",
    excellent: "Excellent",
    actionItems: "Action Items",
    highPriority: "High Priority",
    mediumPriority: "Medium Priority",
    lowPriority: "Low Priority",
    coachMessage: "Coach's Message",
    // Phase 3: Progress
    progressCurve: "Progress Curve",
    practiceCount: "Practice Count",
    bestScore: "Best Score",
    averageScore: "Average Score",
    improvement: "Improvement",
    firstScore: "First Score",
    latestScore: "Latest Score",
  },
};

// 进步曲线组件
function ProgressCurve({ history, locale }: { history: Array<{ attempt: number; score: number; date: string }>; locale: string }) {
  const t = translations[locale === "zh" ? "zh" : "en"];

  if (history.length < 2) return null;

  const maxScore = 100;
  const minScore = 0;
  const range = maxScore - minScore;

  // 计算统计数据
  const firstScore = history[0]?.score || 0;
  const latestScore = history[history.length - 1]?.score || 0;
  const bestScore = Math.max(...history.map(h => h.score));
  const averageScore = Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length);
  const improvement = latestScore - firstScore;

  // 简单的折线图表
  const width = 100;
  const height = 60;
  const padding = 10;

  const points = history.map((item, index) => {
    const x = padding + (index / (history.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((item.score - minScore) / range) * (height - 2 * padding);
    return { x, y, score: item.score };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {t.progressCurve}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-surface rounded-xl p-4 text-center">
            <p className="text-xs text-foreground-muted mb-1">{t.practiceCount}</p>
            <p className="font-display text-2xl font-bold text-foreground">{history.length}</p>
          </div>
          <div className="bg-surface rounded-xl p-4 text-center">
            <p className="text-xs text-foreground-muted mb-1">{t.bestScore}</p>
            <p className={`font-display text-2xl font-bold ${bestScore >= 80 ? 'text-emerald-500' : bestScore >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
              {bestScore}
            </p>
          </div>
          <div className="bg-surface rounded-xl p-4 text-center">
            <p className="text-xs text-foreground-muted mb-1">{t.averageScore}</p>
            <p className={`font-display text-2xl font-bold ${averageScore >= 80 ? 'text-emerald-500' : averageScore >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
              {averageScore}
            </p>
          </div>
        </div>

        {/* 进步对比 */}
        <div className="flex items-center justify-between mb-4 px-4">
          <div className="text-center">
            <p className="text-xs text-foreground-muted mb-1">{t.firstScore}</p>
            <p className="font-display text-xl font-bold text-foreground">{firstScore}</p>
          </div>
          <div className="flex-1 mx-4 flex items-center justify-center">
            <div className={`text-sm font-medium px-3 py-1 rounded-full ${
              improvement > 0 ? 'bg-emerald-100 text-emerald-700' :
              improvement < 0 ? 'bg-rose-100 text-rose-700' : 'bg-foreground-muted/10 text-foreground-muted'
            }`}>
              {improvement > 0 ? '+' : ''}{improvement} {locale === 'zh' ? '分' : 'pts'}
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-foreground-muted mb-1">{t.latestScore}</p>
            <p className={`font-display text-xl font-bold ${latestScore >= 80 ? 'text-emerald-500' : latestScore >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
              {latestScore}
            </p>
          </div>
        </div>

        {/* 折线图 */}
        <div className="bg-surface rounded-xl p-4">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32" preserveAspectRatio="none">
            {/* 背景网格线 */}
            {[0, 25, 50, 75, 100].map((level) => {
              const y = height - padding - ((level - minScore) / range) * (height - 2 * padding);
              return (
                <line
                  key={level}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-border"
                  strokeDasharray="2,2"
                />
              );
            })}

            {/* 折线 */}
            <path
              d={pathData}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-accent"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 数据点 */}
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  className={`${p.score >= 80 ? 'fill-emerald-500' : p.score >= 60 ? 'fill-amber-500' : 'fill-rose-500'}`}
                  stroke="white"
                  strokeWidth="1"
                />
                {/* 分数标签 */}
                <text
                  x={p.x}
                  y={p.y - 6}
                  textAnchor="middle"
                  className="text-[8px] fill-foreground-muted"
                >
                  {p.score}
                </text>
              </g>
            ))}
          </svg>

          {/* X轴标签 */}
          <div className="flex justify-between text-xs text-foreground-muted mt-2 px-2">
            {history.map((h, i) => (
              <span key={i}>
                {locale === 'zh' ? `第${i + 1}次` : `#${i + 1}`}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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

// 多维度评估组件
function MultiDimensionalFeedback({ feedback, locale }: { feedback: PracticeRecord['feedback']; locale: string }) {
  const t = translations[locale === "zh" ? "zh" : "en"];

  if (!feedback?.dimensions) return null;

  const { content, structure, expression, highlights } = feedback.dimensions;

  const dimensionCards = [
    { key: 'content', label: t.contentCompleteness, data: content, color: 'bg-blue-500', icon: '📝' },
    { key: 'structure', label: t.structureLogic, data: structure, color: 'bg-purple-500', icon: '🏗️' },
    { key: 'expression', label: t.expressionProfession, data: expression, color: 'bg-amber-500', icon: '💬' },
    { key: 'highlights', label: t.differentiationHighlights, data: highlights, color: 'bg-emerald-500', icon: '⭐' },
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {t.multiDimensionalAssessment}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 四维度评分卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dimensionCards.map((dim) => (
            <div key={dim.key} className="bg-surface rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{dim.icon}</span>
                <span className="text-xs font-medium text-foreground-muted">{dim.label}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className={`font-display text-2xl font-bold ${
                  dim.data.score >= 80 ? 'text-emerald-500' :
                  dim.data.score >= 60 ? 'text-amber-500' : 'text-rose-500'
                }`}>
                  {dim.data.score}
                </span>
                <span className="text-xs text-foreground-muted">/100</span>
              </div>
              <div className="w-full bg-border rounded-full h-1.5 mb-2">
                <div
                  className={`h-1.5 rounded-full ${dim.color}`}
                  style={{ width: `${dim.data.score}%` }}
                />
              </div>
              <p className="text-xs text-foreground-muted line-clamp-2">{dim.data.feedback}</p>
            </div>
          ))}
        </div>

        {/* 详细信息 */}
        <div className="space-y-4">
          {content.missing && content.missing.length > 0 && (
            <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
              <h4 className="text-sm font-medium text-rose-700 mb-2">{t.contentCompleteness} - {locale === 'zh' ? '缺失点' : 'Missing'}</h4>
              <ul className="space-y-1">
                {content.missing.map((item, idx) => (
                  <li key={idx} className="text-sm text-rose-600 flex items-start gap-2">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {structure.issues && structure.issues.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <h4 className="text-sm font-medium text-amber-700 mb-2">{t.structureLogic} - {locale === 'zh' ? '问题' : 'Issues'}</h4>
              <ul className="space-y-1">
                {structure.issues.map((item, idx) => (
                  <li key={idx} className="text-sm text-amber-600 flex items-start gap-2">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {expression.suggestions && expression.suggestions.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <h4 className="text-sm font-medium text-blue-700 mb-2">{t.expressionProfession} - {locale === 'zh' ? '建议' : 'Suggestions'}</h4>
              <ul className="space-y-1">
                {expression.suggestions.map((item, idx) => (
                  <li key={idx} className="text-sm text-blue-600 flex items-start gap-2">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {highlights.strongPoints && highlights.strongPoints.length > 0 && (
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
              <h4 className="text-sm font-medium text-emerald-700 mb-2">{t.differentiationHighlights} - {locale === 'zh' ? '亮点' : 'Highlights'}</h4>
              <ul className="space-y-1">
                {highlights.strongPoints.map((item, idx) => (
                  <li key={idx} className="text-sm text-emerald-600 flex items-start gap-2">
                    <span>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 差距分析组件
function GapAnalysisView({ feedback, locale }: { feedback: PracticeRecord['feedback']; locale: string }) {
  const t = translations[locale === "zh" ? "zh" : "en"];

  if (!feedback?.gapAnalysis) return null;

  const { missing, insufficient, good, excellent } = feedback.gapAnalysis;

  if (missing.length === 0 && insufficient.length === 0 && good.length === 0 && excellent.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {t.gapAnalysis}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {missing.length > 0 && (
            <div className="border-l-4 border-rose-400 pl-4">
              <h4 className="text-sm font-medium text-rose-600 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-xs">🔴</span>
                {t.missing} ({missing.length})
              </h4>
              <ul className="space-y-2">
                {missing.map((item, idx) => (
                  <li key={idx} className="text-sm text-foreground-muted">
                    <span className="text-rose-500 font-medium">{item.location}:</span> {item.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insufficient.length > 0 && (
            <div className="border-l-4 border-amber-400 pl-4">
              <h4 className="text-sm font-medium text-amber-600 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-xs">🟡</span>
                {t.insufficient} ({insufficient.length})
              </h4>
              <ul className="space-y-2">
                {insufficient.map((item, idx) => (
                  <li key={idx} className="text-sm text-foreground-muted">
                    <span className="text-amber-500 font-medium">{item.location}:</span> {item.description}
                    {item.suggestion && (
                      <p className="text-xs text-amber-600 mt-1">💡 {item.suggestion}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {good.length > 0 && (
            <div className="border-l-4 border-emerald-400 pl-4">
              <h4 className="text-sm font-medium text-emerald-600 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">🟢</span>
                {t.good} ({good.length})
              </h4>
              <ul className="space-y-2">
                {good.map((item, idx) => (
                  <li key={idx} className="text-sm text-foreground-muted">
                    <span className="text-emerald-500 font-medium">{item.location}:</span> {item.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {excellent.length > 0 && (
            <div className="border-l-4 border-purple-400 pl-4">
              <h4 className="text-sm font-medium text-purple-600 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-xs">🌟</span>
                {t.excellent} ({excellent.length})
              </h4>
              <ul className="space-y-2">
                {excellent.map((item, idx) => (
                  <li key={idx} className="text-sm text-foreground-muted">
                    <span className="text-purple-500 font-medium">{item.location}:</span> {item.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 改进行动清单组件
function ActionItems({ feedback, locale }: { feedback: PracticeRecord['feedback']; locale: string }) {
  const t = translations[locale === "zh" ? "zh" : "en"];

  if (!feedback?.improvements || feedback.improvements.length === 0) return null;

  const priorityConfig = {
    high: { label: t.highPriority, color: 'bg-rose-100 text-rose-700 border-rose-200' },
    medium: { label: t.mediumPriority, color: 'bg-amber-100 text-amber-700 border-amber-200' },
    low: { label: t.lowPriority, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          {t.actionItems}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {feedback.improvements.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-surface rounded-lg border border-border">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${priorityConfig[item.priority].color}`}>
                {priorityConfig[item.priority].label}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.action}</p>
                <p className="text-xs text-emerald-600 mt-1">📈 {item.expectedGain}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 教练寄语组件
function CoachMessage({ feedback, locale }: { feedback: PracticeRecord['feedback']; locale: string }) {
  const t = translations[locale === "zh" ? "zh" : "en"];

  if (!feedback?.coachMessage) return null;

  return (
    <div className="bg-accent/5 rounded-2xl p-6 border border-accent/10 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div>
          <h4 className="font-display text-heading font-semibold text-foreground mb-2">{t.coachMessage}</h4>
          <p className="text-foreground leading-relaxed italic">&ldquo;{feedback.coachMessage}&rdquo;</p>
        </div>
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

// 统一的有效反馈检查函数
function hasValidFeedback(feedback: PracticeRecord['feedback'] | null | undefined): boolean {
  if (!feedback) return false;
  // 检查是否有分析中状态
  const hasAnalyzingMessage = feedback.good?.some((g: string) =>
    g.includes("AI正在分析中") || g.includes("分析中")
  );
  if (hasAnalyzingMessage) return false;
  // 检查是否有有效反馈数据（基础版或专业版）
  return !!(feedback.good?.length || feedback.dimensions || feedback.totalScore);
}

export default function PracticeReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLanguage();
  const [record, setRecord] = useState<PracticeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionExists, setQuestionExists] = useState(true);
  const [showCompare, setShowCompare] = useState(false);
  const [progressHistory, setProgressHistory] = useState<Array<{ attempt: number; score: number; date: string }>>([]);
  const [evaluationStatus, setEvaluationStatus] = useState<"PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // 会员权限状态
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [simplifiedFeedback, setSimplifiedFeedback] = useState<SimplifiedFeedback | null>(null);
  const [userType, setUserType] = useState<"free" | "credit_exhausted" | "monthly_expired">("free");
  const [membershipInfo, setMembershipInfo] = useState<{
    creditsRemaining: number | null;
    monthlyExpiresAt: Date | null;
  }>({ creditsRemaining: null, monthlyExpiresAt: null });

  const t = translations[locale === "zh" ? "zh" : "en"];
  const recordId = params.id as string;

  // 处理登录跳转
  const handleLogin = () => {
    const currentPath = window.location.pathname;
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  // 调试：监听 hasAccess 变化
  useEffect(() => {
    console.log("[Debug] hasAccess changed:", hasAccess, "record.feedback:", record?.feedback ? "exists" : "null");
  }, [hasAccess, record?.feedback]);

  // 加载评估状态
  const loadEvaluationStatus = async () => {
    try {
      console.log("[Debug] Loading evaluation status for:", recordId);
      const response = await fetch(`/api/practices/evaluation-status?practiceId=${recordId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("[Debug] Evaluation status:", data.status, "progress:", data.progress);
        setEvaluationStatus(data.status);

        // 如果评估完成，刷新练习记录
        if (data.status === "COMPLETED") {
          const updatedRecord = await getPracticeRecordById(recordId);
          if (updatedRecord) {
            setRecord(updatedRecord);
          }
        }
      } else {
        const errorText = await response.text();
        console.error("[Debug] Failed to load status:", response.status, errorText);
      }
    } catch (error) {
      console.error("Failed to load evaluation status:", error);
    }
  };

  // 仅检查权限，不消费（用于评估进行中的情况）
  const checkAccessOnly = async (practiceId: string) => {
    try {
      const checkResponse = await fetch(`/api/membership/check-access?type=PRACTICE&id=${practiceId}`);
      if (!checkResponse.ok) {
        if (checkResponse.status === 401) {
          setIsUnauthenticated(true);
          setHasAccess(false);
          setUserType("free");
          return false;
        }
        setHasAccess(false);
        setUserType("free");
        return false;
      }

      setIsUnauthenticated(false);
      const checkData = await checkResponse.json();
      setMembershipInfo({
        creditsRemaining: checkData.membershipStatus?.creditsRemaining ?? null,
        monthlyExpiresAt: checkData.membershipStatus?.monthlyExpiresAt ?? null,
      });

      const monthlyExpired = checkData.membershipStatus?.monthlyExpiresAt &&
        new Date(checkData.membershipStatus.monthlyExpiresAt) < new Date();
      const creditsExhausted = checkData.membershipStatus?.creditsRemaining === 0;

      if (monthlyExpired) {
        setUserType("monthly_expired");
      } else if (creditsExhausted) {
        setUserType("credit_exhausted");
      } else if (!checkData.membershipStatus?.hasMembership) {
        setUserType("free");
      }

      // 已付费或有权限时设置为有访问权
      const hasPermission = checkData.alreadyPaid || checkData.hasAccess;
      if (checkData.alreadyPaid) {
        setAlreadyPaid(true);
      }
      setHasAccess(hasPermission);
      return hasPermission;
    } catch (error) {
      console.error("Access check failed:", error);
      setHasAccess(false);
      setIsUnauthenticated(false);
      setUserType("free");
      return false;
    }
  };

  // 检查权限并处理消费
  const checkAccessAndConsume = async (practiceId: string, questionTitle?: string, questionKeyPoints?: string, questionType?: string) => {
    try {
      // 检查访问权限
      const checkResponse = await fetch(`/api/membership/check-access?type=PRACTICE&id=${practiceId}`);
      if (!checkResponse.ok) {
        // 401 表示未登录
        if (checkResponse.status === 401) {
          setIsUnauthenticated(true);
          setHasAccess(false);
          setUserType("free");
          return false;
        }
        // 其他错误，默认显示简化反馈
        setHasAccess(false);
        setUserType("free");
        return false;
      }

      // 已登录，重置未登录状态
      setIsUnauthenticated(false);

      const checkData = await checkResponse.json();
      setMembershipInfo({
        creditsRemaining: checkData.membershipStatus?.creditsRemaining ?? null,
        monthlyExpiresAt: checkData.membershipStatus?.monthlyExpiresAt ?? null,
      });

      // 根据会员状态设置用户类型
      const monthlyExpired = checkData.membershipStatus?.monthlyExpiresAt &&
        new Date(checkData.membershipStatus.monthlyExpiresAt) < new Date();
      const creditsExhausted = checkData.membershipStatus?.creditsRemaining === 0;

      if (monthlyExpired) {
        setUserType("monthly_expired");
      } else if (creditsExhausted) {
        setUserType("credit_exhausted");
      } else if (!checkData.membershipStatus?.hasMembership) {
        setUserType("free");
      }

      if (checkData.alreadyPaid) {
        // 已付费，直接显示完整反馈
        setAlreadyPaid(true);
        setHasAccess(true);
        return true;
      }

      if (checkData.hasAccess) {
        // 有权限，消费一次
        const consumeResponse = await fetch("/api/membership/consume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceType: "PRACTICE",
            sourceId: practiceId,
            sourceTitle: questionTitle,
          }),
        });

        if (consumeResponse.ok) {
          const consumeData = await consumeResponse.json();
          if (consumeData.success) {
            console.log("[Debug] Credit consumed successfully, hasAccess set to true");
            setHasAccess(true);
            if (consumeData.creditsRemaining !== undefined) {
              setMembershipInfo((prev) => ({
                ...prev,
                creditsRemaining: consumeData.creditsRemaining,
              }));
            }
            // 触发全局事件，通知 Navbar 更新会员状态
            window.dispatchEvent(new Event("membership:updated"));
            return true;
          } else {
            console.log("[Debug] Consume failed:", consumeData.error);
          }
        } else {
          console.log("[Debug] Consume API error:", consumeResponse.status);
        }
      }

      // 无权限
      setHasAccess(false);
      return false;
    } catch (error) {
      console.error("Access check failed:", error);
      // API 失败时降级显示简化反馈，但不显示升级弹窗
      setHasAccess(false);
      setIsUnauthenticated(false); // 网络错误时不显示登录引导
      setUserType("free");
      return false;
    }
  };

  // 重试失败的评估
  const retryEvaluation = async () => {
    setIsRetrying(true);
    try {
      const response = await fetch("/api/practices/evaluation-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceId: recordId, retry: true }),
      });

      if (response.ok) {
        // 重新加载评估状态
        await loadEvaluationStatus();
      } else {
        console.error("Failed to retry evaluation:", await response.text());
      }
    } catch (error) {
      console.error("重试评估失败:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  // 初始加载
  useEffect(() => {
    async function loadRecord() {
      try {
        const data = await getPracticeRecordById(recordId);
        console.log("[Debug] Loaded record:", data?.id, "status:", data?.evaluationStatus, "feedback:", data?.feedback);
        if (data) {
          setRecord(data);

          // 检查评估状态 - 优先使用记录中的字段
          if (data.evaluationStatus) {
            setEvaluationStatus(data.evaluationStatus);
            // 如果不是已完成状态，继续轮询
            if (data.evaluationStatus !== "COMPLETED" && data.evaluationStatus !== "FAILED") {
              await loadEvaluationStatus();
            }
          } else {
            // 旧记录没有状态字段，通过 API 查询
            console.log("[Debug] No evaluationStatus in record, querying API");
            await loadEvaluationStatus();
          }

          // 检查题目是否存在
          try {
            const response = await fetch(`/api/questions/${data.questionId}`);
            setQuestionExists(response.ok);
          } catch {
            setQuestionExists(false);
          }

          // Phase 3: 加载该题目的练习历史（进步曲线数据）
          try {
            const historyResponse = await fetch(`/api/practices/question/${data.questionId}`);
            if (historyResponse.ok) {
              const historyData = await historyResponse.json();
              if (historyData.practices) {
                setProgressHistory(
                  historyData.practices.map((p: { createdAt: string; score: number }, index: number) => ({
                    attempt: index + 1,
                    score: p.score,
                    date: p.createdAt,
                  }))
                );
              }
            }
          } catch (error) {
            console.error("Failed to load progress history:", error);
          }

          // Strategy A: 区分评估状态来决定是否消费积分
          const isEvaluationPending = data.evaluationStatus === "PENDING" || data.evaluationStatus === "PROCESSING";
          const hasFeedback = hasValidFeedback(data.feedback);

          let accessGranted = false;

          if (isEvaluationPending && !hasFeedback) {
            // 评估进行中：只检查权限，不消费积分
            // 如果用户有权限，会显示 AIEvaluationProgress 触发评估
            // 如果用户无权限，直接显示简化反馈，不触发 AI 评估
            accessGranted = await checkAccessOnly(recordId);
          } else {
            // 评估已完成或有有效反馈：检查权限并消费积分
            accessGranted = await checkAccessAndConsume(
              recordId,
              data.questionTitle,
              undefined,
              data.questionType
            );
          }

          // 无权限时生成简化反馈
          if (!accessGranted) {
            const simplified = generateRuleBasedFeedback(data.answer || "", {
              keyPoints: undefined,
              type: data.questionType,
            });
            setSimplifiedFeedback(simplified);
          }
        }
      } catch (error) {
        console.error("Failed to load record:", error);
      } finally {
        setLoading(false);
      }
    }

    loadRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState variant="skeleton" fullScreen message={t.loading} />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-12">
          <EmptyState
            icon="😕"
            title={t.notFound}
            description={t.questionDeleted}
            action={{
              label: t.backToHistory,
              href: "/history"
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-12">
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

        {/* 判断是否应该显示评估进度：状态为 PENDING/PROCESSING 且没有有效反馈数据 且 用户有权限查看AI分析 */}
        {(() => {
          const hasFeedback = hasValidFeedback(record.feedback);

          console.log("[Debug] Render check - evaluationStatus:", evaluationStatus, "hasValidFeedback:", hasFeedback, "hasAccess:", hasAccess, "feedback:", record.feedback);

          // 双模型架构：所有用户都触发AI评估，根据用户类型选择不同模型
          // 免费用户 → Qwen-turbo 基础分析
          // 付费用户 → Kimi k2.5 深度分析
          // 需要显示进度：状态未完成 且 没有有效反馈
          const shouldShowProgress = (evaluationStatus === "PENDING" || evaluationStatus === "PROCESSING") &&
            !hasFeedback;

          return shouldShowProgress;
        })() ? (
          <AIEvaluationProgress
            practiceId={recordId}
            onCompleted={async () => {
              setEvaluationStatus("COMPLETED");
              // 刷新记录以获取最新结果
              const updatedRecord = await getPracticeRecordById(recordId);
              if (updatedRecord) {
                setRecord(updatedRecord);
                // AI 分析完成后检查权限
                const accessGranted = await checkAccessAndConsume(
                  recordId,
                  updatedRecord.questionTitle,
                  undefined,
                  updatedRecord.questionType
                );
                // 付费用户：反馈数据应该已经在 updatedRecord 中
                // 无需额外操作，setRecord(updatedRecord) 已经更新了状态
                if (!accessGranted) {
                  // 免费用户：生成简化反馈
                  const simplified = generateRuleBasedFeedback(updatedRecord.answer || "", {
                    keyPoints: undefined,
                    type: updatedRecord.questionType,
                  });
                  setSimplifiedFeedback(simplified);
                }
              }
            }}
            onFailed={() => {
              setEvaluationStatus("FAILED");
            }}
          />
        ) : null}

        {/* 评估失败 Banner */}
        {evaluationStatus === "FAILED" && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-rose-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-medium">
                    {locale === "zh" ? "AI 分析失败" : "AI Analysis Failed"}
                  </p>
                  <p className="text-xs text-rose-600 mt-1">
                    {locale === "zh" ? "抱歉，AI 分析遇到了问题。您可以重试或稍后再试。" : "Sorry, AI analysis encountered an issue. You can retry or try again later."}
                  </p>
                </div>
              </div>
              <button
                onClick={retryEvaluation}
                disabled={isRetrying}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrying
                  ? locale === "zh"
                    ? "重试中..."
                    : "Retrying..."
                  : locale === "zh"
                    ? "重试"
                    : "Retry"}
              </button>
            </div>
          </div>
        )}

        {/* Phase 3: Progress Curve - 进步曲线 (有有效反馈或评估完成时显示) */}
        {(() => {
          const hasFeedback = hasValidFeedback(record.feedback);
          return (hasFeedback || evaluationStatus === "COMPLETED") && progressHistory.length > 1;
        })() && (
          <ProgressCurve history={progressHistory} locale={locale} />
        )}

        {/* View Toggle (有有效反馈或评估完成时显示) */}
        {(() => {
          const hasFeedback = hasValidFeedback(record.feedback);
          return (hasFeedback || evaluationStatus === "COMPLETED") &&
            (record.feedback?.optimizedAnswer || record.feedback?.starAnswer);
        })() && (
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

        {/* Compare View or Normal View (仅在评估完成后显示) */}
        {(() => {
          const hasFeedback = hasValidFeedback(record.feedback);
          return (hasFeedback || evaluationStatus === "COMPLETED") && showCompare &&
            (record.feedback?.optimizedAnswer || record.feedback?.starAnswer);
        })() ? (
          <CompareView record={record} locale={locale} />
        ) : (
          <React.Fragment>
            {/* Your Answer (始终显示) - 带分数徽章 */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {t.yourAnswer}
                </CardTitle>
                {/* 分数徽章 - 右上角 */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${getScoreColor(record.score)} bg-opacity-10`}>
                  <span className="text-sm font-medium text-foreground-muted">得分</span>
                  <span className={`font-bold ${getScoreTextColor(record.score)}`}>{record.score}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-surface rounded-xl p-4 whitespace-pre-wrap text-foreground leading-relaxed">
                  {record.answer}
                </div>
              </CardContent>
            </Card>

            {/* AI Feedback - 双模型架构：根据权限显示不同版本 */}
            {/* 评估失败时根据权限显示不同降级方案 */}
            {evaluationStatus === "FAILED" && (
              <>
                {hasAccess ? (
                  /* 付费用户 - 即使失败也尝试显示专业版（可能有部分数据） */
                  record.feedback ? (
                    <PremiumFeedbackView feedback={record.feedback} />
                  ) : (
                    /* 付费用户但无反馈数据时显示错误提示 */
                    <Card className="mb-6 border-amber-200 bg-amber-50">
                      <CardContent className="pt-6">
                        <p className="text-amber-700">
                          {locale === "zh"
                            ? "AI 分析遇到问题，但您的评分次数不会扣除。请重试或联系客服。"
                            : "AI analysis encountered an issue, but your credit was not deducted. Please retry or contact support."}
                        </p>
                      </CardContent>
                    </Card>
                  )
                ) : (
                  /* 免费用户 - 显示简化反馈 */
                  simplifiedFeedback && (
                    <SimplifiedFeedbackView
                      feedback={simplifiedFeedback}
                      onUpgrade={() => setShowUpgradeModal(true)}
                      isUnauthenticated={isUnauthenticated}
                      onLogin={handleLogin}
                    />
                  )
                )}
              </>
            )}

            {/* 完整 AI Feedback (评估完成后显示) */}
            {/* 双模型架构：免费用户显示基础版，付费用户显示专业版 */}
            {(() => {
              const hasFeedback = hasValidFeedback(record.feedback);
              return (hasFeedback || evaluationStatus === "COMPLETED") && record.feedback && evaluationStatus !== "FAILED";
            })() && (
              <>
                {hasAccess ? (
                  /* 付费用户 - 专业版深度反馈 */
                  <PremiumFeedbackView feedback={record.feedback} />
                ) : (
                  /* 免费用户 - 基础版反馈 + 升级引导 */
                  <BasicFeedbackView
                    feedback={record.feedback}
                    isUnauthenticated={isUnauthenticated}
                    onLogin={handleLogin}
                    onUpgrade={() => setShowUpgradeModal(true)}
                  />
                )}
              </>
            )}
          </React.Fragment>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-border">
          <Link href="/history" className="flex-1">
            <Button variant="outline" className="w-full">
              {t.backToHistory}
            </Button>
          </Link>
          {(() => {
            const hasFeedback = hasValidFeedback(record.feedback);
            // 未登录用户或无权限用户可以重新练习（使用简化反馈）
            const canPractice = hasAccess === false || hasFeedback || evaluationStatus === "COMPLETED";
            return canPractice && questionExists;
          })() ? (
            <Link href={`/questions/${record.questionId}`} className="flex-1">
              <Button className="w-full bg-accent hover:bg-accent-dark">
                {t.practiceAgain}
              </Button>
            </Link>
          ) : (() => {
            const hasFeedback = hasValidFeedback(record.feedback);
            return !hasFeedback && evaluationStatus !== "COMPLETED";
          })() ? (
            <div className="flex-1">
              <Button className="w-full" disabled variant="secondary">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {locale === "zh" ? "AI分析中..." : "AI Analyzing..."}
                </span>
              </Button>
              <p className="text-xs text-foreground-muted text-center mt-2">
                {locale === "zh" ? "请等待AI分析完成后再练习" : "Please wait for AI analysis to complete"}
              </p>
            </div>
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

      {/* 升级弹窗 */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={async () => {
          setShowUpgradeModal(false);
          // 关闭弹窗后重新检查权限（用户可能已开通会员）
          if (record) {
            await checkAccessAndConsume(
              recordId,
              record.questionTitle,
              undefined,
              record.questionType
            );
          }
        }}
        userType={userType}
        creditsRemaining={membershipInfo.creditsRemaining}
        monthlyExpiresAt={membershipInfo.monthlyExpiresAt}
      />
    </div>
  );
}
