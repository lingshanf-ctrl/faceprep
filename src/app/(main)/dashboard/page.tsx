"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  ChevronRight,
} from "lucide-react";
import { getStats, getPracticeRecords, getStreak, PracticeRecord } from "@/lib/practice-store";
import { useLanguage } from "@/components/language-provider";
import { ScoreBadge } from "@/components/ui/score-badge";
import { questions } from "@/data/questions";
import { getTypeConfig } from "@/lib/design-tokens";

// Types
interface DashboardStats {
  totalPractices: number;
  averageScore: number;
  streakDays: number;
  totalTime: number;
  weakestType: string;
  bestType: string;
  typeAverages: Record<string, number>;
  typeCounts: Record<string, number>;
  scoreTrend: number;
  untouchedTypes: string[];
}

// 本地备用推荐逻辑（API 失败时使用）
function getLocalRecommendations(locale: "zh" | "en", count: number = 3, records?: PracticeRecord[]) {
  const practiceRecords = records || [];
  const recs: Array<{ id: string; title: string; type: string; reason: string }> = [];
  const usedIds = new Set<string>();

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

  if (weakestType) {
    const typeQuestions = questions.filter((q) => q.type === weakestType && !usedIds.has(q.id));
    const shuffled = [...typeQuestions].sort(() => 0.5 - Math.random());
    const typeConfig = getTypeConfig(weakestType, locale);

    shuffled.slice(0, Math.min(2, count)).forEach((q) => {
      recs.push({
        id: q.id,
        title: q.title,
        type: q.type,
        reason: locale === "zh" ? `薄弱项：${typeConfig.label}` : `Weak: ${typeConfig.label}`,
      });
      usedIds.add(q.id);
    });
  }

  if (recs.length < count) {
    const remaining = questions.filter((q) => !usedIds.has(q.id) && q.frequency >= 2);
    const shuffled = [...remaining].sort(() => 0.5 - Math.random());

    shuffled.slice(0, count - recs.length).forEach((q) => {
      recs.push({
        id: q.id,
        title: q.title,
        type: q.type,
        reason: locale === "zh" ? "高频题目" : "High-frequency",
      });
      usedIds.add(q.id);
    });
  }

  if (recs.length < count) {
    const finalRemaining = questions.filter((q) => !usedIds.has(q.id));
    const finalShuffled = [...finalRemaining].sort(() => 0.5 - Math.random());

    finalShuffled.slice(0, count - recs.length).forEach((q) => {
      recs.push({
        id: q.id,
        title: q.title,
        type: q.type,
        reason: locale === "zh" ? "推荐练习" : "Recommended",
      });
    });
  }

  return recs;
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
  const [blindspots, setBlindspots] = useState<{
    dimensionScores?: { content: number; structure: number; expression: number; highlights: number };
    topWeakPoints?: string[];
    suggestions?: string[];
  } | null>(null);

  useEffect(() => {
    setMounted(true);

    async function loadData() {
      const [statsData, streakData, recordsData] = await Promise.all([
        getStats(),
        getStreak(),
        getPracticeRecords({ limit: 20 }),
      ]);

      setRawStats(statsData);
      setStreak(streakData);
      setRecords(recordsData);

      try {
        const bsRes = await fetch("/api/stats/blindspots");
        if (bsRes.ok) {
          const bsData = await bsRes.json();
          if (bsData.hasData) {
            setBlindspots({
              dimensionScores: bsData.dimensionScores,
              topWeakPoints: bsData.topWeakPoints?.filter(Boolean).slice(0, 3),
              suggestions: bsData.suggestions?.slice(0, 2),
            });
          }
        }
      } catch { /* 降级到客户端计算 */ }

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
  }, []);

  const stats = useMemo<DashboardStats | null>(() => {
    if (!rawStats) return null;

    const questionTypeMap = new Map(questions.map(q => [q.id, q.type]));
    const allTypes = Array.from(new Set(questions.map(q => q.type)));

    const typeScoresMap: Record<string, number[]> = {};
    let totalTime = 0;

    for (const r of records) {
      totalTime += r.duration || 0;
      const type = questionTypeMap.get(r.questionId);
      if (type) {
        if (!typeScoresMap[type]) typeScoresMap[type] = [];
        typeScoresMap[type].push(r.score);
      }
    }

    const typeAverages: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    let weakestType = "";
    let bestType = "";
    let lowestAvg = 100;
    let highestAvg = 0;

    Object.entries(typeScoresMap).forEach(([type, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      typeAverages[type] = Math.round(avg);
      typeCounts[type] = scores.length;
      if (avg < lowestAvg) { lowestAvg = avg; weakestType = type; }
      if (avg > highestAvg) { highestAvg = avg; bestType = type; }
    });

    const sorted = [...records].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const recent5 = sorted.slice(0, 5);
    const prev5 = sorted.slice(5, 10);
    const recentAvg = recent5.length ? recent5.reduce((s, r) => s + r.score, 0) / recent5.length : 0;
    const prevAvg = prev5.length ? prev5.reduce((s, r) => s + r.score, 0) / prev5.length : recentAvg;
    const scoreTrend = Math.round(recentAvg - prevAvg);

    const untouchedTypes = allTypes.filter(t => !typeScoresMap[t]);

    return {
      totalPractices: rawStats.totalPractices,
      averageScore: rawStats.averageScore,
      streakDays: streak,
      totalTime,
      weakestType,
      bestType,
      typeAverages,
      typeCounts,
      scoreTrend,
      untouchedTypes,
    };
  }, [rawStats, streak, records]);

  const recentRecords = useMemo(() => records.slice(0, 5), [records]);

  if (!mounted || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const isNewUser = stats.totalPractices === 0;

  const today = new Date();
  const todayStr = locale === "zh"
    ? `${today.getMonth() + 1}月${today.getDate()}日`
    : today.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-14 space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {locale === "zh" ? "欢迎回来" : "Welcome back"}
            </h1>
            <p className="text-sm text-foreground-muted mt-1.5 flex items-center gap-1.5">
              <span>{locale === "zh" ? `连续 ${stats.streakDays} 天` : `${stats.streakDays}-day streak`}</span>
              <span className="text-border">·</span>
              <span>{locale === "zh" ? `共 ${stats.totalPractices} 次练习` : `${stats.totalPractices} practices`}</span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {todayStr}
              </span>
            </p>
          </div>
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 h-10 px-5 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent-dark transition-colors self-start sm:self-auto"
          >
            {locale === "zh" ? "开始练习" : "Start Practice"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>

        {/* KPI Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white border border-border/50 rounded-2xl divide-x divide-border/50 grid grid-cols-2 lg:grid-cols-4"
        >
          {/* 练习次数 */}
          <div className="px-6 py-5">
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {stats.totalPractices}
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              {locale === "zh" ? "练习次数" : "Practices"}
            </p>
          </div>

          {/* 平均得分 */}
          <div className="px-6 py-5">
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {Math.round(stats.averageScore)}
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              {locale === "zh" ? "平均得分" : "Avg Score"}
            </p>
            {stats.totalPractices >= 10 && stats.scoreTrend !== 0 && (
              <p className={`text-xs mt-1 flex items-center gap-0.5 ${stats.scoreTrend > 0 ? "text-success" : "text-error"}`}>
                {stats.scoreTrend > 0
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />}
                {stats.scoreTrend > 0 ? "+" : ""}{stats.scoreTrend}{locale === "zh" ? " 分" : " pts"}
              </p>
            )}
          </div>

          {/* 连续天数 */}
          <div className="px-6 py-5">
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {stats.streakDays}
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              {locale === "zh" ? "连续天数" : "Streak (days)"}
            </p>
          </div>

          {/* 练习时长 */}
          <div className="px-6 py-5">
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {Math.round(stats.totalTime / 60)}
            </p>
            <p className="text-xs text-foreground-muted mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {locale === "zh" ? "练习时长（分钟）" : "Minutes practiced"}
            </p>
          </div>
        </motion.div>

        {/* 2-col grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left: Blind spot + Recommendations */}
          <div className="lg:col-span-2 space-y-6">

            {/* Card A: Blind Spot Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white border border-border/50 rounded-2xl overflow-hidden"
            >
              {/* Card header */}
              <div className="px-6 py-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  {locale === "zh" ? "个人盲点分析" : "Blind Spot Analysis"}
                </h2>
                {!isNewUser && (
                  <span className="text-xs text-foreground-muted">
                    {locale === "zh" ? `基于 ${stats.totalPractices} 次练习` : `Based on ${stats.totalPractices} practices`}
                  </span>
                )}
              </div>

              {isNewUser ? (
                <div className="px-6 py-12 text-center border-t border-border/50">
                  <p className="text-foreground-muted text-sm mb-4">
                    {locale === "zh" ? "完成 3 次练习后生成盲点分析" : "Complete 3 practices to unlock analysis"}
                  </p>
                  <Link
                    href="/practice"
                    className="inline-flex items-center gap-2 h-9 px-5 bg-accent text-white rounded-full text-sm font-medium hover:bg-accent-dark transition-colors"
                  >
                    {locale === "zh" ? "开始练习" : "Start Practice"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border/50">

                  {/* Block 1: Type score bars */}
                  {Object.keys(stats.typeAverages).length > 0 && (
                    <div className="px-6 py-4 space-y-3">
                      {Object.entries(stats.typeAverages)
                        .sort(([, a], [, b]) => a - b)
                        .map(([type, avg]) => {
                          const cfg = getTypeConfig(type, locale);
                          const isWeakest = type === stats.weakestType;
                          const isBest = type === stats.bestType;
                          const barColor = avg >= 80 ? "bg-success" : avg >= 65 ? "bg-accent" : "bg-warning";
                          return (
                            <div key={type} className="flex items-center gap-3">
                              <span className="text-xs text-foreground-muted w-12 shrink-0 text-right">
                                {cfg.label}
                              </span>
                              <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full ${barColor} rounded-full`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${avg}%` }}
                                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                />
                              </div>
                              <span className="text-xs font-semibold tabular-nums w-7 shrink-0 text-right text-foreground">
                                {avg}
                              </span>
                              {isWeakest && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-warning/10 text-warning rounded-full shrink-0 leading-none">
                                  {locale === "zh" ? "薄弱" : "Weak"}
                                </span>
                              )}
                              {isBest && !isWeakest && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-success/10 text-success rounded-full shrink-0 leading-none">
                                  {locale === "zh" ? "优势" : "Best"}
                                </span>
                              )}
                              {!isWeakest && !isBest && (
                                <span className="w-10 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Block 2: Top weak points */}
                  {blindspots?.topWeakPoints && blindspots.topWeakPoints.length > 0 && (
                    <div className="px-6 py-4">
                      <p className="text-xs font-medium text-foreground-muted mb-3">
                        {locale === "zh" ? "高频失分点" : "Common Weak Points"}
                      </p>
                      <ul className="space-y-2">
                        {blindspots.topWeakPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <span className="w-1 h-1 rounded-full bg-warning mt-2 shrink-0" />
                            <span className="leading-snug">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Block 3: Summary footer */}
                  <div className="px-6 py-3 bg-surface/40 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {stats.weakestType && (
                      <span className="text-xs text-foreground-muted">
                        <span className="text-warning font-medium">
                          {getTypeConfig(stats.weakestType, locale).label}
                        </span>
                        {locale === "zh"
                          ? ` 低于均值 ${Math.round(stats.averageScore) - stats.typeAverages[stats.weakestType]} 分`
                          : ` is ${Math.round(stats.averageScore) - stats.typeAverages[stats.weakestType]} pts below avg`}
                      </span>
                    )}
                    {stats.totalPractices >= 10 && stats.scoreTrend !== 0 && (
                      <span className={`text-xs flex items-center gap-0.5 ${stats.scoreTrend > 0 ? "text-success" : "text-error"}`}>
                        {stats.scoreTrend > 0
                          ? <TrendingUp className="h-3 w-3" />
                          : <TrendingDown className="h-3 w-3" />}
                        {locale === "zh"
                          ? `近期趋势 ${stats.scoreTrend > 0 ? "+" : ""}${stats.scoreTrend} 分`
                          : `Trend ${stats.scoreTrend > 0 ? "+" : ""}${stats.scoreTrend} pts`}
                      </span>
                    )}
                    {stats.untouchedTypes.length > 0 && (
                      <span className="text-xs text-foreground-muted">
                        {locale === "zh"
                          ? `未练习题型：${stats.untouchedTypes.map(t => getTypeConfig(t, locale).label).join("、")}`
                          : `Untouched: ${stats.untouchedTypes.map(t => getTypeConfig(t, "en").label).join(", ")}`}
                      </span>
                    )}
                    {!stats.weakestType && stats.untouchedTypes.length === 0 && (
                      <span className="text-xs text-success">
                        {locale === "zh" ? "各题型均有覆盖，继续保持" : "All types covered — keep it up"}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Card B: Today's Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-white border border-border/50 rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-4 flex items-center justify-between border-b border-border/50">
                <h2 className="text-sm font-semibold text-foreground">
                  {locale === "zh" ? "今日推荐" : "Recommended"}
                </h2>
                <Link
                  href="/questions"
                  className="text-xs text-foreground-muted hover:text-accent transition-colors flex items-center gap-0.5"
                >
                  {locale === "zh" ? "全部题库" : "All questions"}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-border/50">
                {recommendations.map((rec) => {
                  const cfg = getTypeConfig(rec.type, locale);
                  return (
                    <Link
                      key={rec.id}
                      href={`/questions/${rec.id}`}
                      className="flex items-center gap-3 px-6 py-3.5 hover:bg-surface/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-foreground-muted truncate">{rec.reason}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {rec.title}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-foreground-muted shrink-0 group-hover:text-accent transition-colors" />
                    </Link>
                  );
                })}
                {recommendations.length === 0 && (
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm text-foreground-muted">
                      {locale === "zh" ? "加载中..." : "Loading..."}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right: Recent Practices */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="bg-white border border-border/50 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between border-b border-border/50">
                <h2 className="text-sm font-semibold text-foreground">
                  {locale === "zh" ? "最近练习" : "Recent"}
                </h2>
                <Link
                  href="/history"
                  className="text-xs text-foreground-muted hover:text-accent transition-colors flex items-center gap-0.5"
                >
                  {locale === "zh" ? "全部" : "All"}
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {recentRecords.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm text-foreground-muted mb-4">
                    {locale === "zh" ? "还没有练习记录" : "No records yet"}
                  </p>
                  <Link
                    href="/practice"
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                  >
                    {locale === "zh" ? "去练习" : "Start practicing"}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {recentRecords.map((record) => {
                    const title = record.questionTitle ||
                      questions.find((q) => q.id === record.questionId)?.title ||
                      (locale === "zh" ? "未知题目" : "Unknown");

                    const date = new Date(record.createdAt);
                    const dateStr = locale === "zh"
                      ? `${date.getMonth() + 1}/${date.getDate()}`
                      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                    return (
                      <Link
                        key={record.id}
                        href={`/practice/review/${record.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition-colors group"
                      >
                        <ScoreBadge score={record.score} size="sm" />
                        <p className="flex-1 text-sm text-foreground line-clamp-1 min-w-0">
                          {title}
                        </p>
                        <span className="text-xs text-foreground-muted shrink-0">{dateStr}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
