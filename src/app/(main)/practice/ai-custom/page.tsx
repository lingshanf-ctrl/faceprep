"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { generateInterviewQuestions, GeneratedQuestion, getGenerationTips } from "@/lib/question-generator";
import { createInterviewSessionAsync, InterviewQuestion } from "@/lib/interview-store";

export default function AICustomPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [generationTips, setGenerationTips] = useState<string[]>([]);
  const [generationMode, setGenerationMode] = useState<"ai" | "rule">("ai");
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!jdText.trim()) return;
    setIsGenerating(true);
    setError(null);
    setIsFallback(false);

    try {
      // 调用后端 API 生成题目
      const response = await fetch("/api/interview/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jdText,
          resumeText,
          questionCount: 5,
          mode: generationMode,
          fallback: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "生成失败");
      }

      const data = await response.json();
      setGeneratedQuestions(data.questions);
      setGenerationTips(data.tips);
      setIsFallback(data.isFallback);
    } catch (err) {
      console.error("生成题目失败:", err);
      setError(err instanceof Error ? err.message : "生成失败，请重试");

      // 如果 API 失败，降级到本地规则引擎
      const generated = generateInterviewQuestions({
        jdText,
        resumeText: resumeText || undefined,
        questionCount: 5
      });
      const tips = getGenerationTips(jdText, resumeText || undefined);
      setGeneratedQuestions(generated);
      setGenerationTips(tips);
    } finally {
      setIsGenerating(false);
    }
  };

  // 开始单题练习
  const startSinglePractice = (questionId: string) => {
    if (generatedQuestions) {
      sessionStorage.setItem('ai-generated-questions', JSON.stringify(generatedQuestions));
      router.push(`/practice/ai/${questionId}`);
    }
  };

  // 开始整套面试
  const startFullInterview = async () => {
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

    const session = await createInterviewSessionAsync(
      positionMatch ? `${positionMatch[1].trim()}面试` : 'AI定制面试',
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
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
            {locale === 'zh' ? 'AI 定制面试' : 'AI Custom Interview'}
          </h1>
          <p className="text-body text-foreground-muted mt-2">
            {locale === 'zh' ? '基于岗位 JD 和简历，生成针对性面试题目' : 'Generate tailored questions based on job description and resume'}
          </p>
        </div>

        {/* Content */}
        <div className="bg-surface rounded-3xl p-8 border border-border">
          {!generatedQuestions ? (
            <div className="space-y-6">
              {/* 生成模式选择 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {locale === 'zh' ? '生成模式' : 'Generation Mode'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setGenerationMode('ai')}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                      generationMode === 'ai'
                        ? 'border-accent bg-accent/5 text-accent'
                        : 'border-border hover:border-accent/30'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {locale === 'zh' ? 'AI 智能生成' : 'AI Generate'}
                    </div>
                    <p className="text-xs text-foreground-muted mt-1 font-normal">
                      {locale === 'zh' ? '更精准、更个性化' : 'More precise & personalized'}
                    </p>
                  </button>
                  <button
                    onClick={() => setGenerationMode('rule')}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                      generationMode === 'rule'
                        ? 'border-accent bg-accent/5 text-accent'
                        : 'border-border hover:border-accent/30'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {locale === 'zh' ? '规则引擎' : 'Rule Engine'}
                    </div>
                    <p className="text-xs text-foreground-muted mt-1 font-normal">
                      {locale === 'zh' ? '更快速、更稳定' : 'Faster & more stable'}
                    </p>
                  </button>
                </div>
              </div>

              {/* JD 输入 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {locale === 'zh' ? '岗位描述 (JD)' : 'Job Description'}
                  <span className="text-accent ml-1">*</span>
                </label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder={locale === 'zh' ? '粘贴目标岗位的 JD 内容，AI 将基于岗位要求生成相关题目...' : 'Paste the job description here...'}
                  className="w-full h-40 px-4 py-4 bg-background border border-border rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:border-accent resize-none transition-colors"
                />
                <p className="text-xs text-foreground-muted mt-2">
                  {locale === 'zh' ? '提示：包含岗位职责、技能要求等信息可获得更精准的结果' : 'Tip: Include role responsibilities and skill requirements for better results'}
                </p>
              </div>

              {/* 简历输入 (可选) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {locale === 'zh' ? '个人简历' : 'Your Resume'}
                  <span className="text-foreground-muted ml-1">({locale === 'zh' ? '可选' : 'Optional'})</span>
                </label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder={locale === 'zh' ? '粘贴你的简历内容，AI 将结合你的经历生成更匹配的题目...' : 'Paste your resume for more personalized questions...'}
                  className="w-full h-32 px-4 py-4 bg-background border border-border rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:border-accent resize-none transition-colors"
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* 生成按钮 */}
              <button
                onClick={handleGenerate}
                disabled={!jdText.trim() || isGenerating}
                className="w-full py-4 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-8"
              >
                {isGenerating ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {locale === 'zh' ? (generationMode === 'ai' ? 'AI 生成中...' : '生成中...') : 'Generating...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {generationMode === 'ai'
                      ? (locale === 'zh' ? 'AI 生成定制题目' : 'AI Generate Questions')
                      : (locale === 'zh' ? '规则引擎生成' : 'Generate with Rules')
                    }
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
                    {locale === 'zh' ? '定制题目已生成' : 'Custom Questions Generated'}
                  </h2>
                  <p className="text-sm text-foreground-muted mt-1">
                    {locale === 'zh' ? `共 ${generatedQuestions.length} 道针对性题目` : `${generatedQuestions.length} tailored questions`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGeneratedQuestions(null);
                    setGenerationTips([]);
                    setError(null);
                    setIsFallback(false);
                  }}
                  className="px-4 py-2 text-sm text-accent hover:bg-accent/10 rounded-lg transition-colors"
                >
                  {locale === 'zh' ? '重新生成' : 'Regenerate'}
                </button>
              </div>

              {/* 降级提示 */}
              {isFallback && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">
                        {locale === 'zh' ? 'AI 服务暂时不可用，已自动切换到规则引擎' : 'AI service unavailable, switched to rule engine'}
                      </h3>
                      <p className="text-xs text-yellow-700 mt-1">
                        {locale === 'zh' ? '题目由规则引擎生成，仍具有针对性' : 'Questions are still generated by rule engine with relevance'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 生成建议 */}
              {generationTips.length > 0 && (
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
                  <h3 className="text-sm font-medium text-accent mb-2">
                    {locale === 'zh' ? '💡 答题建议' : '💡 Tips'}
                  </h3>
                  <ul className="space-y-1">
                    {generationTips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-foreground-muted flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 题目预览 */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {generatedQuestions.map((q, index) => (
                  <div
                    key={q.id}
                    className="flex items-start gap-4 p-4 bg-background rounded-xl border border-border"
                  >
                    <span className="flex-shrink-0 w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center text-sm font-medium text-accent">
                      {index + 1}
                    </span>
                    <p className="text-foreground font-medium flex-1">
                      {q.title}
                    </p>
                  </div>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={startFullInterview}
                  className="py-4 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {locale === 'zh' ? '开始整套面试' : 'Start Full Interview'}
                </button>
                <button
                  onClick={() => startSinglePractice(generatedQuestions[0].id)}
                  className="py-4 bg-surface border border-border text-foreground rounded-xl font-medium hover:bg-accent/5 hover:border-accent/30 transition-all flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
}
