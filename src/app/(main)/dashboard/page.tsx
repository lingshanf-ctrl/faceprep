"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Calendar,
  Target,
  Clock,
  Flame,
  ArrowRight,
  Zap,
  BookOpen,
  ChevronRight,
  Award,
  BarChart3,
  Sparkles,
  Brain,
  Trophy,
  Play,
} from "lucide-react";
import { getStats, getPracticeRecords, getStreak, PracticeRecord } from "@/lib/practice-store";
import { useLanguage } from "@/components/language-provider";
import { ScoreBadge } from "@/components/ui/score-badge";
import { QuestionTypeBadge } from "@/components/ui/type-badge";
import { questions } from "@/data/questions";
import { getTypeConfig } from "@/lib/design-tokens";

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

// Types
interface DashboardStats {
  totalPractices: number;
  averageScore: number;
  streakDays: number;
  totalTime: number;
  weakestType: string;
  bestType: string;
}

// 本地备用推荐逻辑（API 失败时使用）
function getLocalRecommendations(locale: "zh" | "en", count: number = 3, records?: PracticeRecord[]) {
  const practiceRecords = records || getPracticeRecordsSync();
  const recs: Array<{ id: string; title: string; type: string; reason: string }> = [];
  const usedIds = new Set<string>();

  // 计算薄弱类型（使用 Map 优化查找）
  const questionTypeMap = new Map(questions.map(q => [q.id, q.type]));
  const typeScores: Record<string, number[]> = {};

  for (const r of practiceRecords) {
    const type = questionTypeMap.get(r.questionId);
    if (type) {
      if (!typeScores[type]) typeScores[type] = [];
      typeScores[type].push(r.score);
    }
  }

  let weakestType = "";
  let lowestAvg = 100;
  Object.entries(typeScores).forEach(([type, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < lowestAvg) {
      lowestAvg = avg;
      weakestType = type;
    }
  });

  // 1. 优先推荐薄弱题型
  if (weakestType) {
    const typeQuestions = questions.filter((q) => q.type === weakestType && !usedIds.has(q.id));
    const shuffled = [...typeQuestions].sort(() => 0.5 - Math.random());
    const typeConfig = getTypeConfig(weakestType, locale);

    shuffled.slice(0, Math.min(2, count)).forEach((q) => {
      recs.push({
        id: q.id,
        title: q.title,
        type: q.type,
        reason: locale === "zh" ? `🔍 薄弱项：${typeConfig.label}` : `Weak: ${typeConfig.label}`,
      });
      usedIds.add(q.id);
    });
  }

  // 2. 补充高频题目
  if (recs.length < count) {
    const remaining = questions.filter((q) => !usedIds.has(q.id) && q.frequency >= 2);
    const shuffled = [...remaining].sort(() => 0.5 - Math.random());

    shuffled.slice(0, count - recs.length).forEach((q) => {
      recs.push({
        id: q.id,
        title: q.title,
        type: q.type,
        reason: locale === "zh" ? "📌 高频题目" : "High-frequency",
      });
      usedIds.add(q.id);
    });
  }

  // 3. 随机补充
  if (recs.length < count) {
    const finalRemaining = questions.filter((q) => !usedIds.has(q.id));
    const finalShuffled = [...finalRemaining].sort(() => 0.5 - Math.random());

    finalShuffled.slice(0, count - recs.length).forEach((q) => {
      recs.push({
        id: q.id,
        title: q.title,
        type: q.type,
        reason: locale === "zh" ? "💡 推荐练习" : "Recommended",
      });
    });
  }

  return recs;
}

