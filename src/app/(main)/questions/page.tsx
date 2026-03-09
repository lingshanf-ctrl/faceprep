"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { questions as systemQuestions } from "@/data/questions";
import { getPracticeRecordsSync, PracticeRecord } from "@/lib/practice-store";
import { useLanguage } from "@/components/language-provider";
import {
  CustomQuestion,
  getCustomQuestions,
  addCustomQuestions,
  deleteCustomQuestion,
} from "@/lib/custom-questions-store";
import {
  previewParsedQuestions,
  formatToCustomQuestions,
  ParsedQuestion,
} from "@/lib/question-parser";
import { createInterviewSessionAsync, InterviewQuestion } from "@/lib/interview-store";
import {
  Search,
  Plus,
  Trash2,
  Play,
  X,
  Filter,
  ChevronRight,
  Sparkles,
  BookOpen,
} from "lucide-react";

// 统一的题目类型
interface UnifiedQuestion {
  id: string;
  title: string;
  category: string;
  type: string;
  difficulty: number;
  keyPoints: string;
  source: "system" | "custom";
  frequency?: number;
}

// 题型配置
const typeConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  INTRO: { label: "自我介绍", color: "text-blue-600", bg: "bg-blue-50", icon: "👋" },
  PROJECT: { label: "项目经历", color: "text-purple-600", bg: "bg-purple-50", icon: "💼" },
  TECHNICAL: { label: "技术问题", color: "text-emerald-600", bg: "bg-emerald-50", icon: "⚡" },
  BEHAVIORAL: { label: "行为面试", color: "text-orange-600", bg: "bg-orange-50", icon: "🎯" },
  HR: { label: "HR面试", color: "text-pink-600", bg: "bg-pink-50", icon: "💬" },
};

// 分类配置
const categoryConfig: Record<string, { label: string; icon: string }> = {
  FRONTEND: { label: "前端", icon: "💻" },
  BACKEND: { label: "后端", icon: "⚙️" },
  PRODUCT: { label: "产品", icon: "📱" },
  DESIGN: { label: "设计", icon: "🎨" },
  OPERATION: { label: "运营", icon: "📊" },
  GENERAL: { label: "通用", icon: "🎯" },
};

// 难度配置
const difficultyConfig: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "简单", color: "text-green-600", bg: "bg-green-50" },
  2: { label: "中等", color: "text-amber-600", bg: "bg-amber-50" },
  3: { label: "困难", color: "text-red-600", bg: "bg-red-50" },
};

