"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { generateMockInterviewQuestions, MockInterviewConfig } from "@/lib/question-generator";
import { createInterviewSessionAsync, InterviewQuestion } from "@/lib/interview-store";

export default function MockInterviewPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const [config, setConfig] = useState<MockInterviewConfig>({
    questionCount: 8,
    difficulty: 'mixed',
    category: 'GENERAL',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<ReturnType<typeof generateMockInterviewQuestions> | null>(null);

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
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    const questions = generateMockInterviewQuestions(config);
    setGeneratedQuestions(questions);
    setIsGenerating(false);
  };

  const startInterview = async () => {
    if (!generatedQuestions || generatedQuestions.length === 0) return;

    const interviewQuestions: InterviewQuestion[] = generatedQuestions.map((q, idx) => ({
      id: q.id,
      title: q.title,
      type: q.type as InterviewQuestion['type'],
      difficulty: q.difficulty as InterviewQuestion['difficulty'],
      keyPoints: q.keyPoints,
      order: idx,
    }));

    const categoryLabel = getCategoryName(config.category || 'GENERAL');

    const session = await createInterviewSessionAsync(
      locale === 'zh' ? `模拟面试 · ${categoryLabel}` : `Mock Interview · ${categoryLabel}`,
      '',
      undefined,
      interviewQuestions,
      { position: categoryLabel || undefined }
    );

    router.push(`/interview/${session.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm">{locale === 'zh' ? '返回' : 'Back'}</span>
          </Link>
          <h1 className="font-display text-display font-bold text-foreground tracking-tight">
            {locale === 'zh' ? '模拟面试' : 'Mock Interview'}
          </h1>
          <p className="text-body text-foreground-muted mt-2">
            {locale === 'zh' ? '智能组卷，模拟真实面试流程' : 'Smart question selection, simulating real interview flow'}
          </p>
        </div>

        {/* Content */}
        <div className="bg-surface rounded-3xl p-8 border border-border">
          {!generatedQuestions ? (
            <div className="space-y-6">
              {/* 岗位选择 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {locale === 'zh' ? '目标岗位' : 'Target Role'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['GENERAL', 'FRONTEND', 'BACKEND', 'PRODUCT', 'DESIGN', 'OPERATION'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setConfig({ ...config, category: cat })}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                        config.category === cat
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
                <label className="block text-sm font-medium text-foreground mb-3">
                  {locale === 'zh' ? '题目数量' : 'Question Count'}
                </label>
                <div className="flex gap-3">
                  {[5, 8, 10].map((count) => (
                    <button
                      key={count}
                      onClick={() => setConfig({ ...config, questionCount: count })}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                        config.questionCount === count
                          ? 'bg-accent text-white'
                          : 'bg-background border border-border hover:border-accent/30'
                      }`}
                    >
                      {count} {locale === 'zh' ? '题' : ''}
                      {count === 8 && (
                        <span className="ml-1 text-xs opacity-80">
                          {locale === 'zh' ? '(推荐)' : '(Rec)'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 难度选择 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {locale === 'zh' ? '难度设置' : 'Difficulty'}
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'mixed', label: locale === 'zh' ? '混合难度' : 'Mixed', rec: true },
                    { value: 'easy', label: locale === 'zh' ? '简单' : 'Easy', rec: false },
                    { value: 'medium', label: locale === 'zh' ? '中等' : 'Medium', rec: false },
                    { value: 'hard', label: locale === 'zh' ? '困难' : 'Hard', rec: false },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setConfig({ ...config, difficulty: opt.value as any })}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                        config.difficulty === opt.value
                          ? 'bg-accent text-white'
                          : 'bg-background border border-border hover:border-accent/30'
                      }`}
                    >
                      {opt.label}
                      {opt.rec && (
                        <span className="ml-1 text-xs opacity-80">
                          {locale === 'zh' ? '(推荐)' : '(Rec)'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 开始按钮 */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-8"
              >
                {isGenerating ? (
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
                    {locale === 'zh' ? '生成面试题目' : 'Generate Questions'}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 生成结果头部 */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-heading font-semibold text-foreground">
                    {locale === 'zh' ? '面试题目已生成' : 'Questions Generated'}
                  </h2>
                  <p className="text-sm text-foreground-muted mt-1">
                    {locale === 'zh' ? `共 ${generatedQuestions.length} 道题目，预计用时 ${generatedQuestions.length * 3} 分钟` : `${generatedQuestions.length} questions, ~${generatedQuestions.length * 3} mins`}
                  </p>
                </div>
                <button
                  onClick={() => setGeneratedQuestions(null)}
                  className="px-4 py-2 text-sm text-accent hover:bg-accent/10 rounded-lg transition-colors"
                >
                  {locale === 'zh' ? '重新配置' : 'Reconfigure'}
                </button>
              </div>

              {/* 题目预览 */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {generatedQuestions.map((q, index) => (
                  <div
                    key={q.id}
                    className="flex items-start gap-4 p-4 bg-background rounded-xl border border-border"
                  >
                    <span className="flex-shrink-0 w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center text-sm font-medium text-accent">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium">
                        {q.title}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-foreground-muted">{getTypeLabelZh(q.type)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
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

              {/* 开始面试按钮 */}
              <button
                onClick={startInterview}
                className="w-full py-4 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {locale === 'zh' ? '开始面试' : 'Start Interview'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
