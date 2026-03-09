"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getStats, getRecentRecords, PracticeRecord, getStreak } from "@/lib/practice-store";
import { useLanguage } from "@/components/language-provider";

// Score color helper
function getScoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-error";
}

// 新手引导步骤组件
function OnboardingSteps({ completedSteps, locale }: { completedSteps: number; locale: string }) {
  const steps = [
    {
      label: locale === 'zh' ? "选择一道题目" : "Pick a question",
      completed: completedSteps >= 1
    },
    {
      label: locale === 'zh' ? "完成作答" : "Answer it",
      completed: completedSteps >= 2
    },
    {
      label: locale === 'zh' ? "获取 AI 反馈" : "Get AI feedback",
      completed: completedSteps >= 3
    },
  ];

  return (
    <div className="bg-surface rounded-2xl p-6 border border-border">
      <h3 className="font-display text-heading font-semibold text-foreground mb-5">
        {locale === 'zh' ? '开始你的旅程' : 'Start Your Journey'}
      </h3>
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step.completed
                ? 'bg-success text-white'
                : 'bg-surface border-2 border-border text-foreground-muted'
            }`}>
              {step.completed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            <span className={`font-medium ${
              step.completed ? 'text-foreground-muted line-through' : 'text-foreground'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 简化的推荐卡片组件
function SingleRecommendation({
  question,
  reason,
  locale
}: {
  question: { id: string; title: string; type: string };
  reason: string;
  locale: string;
}) {
  const typeMap: Record<string, string> = {
    INTRO: locale === 'zh' ? '自我介绍' : 'Intro',
    PROJECT: locale === 'zh' ? '项目经历' : 'Project',
    TECHNICAL: locale === 'zh' ? '技术问题' : 'Technical',
    BEHAVIORAL: locale === 'zh' ? '行为面试' : 'Behavioral',
    HR: locale === 'zh' ? 'HR面试' : 'HR',
  };

  return (
    <Link href={`/questions/${question.id}`} className="block group">
      <div className="bg-surface rounded-2xl p-6 border border-border hover:border-accent/30 transition-all">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-lg">
                {typeMap[question.type] || question.type}
              </span>
              <span className="text-xs text-foreground-muted">{reason}</span>
            </div>
            <h3 className="font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2">
              {question.title}
            </h3>
          </div>
          <svg className="w-5 h-5 text-foreground-muted group-hover:text-accent transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// 折叠式最近记录组件
function RecentRecordsCollapsible({
  records,
  locale
}: {
  records: PracticeRecord[];
  locale: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayRecords = expanded ? records.slice(0, 5) : records.slice(0, 2);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full mb-4 group"
      >
        <h2 className="font-display text-heading font-semibold text-foreground">
          {locale === 'zh' ? '最近记录' : 'Recent'}
        </h2>
        <div className="flex items-center gap-2 text-foreground-muted">
          <span className="text-sm">{records.length} {locale === 'zh' ? '条' : ''}</span>
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <div className="space-y-2">
        {displayRecords.map(record => (
          <Link
            key={record.id}
            href={`/practice/review/${record.id}`}
            className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border hover:border-accent/20 transition-all group"
          >
            <span className="font-medium text-foreground truncate group-hover:text-accent transition-colors">
              {record.questionTitle}
            </span>
            <span className={`font-display text-lg font-bold ${getScoreColor(record.score)} flex-shrink-0 ml-3`}>
              {record.score}
            </span>
          </Link>
        ))}
      </div>
      {records.length > 2 && (
        <Link
          href="/history"
          className="block text-center text-accent text-sm mt-4 hover:text-accent-dark font-medium"
        >
          {locale === 'zh' ? '查看全部' : 'View All'} →
        </Link>
      )}
    </div>
  );
}

// 推荐入口组件
function QuickStartCard({
  type,
  locale,
}: {
  type: 'INTRO' | 'PROJECT';
  locale: string;
}) {
  const config = {
    INTRO: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: locale === 'zh' ? '自我介绍' : 'Self Intro',
      desc: locale === 'zh' ? '最常见的开场' : 'Most common opener',
    },
    PROJECT: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: locale === 'zh' ? '项目经历' : 'Projects',
      desc: locale === 'zh' ? '展示你的实战' : 'Show your work',
    },
  };

  const c = config[type];

  return (
    <Link
      href={`/questions?type=${type}`}
      className="flex-1 group p-5 bg-surface rounded-2xl border border-border hover:border-accent/30 transition-all"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-accent">{c.icon}</span>
        <span className="font-semibold text-foreground group-hover:text-accent transition-colors">
          {c.label}
        </span>
      </div>
      <p className="text-sm text-foreground-muted">{c.desc}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { t, locale } = useLanguage();
  const [stats, setStats] = useState({
    totalPractices: 0,
    averageScore: 0,
    highestScore: 0,
    recentTrend: [] as number[],
  });
  const [recentRecords, setRecentRecords] = useState<PracticeRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [randomQuestionId, setRandomQuestionId] = useState("");
  const [allQuestions, setAllQuestions] = useState<Array<{ id: string; title: string }>>([]);

  // 推荐数据
  const [recommendation, setRecommendation] = useState<{
    id: string;
    title: string;
    type: string;
    reason: string;
  } | null>(null);

  // 用户状态判断
  const isNewUser = stats.totalPractices < 3;

  // 弱点分析数据
  const [blindSpots, setBlindSpots] = useState<{
    hasData: boolean;
    overview?: {
      totalPractices: number;
      overallAvgScore: number;
    };
    weakAreas?: {
      type: Array<{ type: string; count: number; totalScore: number; avgScore: number }>;
      category: Array<{ category: string; count: number; totalScore: number; avgScore: number }>;
      dimension: Array<{ dimension: string; score: number }>;
    };
    dimensionScores?: {
      content: number;
      structure: number;
      expression: number;
      highlights: number;
    };
    topWeakPoints?: string[];
    suggestions?: string[];
  } | null>(null);

  // 今日练习数和目标
  const dailyGoal = 3;
  const todayPractices = useMemo(() => {
    if (!mounted) return 0;
    const today = new Date().toDateString();
    return recentRecords.filter(r => new Date(r.createdAt).toDateString() === today).length;
  }, [recentRecords, mounted]);
  const goalProgress = Math.min((todayPractices / dailyGoal) * 100, 100);

  // 问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return t.dashboard.greeting.night;
    if (hour < 12) return t.dashboard.greeting.morning;
    if (hour < 18) return t.dashboard.greeting.afternoon;
    return t.dashboard.greeting.evening;
  };

  useEffect(() => {
    setMounted(true);

    async function loadData() {
      const [statsData, records, streakDays] = await Promise.all([
        getStats(),
        getRecentRecords(5),
        getStreak(),
      ]);
      setStats(statsData);
      setRecentRecords(records);
      setStreak(streakDays);
    }

    // 加载题目列表
    async function loadQuestions() {
      try {
        const res = await fetch("/api/questions?limit=100");
        if (res.ok) {
          const data = await res.json();
          if (data.questions && data.questions.length > 0) {
            setAllQuestions(data.questions);
            // 设置随机题目ID
            const randomIndex = Math.floor(Math.random() * data.questions.length);
            setRandomQuestionId(data.questions[randomIndex].id);
          }
        }
      } catch (error) {
        console.error("Failed to load questions:", error);
      }
    }

    // 加载推荐数据（仅活跃用户）
    async function loadRecommendation() {
      try {
        const res = await fetch("/api/questions/recommendations");
        if (res.ok) {
          const data = await res.json();
          if (data.recommendations && data.recommendations.length > 0) {
            const rec = data.recommendations[0];
            setRecommendation({
              id: rec.id,
              title: rec.title,
              type: rec.type,
              reason: rec.reason,
            });
          }
        }
      } catch (error) {
        console.error("Failed to load recommendations:", error);
      }
    }

    loadData();
    loadQuestions();
    loadRecommendation();

    // 加载弱点分析（练习次数 > 5 时）
    async function loadBlindSpots() {
      try {
        const res = await fetch("/api/stats/blindspots");
        if (res.ok) {
          const data = await res.json();
          if (data.hasData && data.overview?.totalPractices > 5) {
            setBlindSpots(data);
          }
        }
      } catch (error) {
        console.error("Failed to load blind spots:", error);
      }
    }
    loadBlindSpots();
  }, []);

  const lastPractice = recentRecords[0];

  // 数据加载中，使用骨架屏代替空白 loading，避免闪烁
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* 骨架屏 - 匹配实际布局 */}
          <div className="animate-pulse">
            {/* 欢迎语骨架 */}
            <div className="mb-8 flex items-center justify-between">
              <div className="h-9 bg-surface rounded-lg w-40"></div>
              <div className="h-8 bg-surface rounded-full w-16"></div>
            </div>
            {/* 主 CTA 骨架 */}
            <div className="mb-8 h-20 bg-surface rounded-2xl"></div>
            {/* 今日目标骨架 */}
            <div className="mb-8 p-4 bg-surface rounded-xl h-16"></div>
            {/* 推荐卡片骨架 */}
            <div className="mb-8">
              <div className="h-6 bg-surface rounded w-24 mb-4"></div>
              <div className="h-24 bg-surface rounded-2xl"></div>
            </div>
            {/* 最近记录骨架 */}
            <div>
              <div className="h-6 bg-surface rounded w-20 mb-4"></div>
              <div className="space-y-2">
                <div className="h-16 bg-surface rounded-xl"></div>
                <div className="h-16 bg-surface rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 新用户视图
  if (isNewUser) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* 欢迎语 */}
          <div className="mb-10 text-center">
            <h1 className="font-display text-display font-bold text-foreground tracking-tight mb-3">
              {getGreeting()}
            </h1>
            <p className="text-body-lg text-foreground-muted">
              {locale === 'zh' ? '开始你的面试准备之旅' : 'Start your interview prep journey'}
            </p>
          </div>

          {/* 主 CTA */}
          <div className="mb-10">
            {randomQuestionId ? (
              <Link
                href={`/questions/${randomQuestionId}`}
                className="group block"
              >
                <div className="w-full px-8 py-6 bg-accent text-white rounded-2xl font-display font-semibold text-heading-lg transition-all duration-300 hover:shadow-glow hover:scale-[1.01] flex items-center justify-center gap-4">
                  <span>{locale === 'zh' ? '开始第一次练习' : 'Start Your First Practice'}</span>
                  <svg className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            ) : (
              <div className="w-full px-8 py-6 bg-surface text-foreground-muted rounded-2xl font-display font-semibold text-heading-lg flex items-center justify-center gap-4">
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{locale === 'zh' ? '加载中...' : 'Loading...'}</span>
              </div>
            )}
          </div>

          {/* 新手引导步骤 */}
          <div className="mb-10">
            <OnboardingSteps completedSteps={stats.totalPractices} locale={locale} />
          </div>

          {/* 推荐入口 */}
          <div>
            <h2 className="font-display text-heading font-semibold text-foreground mb-4">
              {locale === 'zh' ? '推荐从这里开始' : 'Recommended Starting Points'}
            </h2>
            <div className="flex gap-4">
              <QuickStartCard type="INTRO" locale={locale} />
              <QuickStartCard type="PROJECT" locale={locale} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 活跃用户视图
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* 欢迎语 + 连续天数 */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-display-sm font-bold text-foreground tracking-tight">
            {getGreeting()}
          </h1>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 rounded-full">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-semibold text-accent">
                {streak} {locale === 'zh' ? '天' : 'd'}
              </span>
            </div>
          )}
        </div>

        {/* 主 CTA */}
        <div className="mb-8">
          {(lastPractice?.questionId || randomQuestionId) ? (
            <Link
              href={`/questions/${lastPractice?.questionId || randomQuestionId}`}
              className="group block"
            >
              <div className="w-full px-8 py-5 bg-accent text-white rounded-2xl transition-all duration-300 hover:shadow-glow hover:scale-[1.01]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display font-semibold text-heading-lg mb-1">
                      {lastPractice ? t.dashboard.continuePractice : t.dashboard.startPractice}
                    </div>
                    {lastPractice && (
                      <div className="text-white/70 text-sm truncate max-w-[280px]">
                        {locale === 'zh' ? '上次：' : 'Last: '}{lastPractice.questionTitle}
                      </div>
                    )}
                  </div>
                  <svg className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ) : (
            <div className="w-full px-8 py-5 bg-surface text-foreground-muted rounded-2xl flex items-center justify-center gap-3">
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="font-medium">{locale === 'zh' ? '加载中...' : 'Loading...'}</span>
            </div>
          )}
        </div>

        {/* 弱点分析模块 - 练习次数 > 5 时显示 */}
        {mounted && blindSpots?.hasData && (
          <div className="mb-8 p-5 bg-surface rounded-2xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-heading font-semibold text-foreground">
                {locale === 'zh' ? '盲点分析' : 'Weakness Analysis'}
              </h2>
              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                {blindSpots.overview?.overallAvgScore} {locale === 'zh' ? '分' : 'pts'}
              </span>
            </div>

            {/* 维度评分 */}
            {blindSpots.dimensionScores && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                <DimensionBadge
                  label={locale === 'zh' ? '内容' : 'Content'}
                  score={blindSpots.dimensionScores.content}
                  locale={locale}
                />
                <DimensionBadge
                  label={locale === 'zh' ? '结构' : 'Structure'}
                  score={blindSpots.dimensionScores.structure}
                  locale={locale}
                />
                <DimensionBadge
                  label={locale === 'zh' ? '表达' : 'Expression'}
                  score={blindSpots.dimensionScores.expression}
                  locale={locale}
                />
                <DimensionBadge
                  label={locale === 'zh' ? '亮点' : 'Highlights'}
                  score={blindSpots.dimensionScores.highlights}
                  locale={locale}
                />
              </div>
            )}

            {/* 薄弱环节 */}
            {blindSpots.weakAreas && (
              <div className="space-y-3">
                {/* 题型弱点 */}
                {blindSpots.weakAreas.type.length > 0 && blindSpots.weakAreas.type[0].avgScore < 70 && (
                  <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl">
                    <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-rose-700">
                        {locale === 'zh' ? '薄弱题型' : 'Weak Type'}
                      </p>
                      <p className="text-xs text-rose-600 truncate">
                        {getTypeLabel(blindSpots.weakAreas.type[0].type, locale)} · {blindSpots.weakAreas.type[0].avgScore}分
                        {locale === 'zh' ? '（建议加强练习）' : ' (needs practice)'}
                      </p>
                    </div>
                    <Link
                      href={`/questions?type=${blindSpots.weakAreas.type[0].type}`}
                      className="text-xs px-3 py-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors flex-shrink-0"
                    >
                      {locale === 'zh' ? '去练习' : 'Practice'}
                    </Link>
                  </div>
                )}

                {/* 维度弱点 */}
                {blindSpots.weakAreas.dimension.length > 0 && blindSpots.weakAreas.dimension[0].score < 70 && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-amber-700">
                        {locale === 'zh' ? '提升重点' : 'Focus Area'}
                      </p>
                      <p className="text-xs text-amber-600 truncate">
                        {getDimensionLabel(blindSpots.weakAreas.dimension[0].dimension, locale)} · {blindSpots.weakAreas.dimension[0].score}分
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 建议 */}
            {blindSpots.suggestions && blindSpots.suggestions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-foreground-muted mb-2">
                  {locale === 'zh' ? 'AI 建议' : 'AI Suggestions'}
                </p>
                <p className="text-sm text-foreground">
                  {blindSpots.suggestions[0]}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 今日目标 */}
        {mounted && (
          <div className="mb-8 p-4 bg-surface rounded-xl border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {t.dashboard.dailyGoal.title}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {todayPractices}/{dailyGoal}
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  goalProgress >= 100 ? 'bg-success' : 'bg-accent'
                }`}
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            {goalProgress >= 100 && (
              <p className="text-xs text-success mt-2 font-medium">
                {t.dashboard.dailyGoal.completed} ✓
              </p>
            )}
          </div>
        )}

        {/* 为你推荐（单个） */}
        {mounted && recommendation && (
          <div className="mb-8">
            <h2 className="font-display text-heading font-semibold text-foreground mb-4">
              {locale === 'zh' ? '为你推荐' : 'For You'}
            </h2>
            <SingleRecommendation
              question={recommendation}
              reason={recommendation.reason}
              locale={locale}
            />
          </div>
        )}

        {/* 最近记录（折叠式） */}
        {mounted && recentRecords.length > 0 && (
          <RecentRecordsCollapsible records={recentRecords} locale={locale} />
        )}

        {/* 空状态 */}
        {mounted && recentRecords.length === 0 && !isNewUser && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-display text-heading font-semibold text-foreground mb-2">
              {t.dashboard.empty.title}
            </h3>
            <p className="text-foreground-muted text-sm mb-6">
              {t.dashboard.empty.desc}
            </p>
            {randomQuestionId ? (
              <Link
                href={`/questions/${randomQuestionId}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-dark transition-all"
              >
                {t.dashboard.empty.button}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-surface text-foreground-muted rounded-full font-semibold">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {locale === 'zh' ? '加载中...' : 'Loading...'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 维度评分徽章组件
function DimensionBadge({ label, score, locale }: { label: string; score: number; locale: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (s >= 60) return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-rose-50 text-rose-600 border-rose-100';
  };

  return (
    <div className={`p-2 rounded-xl border text-center ${getColor(score)}`}>
      <div className="text-lg font-bold">{score || '-'}</div>
      <div className="text-xs opacity-75">{label}</div>
    </div>
  );
}

// 题型标签转换
function getTypeLabel(type: string, locale: string) {
  const typeMap: Record<string, string> = {
    INTRO: locale === 'zh' ? '自我介绍' : 'Intro',
    PROJECT: locale === 'zh' ? '项目经历' : 'Project',
    TECHNICAL: locale === 'zh' ? '技术问题' : 'Technical',
    BEHAVIORAL: locale === 'zh' ? '行为面试' : 'Behavioral',
    HR: locale === 'zh' ? 'HR面试' : 'HR',
  };
  return typeMap[type] || type;
}

// 维度标签转换
function getDimensionLabel(dimension: string, locale: string) {
  const dimensionMap: Record<string, string> = {
    content: locale === 'zh' ? '内容完整性' : 'Content',
    structure: locale === 'zh' ? '结构逻辑性' : 'Structure',
    expression: locale === 'zh' ? '表达专业性' : 'Expression',
    highlights: locale === 'zh' ? '差异化亮点' : 'Highlights',
  };
  return dimensionMap[dimension] || dimension;
}
