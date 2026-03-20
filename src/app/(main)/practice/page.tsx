"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { questions, Question } from "@/data/questions";
import { getFavoriteCount } from "@/lib/favorites-store";
import { useLanguage } from "@/components/language-provider";
import { getPracticeRecordsSync } from "@/lib/practice-store";
import { typeColorConfig, getTypeConfig, getDifficultyConfig } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// 本地备用推荐逻辑（API 失败时使用）
function getLocalRecommendations(locale: "zh" | "en", count: number = 3) {
  const records = getPracticeRecordsSync();
  const recommendations: Array<Question & { reason: string }> = [];

  if (records.length > 0) {
    // 找出得分最低的类型
    const typeScores: Record<string, number[]> = {};
    records.forEach(r => {
      const q = questions.find(q => q.id === r.questionId);
      if (q) {
        if (!typeScores[q.type]) typeScores[q.type] = [];
        typeScores[q.type].push(r.score);
      }
    });

    let weakestType = '';
    let lowestAvg = 100;
    Object.entries(typeScores).forEach(([type, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < lowestAvg) {
        lowestAvg = avg;
        weakestType = type;
      }
    });

    if (weakestType) {
      const typeQuestions = questions.filter(q => q.type === weakestType);
      const shuffled = [...typeQuestions].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(2, count));

      const typeConfig = getTypeConfig(weakestType, locale);
      selected.forEach(q => {
        recommendations.push({
          ...q,
          reason: locale === 'zh'
            ? `${typeConfig.label} · 你的薄弱项`
            : `${typeConfig.label} · Needs Practice`
        });
      });
    }
  }

  // 如果不足 count 道，随机补充
  if (recommendations.length < count) {
    const existingIds = new Set(recommendations.map(q => q.id));
    const remaining = questions.filter(q => !existingIds.has(q.id));
    const shuffled = [...remaining].sort(() => 0.5 - Math.random());
    const needed = count - recommendations.length;

    shuffled.slice(0, needed).forEach(q => {
      recommendations.push({
        ...q,
        reason: locale === 'zh' ? '热门题目' : 'Popular'
      });
    });
  }

  return recommendations;
}

// 估计练习时间（分钟）
function estimateTime(difficulty: number): number {
  return difficulty === 1 ? 3 : difficulty === 2 ? 5 : 8;
}

