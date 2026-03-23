"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  CheckCircle,
  Flame,
  Play,
  MessageSquare,
  Code2,
  User,
  Briefcase,
  Heart,
  AlertCircle,
} from "lucide-react";
import { getStats, getPracticeRecords, getStreak, PracticeRecord } from "@/lib/practice-store";
import { useLanguage } from "@/components/language-provider";
import { ScoreBadge } from "@/components/ui/score-badge";
import { questions } from "@/data/questions";
import { getTypeConfig } from "@/lib/design-tokens";
import { PageHeader } from "@/components/page-header";

// Type icon map
const typeIconMap: Record<string, React.ElementType> = {
  BEHAVIORAL: MessageSquare,
  TECHNICAL: Code2,
  INTRO: User,
  PROJECT: Briefcase,
  HR: Heart,
};

function getDifficultyLabel(difficulty: number | undefined, locale: string) {
  if (!difficulty) return "";
  if (difficulty === 1) return locale === "zh" ? "简单" : "Easy";
  if (difficulty === 2) return locale === "zh" ? "中等" : "Medium";
  return locale === "zh" ? "困难" : "Hard";
}

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
      <PageHeader
        title={locale === "zh" ? "练习仪表板" : "Practice Dashboard"}
        subtitle={locale === "zh" ? `欢迎回来，今日继续保持！` : "Welcome back. Your AI mentor is ready."}
      />

      <div className="px-4 md:px-8 pb-16 max-w-7xl mx-auto space-y-10 pt-6 md:pt-8">

        {/* Stats Grid — 3 columns */}
        <section className="grid grid-cols-3 gap-3 md:gap-6">
          {/* Questions Completed */}
          <div className="p-3 md:p-8 bg-[#f6f3f2] rounded-xl flex flex-col justify-between h-28 md:h-48 group hover:bg-[#eae7e7] transition-colors">
            <div className="flex justify-between items-start gap-1">
              <span className="text-[#5f5e5e] font-body text-[9px] md:text-xs uppercase tracking-widest font-bold leading-tight line-clamp-2">
                {locale === "zh" ? "练习次数" : "Completed"}
              </span>
              <CheckCircle className="w-3.5 h-3.5 md:w-5 md:h-5 text-[#004ac6] shrink-0" />
            </div>
            <div>
              <span className="text-2xl md:text-4xl font-display font-extrabold text-foreground">{stats.totalPractices}</span>
              <p className="text-xs text-[#004ac6] font-bold mt-1 hidden md:block">
                {locale === "zh" ? "继续加油" : "Keep going!"}
              </p>
            </div>
          </div>

          {/* Avg Score */}
          <div className="p-3 md:p-8 bg-[#f6f3f2] rounded-xl flex flex-col justify-between h-28 md:h-48 group hover:bg-[#eae7e7] transition-colors">
            <div className="flex justify-between items-start gap-1">
              <span className="text-[#5f5e5e] font-body text-[9px] md:text-xs uppercase tracking-widest font-bold leading-tight line-clamp-2">
                {locale === "zh" ? "平均得分" : "Avg Score"}
              </span>
              <TrendingUp className="w-3.5 h-3.5 md:w-5 md:h-5 text-[#004ac6] shrink-0" />
            </div>
            <div>
              <span className="text-2xl md:text-4xl font-display font-extrabold text-foreground">
                {Math.round(stats.averageScore)}<span className="text-xs md:text-lg text-[#5f5e5e]">/100</span>
              </span>
              {stats.totalPractices >= 10 && stats.scoreTrend !== 0 && (
                <p className={`text-xs mt-1 items-center gap-0.5 hidden md:flex ${stats.scoreTrend > 0 ? "text-success" : "text-error"}`}>
                  {stats.scoreTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stats.scoreTrend > 0 ? "+" : ""}{stats.scoreTrend}{locale === "zh" ? " 分" : " pts"}
                </p>
              )}
              {(stats.totalPractices < 10 || stats.scoreTrend === 0) && (
                <p className="text-xs text-[#5f5e5e] mt-1 hidden md:block">{locale === "zh" ? "持续练习提升分数" : "Keep practicing to improve"}</p>
              )}
            </div>
          </div>

          {/* Current Streak */}
          <div className="p-3 md:p-8 bg-primary-gradient rounded-xl flex flex-col justify-between h-28 md:h-48 text-white">
            <div className="flex justify-between items-start gap-1">
              <span className="font-body text-[9px] md:text-xs uppercase tracking-widest font-bold opacity-80 leading-tight line-clamp-2">
                {locale === "zh" ? "连续天数" : "Streak"}
              </span>
              <Flame className="w-3.5 h-3.5 md:w-5 md:h-5 shrink-0" />
            </div>
            <div>
              <span className="text-2xl md:text-4xl font-display font-extrabold">
                {stats.streakDays}
                <span className="text-base md:text-4xl"> {locale === "zh" ? "天" : "d"}</span>
              </span>
              <p className="text-xs opacity-80 mt-1 hidden md:block">
                {locale === "zh" ? "保持势头，继续前进！" : "Keep the momentum going!"}
              </p>
            </div>
          </div>
        </section>

        {/* Main 12-col Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Left 8-col */}
          <div className="lg:col-span-8 space-y-6">

            {/* Card A: Blind Spot Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {/* Section title row */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-foreground">
                  {locale === "zh" ? "个人盲点分析" : "Blind Spot Analysis"}
                </h2>
                {!isNewUser && (
                  <span className="text-xs text-[#5f5e5e]">
                    {locale === "zh" ? `基于 ${stats.totalPractices} 次练习` : `Based on ${stats.totalPractices} practices`}
                  </span>
                )}
              </div>
              <div className="bg-[#f6f3f2] rounded-xl overflow-hidden shadow-[0_4px_16px_rgba(28,27,27,0.06)] hover:shadow-[0_8px_28px_rgba(28,27,27,0.10)] transition-shadow duration-300">

              {isNewUser ? (
                <div className="px-6 py-12 text-center border-t border-border/50">
                  <p className="text-foreground-muted text-sm mb-4">
                    {locale === "zh" ? "完成 3 次练习后生成盲点分析" : "Complete 3 practices to unlock analysis"}
                  </p>
                  <Link
                    href="/practice"
                    className="inline-flex items-center gap-2 h-9 px-5 text-white rounded-xl text-sm font-medium transition-all duration-300 bg-primary-gradient shadow-glow"
                  >
                    {locale === "zh" ? "开始练习" : "Start Practice"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border/10">

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
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning bg-warning/10 border border-warning/20 px-2.5 py-1 rounded-full mb-3">
                        <AlertCircle className="w-3 h-3" />
                        {locale === "zh" ? "高频失分点" : "Common Weak Points"}
                      </span>
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
              </div>{/* end inner bg card */}
            </motion.div>

            {/* Card B: Today's Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {/* Section title row */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-foreground">
                  {locale === "zh" ? "今日推荐" : "Recommended for You"}
                </h2>
                <Link
                  href="/questions"
                  className="text-sm text-[#004ac6] font-medium hover:underline flex items-center gap-1"
                >
                  {locale === "zh" ? "查看题库" : "View Question Bank"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Question cards */}
              <div className="space-y-4">
                {recommendations.map((rec) => {
                  const cfg = getTypeConfig(rec.type, locale);
                  const fullQuestion = questions.find(q => q.id === rec.id);
                  const diffLabel = getDifficultyLabel(fullQuestion?.difficulty, locale);
                  const TypeIcon = typeIconMap[rec.type] ?? MessageSquare;
                  return (
                    <div key={rec.id} className="bg-[#f6f3f2] rounded-xl p-5 hover:bg-white hover:shadow-[0_8px_24px_rgba(28,27,27,0.06)] transition-all">
                      {/* Top row: icon + badge + difficulty */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 bg-[#004ac6]/10 rounded-lg flex items-center justify-center shrink-0">
                            <TypeIcon className="w-4 h-4 text-[#004ac6]" />
                          </div>
                          <span className="text-[11px] font-bold tracking-widest uppercase text-[#5f5e5e] bg-[#eae7e7] px-2.5 py-1 rounded">
                            {cfg.label}
                          </span>
                        </div>
                        {diffLabel && (
                          <span className="text-xs text-[#5f5e5e]">
                            {locale === "zh" ? "难度：" : "Difficulty: "}<span className="font-medium text-foreground">{diffLabel}</span>
                          </span>
                        )}
                      </div>
                      {/* Question title */}
                      <h3 className="font-display font-bold text-foreground leading-snug mb-1.5">
                        &ldquo;{rec.title}&rdquo;
                      </h3>
                      {/* Reason/description */}
                      <p className="text-sm text-[#5f5e5e] mb-4 leading-relaxed">{rec.reason}</p>
                      {/* CTA */}
                      <Link
                        href={`/questions/${rec.id}`}
                        className="text-sm font-bold text-[#004ac6] flex items-center gap-1 hover:gap-2 transition-all w-fit"
                      >
                        {locale === "zh" ? "立即练习" : "Practice Now"}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })}
                {recommendations.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-sm text-[#5f5e5e]">
                      {locale === "zh" ? "加载中..." : "Loading..."}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right 4-col */}
          <div className="lg:col-span-4 space-y-8">
            {/* Start Mock Interview CTA */}
            <div className="p-6 md:p-8 bg-[#1c1b1b] rounded-2xl text-white space-y-5 relative overflow-hidden">
              {/* Decorative dot grid */}
              <div className="absolute top-0 right-0 w-28 h-28 opacity-[0.06]"
                style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "10px 10px" }}
              />
              <div>
                <h3 className="font-display text-3xl md:text-4xl font-extrabold leading-[1.1] tracking-tight text-white">
                  {locale === "zh" ? (
                    <>准备好<br />真实模拟了吗？</>
                  ) : (
                    <>Ready for a<br />real session?</>
                  )}
                </h3>
                <p className="text-sm text-white/50 mt-3 leading-relaxed">
                  {locale === "zh" ? "AI 全程监督 · 多题连贯 · 实时评分" : "Start a full AI-proctored mock interview with live feedback."}
                </p>
              </div>
              <Link
                href="/practice"
                className="w-full py-3.5 bg-primary-gradient text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 text-sm relative z-10"
              >
                <Play className="w-4 h-4 fill-white" />
                {locale === "zh" ? "开始模拟面试" : "Start Mock Interview"}
              </Link>
            </div>

            {/* Recent Practices */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl font-bold text-foreground">
                  {locale === "zh" ? "最近练习" : "Recent Practice"}
                </h3>
                <Link
                  href="/history"
                  className="text-sm text-[#004ac6] font-medium hover:underline flex items-center gap-1"
                >
                  {locale === "zh" ? "查看全部" : "View All"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
              <div className="bg-[#f6f3f2] rounded-xl overflow-hidden">

              {recentRecords.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm text-[#5f5e5e] mb-4">
                    {locale === "zh" ? "还没有练习记录" : "No records yet"}
                  </p>
                  <Link
                    href="/practice"
                    className="inline-flex items-center gap-1.5 text-sm text-[#004ac6] font-medium hover:underline"
                  >
                    {locale === "zh" ? "去练习" : "Start practicing"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#eae7e7]">
                  {recentRecords.map((record) => {
                    const title = record.questionTitle ||
                      questions.find((q) => q.id === record.questionId)?.title ||
                      (locale === "zh" ? "未知题目" : "Unknown");
                    const questionData = questions.find((q) => q.id === record.questionId);
                    const cfg = questionData ? getTypeConfig(questionData.type, locale) : null;

                    const date = new Date(record.createdAt);
                    const dateStr = locale === "zh"
                      ? `${date.getMonth() + 1}月${date.getDate()}日`
                      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                    return (
                      <Link
                        key={record.id}
                        href={`/practice/review/${record.id}`}
                        className="flex items-center gap-3 px-5 py-4 hover:bg-white transition-colors group"
                      >
                        <ScoreBadge score={record.score} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground line-clamp-1">
                            {title}
                          </p>
                          {cfg && (
                            <span className="text-[11px] text-[#5f5e5e] mt-0.5 block">{cfg.label}</span>
                          )}
                        </div>
                        <span className="text-xs text-[#5f5e5e] shrink-0">{dateStr}</span>
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
      </div>
    </div>
  );
}
