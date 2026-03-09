"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { questions } from "@/data/questions";
import { getFavoriteCount } from "@/lib/favorites-store";
import { useLanguage } from "@/components/language-provider";
import { getPracticeRecordsSync } from "@/lib/practice-store";

function getRandomQuestionId() {
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex].id;
}

export default function PracticePage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [randomId, setRandomId] = useState("1");
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [recommendQuestion, setRecommendQuestion] = useState<{ id: string; title: string; reason: string } | null>(null);

  useEffect(() => {
    setRandomId(getRandomQuestionId());
    setMounted(true);
    setFavoriteCount(getFavoriteCount());

    // 获取推荐题目（基于练习记录中最薄弱的类型）
    const records = getPracticeRecordsSync();
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
        if (typeQuestions.length > 0) {
          const randomQ = typeQuestions[Math.floor(Math.random() * typeQuestions.length)];
          const typeNames: Record<string, string> = {
            INTRO: '自我介绍',
            PROJECT: '项目经历',
            TECHNICAL: '技术问题',
            BEHAVIORAL: '行为面试',
            HR: 'HR面试',
          };
          setRecommendQuestion({
            id: randomQ.id,
            title: randomQ.title,
            reason: locale === 'zh' ? `${typeNames[weakestType]} · 你的薄弱项` : `${weakestType} · Needs Practice`
          });
        }
      }
    }
  }, [locale]);

  const entryCards = [
    {
      id: 'recommend',
      href: recommendQuestion ? `/questions/${recommendQuestion.id}` : `/questions/${randomId}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: locale === 'zh' ? '智能推荐' : 'Smart Recommend',
      subtitle: recommendQuestion
        ? recommendQuestion.title
        : (locale === 'zh' ? '为你挑选最适合的题目' : 'Questions picked for you'),
      badge: locale === 'zh' ? '推荐' : 'Recommended',
      badgeColor: 'bg-accent text-white',
      bgColor: 'bg-accent',
      textColor: 'text-white',
      descColor: 'text-white/70',
    },
    {
      id: 'mock',
      href: '/practice/mock',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: locale === 'zh' ? '模拟面试' : 'Mock Interview',
      subtitle: locale === 'zh' ? '8道题完整流程，模拟真实面试' : '8 questions, full interview simulation',
      badge: locale === 'zh' ? '热门' : 'Popular',
      badgeColor: 'bg-accent/10 text-accent',
      bgColor: 'bg-surface',
      textColor: 'text-foreground',
      descColor: 'text-foreground-muted',
    },
    {
      id: 'ai',
      href: '/practice/ai-custom',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: locale === 'zh' ? 'AI 定制' : 'AI Custom',
      subtitle: locale === 'zh' ? '基于 JD 和简历生成专属题目' : 'Tailored questions from JD & resume',
      badge: 'AI',
      badgeColor: 'bg-accent/10 text-accent',
      bgColor: 'bg-surface',
      textColor: 'text-foreground',
      descColor: 'text-foreground-muted',
    },
    {
      id: 'browse',
      href: '/questions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      title: locale === 'zh' ? '浏览题库' : 'Browse Questions',
      subtitle: locale === 'zh' ? `${questions.length}+ 道精选题目，按类型筛选` : `${questions.length}+ questions, filter by type`,
      badge: null,
      badgeColor: '',
      bgColor: 'bg-surface',
      textColor: 'text-foreground',
      descColor: 'text-foreground-muted',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="font-display text-display font-bold text-foreground tracking-tight mb-3">
            {t.practice.title}
          </h1>
          <p className="text-body-lg text-foreground-muted">
            {locale === 'zh' ? `选择适合你的练习方式，开始提升面试能力` : `Choose your practice style and start improving`}
          </p>
        </div>

        {/* 4 Entry Cards - 2x2 Grid */}
        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {entryCards.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className={`group block ${card.id === 'recommend' ? 'md:col-span-2' : ''}`}
            >
              <div className={`h-full ${card.bgColor} rounded-3xl p-6 border ${card.id === 'recommend' ? 'border-transparent' : 'border-border hover:border-accent/30'} transition-all ${card.id === 'recommend' ? 'hover:shadow-glow' : 'hover:shadow-lg'}`}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${card.id === 'recommend' ? 'bg-white/20' : 'bg-accent/10'}`}>
                    <span className={card.id === 'recommend' ? 'text-white' : 'text-accent'}>
                      {card.icon}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className={`font-display text-heading font-semibold ${card.textColor}`}>
                        {card.title}
                      </h2>
                      {card.badge && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${card.badgeColor}`}>
                          {card.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${card.descColor} line-clamp-1`}>
                      {card.subtitle}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${card.id === 'recommend' ? 'bg-white/20' : 'bg-accent/10'} group-hover:scale-110 transition-transform`}>
                    <svg className={`w-4 h-4 ${card.id === 'recommend' ? 'text-white' : 'text-accent'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Access Bar */}
        <div className="flex items-center justify-center gap-6 py-6 border-t border-border">
          <Link href="/favorites" className="flex items-center gap-2 text-foreground-muted hover:text-accent transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-sm">
              {locale === 'zh' ? '我的收藏' : 'Favorites'}
              {mounted && favoriteCount > 0 && (
                <span className="ml-1 text-accent">({favoriteCount})</span>
              )}
            </span>
          </Link>

          <span className="text-border">|</span>

          <Link href="/history" className="flex items-center gap-2 text-foreground-muted hover:text-accent transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{locale === 'zh' ? '练习记录' : 'History'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
