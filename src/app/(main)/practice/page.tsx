"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { questions, Question } from "@/data/questions";
import { getFavoriteCount, getFavorites } from "@/lib/favorites-store";
import { useLanguage } from "@/components/language-provider";
import { getPracticeRecordsSync } from "@/lib/practice-store";
import { typeColorConfig, getTypeConfig, getDifficultyConfig } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/page-header";
import { Shuffle, Brain, Sparkles, Bookmark } from "lucide-react";

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
      <PageHeader
        title={locale === 'zh' ? '练习模式' : 'Practice Mode'}
        subtitle={locale === 'zh' ? '选择你的练习方式，AI 助手随时待命' : 'Choose your practice path. Our AI mentors are ready.'}
      />

      <div className="px-4 md:px-8 pb-6 md:pb-16 max-w-7xl mx-auto pt-4 md:pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6">

          {/* Card 1: 随机挑战 (7 cols) */}
          <div
            onClick={() => router.push(currentQuestion ? `/questions/${currentQuestion.id}` : "/questions")}
            className="lg:col-span-7 group cursor-pointer"
          >
            <div className="h-full bg-[#f6f3f2] p-5 md:p-8 rounded-xl transition-all duration-300 hover:bg-white hover:shadow-[0_20px_40px_rgba(28,27,27,0.06)] flex flex-col justify-between overflow-hidden relative border-b-2 border-transparent hover:border-[#004ac6]/20 min-h-[200px] md:min-h-[280px]">
              <div className="relative z-10">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#004ac6] mb-5 md:mb-8 group-hover:scale-110 transition-transform">
                  <Shuffle className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-display mb-2 md:mb-3 text-foreground">
                  {locale === 'zh' ? '随机挑战' : 'Ready for a Challenge?'}
                </h2>
                <p className="text-[#5f5e5e] leading-relaxed max-w-md text-sm md:text-base">
                  {locale === 'zh'
                    ? '从题库中随机挑选高质量面试题，参照行业标准，随时开练。'
                    : 'Let our AI select a top-tier question from our database based on global industry standards.'}
                </p>
              </div>
              <div className="mt-8 md:mt-12 flex items-center text-[#004ac6] font-bold text-sm tracking-wider uppercase gap-2">
                {locale === 'zh' ? '开始练习' : 'Start Practicing'}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Shuffle className="w-48 h-48" />
              </div>
            </div>
          </div>

          {/* Card 2: 完整模拟面试 (5 cols) */}
          <Link href="/practice/mock" className="lg:col-span-5 group cursor-pointer">
            <div className="h-full bg-[#f6f3f2] p-5 md:p-8 rounded-xl transition-all duration-300 hover:bg-white hover:shadow-[0_20px_40px_rgba(28,27,27,0.06)] flex flex-col justify-between border-b-2 border-transparent hover:border-[#004ac6]/20 min-h-[200px] md:min-h-[280px]">
              <div>
                <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#004ac6] mb-5 md:mb-8 group-hover:scale-110 transition-transform">
                  <Brain className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-display mb-2 md:mb-3 text-foreground">
                  {locale === 'zh' ? '完整模拟面试' : 'The Real Deal'}
                </h2>
                <p className="text-[#5f5e5e] leading-relaxed text-sm md:text-base">
                  {locale === 'zh'
                    ? '完整流程的多题连贯模拟，AI 实时反馈与综合评估。'
                    : 'Full-proctored, multi-question simulation with live AI feedback and performance analytics.'}
                </p>
              </div>
              <div className="mt-6 md:mt-8">
                <span className="inline-flex items-center px-4 py-2 bg-[#004ac6]/10 text-[#004ac6] rounded-full text-xs font-bold tracking-widest">
                  {locale === 'zh' ? '进入模拟' : 'ENTER SIMULATION'}
                </span>
              </div>
            </div>
          </Link>

          {/* Card 3: AI 自定义练习 (5 cols) */}
          <Link href="/practice/ai-custom" className="lg:col-span-5 group cursor-pointer">
            <div className="h-full bg-[#f6f3f2] p-5 md:p-8 rounded-xl transition-all duration-300 hover:bg-white hover:shadow-[0_20px_40px_rgba(28,27,27,0.06)] border-b-2 border-transparent hover:border-[#004ac6]/20 min-h-[180px] md:min-h-[240px]">
              <div className="flex justify-between items-start mb-5 md:mb-8">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#004ac6] group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5 md:w-7 md:h-7" />
                </div>
                <span className="bg-[#004ac6] text-white text-[10px] font-black px-3 py-1 rounded-full tracking-tighter">NEW</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold font-display mb-2 md:mb-3 text-foreground">
                {locale === 'zh' ? 'AI 自定义练习' : 'Targeted Prep'}
              </h2>
              <p className="text-[#5f5e5e] leading-relaxed text-sm md:text-base">
                {locale === 'zh'
                  ? '上传简历和 JD，AI 生成专属面试题，精准匹配目标岗位。'
                  : 'Upload your Resume and JD to generate industry-specific questions tailored to your profile.'}
              </p>
            </div>
          </Link>

          {/* Card 4: 针对薄弱项 (7 cols) */}
          <div
            onClick={() => {
              const favorites = getFavorites();
              if (favorites.length > 0) {
                const randomId = favorites[Math.floor(Math.random() * favorites.length)];
                router.push(`/questions/${randomId}`);
              } else {
                router.push("/favorites");
              }
            }}
            className="lg:col-span-7 group cursor-pointer"
          >
            <div className="h-full bg-[#f6f3f2] p-5 md:p-8 rounded-xl transition-all duration-300 hover:bg-white hover:shadow-[0_20px_40px_rgba(28,27,27,0.06)] flex items-center gap-5 md:gap-8 border-b-2 border-transparent hover:border-[#004ac6]/20 min-h-[140px] md:min-h-[240px]">
              <div className="shrink-0 w-14 h-14 md:w-20 md:h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#004ac6] group-hover:rotate-6 transition-transform">
                <Bookmark className="w-7 h-7 md:w-10 md:h-10" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold font-display mb-1 md:mb-2 text-foreground">
                  {locale === 'zh' ? '针对薄弱项' : 'Master Your Weaknesses'}
                </h2>
                <p className="text-[#5f5e5e] leading-relaxed text-sm md:text-base">
                  {locale === 'zh'
                    ? '基于历史数据识别薄弱题型，快速访问收藏题目进行专项练习。'
                    : 'Quick access to your saved and favorited questions for focused revision.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
