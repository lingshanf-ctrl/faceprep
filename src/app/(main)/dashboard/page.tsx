"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getStats, getRecentRecords, PracticeRecord, getStreak } from "@/lib/practice-store";
import { questions } from "@/data/questions";
import { useLanguage } from "@/components/language-provider";
import { ScoreTrendChart, StatsCards, StreakDisplay } from "@/components/charts";
import { AnonymousStatsWarning } from "@/components/anonymous-warning";

// Score color - new design system
function getScoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-error";
}

// Format date
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Get random question ID
function getRandomQuestionId() {
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex].id;
}

// Category icons - unified SVG style
const categoryIcons: Record<string, React.ReactNode> = {
  INTRO: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  PROJECT: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  TECHNICAL: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  BEHAVIORAL: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  HR: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

const typeCategories = [
  { key: "INTRO", type: "INTRO" },
  { key: "PROJECT", type: "PROJECT" },
  { key: "TECHNICAL", type: "TECHNICAL" },
  { key: "BEHAVIORAL", type: "BEHAVIORAL" },
  { key: "HR", type: "HR" },
];

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
  const [randomQuestionId, setRandomQuestionId] = useState("1");

  // Phase 4: 盲点画像数据
  const [blindSpotData, setBlindSpotData] = useState<{
    hasData: boolean;
    overview?: { totalPractices: number; overallAvgScore: number };
    weakAreas?: {
      type: Array<{ type: string; count: number; avgScore: number }>;
      category: Array<{ category: string; count: number; avgScore: number }>;
      dimension: Array<{ dimension: string; score: number }>;
    };
    dimensionScores?: Record<string, number>;
    suggestions?: string[];
  } | null>(null);
  const [recommendations, setRecommendations] = useState<Array<{
    id: string;
    title: string;
    category: string;
    type: string;
    difficulty: number;
    reason: string;
  }>>([]);

  const dailyGoal = 3;
  const todayPractices = useMemo(() => {
    if (!mounted) return 0;
    const today = new Date().toDateString();
    return recentRecords.filter(r => new Date(r.createdAt).toDateString() === today).length;
  }, [recentRecords, mounted]);

  const goalProgress = Math.min((todayPractices / dailyGoal) * 100, 100);

  // Get greeting based on time
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

    loadData();
    setRandomQuestionId(getRandomQuestionId());

    // Phase 4: 加载盲点画像数据
    async function loadBlindSpotData() {
      try {
        const [blindSpotRes, recommendationsRes] = await Promise.all([
          fetch("/api/stats/blindspots"),
          fetch("/api/questions/recommendations"),
        ]);

        if (blindSpotRes.ok) {
          const blindSpotData = await blindSpotRes.json();
          setBlindSpotData(blindSpotData);
        }

        if (recommendationsRes.ok) {
          const recData = await recommendationsRes.json();
          setRecommendations(recData.recommendations || []);
        }
      } catch (error) {
        console.error("Failed to load blind spot data:", error);
      }
    }

    loadBlindSpotData();
  }, []);

  // Get category name based on type
  const getCategoryName = (type: string) => {
    const typeMap: Record<string, string> = {
      INTRO: locale === 'zh' ? '自我介绍' : 'Intro',
      PROJECT: locale === 'zh' ? '项目经历' : 'Project',
      TECHNICAL: locale === 'zh' ? '技术问题' : 'Technical',
      BEHAVIORAL: locale === 'zh' ? '行为面试' : 'Behavioral',
      HR: locale === 'zh' ? 'HR 面试' : 'HR',
    };
    return typeMap[type] || type;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (locale === 'zh') {
      if (diffMins < 1) return '刚刚';
      if (diffMins < 60) return `${diffMins}分钟前`;
      if (diffHours < 24) return `${diffHours}小时前`;
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    } else {
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const lastPractice = recentRecords[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Anonymous Warning */}
        <AnonymousStatsWarning />

        {/* Welcome - Large Typography */}
        <div className="mb-16">
          <h1 className="font-display text-display-lg font-bold text-foreground tracking-tight mb-3">
            {getGreeting()}
          </h1>
          <p className="text-body-lg text-foreground-muted">
            {t.dashboard.ready}
          </p>
        </div>

        {/* Main Action - Big CTA */}
        <div className="mb-16">
          <Link
            href={`/questions/${randomQuestionId}`}
            className="group relative block w-full md:w-auto md:inline-flex"
          >
            <div className="w-full md:w-auto px-12 py-6 bg-accent text-white rounded-full font-display font-semibold text-heading-lg transition-all duration-500 hover:shadow-glow-lg hover:scale-[1.02] flex items-center justify-center gap-4">
              <span>{lastPractice ? t.dashboard.continuePractice : t.dashboard.startPractice}</span>
              <svg className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </Link>

          {streak > 0 && (
            <div className="mt-4 flex items-center gap-2 text-foreground-muted">
              <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11zm0-20c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9z"/>
                <path d="M12 17a1 1 0 100-2 1 1 0 000 2zm0-3c.5 0 1-.5 1-1V7a1 1 0 10-2 0v6c0 .5.5 1 1 1z" fill="currentColor"/>
              </svg>
              <span className="text-small font-medium uppercase tracking-wider">
                {locale === 'zh' ? `连续 ${streak} 天` : `${streak} day streak`}
              </span>
            </div>
          )}
        </div>

        {/* Stats Cards with Charts */}
        <div className="mb-12">
          <StatsCards
            totalPractices={stats.totalPractices}
            averageScore={stats.averageScore}
            highestScore={stats.highestScore}
            streak={streak}
          />
        </div>

        {/* Phase 4: 盲点画像 */}
        {mounted && blindSpotData?.hasData && (
          <div className="mb-12">
            <div className="bg-surface rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-heading-sm font-semibold text-foreground">
                    {locale === 'zh' ? '个人盲点画像' : 'Your Blind Spot Profile'}
                  </h3>
                  <p className="text-small text-foreground-muted">
                    {locale === 'zh'
                      ? `基于 ${blindSpotData.overview?.totalPractices || 0} 次练习数据分析`
                      : `Based on ${blindSpotData.overview?.totalPractices || 0} practice sessions`}
                  </p>
                </div>
              </div>

              {/* 薄弱类型 */}
              {blindSpotData.weakAreas?.type && blindSpotData.weakAreas.type.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-small font-medium text-foreground-muted uppercase tracking-wider mb-3">
                    {locale === 'zh' ? '需加强的题型' : 'Weak Areas by Type'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {blindSpotData.weakAreas.type.map((area) => {
                      const typeMap: Record<string, string> = {
                        INTRO: locale === 'zh' ? '自我介绍' : 'Intro',
                        PROJECT: locale === 'zh' ? '项目经历' : 'Project',
                        TECHNICAL: locale === 'zh' ? '技术问题' : 'Technical',
                        BEHAVIORAL: locale === 'zh' ? '行为面试' : 'Behavioral',
                        HR: locale === 'zh' ? 'HR问题' : 'HR',
                      };
                      const scoreColor = area.avgScore < 60 ? 'bg-error/10 text-error' : area.avgScore < 75 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success';
                      return (
                        <div key={area.type} className={`px-4 py-2 rounded-xl ${scoreColor} flex items-center gap-2`}>
                          <span className="font-medium">{typeMap[area.type] || area.type}</span>
                          <span className="text-small opacity-75">{area.avgScore}分 · {area.count}次</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 维度得分雷达图简化版 */}
              {blindSpotData.dimensionScores && Object.values(blindSpotData.dimensionScores).some(s => s > 0) && (
                <div className="mb-6">
                  <h4 className="text-small font-medium text-foreground-muted uppercase tracking-wider mb-3">
                    {locale === 'zh' ? '能力维度分析' : 'Skill Dimensions'}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(blindSpotData.dimensionScores).map(([dim, score]) => {
                      const dimMap: Record<string, string> = {
                        content: locale === 'zh' ? '内容完整性' : 'Content',
                        structure: locale === 'zh' ? '结构逻辑' : 'Structure',
                        expression: locale === 'zh' ? '表达专业' : 'Expression',
                        highlights: locale === 'zh' ? '亮点差异' : 'Highlights',
                      };
                      const scoreColor = score < 60 ? 'text-error' : score < 75 ? 'text-warning' : 'text-success';
                      return (
                        <div key={dim} className="bg-background rounded-xl p-3 text-center">
                          <div className={`font-display text-heading-lg font-bold ${scoreColor}`}>{score}</div>
                          <div className="text-small text-foreground-muted">{dimMap[dim]}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 改进建议 */}
              {blindSpotData.suggestions && blindSpotData.suggestions.length > 0 && (
                <div>
                  <h4 className="text-small font-medium text-foreground-muted uppercase tracking-wider mb-3">
                    {locale === 'zh' ? '改进建议' : 'Suggestions'}
                  </h4>
                  <ul className="space-y-2">
                    {blindSpotData.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-small text-foreground">
                        <span className="w-5 h-5 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-accent text-xs font-bold">{idx + 1}</span>
                        </span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 4: 个性化推荐 */}
        {mounted && recommendations.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display text-heading-xl font-semibold text-foreground mb-6">
              {locale === 'zh' ? '为你推荐' : 'Recommended for You'}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.slice(0, 3).map((q) => {
                const typeMap: Record<string, string> = {
                  INTRO: locale === 'zh' ? '自我介绍' : 'Intro',
                  PROJECT: locale === 'zh' ? '项目经历' : 'Project',
                  TECHNICAL: locale === 'zh' ? '技术问题' : 'Technical',
                  BEHAVIORAL: locale === 'zh' ? '行为面试' : 'Behavioral',
                  HR: locale === 'zh' ? 'HR问题' : 'HR',
                };
                return (
                  <Link
                    key={q.id}
                    href={`/questions/${q.id}`}
                    className="group p-5 bg-surface hover:bg-accent/5 rounded-2xl border border-border hover:border-accent/20 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded-lg">
                        {typeMap[q.type] || q.type}
                      </span>
                      <span className="text-small text-foreground-muted">
                        {'★'.repeat(q.difficulty)}{'☆'.repeat(3 - q.difficulty)}
                      </span>
                    </div>
                    <h3 className="font-medium text-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                      {q.title}
                    </h3>
                    <p className="text-small text-foreground-muted flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {q.reason}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Charts Section */}
        {mounted && stats.totalPractices > 0 && (
          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            <div className="lg:col-span-2 bg-surface rounded-2xl p-6 border border-border">
              <h3 className="font-display text-heading-sm font-semibold text-foreground mb-4">
                {locale === 'zh' ? '近期得分趋势' : 'Recent Score Trend'}
              </h3>
              <ScoreTrendChart data={stats.recentTrend} height={240} />
            </div>

            <div className="lg:col-span-1">
              <StreakDisplay streak={streak} />
            </div>
          </div>
        )}

        {/* Daily Goal Progress */}
        <div className="mb-20">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="font-display text-heading-xl font-semibold text-foreground mb-1">
                {t.dashboard.dailyGoal.title}
              </h2>
              <p className="text-foreground-muted">
                {todayPractices >= dailyGoal
                  ? t.dashboard.dailyGoal.completed
                  : t.dashboard.dailyGoal.remaining.replace('{count}', String(dailyGoal - todayPractices))}
              </p>
            </div>
            <div className="font-display text-display-sm font-bold text-foreground">
              {todayPractices}/{dailyGoal}
            </div>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-700"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>

        {/* Quick Practice Categories */}
        <div className="mb-20">
          <h2 className="font-display text-heading-xl font-semibold text-foreground mb-8">
            {t.dashboard.categories.title}
          </h2>
          <div className="flex flex-wrap gap-3">
            {typeCategories.map((category) => (
              <Link
                key={category.type}
                href={`/questions?type=${category.type}`}
                className="group flex items-center gap-3 px-5 py-3.5 bg-surface hover:bg-accent/5 rounded-2xl border border-border hover:border-accent/20 transition-all duration-300"
              >
                <span className="text-accent">{categoryIcons[category.type]}</span>
                <span className="font-medium text-foreground">{getCategoryName(category.type)}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Records */}
        {mounted && recentRecords.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-heading-xl font-semibold text-foreground">
                {t.dashboard.recent.title}
              </h2>
              <Link
                href="/history"
                className="text-accent hover:text-accent-dark font-medium transition-colors flex items-center gap-1"
              >
                {t.dashboard.recent.viewAll}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="space-y-3">
              {recentRecords.map((record) => (
                <Link
                  key={record.id}
                  href={`/questions/${record.questionId}`}
                  className="group flex items-center justify-between p-5 bg-surface hover:bg-accent/5 rounded-2xl border border-border hover:border-accent/10 transition-all duration-300"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <h3 className="font-medium text-foreground truncate mb-1 group-hover:text-accent transition-colors">
                      {record.questionTitle}
                    </h3>
                    <span className="text-small text-foreground-muted">
                      {formatDate(record.createdAt)}
                    </span>
                  </div>
                  <div className={`font-display text-heading-xl font-bold ${getScoreColor(record.score)}`}>
                    {record.score}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {mounted && recentRecords.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-display text-heading-xl font-semibold text-foreground mb-3">
              {t.dashboard.empty.title}
            </h3>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              {t.dashboard.empty.desc}
            </p>
            <Link
              href={`/questions/${randomQuestionId}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent-dark transition-all duration-300 hover:shadow-glow"
            >
              {t.dashboard.empty.button}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
