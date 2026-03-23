"use client";

import { useMemo, useState, useEffect, Suspense, useCallback } from "react";
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
import { isFavorite, toggleFavorite } from "@/lib/favorites-store";
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
import { PageHeader } from "@/components/page-header";

// Design System Imports
import { ScoreBadge } from "@/components/ui/score-badge";
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
      <PageHeader
        title={locale === "zh" ? "题库" : "Question Bank"}
        subtitle={locale === "zh"
          ? `精选 ${stats.system} 道面试题，${stats.custom} 道专属定制`
          : `${stats.system} curated · ${stats.custom} custom`}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8">

        {/* ── Source Tab Switcher (Stitch underline tabs) ── */}
        <div className="flex items-center gap-5 md:gap-8 mb-5 md:mb-6 border-b border-[#eae7e7]">
          {[
            { value: "system", label: locale === "zh" ? "官方题库" : "Official Library", count: stats.system },
            { value: "custom", label: locale === "zh" ? "我的题目" : "My Questions", count: stats.custom },
          ].map((tab) => {
            const isActive = sourceFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setSourceFilter(tab.value as typeof sourceFilter)}
                className={`pb-3 md:pb-4 text-sm tracking-wide transition-all duration-200 ${
                  isActive
                    ? "font-bold text-[#004ac6] border-b-2 border-[#004ac6]"
                    : "font-medium text-[#5f5e5e] hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          {/* Add button — only visible in custom tab */}
          {sourceFilter === "custom" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="ml-auto mb-2 flex items-center gap-1.5 px-3 py-2 md:px-3.5 md:py-2.5 text-white text-xs md:text-sm font-semibold rounded-xl transition-all duration-200 bg-primary-gradient shadow-glow hover:shadow-glow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>{locale === "zh" ? "添加" : "Add"}</span>
            </button>
          )}
        </div>

        {/* ── Filter Panel ── */}
        <div className="mb-4 md:mb-5 space-y-2">

          {/* ── Mobile Filter (3 rows) ── */}
          <div className="md:hidden space-y-2">
            {/* Row 1: Search */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted group-focus-within:text-accent pointer-events-none" />
              <input
                type="text"
                placeholder={locale === "zh" ? "搜索题目..." : "Search questions..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-[#f6f3f2] rounded-xl text-sm text-foreground placeholder-foreground-muted
                  focus:outline-none focus:ring-1 focus:ring-accent focus:bg-white transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Row 2: Category pills — wrapping */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_TABS.map((tab) => {
                const isActive = categoryFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setCategoryFilter(tab.value)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      isActive
                        ? "bg-[#004ac6] text-white"
                        : "bg-[#f6f3f2] text-[#5f5e5e]"
                    }`}
                  >
                    {tab.label[locale as "zh" | "en"]}
                  </button>
                );
              })}
            </div>

            {/* Row 3: Type + Difficulty chips + Clear — wrapping */}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(typeColorConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(typeFilter === key ? "" : key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    typeFilter === key
                      ? `${config.bg} ${config.color}`
                      : "bg-[#f6f3f2] text-[#5f5e5e]"
                  }`}
                >
                  {config.label[locale as "zh" | "en"]}
                </button>
              ))}
              {Object.entries(difficultyColorConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setDifficultyFilter(difficultyFilter === key ? "" : key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    difficultyFilter === key
                      ? `${config.bg} ${config.color}`
                      : "bg-[#f6f3f2] text-[#5f5e5e]"
                  }`}
                >
                  {config.label[locale as "zh" | "en"]}
                </button>
              ))}
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-error bg-error/8 rounded-lg"
                >
                  <X className="w-2.5 h-2.5" />
                  {locale === "zh" ? "清除" : "Clear"}
                </button>
              )}
            </div>
          </div>

          {/* Desktop: original full filter panel */}
          <div className="hidden md:block bg-surface-elevated rounded-xl overflow-hidden shadow-subtle">
            <div className="flex items-center gap-2 pr-3" style={{ borderBottom: "1px solid rgba(195,198,215,0.25)" }}>
              <div className="relative flex-1 min-w-0">
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-surface-elevated to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-surface-elevated to-transparent pointer-events-none z-10" />
                <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide px-3 py-2">
                  {CATEGORY_TABS.map((tab) => {
                    const isActive = categoryFilter === tab.value;
                    return (
                      <button
                        key={tab.value}
                        onClick={() => setCategoryFilter(tab.value)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                          isActive ? "bg-accent text-white" : "text-foreground-muted hover:text-foreground hover:bg-surface"
                        }`}
                      >
                        {tab.label[locale as "zh" | "en"]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="relative flex-shrink-0 group">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted transition-colors group-focus-within:text-accent pointer-events-none" />
                <input
                  type="text"
                  placeholder={locale === "zh" ? "搜索..." : "Search..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-32 focus:w-48 pl-8 pr-7 py-1.5 bg-surface border border-border rounded-lg text-xs text-foreground placeholder-foreground-muted
                    focus:outline-none focus:border-accent focus:bg-white transition-all duration-300"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 flex-wrap">
              {Object.entries(typeColorConfig).map(([key, config]) => (
                <button key={key} onClick={() => setTypeFilter(typeFilter === key ? "" : key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    typeFilter === key ? `${config.bg} ${config.color} ring-1 ring-current/30` : "text-foreground-muted hover:text-foreground hover:bg-surface"
                  }`}
                >{config.label[locale as "zh" | "en"]}</button>
              ))}
              <span className="w-px h-3.5 bg-border/70 flex-shrink-0 mx-0.5" />
              {Object.entries(difficultyColorConfig).map(([key, config]) => (
                <button key={key} onClick={() => setDifficultyFilter(difficultyFilter === key ? "" : key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    difficultyFilter === key ? `${config.bg} ${config.color} ring-1 ring-current/30` : "text-foreground-muted hover:text-foreground hover:bg-surface"
                  }`}
                >{config.label[locale as "zh" | "en"]}</button>
              ))}
              <div className="flex-1" />
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-error hover:bg-error/5 rounded-lg transition-all">
                  <X className="w-3 h-3" />
                  <span>{locale === "zh" ? "清除筛选" : "Clear"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Custom Questions Selection Bar */}
        {sourceFilter === "custom" && customQuestions.length > 0 && (
          <div className="flex items-center justify-between mb-5 px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-border/50 rounded-xl">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <button
                onClick={toggleSelectAll}
                className={`w-4 h-4 md:w-5 md:h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  selectedQuestions.size === filteredQuestions.length && filteredQuestions.length > 0
                    ? "bg-accent border-accent"
                    : selectedQuestions.size > 0
                    ? "bg-accent/50 border-accent"
                    : "border-border bg-white group-hover:border-accent"
                }`}
              >
                {selectedQuestions.size > 0 && (
                  <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-xl transition-all duration-200 bg-primary-gradient shadow-glow hover:shadow-glow-lg"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
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
                onDelete={() => handleDeleteCustom(question.id, question.title)}
              />
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
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    setFavorited(isFavorite(question.id));
  }, [question.id]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavorite(question.id);
    setFavorited(next);
  }, [question.id]);

  return (
    <Link
      href={`/questions/${question.id}`}
      className={`group block rounded-xl p-4 md:p-5 transition-all hover:bg-white hover:shadow-[0_20px_40px_rgba(28,27,27,0.06)] ${
        isSelected
          ? "bg-white ring-1 ring-accent/30 shadow-glow"
          : "bg-[#f6f3f2]"
      }`}
    >
      <div className="flex items-start justify-between gap-3 md:gap-4">
        {/* Left: checkbox (custom) + content */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Selection Checkbox (custom only) */}
          {isCustom && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect?.(); }}
              className={`mt-0.5 w-4 h-4 md:w-5 md:h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                isSelected
                  ? "bg-accent border-accent"
                  : "border-border bg-white hover:border-accent"
              }`}
            >
              {isSelected && (
                <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            {/* Tags */}
            <div className="flex items-center gap-1 md:gap-1.5 mb-1.5 md:mb-2.5 flex-wrap">
              <span className="text-[10px] px-1.5 md:px-2 py-0.5 rounded font-semibold tracking-wider uppercase bg-[#eef1ff] text-[#004ac6] border border-[#c5d0f5]">
                {typeColorConfig[question.type as keyof typeof typeColorConfig]?.label[locale as "zh" | "en"] ?? question.type}
              </span>
              <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded font-semibold tracking-wider uppercase bg-[#f2f2f2] text-[#888] border border-[#e4e4e4]">
                {categoryColorConfig[question.category as keyof typeof categoryColorConfig]?.label[locale as "zh" | "en"] ?? question.category}
              </span>
              <span className={`text-[10px] px-1.5 md:px-2 py-0.5 rounded font-semibold tracking-wider uppercase bg-[#f2f2f2] border border-[#e4e4e4] ${
                question.difficulty === 3 ? "text-[#555]" : "text-[#999]"
              }`}>
                {difficultyColorConfig[question.difficulty as keyof typeof difficultyColorConfig]?.label[locale as "zh" | "en"]}
              </span>
              {question.frequency && question.frequency >= 2 && (
                <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded font-semibold tracking-wider uppercase bg-[#f2f2f2] text-[#888] border border-[#e4e4e4]">
                  ⚡ {locale === "zh" ? "高频" : "Hot"}
                </span>
              )}
              {isCustom && (
                <span className="text-[10px] px-1.5 md:px-2 py-0.5 rounded font-semibold tracking-wider uppercase bg-[#eef1ff] text-[#004ac6] border border-[#c5d0f5]">
                  {locale === "zh" ? "专属" : "Custom"}
                </span>
              )}
              {isPracticed && (
                <span className="flex items-center gap-0.5 text-[10px] px-1.5 md:px-2 py-0.5 rounded font-semibold tracking-wider uppercase bg-[#f2f2f2] text-[#888] border border-[#e4e4e4]">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {locale === "zh" ? "已练" : "Done"}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground mb-0 md:mb-1 leading-snug text-sm md:text-base group-hover:text-accent transition-colors">
              {question.title}
            </h3>

            {/* Key Points — desktop only */}
            {question.keyPoints && (
              <p className="hidden md:block text-sm text-foreground-muted leading-relaxed line-clamp-2 mt-1.5">
                {question.keyPoints}
              </p>
            )}
          </div>
        </div>

        {/* Right: bookmark + score + arrow */}
        <div className="shrink-0 flex flex-col items-end gap-2 md:gap-3">
          {/* Bookmark */}
          <button
            onClick={handleToggleFavorite}
            className="p-1.5 md:p-2 rounded-xl transition-colors text-foreground-muted hover:text-accent hover:bg-accent/10"
            aria-label={favorited ? (locale === "zh" ? "取消收藏" : "Remove") : (locale === "zh" ? "收藏" : "Save")}
          >
            <svg
              className="w-4 h-4 md:w-5 md:h-5"
              fill={favorited ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>

          {/* Score */}
          {isPracticed && highestScore !== undefined && (
            <span className={`font-bold text-base md:text-lg leading-none ${
              highestScore >= 80 ? "text-success" : highestScore >= 60 ? "text-warning" : "text-error"
            }`}>
              {highestScore}
            </span>
          )}

          {/* Delete (custom) or Arrow */}
          {isCustom ? (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(); }}
              className="p-1.5 md:p-2 text-foreground-muted hover:text-error hover:bg-error/5 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
              aria-label={locale === "zh" ? "删除" : "Delete"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <svg className="w-4 h-4 md:w-5 md:h-5 text-foreground-muted group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
    </Link>
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
