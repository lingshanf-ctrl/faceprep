"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
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
  ChevronRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

// Design System Imports
import { ScoreBadge } from "@/components/ui/score-badge";
import { QuestionTypeBadge, CategoryBadge, DifficultyBadge } from "@/components/ui/type-badge";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";
import { typeColorConfig, categoryColorConfig, difficultyColorConfig } from "@/lib/design-tokens";

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

// 分类筛选配置
const CATEGORY_TABS = [
  { value: "ALL", label: { zh: "全部", en: "All" }, icon: "✨" },
  { value: "FRONTEND", label: { zh: "前端", en: "Frontend" }, icon: "💻" },
  { value: "BACKEND", label: { zh: "后端", en: "Backend" }, icon: "⚙️" },
  { value: "PRODUCT", label: { zh: "产品", en: "Product" }, icon: "📱" },
  { value: "DESIGN", label: { zh: "设计", en: "Design" }, icon: "🎨" },
  { value: "OPERATION", label: { zh: "运营", en: "Operation" }, icon: "📊" },
  { value: "GENERAL", label: { zh: "通用", en: "General" }, icon: "🎯" },
  { value: "DATA", label: { zh: "数据分析", en: "Data" }, icon: "📈" },
  { value: "AI", label: { zh: "算法/AI", en: "AI" }, icon: "🤖" },
  { value: "MARKETING", label: { zh: "市场/品牌", en: "Marketing" }, icon: "📣" },
  { value: "MANAGEMENT", label: { zh: "管理", en: "Management" }, icon: "👥" },
];