export default function PracticePage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [recommendations, setRecommendations] = useState<Array<Question & { reason: string }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFavoriteCount(getFavoriteCount());

    // 从 API 获取推荐题目
    async function loadRecommendations() {
      try {
        const res = await fetch("/api/questions/recommendations?count=3");
        if (res.ok) {
          const data = await res.json();
          const formattedRecs = data.recommendations.map((q: {
            id: string;
            title: string;
            category: string;
            type: string;
            difficulty: number;
            frequency: number;
            keyPoints: string;
            framework?: string;
            referenceAnswer: string;
            commonMistakes?: string;
            tips?: string;
            reason: string;
          }) => ({
            ...q,
            reason: q.reason,
          }));
          setRecommendations(formattedRecs);
        } else {
          // API 失败使用本地备用
          setRecommendations(getLocalRecommendations(locale, 3));
        }
      } catch {
        setRecommendations(getLocalRecommendations(locale, 3));
      }
    }

    loadRecommendations();
  }, [locale]);

  // 切换推荐题目
  const handleChangeQuestion = useCallback(() => {
    setIsChanging(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % recommendations.length);
      setIsChanging(false);
    }, 200);
  }, [recommendations.length]);

  const currentQuestion = recommendations[currentIndex];

  // 动画配置
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ========== 上半部分：快速练习（浅色主题） ========== */}
      <section className="relative bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-accent uppercase tracking-wider">
                {locale === 'zh' ? '快速练习' : 'Quick Practice'}
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">
              {locale === 'zh' ? '利用碎片时间，针对性提升' : 'Practice Anytime, Improve Fast'}
            </h1>
            <p className="text-foreground-muted text-base md:text-lg">
              {locale === 'zh'
                ? '单题模式 · 3-8分钟 · 随时随地开始'
                : 'Single question mode · 3-8 min · Start anytime'}
            </p>
          </motion.div>

          {/* Quick Practice Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-5 gap-5 mb-12"
          >
            {/* 智能推荐 - 占3列 */}
            <motion.div variants={itemVariants} className="md:col-span-3">
              <div className="h-full bg-accent rounded-xl p-5 sm:p-6 md:p-8 text-white relative overflow-hidden group">

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <span className="font-medium">{locale === 'zh' ? '为你推荐' : 'Recommended'}</span>
                    </div>
                    {currentQuestion && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {currentIndex + 1} / {recommendations.length}
                      </span>
                    )}
                  </div>

                  {/* 推荐内容 */}
                  {mounted && currentQuestion ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* 题目类型标签 */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md">
                            {getTypeConfig(currentQuestion.type, locale).label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-md ${
                            currentQuestion.difficulty === 1 ? 'bg-success/30' :
                            currentQuestion.difficulty === 2 ? 'bg-warning/30' : 'bg-error/30'
                          }`}>
                            {getDifficultyConfig(currentQuestion.difficulty, locale).label}
                          </span>
                          {currentQuestion.frequency >= 2 && (
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                              </svg>
                              {locale === 'zh' ? '高频' : 'Hot'}
                            </span>
                          )}
                        </div>

                        {/* 题目标题 */}
                        <h3 className="font-display text-xl md:text-2xl font-semibold mb-3 line-clamp-2">
                          {currentQuestion.title}
                        </h3>

                        {/* 推荐理由 */}
                        <p className="text-slate-200 text-sm mb-4 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {currentQuestion.reason}
                        </p>

                        {/* 预计时间 */}
                        <div className="flex items-center gap-4 mb-6 text-sm text-slate-100">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {locale === 'zh'
                              ? `预计 ${estimateTime(currentQuestion.difficulty)} 分钟`
                              : `~${estimateTime(currentQuestion.difficulty)} min`}
                          </span>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                          <Link href={`/questions/${currentQuestion.id}`} className="flex-1 sm:flex-initial">
                            <Button
                              className="w-full sm:w-auto bg-white text-accent hover:bg-white/90 rounded-full px-6 shadow-lg hover:shadow-xl transition-all h-11 sm:h-10"
                            >
                              {locale === 'zh' ? '立即练习' : 'Practice Now'}
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            onClick={handleChangeQuestion}
                            disabled={isChanging}
                            className="text-slate-100 hover:text-white hover:bg-slate-700/90 rounded-full h-11 sm:h-10"
                          >
                            <svg className={`w-4 h-4 mr-1 ${isChanging ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {locale === 'zh' ? '换一题' : 'Next'}
                          </Button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    /* 加载状态 */
                    <div className="animate-pulse">
                      <div className="h-4 bg-white/20 rounded w-1/4 mb-3" />
                      <div className="h-8 bg-white/20 rounded w-3/4 mb-4" />
                      <div className="h-4 bg-white/20 rounded w-1/2" />
                    </div>
                  )}
                </div>

              </div>
            </motion.div>

            {/* 浏览题库 - 占2列 */}
            <motion.div variants={itemVariants} className="md:col-span-2">
              <Link href="/questions" className="block h-full group">
                <div className="h-full bg-surface border border-border/50 hover:border-accent/40 rounded-xl p-5 sm:p-6 transition-all relative overflow-hidden">

                  <div className="relative z-10 h-full flex flex-col">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>

                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      {locale === 'zh' ? '浏览题库' : 'Browse All'}
                    </h3>
                    <p className="text-foreground-muted text-sm mb-4 flex-1">
                      {locale === 'zh'
                        ? `${questions.length}+ 道精选题目，按类型、难度筛选`
                        : `${questions.length}+ questions, filter by type & difficulty`}
                    </p>

                    <div className="flex items-center text-accent text-sm font-medium">
                      {locale === 'zh' ? '进入题库' : 'Browse'}
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========== 下半部分：模拟面试 ========== */}
      <section className="relative bg-[#FAFAFA] border-t border-border/50 py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground-muted mb-3">
              {locale === 'zh' ? '模拟面试' : 'Mock Interview'}
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">
              {locale === 'zh' ? '沉浸式面试体验' : 'Immersive Interview Experience'}
            </h2>
            <p className="text-foreground-muted text-base max-w-xl">
              {locale === 'zh'
                ? '完整流程 · 多题连贯 · AI 综合评估 · 20-30分钟'
                : 'Full flow · Multi-questions · AI assessment · 20-30 min'}
            </p>
          </motion.div>

          {/* 模拟面试卡片网格 */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-5 mb-10"
          >
            {/* 标准模拟 */}
            <motion.div variants={itemVariants}>
              <Link href="/practice/mock" className="block h-full group">
                <div className="h-full bg-white border border-border/50 hover:border-accent/40 rounded-xl p-5 sm:p-6 md:p-8 transition-all relative overflow-hidden">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="px-2.5 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
                      {locale === 'zh' ? '热门' : 'Popular'}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {locale === 'zh' ? '标准模拟' : 'Standard Mock'}
                  </h3>
                  <p className="text-sm text-foreground-muted mb-5">
                    {locale === 'zh'
                      ? '8道精选经典题，覆盖自我介绍、项目经历、技术、行为面试等全类型'
                      : '8 classic questions covering all interview types'}
                  </p>

                  <div className="space-y-2 mb-6">
                    {[
                      locale === 'zh' ? '通用题库，适合所有岗位' : 'General questions for all roles',
                      locale === 'zh' ? '完整面试流程模拟' : 'Full interview flow simulation',
                      locale === 'zh' ? '综合评分与详细反馈' : 'Comprehensive scoring & feedback'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground-muted">
                        <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ~20 {locale === 'zh' ? '分钟' : 'min'}
                    </span>
                    <span className="text-accent text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      {locale === 'zh' ? '开始准备' : 'Get Ready'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* AI 定制 */}
            <motion.div variants={itemVariants}>
              <Link href="/practice/ai-custom" className="block h-full group">
                <div className="h-full bg-white border border-border/50 hover:border-accent/40 rounded-xl p-6 md:p-8 transition-all relative overflow-hidden">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="px-2.5 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
                      AI
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {locale === 'zh' ? 'AI 定制模拟' : 'AI Custom Mock'}
                  </h3>
                  <p className="text-sm text-foreground-muted mb-5">
                    {locale === 'zh'
                      ? '上传简历和职位描述，AI 生成专属面试题目，精准匹配目标岗位'
                      : 'Upload resume & JD, AI generates tailored questions for your target role'}
                  </p>

                  <div className="space-y-2 mb-6">
                    {[
                      locale === 'zh' ? '基于真实 JD 定制' : 'Tailored to real job descriptions',
                      locale === 'zh' ? '针对简历内容深挖' : 'Deep dive into your resume',
                      locale === 'zh' ? '岗位匹配度分析' : 'Role compatibility analysis'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground-muted">
                        <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ~30 {locale === 'zh' ? '分钟' : 'min'}
                    </span>
                    <span className="text-accent text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      {locale === 'zh' ? '创建专属面试' : 'Create Custom'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          </motion.div>

          {/* 底部提示 */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <p className="text-foreground-muted text-sm">
              {locale === 'zh'
                ? '模拟面试会消耗更多精力，建议预留完整时间段'
                : 'Mock interviews require more energy, plan accordingly'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ========== 底部快捷入口 ========== */}
      <section className="bg-background border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <Link
              href="/favorites"
              className="flex items-center gap-2 text-foreground-muted hover:text-accent transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-surface group-hover:bg-accent/10 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium">
                  {locale === 'zh' ? '我的收藏' : 'Favorites'}
                </div>
                {mounted && favoriteCount > 0 && (
                  <div className="text-xs text-accent">{favoriteCount} {locale === 'zh' ? '道题' : 'questions'}</div>
                )}
              </div>
            </Link>

            <div className="hidden md:block w-px h-10 bg-border" />

            <Link
              href="/history"
              className="flex items-center gap-2 text-foreground-muted hover:text-accent transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-surface group-hover:bg-accent/10 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium">
                  {locale === 'zh' ? '练习记录' : 'History'}
                </div>
                <div className="text-xs text-foreground-muted">
                  {locale === 'zh' ? '查看进度' : 'View progress'}
                </div>
              </div>
            </Link>

            <div className="hidden md:block w-px h-10 bg-border" />

            <Link
              href="/achievements"
              className="flex items-center gap-2 text-foreground-muted hover:text-accent transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-surface group-hover:bg-accent/10 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium">
                  {locale === 'zh' ? '成就徽章' : 'Achievements'}
                </div>
                <div className="text-xs text-foreground-muted">
                  {locale === 'zh' ? '解锁成就' : 'Unlock badges'}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