function QuestionsContent() {
  const { locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 来源筛选: all | system | custom
  const [sourceFilter, setSourceFilter] = useState<"all" | "system" | "custom">("all");

  // 其他筛选
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");

  // 练习状态
  const [practiceStatus, setPracticeStatus] = useState<
    Record<string, { practiced: boolean; highestScore: number; count: number }>
  >({});

  // 自定义题目
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  // 添加题目弹窗
  const [showAddModal, setShowAddModal] = useState(false);
  const [parseText, setParseText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<{
    questions: ParsedQuestion[];
    total: number;
  } | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // 加载数据
  useEffect(() => {
    const records = getPracticeRecordsSync();
    const status: Record<string, { practiced: boolean; highestScore: number; count: number }> = {};

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
    setCustomQuestions(getCustomQuestions());
  }, []);

  // 系统题目转换为统一格式
  const systemUnifiedQuestions: UnifiedQuestion[] = useMemo(() => {
    return systemQuestions.map((q) => ({
      id: q.id,
      title: q.title,
      category: q.category,
      type: q.type,
      difficulty: q.difficulty,
      keyPoints: q.keyPoints,
      source: "system",
      frequency: q.frequency,
    }));
  }, []);

  // 自定义题目转换为统一格式
  const customUnifiedQuestions: UnifiedQuestion[] = useMemo(() => {
    const difficultyMap: Record<string, number> = {
      easy: 1,
      medium: 2,
      hard: 3,
    };
    return customQuestions.map((q) => ({
      id: q.id,
      title: q.title,
      category: q.category,
      type: q.type,
      difficulty: difficultyMap[q.difficulty] || 2,
      keyPoints: q.keyPoints || "",
      source: "custom",
    }));
  }, [customQuestions]);

  // 合并所有题目
  const allQuestions = useMemo(() => {
    return [...systemUnifiedQuestions, ...customUnifiedQuestions];
  }, [systemUnifiedQuestions, customUnifiedQuestions]);

  // 筛选后的题目
  const filteredQuestions = useMemo(() => {
    let result = allQuestions;

    // 来源筛选
    if (sourceFilter !== "all") {
      result = result.filter((q) => q.source === sourceFilter);
    }

    // 题型筛选
    if (typeFilter) {
      result = result.filter((q) => q.type === typeFilter);
    }

    // 难度筛选
    if (difficultyFilter) {
      result = result.filter((q) => q.difficulty === parseInt(difficultyFilter));
    }

    // 搜索
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter((q) =>
        q.title.toLowerCase().includes(searchLower) ||
        q.keyPoints.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [allQuestions, sourceFilter, typeFilter, difficultyFilter, searchQuery]);

  // 解析题目
  const handleParseText = () => {
    if (!parseText.trim()) return;
    setIsParsing(true);
    setTimeout(() => {
      const preview = previewParsedQuestions(parseText, { autoSelect: true });
      setParsedPreview(preview);
      setIsParsing(false);
    }, 400);
  };

  // 保存解析的题目
  const handleSaveParsed = () => {
    if (!parsedPreview || parsedPreview.questions.length === 0) return;
    const formatted = formatToCustomQuestions(parsedPreview.questions, true);
    if (formatted.length === 0) {
      alert("请至少选择一道题目");
      return;
    }
    addCustomQuestions(formatted);
    setCustomQuestions(getCustomQuestions());
    setShowAddModal(false);
    setParseText("");
    setParsedPreview(null);
    // 切换到显示自定义题目
    setSourceFilter("custom");
  };

  // 删除自定义题目
  const handleDeleteCustom = (id: string) => {
    if (confirm("确定删除这道题吗？")) {
      deleteCustomQuestion(id);
      setCustomQuestions(getCustomQuestions());
      const newSelected = new Set(selectedQuestions);
      newSelected.delete(id);
      setSelectedQuestions(newSelected);
    }
  };

  // 选择/取消选择题目
  const toggleQuestionSelection = (id: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedQuestions(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    const customFiltered = filteredQuestions.filter((q) => q.source === "custom");
    if (selectedQuestions.size === customFiltered.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(customFiltered.map((q) => q.id)));
    }
  };

  // 开始自定义面试
  const startCustomInterview = async () => {
    if (selectedQuestions.size === 0) return;
    const selected = customQuestions.filter((q) => selectedQuestions.has(q.id));
    const interviewQuestions: InterviewQuestion[] = selected.map((q, idx) => ({
      id: q.id,
      title: q.title,
      type: q.type as InterviewQuestion["type"],
      difficulty: q.difficulty as InterviewQuestion["difficulty"],
      keyPoints: q.keyPoints,
      order: idx,
    }));
    const session = await createInterviewSessionAsync("我的专属面试", "", undefined, interviewQuestions, {});
    router.push(`/interview/${session.id}`);
  };

  // 清空所有筛选
  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("");
    setDifficultyFilter("");
    setSourceFilter("all");
  };

  // 是否有筛选条件
  const hasFilters = Boolean(searchQuery || typeFilter || difficultyFilter || sourceFilter !== "all");

  // 统计
  const stats = useMemo(() => ({
    total: allQuestions.length,
    system: systemUnifiedQuestions.length,
    custom: customUnifiedQuestions.length,
  }), [allQuestions, systemUnifiedQuestions, customUnifiedQuestions]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {locale === "zh" ? "题库" : "Questions"}
            </h1>
          </div>
          <p className="text-foreground-muted text-sm sm:text-base ml-[52px]">
            {locale === "zh"
              ? `官方 ${stats.system} 道 | 我的 ${stats.custom} 道`
              : `${stats.system} official | ${stats.custom} custom`}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
          <input
            type="text"
            placeholder={locale === "zh" ? "搜索题目..." : "Search questions..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-surface border border-border rounded-2xl text-foreground placeholder-foreground-muted focus:outline-none focus:border-accent transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Source Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSourceFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              sourceFilter === "all"
                ? "bg-foreground text-white"
                : "bg-surface text-foreground-muted hover:text-foreground border border-border"
            }`}
          >
            {locale === "zh" ? "全部" : "All"} ({stats.total})
          </button>
          <button
            onClick={() => setSourceFilter("system")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              sourceFilter === "system"
                ? "bg-accent text-white"
                : "bg-surface text-foreground-muted hover:text-foreground border border-border"
            }`}
          >
            {locale === "zh" ? "官方题库" : "Official"} ({stats.system})
          </button>
          <button
            onClick={() => setSourceFilter("custom")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              sourceFilter === "custom"
                ? "bg-accent text-white"
                : "bg-surface text-foreground-muted hover:text-foreground border border-border"
            }`}
          >
            {locale === "zh" ? "我的专属" : "My Custom"} ({stats.custom})
          </button>

          <div className="flex-1" />

          {/* Add Button (only show when viewing custom or all) */}
          {(sourceFilter === "custom" || sourceFilter === "all") && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-full hover:bg-accent-dark transition-all"
            >
              <Plus className="w-4 h-4" />
              {locale === "zh" ? "添加" : "Add"}
            </button>
          )}
        </div>

        {/* Type & Difficulty Filter Tags */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <Filter className="w-4 h-4 text-foreground-muted flex-shrink-0" />

          {/* Type filters */}
          {Object.entries(typeConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(typeFilter === key ? "" : key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                typeFilter === key
                  ? `${config.bg} ${config.color} ring-1 ring-current`
                  : "bg-surface text-foreground-muted border border-border hover:border-accent/30"
              }`}
            >
              {config.icon} {config.label}
            </button>
          ))}

          <span className="w-px h-4 bg-border mx-1" />

          {/* Difficulty filters */}
          {Object.entries(difficultyConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setDifficultyFilter(difficultyFilter === key ? "" : key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                difficultyFilter === key
                  ? `${config.bg} ${config.color} ring-1 ring-current`
                  : "bg-surface text-foreground-muted border border-border hover:border-accent/30"
              }`}
            >
              {config.label}
            </button>
          ))}

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs text-foreground-muted hover:text-error transition-colors"
            >
              {locale === "zh" ? "清空" : "Clear"}
            </button>
          )}
        </div>

        {/* Custom Questions Selection Bar */}
        {sourceFilter === "custom" && customQuestions.length > 0 && (
          <div className="flex items-center justify-between mb-4 p-4 bg-surface rounded-xl border border-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                onClick={toggleSelectAll}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  selectedQuestions.size === filteredQuestions.length && filteredQuestions.length > 0
                    ? "bg-accent border-accent"
                    : selectedQuestions.size > 0
                    ? "bg-accent/50 border-accent"
                    : "border-border"
                }`}
              >
                {selectedQuestions.size > 0 && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className="text-sm text-foreground-muted">
                {selectedQuestions.size > 0
                  ? `${locale === "zh" ? "已选" : "Selected"} ${selectedQuestions.size}`
                  : locale === "zh" ? "全选" : "Select all"}
              </span>
            </label>

            {selectedQuestions.size > 0 && (
              <button
                onClick={startCustomInterview}
                className="flex items-center gap-2 px-4 py-2 bg-foreground text-white text-sm font-medium rounded-full hover:bg-foreground/90 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                {locale === "zh" ? `开始面试 (${selectedQuestions.size})` : `Start Interview`}
              </button>
            )}
          </div>
        )}

        {/* Question List */}
        {filteredQuestions.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            locale={locale}
            onClearFilters={clearFilters}
            onAddQuestion={() => setShowAddModal(true)}
          />
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                locale={locale}
                isPracticed={practiceStatus[question.id]?.practiced}
                highestScore={practiceStatus[question.id]?.highestScore}
                practiceCount={practiceStatus[question.id]?.count}
                isSelected={selectedQuestions.has(question.id)}
                onToggleSelect={() => toggleQuestionSelection(question.id)}
                onDelete={() => handleDeleteCustom(question.id)}
              />
            ))}
          </div>
        )}

        {/* Result Count */}
        <div className="mt-6 text-center text-sm text-foreground-muted">
          {locale === "zh"
            ? `共 ${filteredQuestions.length} 道题目`
            : `${filteredQuestions.length} questions`}
        </div>
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <AddQuestionModal
          locale={locale}
          parseText={parseText}
          setParseText={setParseText}
          parsedPreview={parsedPreview}
          setParsedPreview={setParsedPreview}
          isParsing={isParsing}
          onParse={handleParseText}
          onSave={handleSaveParsed}
          onClose={() => {
            setShowAddModal(false);
            setParseText("");
            setParsedPreview(null);
          }}
        />
      )}
    </div>
  );
}