// Stat Card Component - Enhanced with gradient hover effect
function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
  index,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: string;
  color: "accent" | "success" | "warning" | "error";
  index: number;
}) {
  const colorClasses = {
    accent: "from-accent/20 to-accent/5 text-accent border-accent/20",
    success: "from-success/20 to-success/5 text-success border-success/20",
    warning: "from-warning/20 to-warning/5 text-warning border-warning/20",
    error: "from-error/20 to-error/5 text-error border-error/20",
  };

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="group relative overflow-hidden rounded-2xl bg-white border border-border p-5 transition-all duration-300 hover:shadow-soft-lg hover:border-accent/30 hover:-translate-y-1"
    >
      {/* Gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-sm text-foreground-muted mb-1">{label}</p>
          <p className="text-2xl font-display font-bold text-foreground group-hover:scale-105 transition-transform origin-left">{value}</p>
          {trend && (
            <p className="text-xs text-success mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center border`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}

// Circular Progress Component
function CircularProgress({
  value,
  label,
  color = "accent",
  size = 70,
}: {
  value: number;
  label: string;
  color?: "accent" | "success" | "warning" | "error";
  size?: number;
}) {
  const colorClasses = {
    accent: "text-accent",
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
  };

  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${colorClasses[color]} transition-all duration-1000`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{Math.round(value)}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-foreground-muted mt-2">{label}</span>
    </div>
  );
}

// Recommendation Card - Enhanced design
function RecommendationCard({
  question,
  reason,
  locale,
  index,
}: {
  question: { id: string; title: string; type: string };
  reason: string;
  locale: "zh" | "en";
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <Link
        href={`/questions/${question.id}`}
        className="group block h-full"
      >
        <div className="h-full bg-white rounded-2xl border border-border p-5 transition-all duration-300 hover:shadow-soft-lg hover:border-accent/30 hover:-translate-y-1 relative overflow-hidden">
          {/* Hover gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform border border-accent/20">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <QuestionTypeBadge
                  type={question.type}
                  locale={locale}
                  showIcon={false}
                  className="mb-1"
                />
                <p className="text-xs text-foreground-muted truncate">{reason}</p>
              </div>
            </div>
            <h4 className="font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors">
              {question.title}
            </h4>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Recent Practice Item
function RecentPracticeItem({
  record,
  locale,
  index,
}: {
  record: PracticeRecord;
  locale: "zh" | "en";
  index: number;
}) {
  const question = questions.find((q) => q.id === record.questionId);
  if (!question) return null;

  const date = new Date(record.createdAt);
  const dateStr = locale === "zh"
    ? `${date.getMonth() + 1}月${date.getDate()}日`
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <Link
        href={`/practice/review/${record.id}`}
        className="group flex items-center gap-4 p-4 rounded-xl bg-white border border-border hover:border-accent/30 hover:shadow-soft-sm transition-all"
      >
        <ScoreBadge score={record.score} size="md" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate group-hover:text-accent transition-colors">
            {question.title}
          </h4>
          <p className="text-xs text-foreground-muted flex items-center gap-2 mt-1">
            <span>{dateStr}</span>
            <span>·</span>
            <span>{Math.round((record.duration || 0) / 60)}分钟</span>
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-foreground-muted group-hover:text-accent transition-colors" />
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { locale } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [rawStats, setRawStats] = useState<{ totalPractices: number; averageScore: number } | null>(null);
  const [streak, setStreak] = useState(0);
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [recommendations, setRecommendations] = useState<
    Array<{ id: string; title: string; type: string; reason: string }>
  >([]);

  // 数据加载（仅在组件挂载时执行一次）
  useEffect(() => {
    setMounted(true);

    async function loadData() {
      const [statsData, streakData, recordsData] = await Promise.all([
        getStats(),
        getStreak(),
        getPracticeRecords({ limit: 5 }), // 从API获取最近5条记录
      ]);

      setRawStats(statsData);
      setStreak(streakData);
      setRecords(recordsData);

      // 从 API 获取推荐题目
      try {
        const recsRes = await fetch("/api/questions/recommendations?count=3");
        if (recsRes.ok) {
          const recsData = await recsRes.json();
          const formattedRecs = recsData.recommendations.map((q: {
            id: string;
            title: string;
            type: string;
            reason: string;
          }) => ({
            id: q.id,
            title: q.title,
            type: q.type,
            reason: q.reason,
          }));
          setRecommendations(formattedRecs);
        } else {
          setRecommendations(getLocalRecommendations(locale, 3, recordsData));
        }
      } catch {
        setRecommendations(getLocalRecommendations(locale, 3, recordsData));
      }
    }

    loadData();
  }, []); // 移除 locale 依赖，只在挂载时加载

  // 使用 useMemo 缓存统计数据计算
  const stats = useMemo<DashboardStats | null>(() => {
    if (!rawStats) return null;

    // 缓存题目 ID 到类型的映射，避免重复查找
    const questionTypeMap = new Map(questions.map(q => [q.id, q.type]));

    const typeScores: Record<string, number[]> = {};
    let totalTime = 0;

    // 单次遍历完成所有计算
    for (const r of records) {
      totalTime += r.duration || 0;
      const type = questionTypeMap.get(r.questionId);
      if (type) {
        if (!typeScores[type]) typeScores[type] = [];
        typeScores[type].push(r.score);
      }
    }

    let weakestType = "";
    let bestType = "";
    let lowestAvg = 100;
    let highestAvg = 0;

    Object.entries(typeScores).forEach(([type, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < lowestAvg) {
        lowestAvg = avg;
        weakestType = type;
      }
      if (avg > highestAvg) {
        highestAvg = avg;
        bestType = type;
      }
    });

    return {
      totalPractices: rawStats.totalPractices,
      averageScore: rawStats.averageScore,
      streakDays: streak,
      totalTime,
      weakestType,
      bestType,
    };
  }, [rawStats, streak, records]);

  // 缓存最近记录
  const recentRecords = useMemo(() => records.slice(0, 5), [records]);

  if (!mounted || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/20" />
          <div className="h-4 w-32 bg-surface rounded" />
        </div>
      </div>
    );
  }

  const isNewUser = stats.totalPractices === 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects - Like Practice Page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Top gradient orb */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/10 rounded-full blur-[120px]" />
        {/* Secondary orb */}
        <div className="absolute top-40 -right-40 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
        {/* Bottom left orb */}
        <div className="absolute bottom-0 -left-40 w-[400px] h-[400px] bg-success/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10">
        {/* Hero Section - Like Landing Page */}
        <section className="relative pt-8 pb-6 md:pt-12 md:pb-8">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
            >
              {/* Left: Welcome Message */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-accent">
                    {locale === "zh" ? "继续加油" : "Keep it up"}
                  </span>
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">
                  {locale === "zh" ? "欢迎回来" : "Welcome back"}
                </h1>
                <p className="text-foreground-muted text-base md:text-lg">
                  {locale === "zh"
                    ? `今天是你第 ${stats.streakDays} 天练习，保持这个节奏！`
                    : `Day ${stats.streakDays} of your streak. Keep going!`}
                </p>
              </div>

              {/* Right: Quick Actions */}
              <div className="flex items-center gap-3">
                <Link
                  href="/practice"
                  className="group relative inline-flex items-center justify-center gap-2 h-12 px-6 bg-gradient-to-r from-accent to-accent-light text-white rounded-full font-medium shadow-glow hover:shadow-glow-lg transition-all hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <Play className="h-4 w-4 relative z-10 fill-current" />
                  <span className="relative z-10">{locale === "zh" ? "开始练习" : "Start Practice"}</span>
                </Link>
                <Link
                  href="/history"
                  className="inline-flex items-center justify-center gap-2 h-12 px-5 bg-white text-foreground border border-border rounded-full font-medium hover:border-accent/30 hover:shadow-soft-md transition-all"
                >
                  <Calendar className="h-4 w-4" />
                  {locale === "zh" ? "查看记录" : "History"}
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-4 md:py-6">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <StatCard
                icon={BookOpen}
                label={locale === "zh" ? "练习次数" : "Practices"}
                value={String(stats.totalPractices)}
                color="accent"
                index={0}
              />
              <StatCard
                icon={Target}
                label={locale === "zh" ? "平均分" : "Avg Score"}
                value={`${Math.round(stats.averageScore)}`}
                trend={stats.averageScore > 70 ? "+5%" : undefined}
                color="success"
                index={1}
              />
              <StatCard
                icon={Flame}
                label={locale === "zh" ? "连续天数" : "Streak"}
                value={`${stats.streakDays}天`}
                color="warning"
                index={2}
              />
              <StatCard
                icon={Clock}
                label={locale === "zh" ? "练习时长" : "Time"}
                value={`${Math.round(stats.totalTime / 60)}h`}
                color="accent"
                index={3}
              />
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-6 md:py-8">
          <div className="max-w-5xl mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Skill Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 space-y-6"
              >
                {/* Skill Analysis Card */}
                <div className="bg-white rounded-2xl border border-border p-6 relative overflow-hidden">
                  {/* Subtle gradient background */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-accent/5 to-transparent rounded-full blur-3xl" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
                        <Brain className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-semibold text-foreground">
                          {locale === "zh" ? "能力分析" : "Skill Analysis"}
                        </h2>
                        <p className="text-sm text-foreground-muted">
                          {locale === "zh" ? "基于你的练习数据" : "Based on your practice data"}
                        </p>
                      </div>
                    </div>

                    {isNewUser ? (
                      <div className="text-center py-10">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-4 border border-accent/20">
                          <Calendar className="h-10 w-10 text-accent" />
                        </div>
                        <h3 className="font-medium text-foreground mb-2 text-lg">
                          {locale === "zh" ? "开始你的第一次练习" : "Start your first practice"}
                        </h3>
                        <p className="text-sm text-foreground-muted mb-5 max-w-sm mx-auto">
                          {locale === "zh"
                            ? "完成3次练习后，我们将为你生成详细的能力分析报告"
                            : "Complete 3 practices to unlock detailed skill analysis"}
                        </p>
                        <Link
                          href="/practice"
                          className="inline-flex items-center gap-2 h-11 px-6 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent-dark transition-colors shadow-glow hover:shadow-glow-lg"
                        >
                          {locale === "zh" ? "开始练习" : "Start Practice"}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4">
                        <CircularProgress
                          value={stats.averageScore}
                          label={locale === "zh" ? "综合" : "Overall"}
                          color={stats.averageScore >= 80 ? "success" : stats.averageScore >= 60 ? "warning" : "error"}
                          size={75}
                        />
                        <CircularProgress
                          value={Math.min(100, stats.totalPractices * 10)}
                          label={locale === "zh" ? "练习量" : "Volume"}
                          color="accent"
                          size={75}
                        />
                        <CircularProgress
                          value={stats.weakestType ? 60 : 100}
                          label={locale === "zh" ? "薄弱项" : "Weakness"}
                          color="warning"
                          size={75}
                        />
                        <CircularProgress
                          value={stats.bestType ? 85 : 70}
                          label={locale === "zh" ? "优势" : "Strength"}
                          color="success"
                          size={75}
                        />
                      </div>
                    )}

                    {/* Type Breakdown */}
                    {!isNewUser && stats.weakestType && (
                      <div className="mt-6 pt-6 border-t border-border">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm text-foreground-muted">
                            {locale === "zh" ? "需要加强:" : "Needs work:"}
                          </span>
                          <QuestionTypeBadge type={stats.weakestType} locale={locale} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-accent" />
                      <h2 className="font-display text-lg font-semibold text-foreground">
                        {locale === "zh" ? "为你推荐" : "Recommended"}
                      </h2>
                    </div>
                    <Link
                      href="/questions"
                      className="text-sm text-accent hover:underline flex items-center gap-1"
                    >
                      {locale === "zh" ? "查看全部" : "View all"}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.map((rec, index) => (
                      <RecommendationCard
                        key={rec.id}
                        question={rec}
                        reason={rec.reason}
                        locale={locale}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Right Column - Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                {/* Recent Practice */}
                <div className="bg-white rounded-2xl border border-border p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
                        <Clock className="h-5 w-5 text-accent" />
                      </div>
                      <h2 className="font-display text-lg font-semibold text-foreground">
                        {locale === "zh" ? "最近练习" : "Recent"}
                      </h2>
                    </div>
                    <Link
                      href="/history"
                      className="text-sm text-accent hover:underline"
                    >
                      {locale === "zh" ? "全部" : "All"}
                    </Link>
                  </div>

                  {recentRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-16 w-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-3">
                        <Award className="h-8 w-8 text-foreground-muted" />
                      </div>
                      <p className="text-sm text-foreground-muted">
                        {locale === "zh" ? "还没有练习记录" : "No practice records yet"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentRecords.map((record, index) => (
                        <RecentPracticeItem
                          key={record.id}
                          record={record}
                          locale={locale}
                          index={index}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA Card */}
                <div className="relative overflow-hidden rounded-2xl">
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent to-accent-dark" />
                  {/* Decorative orbs */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />

                  <div className="relative z-10 p-6 text-white">
                    <h3 className="font-display text-lg font-semibold mb-2">
                      {locale === "zh" ? "准备开始？" : "Ready to practice?"}
                    </h3>
                    <p className="text-white/70 text-sm mb-4">
                      {locale === "zh"
                        ? "每天练习15分钟，持续进步"
                        : "Practice 15 minutes daily for steady progress"}
                    </p>
                    <Link
                      href="/practice"
                      className="group inline-flex items-center gap-2 h-10 px-5 bg-white text-accent rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
                    >
                      {locale === "zh" ? "开始练习" : "Start Now"}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
