"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { getFavorites, removeFavorite } from "@/lib/favorites-store";
import { getQuestionById } from "@/data/questions";
import { getPracticeRecords, PracticeRecord } from "@/lib/practice-store";
import { useLanguage } from "@/components/language-provider";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";

// Type config - language specific
const getTypeConfig = (locale: string): Record<string, { label: string }> => ({
  INTRO: { label: locale === 'zh' ? '自我介绍' : 'Intro' },
  PROJECT: { label: locale === 'zh' ? '项目经历' : 'Project' },
  TECHNICAL: { label: locale === 'zh' ? '技术问题' : 'Technical' },
  BEHAVIORAL: { label: locale === 'zh' ? '行为面试' : 'Behavioral' },
  HR: { label: locale === 'zh' ? 'HR 面试' : 'HR' },
});

// Frequency labels - language specific
const getFrequencyLabels = (locale: string): string[] =>
  locale === 'zh' ? ['低', '中', '高'] : ['Low', 'Medium', 'High'];

export default function FavoritesPage() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([]);
  const [mounted, setMounted] = useState(false);
  const { locale, t } = useLanguage();

  // Get language-specific configs
  const typeConfig = useMemo(() => getTypeConfig(locale), [locale]);
  const frequencyLabels = useMemo(() => getFrequencyLabels(locale), [locale]);

  useEffect(() => {
    setMounted(true);
    setFavoriteIds(getFavorites());
    // 异步加载练习记录
    getPracticeRecords().then(records => setPracticeRecords(records));
  }, []);

  // Get favorite questions
  const favoriteQuestions = useMemo(() => {
    return favoriteIds
      .map((id) => getQuestionById(id))
      .filter(Boolean);
  }, [favoriteIds]);

  // 获取题目的练习记录（从已加载的记录中筛选）
  const getRecordsForQuestion = (questionId: string) => {
    return practiceRecords.filter(r => r.questionId === questionId);
  };

  // Remove favorite
  const handleRemoveFavorite = (questionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeFavorite(questionId);
    setFavoriteIds(getFavorites());
  };

  // Get random favorite ID
  const getRandomFavoriteId = () => {
    if (favoriteIds.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * favoriteIds.length);
    return favoriteIds[randomIndex];
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState variant="skeleton" fullScreen message={t.favorites.loading || "Loading..."} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={t.favorites.title}
        subtitle={favoriteQuestions.length > 0
          ? t.favorites.count.replace('{count}', String(favoriteQuestions.length))
          : t.favorites.empty.desc}
      />
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8">

        {favoriteQuestions.length === 0 ? (
          /* Empty state */
          <EmptyState
            icon="🔖"
            title={t.favorites.empty.title}
            description={t.favorites.empty.desc}
            action={{
              label: t.favorites.empty.button,
              href: "/questions"
            }}
          />
        ) : (
          <>
            {/* Quick start */}
            <div className="mb-10">
              <Link
                href={`/questions/${getRandomFavoriteId()}`}
                className="block rounded-xl p-8 text-white group hover:opacity-90 transition-all bg-[#004ac6]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Bookmark className="w-7 h-7 text-white" fill="white" strokeWidth={0} />
                    </div>
                    <div>
                      <h3 className="font-display text-heading font-semibold mb-1 text-white">{t.favorites.review.title}</h3>
                      <p className="text-white/70">{t.favorites.review.desc}</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            </div>

            {/* Favorites list */}
            <div className="space-y-3">
              {favoriteQuestions.map((question) => {
                if (!question) return null;
                const records = getRecordsForQuestion(question.id);
                const highestScore = records.length > 0 ? Math.max(...records.map((r) => r.score)) : null;

                return (
                  <Link
                    key={question.id}
                    href={`/questions/${question.id}`}
                    className="block bg-[#f6f3f2] rounded-xl p-6 hover:bg-white hover:shadow-[0_20px_40px_rgba(28,27,27,0.06)] transition-all group"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        {/* Tags */}
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent/5 text-accent">
                            {typeConfig[question.type]?.label}
                          </span>
                          <span className="text-xs text-foreground-muted uppercase tracking-wider">
                            {frequencyLabels[question.frequency - 1]}
                          </span>
                          {records.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-success font-medium">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {t.favorites.practiced.replace('{count}', String(records.length))}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-display text-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                          {question.title}
                        </h3>

                        {/* Key points */}
                        <p className="text-foreground-muted text-small line-clamp-1">
                          {question.keyPoints}
                        </p>
                      </div>

                      {/* Right side */}
                      <div className="shrink-0 flex flex-col items-end gap-3">
                        {/* Remove favorite button */}
                        <button
                          onClick={(e) => handleRemoveFavorite(question.id, e)}
                          className="transition-colors text-[#004ac6] hover:text-[#c3c6d7]"
                          title={locale === 'zh' ? '取消收藏' : 'Remove from saved'}
                        >
                          <Bookmark className="w-[18px] h-[18px]" fill="currentColor" strokeWidth={0} />
                        </button>

                        {/* Highest score */}
                        {highestScore && (
                          <span
                            className={`font-display text-heading-xl font-bold ${
                              highestScore >= 80
                                ? "text-success"
                                : highestScore >= 60
                                ? "text-warning"
                                : "text-error"
                            }`}
                          >
                            {highestScore}
                          </span>
                        )}

                        {/* Arrow */}
                        <svg className="w-5 h-5 text-foreground-muted group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
