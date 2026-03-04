"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { questions, getQuestionsByType, getQuestionsByCategory } from "@/data/questions";
import { getFavoriteCount } from "@/lib/favorites-store";
import { useLanguage } from "@/components/language-provider";
import { generateInterviewQuestions, getGenerationTips, GeneratedQuestion, generateMockInterviewQuestions, MockInterviewConfig } from "@/lib/question-generator";
import { createInterviewSession, InterviewQuestion } from "@/lib/interview-store";

function getRandomQuestionId() {
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex].id;
}

// Type icons - unified style
const typeIcons: Record<string, React.ReactNode> = {
  INTRO: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  PROJECT: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  TECHNICAL: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  BEHAVIORAL: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  HR: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

// Category icons - unified style
const categoryIcons: Record<string, React.ReactNode> = {
  FRONTEND: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  BACKEND: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  ),
  PRODUCT: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  DESIGN: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  OPERATION: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  GENERAL: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

export default function PracticePage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [randomId, setRandomId] = useState("1");
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // AI Generate states
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [generationTips, setGenerationTips] = useState<string[]>([]);

  // Mock Interview states
  const [showMockInterview, setShowMockInterview] = useState(false);
  const [mockConfig, setMockConfig] = useState<MockInterviewConfig>({
    questionCount: 8,
    difficulty: 'mixed',
    category: 'GENERAL',
  });
  const [isGeneratingMock, setIsGeneratingMock] = useState(false);
  const [mockQuestions, setMockQuestions] = useState<GeneratedQuestion[] | null>(null);

  useEffect(() => {
    setRandomId(getRandomQuestionId());
    setMounted(true);
    setFavoriteCount(getFavoriteCount());
  }, []);

  const getTypeCount = (type: "INTRO" | "PROJECT" | "TECHNICAL" | "BEHAVIORAL" | "HR") => getQuestionsByType(type).length;
  const getCategoryCount = (category: "FRONTEND" | "BACKEND" | "PRODUCT" | "DESIGN" | "OPERATION" | "GENERAL") => getQuestionsByCategory(category).length;

  const getTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      INTRO: locale === 'zh' ? '自我介绍' : 'Intro',
      PROJECT: locale === 'zh' ? '项目经历' : 'Project',
      TECHNICAL: locale === 'zh' ? '技术问题' : 'Technical',
      BEHAVIORAL: locale === 'zh' ? '行为面试' : 'Behavioral',
      HR: locale === 'zh' ? 'HR 面试' : 'HR',
    };
    return typeMap[type] || type;
  };

  const getCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      FRONTEND: locale === 'zh' ? '前端' : 'Frontend',
      BACKEND: locale === 'zh' ? '后端' : 'Backend',
      PRODUCT: locale === 'zh' ? '产品' : 'Product',
      DESIGN: locale === 'zh' ? '设计' : 'Design',
      OPERATION: locale === 'zh' ? '运营' : 'Operation',
      GENERAL: locale === 'zh' ? '通用' : 'General',
    };
    return categoryMap[category] || category;
  };

  const getTypeLabelZh = (type: string) => {
    const typeMap: Record<string, string> = {
      INTRO: '自我介绍',
      PROJECT: '项目经历',
      TECHNICAL: '技术问题',
      BEHAVIORAL: '行为面试',
      HR: 'HR面试',
    };
    return typeMap[type] || type;
  };

  const getDifficultyLabelZh = (difficulty: string) => {
    const difficultyMap: Record<string, string> = {
      easy: '简单',
      medium: '中等',
      hard: '困难',
    };
    return difficultyMap[difficulty] || difficulty;
  };

  const handleGenerate = async () => {
    if (!jdText.trim()) return;
    setIsGenerating(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    const generated = generateInterviewQuestions({
      jdText,
      resumeText: resumeText || undefined,
      questionCount: 5
    });

    const tips = getGenerationTips(jdText, resumeText || undefined);

    setGeneratedQuestions(generated);
    setGenerationTips(tips);
    setIsGenerating(false);
  };

  // 开始单题练习
  const startGeneratedPractice = (questionId: string) => {
    if (generatedQuestions) {
      sessionStorage.setItem('ai-generated-questions', JSON.stringify(generatedQuestions));
      router.push(`/practice/ai/${questionId}`);
    }
  };

  // 开始整套面试
  const startFullInterview = () => {
    if (!generatedQuestions || generatedQuestions.length === 0) return;

    // 提取公司和岗位信息
    const companyMatch = jdText.match(/(?:公司|单位)[：:]?\s*([^\n，。]+)/);
    const positionMatch = jdText.match(/(?:职位|岗位)[：:]?\s*([^\n]+)/);

    const interviewQuestions: InterviewQuestion[] = generatedQuestions.map((q, idx) => ({
      id: q.id,
      title: q.title,
      type: q.type as InterviewQuestion['type'],
      difficulty: q.difficulty as InterviewQuestion['difficulty'],
      keyPoints: q.keyPoints,
      order: idx,
    }));

    const session = createInterviewSession(
      positionMatch ? `${positionMatch[1].trim()}面试` : '模拟面试',
      jdText,
      resumeText || undefined,
      interviewQuestions,
      {
        company: companyMatch?.[1]?.trim(),
        position: positionMatch?.[1]?.trim(),
      }
    );

    router.push(`/interview/${session.id}`);
  };

  // 开始模拟面试
  const handleStartMockInterview = async () => {
    setIsGeneratingMock(true);

    // 模拟加载动画
    await new Promise(resolve => setTimeout(resolve, 600));

    const questions = generateMockInterviewQuestions(mockConfig);
    setMockQuestions(questions);
    setIsGeneratingMock(false);
  };

  // 开始模拟面试整套流程
  const startMockFullInterview = () => {
    if (!mockQuestions || mockQuestions.length === 0) return;

    const interviewQuestions: InterviewQuestion[] = mockQuestions.map((q, idx) => ({
      id: q.id,
      title: q.title,
      type: q.type as InterviewQuestion['type'],
      difficulty: q.difficulty as InterviewQuestion['difficulty'],
      keyPoints: q.keyPoints,
      order: idx,
    }));

    const categoryLabel = mockConfig.category
      ? getCategoryName(mockConfig.category)
      : '';

    const session = createInterviewSession(
      locale === 'zh' ? `模拟面试 ${categoryLabel}` : `Mock Interview ${categoryLabel}`,
      '',
      undefined,
      interviewQuestions,
      {
        position: categoryLabel || undefined,
      }
    );

    router.push(`/interview/${session.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="font-display text-display font-bold text-foreground tracking-tight mb-3">
            {t.practice.title}
          </h1>
          <p className="text-body-lg text-foreground-muted">
            {t.practice.subtitle.replace('{count}', String(questions.length))}
          </p>
        </div>

        {/* Single Practice - Random */}
        <div className="mb-6">
          <Link href={`/questions/${randomId}`} className="group block">
            <div className="h-full bg-accent rounded-3xl p-8 text-white hover:shadow-glow transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="px-3 py-1 bg-white/20 text-white text-xs font-medium rounded-full">
                  {locale === 'zh' ? '推荐' : 'Recommended'}
                </span>
              </div>
              <h2 className="font-display text-heading-xl font-semibold text-white mb-2">
                {locale === 'zh' ? '快速练习' : 'Quick Practice'}
              </h2>
              <p className="text-white/70 mb-6">
                {locale === 'zh' ? '利用碎片时间随机练一题，保持答题手感' : 'Practice a random question in your spare time'}
              </p>
              <div className="flex items-center gap-2 text-white font-medium">
                <span>{t.practice.random.button}</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Interview Room - Mock & AI Generate */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Mock Interview */}
          <div className="h-full">
            {!showMockInterview ? (
              <button
                onClick={() => setShowMockInterview(true)}
                className="w-full h-full text-left group"
              >
                <div className="h-full bg-surface rounded-3xl p-8 border border-border hover:border-accent/30 transition-all">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
                      {locale === 'zh' ? '热门' : 'Popular'}
                    </span>
                  </div>
                  <h2 className="font-display text-heading-xl font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                    {locale === 'zh' ? '模拟面试' : 'Mock Interview'}
                  </h2>
                  <p className="text-foreground-muted mb-6">
                    {locale === 'zh' ? '系统智能组卷，8道题完整流程，模拟真实面试节奏' : '8 questions with full process, simulating real interview pace'}
                  </p>
                  <div className="flex items-center gap-2 text-accent font-medium">
                    <span>{locale === 'zh' ? '开始模拟' : 'Start Mock'}</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ) : (
              <div className="h-full bg-surface rounded-3xl p-8 border border-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h2 className="font-display text-heading font-semibold">
                      {locale === 'zh' ? '模拟面试' : 'Mock Interview'}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowMockInterview(false);
                      setMockQuestions(null);
                      setMockConfig({ questionCount: 8, difficulty: 'mixed', category: null });
                    }}
                    className="p-2 hover:bg-accent/10 rounded-xl transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {!mockQuestions ? (
                  <div className="space-y-4">
                    {/* 岗位选择 */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {locale === 'zh' ? '目标岗位' : 'Target Role'}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['GENERAL', 'FRONTEND', 'BACKEND', 'PRODUCT', 'DESIGN'] as const).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setMockConfig({ ...mockConfig, category: cat })}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              mockConfig.category === cat
                                ? 'bg-accent text-white'
                                : 'bg-background border border-border hover:border-accent/30'
                            }`}
                          >
                            {getCategoryName(cat)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 题目数量 */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {locale === 'zh' ? '题目数量' : 'Question Count'}
                      </label>
                      <div className="flex gap-2">
                        {[5, 8, 10].map((count) => (
                          <button
                            key={count}
                            onClick={() => setMockConfig({ ...mockConfig, questionCount: count })}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                              mockConfig.questionCount === count
                                ? 'bg-accent text-white'
                                : 'bg-background border border-border hover:border-accent/30'
                            }`}
                          >
                            {count} {locale === 'zh' ? '题' : ''}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 难度选择 */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {locale === 'zh' ? '难度设置' : 'Difficulty'}
                      </label>
                      <select
                        value={mockConfig.difficulty}
                        onChange={(e) => setMockConfig({ ...mockConfig, difficulty: e.target.value as any })}
                        className="w-full py-2 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
                      >
                        <option value="mixed">{locale === 'zh' ? '混合难度（推荐）' : 'Mixed (Recommended)'}</option>
                        <option value="easy">{locale === 'zh' ? '简单' : 'Easy'}</option>
                        <option value="medium">{locale === 'zh' ? '中等' : 'Medium'}</option>
                        <option value="hard">{locale === 'zh' ? '困难' : 'Hard'}</option>
                      </select>
                    </div>

                    <button
                      onClick={handleStartMockInterview}
                      disabled={isGeneratingMock}
                      className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isGeneratingMock ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          {locale === 'zh' ? '组卷中...' : 'Preparing...'}
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {locale === 'zh' ? '开始模拟面试' : 'Start Mock Interview'}
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Generated Questions Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {locale === 'zh' ? `已生成 ${mockQuestions.length} 道题目` : `${mockQuestions.length} Questions Generated`}
                      </span>
                      <button
                        onClick={() => setMockQuestions(null)}
                        className="text-sm text-accent hover:text-accent-dark transition-colors"
                      >
                        {locale === 'zh' ? '重新组卷' : 'Regenerate'}
                      </button>
                    </div>

                    {/* Questions Preview */}
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {mockQuestions.map((q, index) => (
                        <div
                          key={q.id}
                          className="flex items-start gap-3 p-2 bg-background rounded-lg"
                        >
                          <span className="flex-shrink-0 w-5 h-5 bg-accent/10 rounded flex items-center justify-center text-xs font-medium text-accent">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">
                              {q.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-foreground-muted">{getTypeLabelZh(q.type)}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {getDifficultyLabelZh(q.difficulty)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Start Button */}
                    <button
                      onClick={startMockFullInterview}
                      className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {locale === 'zh' ? '进入面试' : 'Start Interview'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Generate */}
          <div className="h-full">
            {!showAIGenerate ? (
              <button
                onClick={() => setShowAIGenerate(true)}
                className="w-full h-full text-left group"
              >
                <div className="h-full bg-surface rounded-3xl p-8 border border-border hover:border-accent/30 transition-all">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
                      {t.practice.aiGenerate.badge}
                    </span>
                  </div>
                  <h2 className="font-display text-heading-xl font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                    {locale === 'zh' ? 'AI定制面试' : 'AI Custom Interview'}
                  </h2>
                  <p className="text-foreground-muted mb-6">
                    {locale === 'zh' ? '基于目标岗位JD和简历，生成针对性题目' : 'Generate tailored questions based on JD and resume'}
                  </p>
                  <div className="flex items-center gap-2 text-accent font-medium">
                    <span>{locale === 'zh' ? '定制题目' : 'Customize'}</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ) : (
              <div className="h-full bg-surface rounded-3xl p-8 border border-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h2 className="font-display text-heading font-semibold">
                      {t.practice.aiGenerate.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowAIGenerate(false);
                      setGeneratedQuestions(null);
                      setGenerationTips([]);
                      setJdText('');
                      setResumeText('');
                    }}
                    className="p-2 hover:bg-accent/10 rounded-xl transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {!generatedQuestions ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t.practice.aiGenerate.jdLabel}
                        <span className="text-accent ml-1">*</span>
                      </label>
                      <textarea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        placeholder={t.practice.aiGenerate.jdPlaceholder}
                        className="w-full h-28 px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:border-accent resize-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t.practice.aiGenerate.resumeLabel}
                        <span className="text-foreground-muted ml-1">({t.practice.aiGenerate.optional})</span>
                      </label>
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder={t.practice.aiGenerate.resumePlaceholder}
                        className="w-full h-28 px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:border-accent resize-none transition-colors"
                      />
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={!jdText.trim() || isGenerating}
                      className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          {t.practice.aiGenerate.generating}
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {t.practice.aiGenerate.generateButton}
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Generated Questions Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t.practice.aiGenerate.generatedTitle}</span>
                      <button
                        onClick={() => setGeneratedQuestions(null)}
                        className="text-sm text-accent hover:text-accent-dark transition-colors"
                      >
                        {t.practice.aiGenerate.regenerate}
                      </button>
                    </div>

                    {/* Tips */}
                    {generationTips.length > 0 && (
                      <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl">
                        <ul className="space-y-1">
                          {generationTips.map((tip, idx) => (
                            <li key={idx} className="text-xs text-foreground-muted flex items-start gap-2">
                              <span className="text-accent">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Questions Preview */}
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {generatedQuestions.map((q, index) => (
                        <div
                          key={q.id}
                          className="flex items-start gap-3 p-2 bg-background rounded-lg"
                        >
                          <span className="flex-shrink-0 w-5 h-5 bg-accent/10 rounded flex items-center justify-center text-xs font-medium text-accent">
                            {index + 1}
                          </span>
                          <p className="text-sm text-foreground truncate flex-1">
                            {q.title}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={startFullInterview}
                        className="py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {locale === 'zh' ? '开始面试' : 'Start Interview'}
                      </button>
                      <button
                        onClick={() => startGeneratedPractice(generatedQuestions[0].id)}
                        className="py-3 bg-surface border border-border text-foreground rounded-xl font-medium hover:bg-accent/5 hover:border-accent/30 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {locale === 'zh' ? '单题练习' : 'Practice Single'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Practice by Type */}
        <div className="mb-12">
          <h3 className="font-display text-heading-lg font-semibold text-foreground mb-6">
            {t.practice.byType.title}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {(['INTRO', 'PROJECT', 'TECHNICAL', 'BEHAVIORAL', 'HR'] as const).map((type) => (
              <Link
                key={type}
                href={`/questions?type=${type}`}
                className="group flex flex-col items-center p-5 rounded-2xl bg-surface border border-border hover:border-accent/30 transition-all"
              >
                <span className="text-accent mb-3">
                  {typeIcons[type]}
                </span>
                <span className="text-sm font-medium text-foreground text-center">{getTypeName(type)}</span>
                <span className="text-xs text-foreground-muted mt-1">{getTypeCount(type)} {locale === 'zh' ? '题' : ''}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Practice by Category */}
        <div className="mb-12">
          <h3 className="font-display text-heading-lg font-semibold text-foreground mb-6">
            {t.practice.byRole.title}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {(['FRONTEND', 'BACKEND', 'PRODUCT', 'DESIGN', 'OPERATION', 'GENERAL'] as const).map((category) => (
              <Link
                key={category}
                href={`/questions?category=${category}`}
                className="group flex flex-col items-center p-4 rounded-2xl bg-surface border border-border hover:border-accent/30 transition-all"
              >
                <span className="text-accent mb-2">
                  {categoryIcons[category]}
                </span>
                <span className="text-sm font-medium text-foreground text-center">{getCategoryName(category)}</span>
                <span className="text-xs text-foreground-muted mt-1">{getCategoryCount(category)}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links - Favorites highlighted with blue theme */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Favorites - Blue theme highlight */}
          <Link href="/favorites" className="group flex items-center gap-4 p-5 bg-accent rounded-2xl text-white hover:shadow-glow transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="font-medium block">{t.practice.saved.title}</span>
              <span className="text-sm text-white/70">{mounted && favoriteCount > 0 ? `${favoriteCount} ${locale === 'zh' ? '道收藏' : 'saved'}` : t.practice.saved.desc}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </Link>

          {/* Browse Questions */}
          <Link href="/questions" className="group flex items-center gap-4 p-5 bg-surface rounded-2xl border border-border hover:border-accent/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="font-medium text-foreground block">{t.practice.browse.title}</span>
              <span className="text-sm text-foreground-muted">{t.practice.browse.count.replace('{count}', String(questions.length))}</span>
            </div>
            <svg className="w-5 h-5 text-foreground-muted group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* History */}
          <Link href="/history" className="group flex items-center gap-4 p-5 bg-surface rounded-2xl border border-border hover:border-accent/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="font-medium text-foreground block">{t.practice.history.title}</span>
              <span className="text-sm text-foreground-muted">{t.practice.history.desc}</span>
            </div>
            <svg className="w-5 h-5 text-foreground-muted group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