// Question Card Component
interface QuestionCardProps {
  question: UnifiedQuestion;
  locale: string;
  isPracticed?: boolean;
  highestScore?: number;
  practiceCount?: number;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onDelete?: () => void;
}

function QuestionCard({
  question,
  locale,
  isPracticed,
  highestScore,
  practiceCount,
  isSelected,
  onToggleSelect,
  onDelete,
}: QuestionCardProps) {
  const typeInfo = typeConfig[question.type] || { label: question.type, color: "", bg: "", icon: "" };
  const categoryInfo = categoryConfig[question.category] || { label: question.category, icon: "" };
  const difficultyInfo = difficultyConfig[question.difficulty] || { label: "", color: "", bg: "" };
  const isCustom = question.source === "custom";

  return (
    <div
      className={`group bg-surface rounded-2xl border transition-all overflow-hidden ${
        isCustom && isSelected
          ? "border-accent shadow-sm"
          : "border-border hover:border-accent/30"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Selection Checkbox (custom only) */}
          {isCustom && (
            <button
              onClick={onToggleSelect}
              className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                isSelected ? "bg-accent border-accent" : "border-border hover:border-accent"
              }`}
            >
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Tags */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded-lg font-medium ${typeInfo.bg} ${typeInfo.color}`}>
                {typeInfo.icon} {typeInfo.label}
              </span>
              <span className="text-xs px-2 py-1 rounded-lg text-foreground-muted bg-background border border-border">
                {categoryInfo.icon} {categoryInfo.label}
              </span>
              <span className={`text-xs px-2 py-1 rounded-lg font-medium ${difficultyInfo.bg} ${difficultyInfo.color}`}>
                {difficultyInfo.label}
              </span>
              {question.frequency && question.frequency >= 2 && (
                <span className="text-xs px-2 py-1 rounded-lg text-amber-600 bg-amber-50 border border-amber-100">
                  {locale === "zh" ? "高频" : "Hot"}
                </span>
              )}
              {isCustom && (
                <span className="text-xs px-2 py-1 rounded-lg text-accent bg-accent/10 border border-accent/20">
                  {locale === "zh" ? "我的" : "Custom"}
                </span>
              )}
              {isPracticed && (
                <span className="text-xs px-2 py-1 rounded-lg text-green-600 bg-green-50 border border-green-100">
                  {locale === "zh" ? "已练习" : "Done"}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-medium text-foreground mb-1 leading-relaxed">
              <Link href={`/questions/${question.id}`} className="hover:text-accent transition-colors">
                {question.title}
              </Link>
            </h3>

            {/* Key Points */}
            {question.keyPoints && (
              <p className="text-foreground-muted text-sm line-clamp-1">{question.keyPoints}</p>
            )}
          </div>

          {/* Right Side */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            {/* Score */}
            {isPracticed && highestScore !== undefined && (
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${
                  highestScore >= 80 ? "text-green-500" : highestScore >= 60 ? "text-amber-500" : "text-red-500"
                }`}>
                  {highestScore}
                </span>
                {practiceCount && practiceCount > 1 && (
                  <span className="text-xs text-foreground-muted bg-background px-2 py-0.5 rounded-full">
                    {practiceCount}次
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Link
                href={`/questions/${question.id}`}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-accent hover:bg-accent/5 rounded-lg transition-all"
              >
                {locale === "zh" ? "练习" : "Practice"}
                <ChevronRight className="w-4 h-4" />
              </Link>

              {isCustom && (
                <button
                  onClick={onDelete}
                  className="p-1.5 text-foreground-muted hover:text-error hover:bg-error/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  hasFilters: boolean;
  locale: string;
  onClearFilters: () => void;
  onAddQuestion: () => void;
}

function EmptyState({ hasFilters, locale, onClearFilters, onAddQuestion }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-5xl mb-4">{hasFilters ? "🔍" : "📝"}</div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {hasFilters
          ? locale === "zh" ? "没有找到符合条件的题目" : "No questions found"
          : locale === "zh" ? "还没有题目" : "No questions yet"}
      </h3>
      <p className="text-foreground-muted text-sm mb-6">
        {hasFilters
          ? locale === "zh" ? "尝试调整筛选条件" : "Try adjusting your filters"
          : locale === "zh" ? "添加你的第一道题开始练习" : "Add your first question to start"}
      </p>
      {hasFilters ? (
        <button
          onClick={onClearFilters}
          className="px-6 py-2.5 bg-surface text-foreground rounded-xl font-medium hover:bg-border transition-all"
        >
          {locale === "zh" ? "清除筛选" : "Clear filters"}
        </button>
      ) : (
        <button
          onClick={onAddQuestion}
          className="px-6 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all"
        >
          {locale === "zh" ? "添加题目" : "Add question"}
        </button>
      )}
    </div>
  );
}

// Add Question Modal Component
interface AddQuestionModalProps {
  locale: string;
  parseText: string;
  setParseText: (text: string) => void;
  parsedPreview: { questions: ParsedQuestion[]; total: number } | null;
  setParsedPreview: (preview: { questions: ParsedQuestion[]; total: number } | null) => void;
  isParsing: boolean;
  onParse: () => void;
  onSave: () => void;
  onClose: () => void;
}

function AddQuestionModal({
  locale,
  parseText,
  setParseText,
  parsedPreview,
  setParsedPreview,
  isParsing,
  onParse,
  onSave,
  onClose,
}: AddQuestionModalProps) {
  const toggleSelection = (index: number) => {
    if (!parsedPreview) return;
    const newQuestions = [...parsedPreview.questions];
    newQuestions[index] = { ...newQuestions[index], selected: !newQuestions[index].selected };
    setParsedPreview({ ...parsedPreview, questions: newQuestions });
  };

  const selectedCount = parsedPreview?.questions.filter((q) => q.selected).length || 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              {locale === "zh" ? "添加专属题目" : "Add Custom Questions"}
            </h3>
            <p className="text-sm text-foreground-muted mt-1">
              {locale === "zh" ? "支持多种格式，AI 智能识别" : "Multiple formats supported, AI-powered parsing"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-foreground-muted hover:text-foreground rounded-xl hover:bg-background">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!parsedPreview ? (
            <div className="space-y-4">
              <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-accent mt-0.5" />
                  <p className="text-sm text-foreground-muted">
                    {locale === "zh"
                      ? "支持 1. / - / (1) / 第一题：等各种编号格式，自动识别题型"
                      : "Supports various numbering formats with auto type detection"}
                  </p>
                </div>
              </div>
              <textarea
                value={parseText}
                onChange={(e) => setParseText(e.target.value)}
                placeholder={
                  locale === "zh"
                    ? "在此粘贴你的面试题目...\n\n例如：\n1. 请介绍一下你自己\n2. React 的虚拟 DOM 原理是什么？"
                    : "Paste your interview questions here..."
                }
                className="w-full h-48 px-4 py-4 bg-background border border-border rounded-2xl text-foreground placeholder-foreground-muted focus:outline-none focus:border-accent resize-none"
              />
              <button
                onClick={onParse}
                disabled={!parseText.trim() || isParsing}
                className="w-full py-3.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isParsing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {locale === "zh" ? "解析中..." : "Parsing..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {locale === "zh" ? "智能解析" : "Parse"}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                <span className="font-medium text-foreground">
                  {locale === "zh" ? `识别 ${parsedPreview.total} 道题目` : `${parsedPreview.total} questions found`}
                </span>
                <span className="text-sm text-accent font-medium">
                  {locale === "zh" ? `已选 ${selectedCount}` : `${selectedCount} selected`}
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {parsedPreview.questions.map((q, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleSelection(idx)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      q.selected
                        ? "bg-accent/5 border-accent/30"
                        : "bg-background border-border opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        q.selected ? "bg-accent border-accent" : "border-border"
                      }`}>
                        {q.selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-foreground-muted">#{idx + 1}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent">
                            {typeConfig[q.type]?.label || q.type}
                          </span>
                        </div>
                        <p className={`text-sm ${q.selected ? "text-foreground" : "text-foreground-muted"}`}>
                          {q.title}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {parsedPreview && (
          <div className="flex gap-3 p-6 border-t border-border">
            <button
              onClick={() => setParsedPreview(null)}
              className="px-6 py-3 border border-border rounded-xl font-medium text-foreground hover:bg-background transition-all"
            >
              {locale === "zh" ? "重新编辑" : "Re-edit"}
            </button>
            <button
              onClick={onSave}
              disabled={selectedCount === 0}
              className="flex-1 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark disabled:opacity-50 transition-all"
            >
              {locale === "zh" ? `保存 ${selectedCount} 道` : `Save ${selectedCount}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-surface rounded-lg w-32"></div>
          <div className="h-14 bg-surface rounded-2xl"></div>
          <div className="h-10 bg-surface rounded-full w-64"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-surface rounded-2xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<QuestionsLoading />}>
      <QuestionsContent />
    </Suspense>
  );
}