function QuestionsContent() {
  const { locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showConfirm, DialogComponent } = useConfirmDialog();

  // 来源筛选: all | system | custom
  const [sourceFilter, setSourceFilter] = useState<"all" | "system" | "custom">("system");

  // 其他筛选
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
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

    // 方向筛选
    if (categoryFilter !== "ALL") {
      result = result.filter((q) => q.category === categoryFilter);
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
  }, [allQuestions, sourceFilter, categoryFilter, typeFilter, difficultyFilter, searchQuery]);

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
    setSourceFilter("custom");
  };

  // 删除自定义题目
  const handleDeleteCustom = (id: string, title: string) => {
    showConfirm({
      title: locale === "zh" ? "确认删除" : "Confirm Delete",
      description: locale === "zh"
        ? `确定要删除题目「${title}」吗？此操作无法撤销。`
        : `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      confirmText: locale === "zh" ? "删除" : "Delete",
      cancelText: locale === "zh" ? "取消" : "Cancel",
      variant: "danger",
      onConfirm: () => {
        deleteCustomQuestion(id);
        setCustomQuestions(getCustomQuestions());
        const newSelected = new Set(selectedQuestions);
        newSelected.delete(id);
        setSelectedQuestions(newSelected);
      },
    });
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

  // 清空次级筛选（不重置 sourceFilter，那是页面级导航）
  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("ALL");
    setTypeFilter("");
    setDifficultyFilter("");
  };

  // 是否有次级筛选条件
  const hasFilters = Boolean(searchQuery || categoryFilter !== "ALL" || typeFilter || difficultyFilter);

  // 统计
  const stats = useMemo(() => ({
    system: systemUnifiedQuestions.length,
    custom: customUnifiedQuestions.length,
    total: systemUnifiedQuestions.length + customUnifiedQuestions.length,
  }), [systemUnifiedQuestions, customUnifiedQuestions]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-1">
            {locale === "zh" ? "题库" : "Questions"}
          </h1>
          <p className="text-foreground-muted text-sm">
            {locale === "zh"
              ? `精选 ${stats.system} 道面试题，${stats.custom} 道专属定制`
              : `${stats.system} curated · ${stats.custom} custom`}
          </p>
        </motion.div>

        {/* ── Source Tab Switcher (Top Level) ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="flex items-center gap-2 mb-5"
        >
          {[
            { value: "system", label: locale === "zh" ? "官方题库" : "Official", icon: <BookOpen className="w-4 h-4" />, count: stats.system },
            { value: "custom", label: locale === "zh" ? "我的题目" : "My Questions", icon: <Sparkles className="w-4 h-4" />, count: stats.custom },
          ].map((tab) => {
            const isActive = sourceFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setSourceFilter(tab.value as typeof sourceFilter)}
                className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-accent text-white shadow-md shadow-accent/20"
                    : "bg-white border border-border text-foreground-muted hover:text-foreground hover:border-accent/40 hover:bg-accent/5"
                }`}
              >
                <span className={isActive ? "text-white/90" : "text-foreground-muted group-hover:text-accent"}>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                  isActive ? "bg-white/20 text-white" : "bg-surface text-foreground-muted"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}

          {/* Add button — only visible in custom tab */}
          {sourceFilter === "custom" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="ml-auto flex items-center gap-1.5 px-3.5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl
                hover:bg-accent/90 transition-all duration-200 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{locale === "zh" ? "添加题目" : "Add"}</span>
            </button>
          )}
        </motion.div>

        {/* ── Filter Panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-5 bg-white border border-border/50 rounded-xl overflow-hidden"
        >
          {/* Row 1: Category tabs + Search */}
          <div className="flex items-center gap-2 border-b border-border/60 pr-3">
            {/* Category scroll */}
            <div className="relative flex-1 min-w-0">
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
              <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide px-3 py-2">
                {CATEGORY_TABS.map((tab) => {
                  const isActive = categoryFilter === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setCategoryFilter(tab.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                        isActive
                          ? "bg-accent text-white"
                          : "text-foreground-muted hover:text-foreground hover:bg-surface"
                      }`}
                    >
                      {tab.label[locale as "zh" | "en"]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compact inline search */}
            <div className="relative flex-shrink-0 group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted transition-colors group-focus-within:text-accent pointer-events-none" />
              <input
                type="text"
                placeholder={locale === "zh" ? "搜索..." : "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 focus:w-48 pl-8 pr-7 py-1.5 bg-surface border border-border rounded-lg text-xs text-foreground placeholder-foreground-muted
                  focus:outline-none focus:border-accent focus:bg-white
                  transition-all duration-300"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Type · Difficulty · Clear */}
          <div className="flex items-center gap-1 px-3 py-1.5 flex-wrap">
            {/* Type filters */}
            {Object.entries(typeColorConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setTypeFilter(typeFilter === key ? "" : key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  typeFilter === key
                    ? `${config.bg} ${config.color} ring-1 ring-current/30`
                    : "text-foreground-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                {config.label[locale as "zh" | "en"]}
              </button>
            ))}

            {/* Divider */}
            <span className="w-px h-3.5 bg-border/70 flex-shrink-0 mx-0.5" />

            {/* Difficulty filters */}
            {Object.entries(difficultyColorConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setDifficultyFilter(difficultyFilter === key ? "" : key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  difficultyFilter === key
                    ? `${config.bg} ${config.color} ring-1 ring-current/30`
                    : "text-foreground-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                {config.label[locale as "zh" | "en"]}
              </button>
            ))}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-error hover:bg-error/5 rounded-lg transition-all"
              >
                <X className="w-3 h-3" />
                <span>{locale === "zh" ? "清除筛选" : "Clear"}</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Custom Questions Selection Bar */}
        {sourceFilter === "custom" && customQuestions.length > 0 && (
          <div className="flex items-center justify-between mb-5 p-4 bg-white border border-border/50 rounded-xl animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <label className="flex items-center gap-3 cursor-pointer group">
              <button
                onClick={toggleSelectAll}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                  selectedQuestions.size === filteredQuestions.length && filteredQuestions.length > 0
                    ? "bg-accent border-accent shadow-soft-sm scale-110"
                    : selectedQuestions.size > 0
                    ? "bg-accent/50 border-accent"
                    : "border-border bg-white group-hover:border-accent"
                }`}
              >
                {selectedQuestions.size > 0 && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className="text-sm font-medium text-foreground">
                {selectedQuestions.size > 0
                  ? `${locale === "zh" ? "已选" : "Selected"} ${selectedQuestions.size} ${locale === "zh" ? "道题" : "questions"}`
                  : locale === "zh" ? "全选" : "Select all"}
              </span>
            </label>

            {selectedQuestions.size > 0 && (
              <button
                onClick={startCustomInterview}
                className="group relative flex items-center gap-2 px-6 py-2.5 bg-foreground text-white text-sm font-semibold rounded-full
                  hover:bg-foreground/90 hover:shadow-soft-md transition-all duration-300 hover:scale-105"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{locale === "zh" ? `开始面试 (${selectedQuestions.size})` : `Start (${selectedQuestions.size})`}</span>
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
          <div className="space-y-3 animate-fade-up" style={{ animationDelay: "0.5s" }}>
            {filteredQuestions.map((question, index) => (
              <div
                key={question.id}
                className="animate-fade-up"
                style={{ animationDelay: `${0.5 + index * 0.05}s` }}
              >
                <QuestionCard
                  question={question}
                  locale={locale}
                  isPracticed={practiceStatus[question.id]?.practiced}
                  highestScore={practiceStatus[question.id]?.highestScore}
                  practiceCount={practiceStatus[question.id]?.count}
                  isSelected={selectedQuestions.has(question.id)}
                  onToggleSelect={() => toggleQuestionSelection(question.id)}
                  onDelete={() => handleDeleteCustom(question.id, question.title)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Result Count */}
        {filteredQuestions.length > 0 && (
          <div className="mt-8 text-center text-sm text-foreground-muted">
            {locale === "zh"
              ? `共找到 ${filteredQuestions.length} 道题目`
              : `${filteredQuestions.length} questions found`}
          </div>
        )}
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

      {/* Confirm Dialog */}
      {DialogComponent}
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
  const isCustom = question.source === "custom";
  const isOfficial = question.source === "system";

  return (
    <div
      className={`group relative bg-white rounded-xl border transition-all duration-200 overflow-hidden
        ${isCustom && isSelected
          ? "border-accent"
          : "border-border/50 hover:border-accent/40"
        }`}
    >
      {/* Official Question left accent */}
      {isOfficial && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent/60" />
      )}

      <div className="p-4 sm:p-5 pl-5 sm:pl-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          {/* Selection Checkbox (custom only) */}
          {isCustom && (
            <button
              onClick={onToggleSelect}
              className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
                isSelected
                  ? "bg-accent border-accent shadow-soft-sm scale-110"
                  : "border-border bg-white hover:border-accent hover:scale-105"
              }`}
            >
              {isSelected && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Tags - optimized for mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3 flex-wrap">
              <QuestionTypeBadge
                type={question.type}
                locale={locale as "zh" | "en"}
                showIcon={false}
              />
              <CategoryBadge
                category={question.category}
                locale={locale as "zh" | "en"}
                showIcon={false}
              />
              <DifficultyBadge
                difficulty={question.difficulty}
                locale={locale as "zh" | "en"}
              />

              {question.frequency && question.frequency >= 2 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold text-amber-700 bg-amber-50 border border-amber-200">
                  ⚡ {locale === "zh" ? "高频" : "Hot"}
                </span>
              )}

              {isCustom && (
                <span className="text-xs px-3 py-1 rounded-full font-semibold text-accent bg-accent/10 border border-accent/30">
                  {locale === "zh" ? "专属" : "Custom"}
                </span>
              )}

              {isPracticed && (
                <span className="flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold text-success bg-success/10 border border-success/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {locale === "zh" ? "已练" : "Done"}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground mb-2 leading-relaxed text-base group-hover:text-accent transition-colors">
              <Link href={`/questions/${question.id}`}>
                {question.title}
              </Link>
            </h3>

            {/* Key Points */}
            {question.keyPoints && (
              <p className="text-foreground-muted text-sm line-clamp-2 leading-relaxed">
                {question.keyPoints}
              </p>
            )}
          </div>

          {/* Right Side - Mobile: horizontal row at bottom, Desktop: vertical column */}
          <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2 sm:gap-3">
            {/* Score */}
            {isPracticed && highestScore !== undefined && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <ScoreBadge score={highestScore} size="sm" showLabel={false} />
                {practiceCount && practiceCount > 1 && (
                  <span className="text-xs text-foreground-muted bg-surface px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-medium border border-border">
                    ×{practiceCount}
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Link
                href={`/questions/${question.id}`}
                className="group/btn flex items-center gap-1 px-3 sm:px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10 rounded-full transition-all duration-300 hover:shadow-soft-sm"
              >
                <span className="hidden sm:inline">{locale === "zh" ? "练习" : "Practice"}</span>
                <span className="sm:hidden">{locale === "zh" ? "去练" : "Go"}</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>

              {isCustom && (
                <button
                  onClick={onDelete}
                  className="p-2 text-foreground-muted hover:text-error hover:bg-error/5 rounded-full transition-all duration-300 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label={locale === "zh" ? "删除" : "Delete"}
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
    <div className="text-center py-20 px-4">
      <div className="text-5xl mb-4">{hasFilters ? "🔍" : "📚"}</div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        {hasFilters
          ? locale === "zh" ? "未找到匹配的题目" : "No questions found"
          : locale === "zh" ? "题库空空如也" : "No questions yet"}
      </h3>

      <p className="text-foreground-muted text-sm mb-6 max-w-sm mx-auto">
        {hasFilters
          ? locale === "zh"
            ? "试试调整筛选条件，或者清空筛选查看所有题目"
            : "Try adjusting your filters or clear them to see all questions"
          : locale === "zh"
            ? "添加你的第一道专属题目，开启刻意练习之旅"
            : "Add your first custom question to start practicing"}
      </p>

      {hasFilters ? (
        <button
          onClick={onClearFilters}
          className="px-6 py-2.5 bg-white text-foreground rounded-full font-medium border border-border hover:border-accent/40 transition-all"
        >
          {locale === "zh" ? "清除筛选条件" : "Clear filters"}
        </button>
      ) : (
        <button
          onClick={onAddQuestion}
          className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-accent text-white rounded-full font-medium transition-all hover:bg-accent/90"
        >
          <Plus className="w-4 h-4" />
          {locale === "zh" ? "添加专属题目" : "Add question"}
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl border border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div>
            <h3 className="text-2xl font-display font-bold text-foreground">
              {locale === "zh" ? "添加专属题目" : "Add Custom Questions"}
            </h3>
            <p className="text-sm text-foreground-muted mt-1.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              {locale === "zh" ? "支持多种格式，AI 智能识别" : "Multiple formats supported, AI-powered"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-foreground-muted hover:text-foreground rounded-xl hover:bg-surface transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!parsedPreview ? (
            <div className="space-y-5">
              <div className="p-4 bg-surface border border-border/50 rounded-xl">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-foreground-muted leading-relaxed">
                    {locale === "zh"
                      ? "支持 1. / - / (1) / 第一题：等各种编号格式，AI 会自动识别题型和难度"
                      : "Supports various numbering formats (1. / - / (1)) with automatic type and difficulty detection"}
                  </div>
                </div>
              </div>

              <textarea
                value={parseText}
                onChange={(e) => setParseText(e.target.value)}
                placeholder={
                  locale === "zh"
                    ? "在此粘贴你的面试题目...\n\n例如：\n1. 请介绍一下你自己\n2. React 的虚拟 DOM 原理是什么？\n3. 描述一个你遇到的技术难题及解决方案"
                    : "Paste your interview questions here...\n\nExample:\n1. Tell me about yourself\n2. Explain React's Virtual DOM\n3. Describe a technical challenge you solved"
                }
                className="w-full h-56 px-4 py-3.5 bg-surface border border-border rounded-xl text-foreground placeholder-foreground-muted
                  focus:outline-none focus:border-accent focus:bg-white resize-none transition-all"
              />

              <button
                onClick={onParse}
                disabled={!parseText.trim() || isParsing}
                className="w-full py-3.5 bg-accent text-white rounded-xl font-semibold
                  hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  {isParsing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{locale === "zh" ? "AI 解析中..." : "Parsing..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{locale === "zh" ? "AI 智能解析" : "AI Parse"}</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface border border-border/50 rounded-xl">
                <div>
                  <span className="font-semibold text-foreground text-lg">
                    {locale === "zh" ? `识别到 ${parsedPreview.total} 道题目` : `${parsedPreview.total} questions found`}
                  </span>
                  <p className="text-xs text-foreground-muted mt-1">
                    {locale === "zh" ? "点击题目选择或取消选择" : "Click to select/deselect"}
                  </p>
                </div>
                <span className="text-sm text-accent font-bold bg-accent/10 px-4 py-2 rounded-full">
                  {locale === "zh" ? `已选 ${selectedCount}` : `${selectedCount} selected`}
                </span>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-2">
                {parsedPreview.questions.map((q, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleSelection(idx)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      q.selected
                        ? "bg-accent/5 border-accent/40"
                        : "bg-white border-border/50 hover:border-accent/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                        q.selected ? "bg-accent border-accent shadow-soft-sm" : "border-border bg-white"
                      }`}>
                        {q.selected && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-medium text-foreground-muted">#{idx + 1}</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-accent/10 text-accent border border-accent/20">
                            {typeColorConfig[q.type as keyof typeof typeColorConfig]?.label[locale as "zh" | "en"] || q.type}
                          </span>
                        </div>
                        <p className={`text-sm leading-relaxed ${q.selected ? "text-foreground font-medium" : "text-foreground-muted"}`}>
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
          <div className="flex gap-3 p-5 border-t border-border/50">
            <button
              onClick={() => setParsedPreview(null)}
              className="px-5 py-2.5 border border-border rounded-xl font-medium text-foreground hover:border-accent/40 transition-all"
            >
              {locale === "zh" ? "← 重新编辑" : "← Re-edit"}
            </button>
            <button
              onClick={onSave}
              disabled={selectedCount === 0}
              className="flex-1 py-2.5 bg-accent text-white rounded-xl font-semibold
                hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {locale === "zh" ? `保存 ${selectedCount} 道题目` : `Save ${selectedCount} questions`}
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
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-surface rounded-2xl w-40"></div>
          <div className="h-14 bg-surface rounded-2xl"></div>
          <div className="h-12 bg-surface rounded-full w-96"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-surface rounded-2xl"></div>
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
