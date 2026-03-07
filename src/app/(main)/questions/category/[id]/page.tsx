"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { questions as systemQuestions } from "@/data/questions";
import { getPracticeRecords, PracticeRecord } from "@/lib/practice-store";
import { useLanguage } from "@/components/language-provider";
import { categoryGroups, subCategoryMap } from "@/components/category-card";
import {
  ArrowLeft,
  BookOpen,
  Filter,
  Search,
  X,
  ChevronRight,
  Award,
  Play,
} from "lucide-react";

// 题型配置
const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  INTRO: { label: "自我介绍", color: "text-blue-600", bg: "bg-blue-50" },
  PROJECT: { label: "项目经历", color: "text-purple-600", bg: "bg-purple-50" },
  TECHNICAL: { label: "技术问题", color: "text-emerald-600", bg: "bg-emerald-50" },
  BEHAVIORAL: { label: "行为面试", color: "text-orange-600", bg: "bg-orange-50" },
  HR: { label: "HR面试", color: "text-pink-600", bg: "bg-pink-50" },
};

// 难度配置
const difficultyConfig: Record<number, { label: string; color: string }> = {
  1: { label: "简单", color: "text-green-600" },
  2: { label: "中等", color: "text-amber-600" },
  3: { label: "困难", color: "text-red-600" },
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLanguage();
  const categoryId = params.id as string;

  const [practiceStatus, setPracticeStatus] = useState<
    Record<string, { practiced: boolean; highestScore: number; count: number }>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);

  // 获取当前分类配置
  const categoryConfig = categoryGroups.find((g) => g.id === categoryId);

  // 获取该分类下的题目
  const categoryQuestions = useMemo(() => {
    if (!categoryConfig) return [];
    return systemQuestions.filter((q) =>
      categoryConfig.categories.includes(q.category)
    );
  }, [categoryConfig]);

  // 加载练习记录
  useEffect(() => {
    async function loadData() {
      const records = await getPracticeRecords();
      const status: Record<
        string,
        { practiced: boolean; highestScore: number; count: number }
      > = {};

      const questionRecords = new Map<string, PracticeRecord[]>();
      records.forEach((r) => {
        const existing = questionRecords.get(r.questionId) || [];
        existing.push(r);
        questionRecords.set(r.questionId, existing);
      });

      questionRecords.forEach((recs, qid) => {
        if (recs.length > 0) {
          const highestScore = Math.max(...recs.map((r) => r.score));
          status[qid] = { practiced: true, highestScore, count: recs.length };
        }
      });

      setPracticeStatus(status);
    }

    loadData();
  }, []);

  // 筛选后的题目
  const filteredQuestions = useMemo(() => {
    return categoryQuestions.filter((q) => {
      if (selectedType && q.type !== selectedType) return false;
      if (selectedDifficulty && q.difficulty !== selectedDifficulty) return false;
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        return (
          q.title.toLowerCase().includes(searchLower) ||
          q.keyPoints.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [categoryQuestions, selectedType, selectedDifficulty, searchQuery]);

  // 统计
  const stats = useMemo(() => {
    const practicedCount = categoryQuestions.filter(
      (q) => practiceStatus[q.id]?.practiced
    ).length;
    const scores = categoryQuestions
      .filter((q) => practiceStatus[q.id]?.practiced)
      .map((q) => practiceStatus[q.id]?.highestScore || 0);
    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    return {
      total: categoryQuestions.length,
      practiced: practicedCount,
      progress:
        categoryQuestions.length > 0
          ? Math.round((practicedCount / categoryQuestions.length) * 100)
          : 0,
      averageScore,
    };
  }, [categoryQuestions, practiceStatus]);

  if (!categoryConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-surface/30 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {locale === "zh" ? "分类不存在" : "Category not found"}
          </h1>
          <Link
            href="/questions"
            className="text-accent hover:underline"
          >
            {locale === "zh" ? "返回题库" : "Back to questions"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* 面包屑导航 */}
        <div className="mb-6">
          <Link
            href="/questions"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {locale === "zh" ? "返回题库" : "Back to Questions"}
          </Link>
        </div>

        {/* 头部信息 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl ${categoryConfig.color} flex items-center justify-center text-4xl`}>
              {categoryConfig.icon}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {locale === "zh" ? categoryConfig.title.zh : categoryConfig.title.en}
              </h1>
              <p className="text-foreground-muted">
                {locale === "zh"
                  ? categoryConfig.subtitle.zh
                  : categoryConfig.subtitle.en}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-foreground">
                  {stats.total}
                </div>
                <div className="text-sm text-foreground-muted">
                  {locale === "zh" ? "总题数" : "Total"}
                </div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-accent">
                  {stats.progress}%
                </div>
                <div className="text-sm text-foreground-muted">
                  {locale === "zh" ? "完成度" : "Progress"}
                </div>
              </div>
              {stats.averageScore > 0 && (
                <div className="text-center">
                  <div
                    className={`font-display text-3xl font-bold ${
                      stats.averageScore >= 80
                        ? "text-success"
                        : stats.averageScore >= 60
                          ? "text-warning"
                          : "text-error"
                    }`}
                  >
                    {stats.averageScore}
                  </div>
                  <div className="text-sm text-foreground-muted">
                    {locale === "zh" ? "平均分" : "Avg"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 进度条 */}
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
              <input
                type="text"
                placeholder={locale === "zh" ? "搜索题目..." : "Search questions..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-surface rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 题型筛选 */}
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 bg-surface rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">{locale === "zh" ? "全部题型" : "All Types"}</option>
                {Object.entries(typeConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty || ""}
                onChange={(e) =>
                  setSelectedDifficulty(e.target.value ? parseInt(e.target.value) : null)
                }
                className="px-4 py-3 bg-surface rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">{locale === "zh" ? "全部难度" : "All Levels"}</option>
                <option value={1}>{locale === "zh" ? "简单" : "Easy"}</option>
                <option value={2}>{locale === "zh" ? "中等" : "Medium"}</option>
                <option value={3}>{locale === "zh" ? "困难" : "Hard"}</option>
              </select>
            </div>
          </div>

          {/* 筛选标签 */}
          {(selectedType || selectedDifficulty) && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
              <span className="text-sm text-foreground-muted">
                {locale === "zh" ? "已筛选:" : "Filtered:"}
              </span>
              {selectedType && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent text-sm rounded-full"
                >
                  {typeConfig[selectedType]?.label}
                  <button onClick={() => setSelectedType("")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedDifficulty && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent text-sm rounded-full"
                >
                  {difficultyConfig[selectedDifficulty]?.label}
                  <button onClick={() => setSelectedDifficulty(null)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedType("");
                  setSelectedDifficulty(null);
                }}
                className="text-sm text-foreground-muted hover:text-error ml-auto"
              >
                {locale === "zh" ? "清除筛选" : "Clear filters"}
              </button>
            </div>
          )}
        </div>

        {/* 题目列表 */}
        <div className="space-y-3">
          {filteredQuestions.map((question) => {
            const status = practiceStatus[question.id];
            const typeInfo = typeConfig[question.type];

            return (
              <Link
                key={question.id}
                href={`/questions/${question.id}`}
                className="block bg-white rounded-2xl p-5 border border-border shadow-sm hover:shadow-md hover:border-accent/20 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-lg ${typeInfo?.bg} ${typeInfo?.color}`}
                      >
                        {typeInfo?.label || question.type}
                      </span>
                      <span
                        className={`text-xs ${
                          difficultyConfig[question.difficulty]?.color
                        }`}
                      >
                        {difficultyConfig[question.difficulty]?.label}
                      </span>
                      {status?.practiced && (
                        <span className="px-2 py-0.5 text-xs bg-success/10 text-success rounded-lg"
                        >
                          ✓ {locale === "zh" ? "已练习" : "Practiced"}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-foreground mb-1 line-clamp-2">
                      {question.title}
                    </h3>
                    <p className="text-sm text-foreground-muted line-clamp-1">
                      {question.keyPoints}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {status?.practiced ? (
                      <>
                        <div
                          className={`font-display text-2xl font-bold ${
                            status.highestScore >= 80
                              ? "text-success"
                              : status.highestScore >= 60
                                ? "text-warning"
                                : "text-error"
                          }`}
                        >
                          {status.highestScore}
                        </div>
                        <div className="text-xs text-foreground-muted">
                          {locale === "zh" ? "最高分" : "Best"}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-accent"
                      >
                        <Play className="w-5 h-5" />
                        <span className="text-sm">{locale === "zh" ? "去练习" : "Practice"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 空状态 */}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-foreground-muted" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {locale === "zh" ? "没有找到题目" : "No questions found"}
            </h3>
            <p className="text-foreground-muted mb-6">
              {locale === "zh"
                ? "尝试调整筛选条件"
                : "Try adjusting your filters"}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedType("");
                setSelectedDifficulty(null);
              }}
              className="px-6 py-3 bg-accent text-white rounded-full font-medium hover:bg-accent-dark transition-all"
            >
              {locale === "zh" ? "清除筛选" : "Clear filters"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
