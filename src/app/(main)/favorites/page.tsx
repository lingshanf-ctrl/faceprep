"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getFavorites, removeFavorite } from "@/lib/favorites-store";
import { getQuestionById } from "@/data/questions";
import { getPracticeRecords, PracticeRecord } from "@/lib/practice-store";
import { useLanguage } from "@/components/language-provider";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

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
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="mb-16">
          <h1 className="font-display text-display-sm font-bold text-foreground tracking-tight mb-4">
            {t.favorites.title}
          </h1>
          <p className="text-body-lg text-foreground-muted">
            {favoriteQuestions.length > 0
              ? t.favorites.count.replace('{count}', String(favoriteQuestions.length))
              : t.favorites.empty.desc}
          </p>
        </div>

        {favoriteQuestions.length === 0 ? (
          /* Empty state */
          <EmptyState
            icon="⭐"
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
                className="block bg-accent rounded-2xl p-8 text-white group hover:shadow-glow transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-display text-heading font-semibold mb-1">{t.favorites.review.title}</h3>
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
                    className="block bg-surface rounded-2xl p-6 hover:bg-accent/5 border border-border hover:border-accent/10 transition-all group"
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
                          className="p-2 text-foreground-muted hover:text-accent hover:bg-accent/10 rounded-xl transition-colors"
                          title={locale === 'zh' ? '取消收藏' : 'Remove from saved'}
                        >
                          <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
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
