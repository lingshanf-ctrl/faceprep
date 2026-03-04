"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { questions as systemQuestions, Question } from "@/data/questions";
import { getPracticeRecords, PracticeRecord } from "@/lib/practice-store";
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
import { createInterviewSession, InterviewQuestion } from "@/lib/interview-store";
import {
  BookOpen,
  Plus,
  Trash2,
  Play,
  Search,
  X,
  Filter,
  ChevronRight,
  Sparkles,
  Target,
  Award,
  Clock,
  MoreHorizontal,
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

// 筛选配置
interface Filters {
  search: string;
  type: string;
  category: string;
  difficulty: string;
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
const categoryConfig: Record<string, { label: string; icon: string; color: string }> = {
  FRONTEND: { label: "前端", icon: "💻", color: "bg-blue-100" },
  BACKEND: { label: "后端", icon: "⚙️", color: "bg-green-100" },
  PRODUCT: { label: "产品", icon: "📱", color: "bg-purple-100" },
  DESIGN: { label: "设计", icon: "🎨", color: "bg-pink-100" },
  OPERATION: { label: "运营", icon: "📊", color: "bg-orange-100" },
  GENERAL: { label: "通用", icon: "🎯", color: "bg-gray-100" },
};

// 难度配置
const difficultyConfig: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: "简单", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  2: { label: "中等", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  3: { label: "困难", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

function QuestionsContent() {
  const { locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab 状态
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"library" | "custom">(
    tabParam === "custom" ? "custom" : "library"
  );

  // 筛选状态
  const [filters, setFilters] = useState<Filters>({
    search: "",
    type: "",
    category: "",
    difficulty: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // 练习状态
  const [practiceStatus, setPracticeStatus] = useState<
    Record<string, { practiced: boolean; highestScore: number; count: number }>
  >({});

  // 我的专属题库状态
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [selectedCustomQuestions, setSelectedCustomQuestions] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [parseText, setParseText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<{
    questions: ParsedQuestion[];
    total: number;
  } | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // 加载数据
  useEffect(() => {
    async function loadData() {
      const records = await getPracticeRecords();
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
    }

    loadData();
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

  // 当前展示的题目列表
  const currentQuestions = activeTab === "library" ? systemUnifiedQuestions : customUnifiedQuestions;

  // 筛选后的题目
  const filteredQuestions = useMemo(() => {
    return currentQuestions.filter((q) => {
      if (filters.type && q.type !== filters.type) return false;
      if (filters.category && q.category !== filters.category) return false;
      if (filters.difficulty && q.difficulty !== parseInt(filters.difficulty)) return false;
      if (filters.search.trim()) {
        const searchLower = filters.search.toLowerCase();
        const matchTitle = q.title.toLowerCase().includes(searchLower);
        const matchKeyPoints = q.keyPoints.toLowerCase().includes(searchLower);
        if (!matchTitle && !matchKeyPoints) return false;
      }
      return true;
    });
  }, [currentQuestions, filters]);

  // 切换 Tab
  const handleTabChange = (tab: "library" | "custom") => {
    setActiveTab(tab);
    setSelectedCustomQuestions(new Set());
    // 更新 URL
    const url = tab === "custom" ? "/questions?tab=custom" : "/questions";
    window.history.replaceState(null, "", url);
  };

  // 更新筛选
  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // 清空筛选
  const clearFilters = () => {
    setFilters({ search: "", type: "", category: "", difficulty: "" });
  };

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
  };

  // 删除自定义题目
  const handleDeleteCustom = (id: string) => {
    if (confirm("确定删除这道题吗？")) {
      deleteCustomQuestion(id);
      setCustomQuestions(getCustomQuestions());
      const newSelected = new Set(selectedCustomQuestions);
      newSelected.delete(id);
      setSelectedCustomQuestions(newSelected);
    }
  };

  // 选择/取消选择题目
  const toggleQuestionSelection = (id: string) => {
    const newSelected = new Set(selectedCustomQuestions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCustomQuestions(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedCustomQuestions.size === filteredQuestions.length) {
      setSelectedCustomQuestions(new Set());
    } else {
      setSelectedCustomQuestions(new Set(filteredQuestions.map((q) => q.id)));
    }
  };

  // 开始自定义面试
  const startCustomInterview = () => {
    if (selectedCustomQuestions.size === 0) return;
    const selected = customQuestions.filter((q) => selectedCustomQuestions.has(q.id));
    const interviewQuestions: InterviewQuestion[] = selected.map((q, idx) => ({
      id: q.id,
      title: q.title,
      type: q.type as InterviewQuestion["type"],
      difficulty: q.difficulty as InterviewQuestion["difficulty"],
      keyPoints: q.keyPoints,
      order: idx,
    }));
    const session = createInterviewSession("我的专属面试", "", undefined, interviewQuestions, {});
    router.push(`/interview/${session.id}`);
  };

  // 是否有过滤条件
  const hasFilters = Boolean(filters.search || filters.type || filters.category || filters.difficulty);

  // 计算统计数据
  const stats = useMemo(() => {
    const practicedCount = Object.keys(practiceStatus).length;
    const totalCount = systemQuestions.length;
    const progress = totalCount > 0 ? (practicedCount / totalCount) * 100 : 0;
    const avgScore =
      Object.values(practiceStatus).length > 0
        ? Math.round(
            Object.values(practiceStatus).reduce((sum, s) => sum + s.highestScore, 0) /
              Object.values(practiceStatus).length
          )
        : 0;
    return { practicedCount, totalCount, progress, avgScore };
  }, [practiceStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* 页面头部 - 简洁现代 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg shadow-accent/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {locale === "zh" ? "题库" : "Questions"}
            </h1>
          </div>
          <p className="text-foreground-muted text-sm sm:text-base ml-[52px]">
            {locale === "zh"
              ? `掌握面试核心，${systemQuestions.length}+ 精选题目助你成功`
              : `Master interview skills with ${systemQuestions.length}+ curated questions`}
          </p>
        </div>

        {/* Tab 切换 - 药丸式设计 */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center bg-surface rounded-full p-1 shadow-sm border border-border/50">
            <button
              onClick={() => handleTabChange("library")}
              className={`relative flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === "library"
                  ? "text-foreground"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {activeTab === "library" && (
                <span className="absolute inset-0 bg-white rounded-full shadow-sm border border-border/50" />
              )}
              <span className="relative flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {locale === "zh" ? "官方题库" : "Official"}
                <span className="hidden sm:inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] bg-foreground/5 rounded-full">
                  {systemQuestions.length}
                </span>
              </span>
            </button>
            <button
              onClick={() => handleTabChange("custom")}
              className={`relative flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === "custom"
                  ? "text-foreground"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {activeTab === "custom" && (
                <span className="absolute inset-0 bg-white rounded-full shadow-sm border border-border/50" />
              )}
              <span className="relative flex items-center gap-2">
                <Target className="w-4 h-4" />
                {locale === "zh" ? "我的专属" : "My Custom"}
                {customQuestions.length > 0 && (
                  <span className="hidden sm:inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] bg-accent/10 text-accent rounded-full">
                    {customQuestions.length}
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* 我的专属的操作按钮 */}
          {activeTab === "custom" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-full hover:bg-accent-dark transition-all shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{locale === "zh" ? "添加题目" : "Add"}</span>
            </button>
          )}
        </div>

        {/* 搜索与筛选栏 - 一体化设计 */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden mb-6">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
            <input
              type="text"
              placeholder={
                activeTab === "library"
                  ? locale === "zh"
                    ? "搜索官方题库..."
                    : "Search official questions..."
                  : locale === "zh"
                  ? "搜索我的题目..."
                  : "Search my questions..."
              }
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="w-full pl-12 pr-24 py-4 bg-transparent text-foreground placeholder-foreground-muted focus:outline-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {filters.search && (
                <button
                  onClick={() => updateFilter("search", "")}
                  className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                  showFilters || hasFilters
                    ? "bg-accent text-white"
                    : "bg-surface text-foreground-muted hover:text-foreground"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {locale === "zh" ? "筛选" : "Filter"}
                {hasFilters && (
                  <span className="flex items-center justify-center w-4 h-4 text-[10px] bg-white/20 rounded-full">
                    {[filters.type, filters.category, filters.difficulty].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 展开的筛选选项 */}
          {showFilters && (
            <div className="px-4 pb-4 border-t border-border/50 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* 题型筛选 */}
                <div className="relative">
                  <select
                    value={filters.type}
                    onChange={(e) => updateFilter("type", e.target.value)}
                    className={`appearance-none px-4 py-2 pr-10 text-sm rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                      filters.type
                        ? "bg-accent/5 border-accent/30 text-accent"
                        : "bg-surface border-border text-foreground"
                    }`}
                  >
                    <option value="">{locale === "zh" ? "全部题型" : "All Types"}</option>
                    {Object.entries(typeConfig).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-foreground-muted pointer-events-none" />
                </div>

                {/* 分类筛选 */}
                <div className="relative">
                  <select
                    value={filters.category}
                    onChange={(e) => updateFilter("category", e.target.value)}
                    className={`appearance-none px-4 py-2 pr-10 text-sm rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                      filters.category
                        ? "bg-accent/5 border-accent/30 text-accent"
                        : "bg-surface border-border text-foreground"
                    }`}
                  >
                    <option value="">{locale === "zh" ? "全部分类" : "All Categories"}</option>
                    {Object.entries(categoryConfig).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-foreground-muted pointer-events-none" />
                </div>

                {/* 难度筛选 */}
                <div className="relative">
                  <select
                    value={filters.difficulty}
                    onChange={(e) => updateFilter("difficulty", e.target.value)}
                    className={`appearance-none px-4 py-2 pr-10 text-sm rounded-xl border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/20 ${
                      filters.difficulty
                        ? "bg-accent/5 border-accent/30 text-accent"
                        : "bg-surface border-border text-foreground"
                    }`}
                  >
                    <option value="">{locale === "zh" ? "全部难度" : "All Levels"}</option>
                    <option value="1">{locale === "zh" ? "简单" : "Easy"}</option>
                    <option value="2">{locale === "zh" ? "中等" : "Medium"}</option>
                    <option value="3">{locale === "zh" ? "困难" : "Hard"}</option>
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-foreground-muted pointer-events-none" />
                </div>

                {/* 清空筛选 */}
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-sm text-foreground-muted hover:text-error transition-colors"
                  >
                    {locale === "zh" ? "清空" : "Clear"}
                  </button>
                )}

                {/* 结果计数 */}
                <div className="ml-auto text-sm text-foreground-muted">
                  {filteredQuestions.length > 0 && (
                    <span>
                      {locale === "zh" ? "共" : ""} {filteredQuestions.length}{" "}
                      {locale === "zh" ? "道题" : "questions"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 我的专属题库的操作栏 */}
        {activeTab === "custom" && customQuestions.length > 0 && (
          <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-accent/5 to-transparent rounded-xl border border-accent/10">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <button
                  onClick={toggleSelectAll}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    selectedCustomQuestions.size === filteredQuestions.length && filteredQuestions.length > 0
                      ? "bg-accent border-accent"
                      : selectedCustomQuestions.size > 0
                      ? "bg-accent/50 border-accent"
                      : "border-border group-hover:border-accent"
                  }`}
                >
                  {selectedCustomQuestions.size > 0 && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-foreground-muted">
                  {selectedCustomQuestions.size > 0
                    ? locale === "zh"
                      ? `已选 ${selectedCustomQuestions.size} 题`
                      : `${selectedCustomQuestions.size} selected`
                    : locale === "zh"
                    ? "全选"
                    : "Select all"}
                </span>
              </label>
            </div>
            {selectedCustomQuestions.size > 0 && (
              <button
                onClick={startCustomInterview}
                className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-white text-sm font-medium rounded-full hover:bg-foreground/90 transition-all shadow-lg active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                {locale === "zh" ? `开始面试 (${selectedCustomQuestions.size})` : `Start Interview`}
              </button>
            )}
          </div>
        )}

        {/* 题目列表 */}
        {filteredQuestions.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            activeTab={activeTab}
            locale={locale}
            onClearFilters={clearFilters}
            onAddQuestion={() => setShowAddModal(true)}
          />
        ) : (
          <div className="space-y-3">
            {filteredQuestions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                activeTab={activeTab}
                locale={locale}
                isPracticed={practiceStatus[question.id]?.practiced}
                highestScore={practiceStatus[question.id]?.highestScore}
                practiceCount={practiceStatus[question.id]?.count}
                isSelected={selectedCustomQuestions.has(question.id)}
                onToggleSelect={() => toggleQuestionSelection(question.id)}
                onDelete={() => handleDeleteCustom(question.id)}
              />
            ))}
          </div>
        )}

        {/* 官方题库统计 */}
        {activeTab === "library" && stats.totalCount > 0 && (
          <div className="mt-12">
            <div className="bg-gradient-to-br from-foreground to-foreground/90 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {locale === "zh" ? "练习进度" : "Practice Progress"}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {locale === "zh"
                        ? `已完成 ${stats.practicedCount}/${stats.totalCount} 道题目`
                        : `${stats.practicedCount}/${stats.totalCount} questions practiced`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{Math.round(stats.progress)}%</div>
                    <div className="text-white/60 text-xs mt-1">{locale === "zh" ? "完成度" : "Progress"}</div>
                  </div>
                  {stats.avgScore > 0 && (
                    <div className="text-center">
                      <div
                        className={`text-3xl font-bold ${
                          stats.avgScore >= 80 ? "text-green-400" : stats.avgScore >= 60 ? "text-amber-400" : "text-red-400"
                        }`}
                      >
                        {stats.avgScore}
                      </div>
                      <div className="text-white/60 text-xs mt-1">{locale === "zh" ? "平均分" : "Avg Score"}</div>
                    </div>
                  )}
                </div>
              </div>
              {/* 进度条 */}
              <div className="mt-6">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${stats.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 添加题目弹窗 */}
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

// 题目卡片组件
interface QuestionCardProps {
  question: UnifiedQuestion;
  index: number;
  activeTab: "library" | "custom";
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
  activeTab,
  locale,
  isPracticed,
  highestScore,
  practiceCount,
  isSelected,
  onToggleSelect,
  onDelete,
}: QuestionCardProps) {
  const typeInfo = typeConfig[question.type] || { label: question.type, color: "", bg: "", icon: "" };
  const categoryInfo = categoryConfig[question.category] || { label: question.category, icon: "", color: "" };
  const difficultyInfo = difficultyConfig[question.difficulty] || { label: "", color: "", bg: "", border: "" };

  return (
    <div
      className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
        activeTab === "custom" && isSelected
          ? "border-accent shadow-lg shadow-accent/10"
          : "border-border/50 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* 选择框（仅我的专属） */}
          {activeTab === "custom" && (
            <button
              onClick={onToggleSelect}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
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

          {/* 题目内容 */}
          <div className="flex-1 min-w-0">
            {/* 标签行 */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${typeInfo.bg} ${typeInfo.color}`}
              >
                <span>{typeInfo.icon}</span>
                {typeInfo.label}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-foreground-muted bg-surface">
                <span>{categoryInfo.icon}</span>
                {categoryInfo.label}
              </span>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${difficultyInfo.color} ${difficultyInfo.bg} ${difficultyInfo.border}`}
              >
                {difficultyInfo.label}
              </span>
              {question.frequency && question.frequency >= 2 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-amber-600 bg-amber-50 border border-amber-100">
                  <span className="w-1 h-1 rounded-full bg-amber-500" />
                  {locale === "zh" ? "高频" : "Hot"}
                </span>
              )}
              {isPracticed && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-green-600 bg-green-50 border border-green-100">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {locale === "zh" ? "已练习" : "Done"}
                </span>
              )}
            </div>

            {/* 标题 */}
            <h3 className="font-semibold text-foreground mb-2 leading-relaxed">
              {activeTab === "library" ? (
                <Link href={`/questions/${question.id}`} className="hover:text-accent transition-colors">
                  {question.title}
                </Link>
              ) : (
                question.title
              )}
            </h3>

            {/* 考察点 */}
            {question.keyPoints && (
              <p className="text-foreground-muted text-sm line-clamp-2">{question.keyPoints}</p>
            )}
          </div>

          {/* 右侧操作 */}
          <div className="shrink-0 flex flex-col items-end gap-3">
            {/* 分数 */}
            {isPracticed && highestScore !== undefined && (
              <div className="flex items-center gap-2">
                <div
                  className={`font-display text-3xl font-bold ${
                    highestScore >= 80 ? "text-green-500" : highestScore >= 60 ? "text-amber-500" : "text-red-500"
                  }`}
                >
                  {highestScore}
                </div>
                {practiceCount && practiceCount > 1 && (
                  <span className="text-xs text-foreground-muted bg-surface px-2 py-1 rounded-full">
                    {practiceCount}次
                  </span>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center gap-1">
              {activeTab === "library" && (
                <Link
                  href={`/questions/${question.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/5 rounded-xl transition-all"
                >
                  {locale === "zh" ? "练习" : "Practice"}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}

              {activeTab === "custom" && (
                <button
                  onClick={onDelete}
                  className="p-2 text-foreground-muted hover:text-error hover:bg-error/5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
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

// 空状态组件
interface EmptyStateProps {
  hasFilters: boolean;
  activeTab: "library" | "custom";
  locale: string;
  onClearFilters: () => void;
  onAddQuestion: () => void;
}

function EmptyState({ hasFilters, activeTab, locale, onClearFilters, onAddQuestion }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-24 h-24 bg-gradient-to-br from-surface to-background rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
        <span className="text-5xl">{hasFilters ? "🔍" : activeTab === "custom" ? "📝" : "📚"}</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {hasFilters
          ? locale === "zh"
            ? "没有找到符合条件的题目"
            : "No questions found"
          : activeTab === "custom"
          ? locale === "zh"
            ? "还没有专属题目"
            : "No custom questions yet"
          : locale === "zh"
          ? "题库空空如也"
          : "No questions available"}
      </h3>
      <p className="text-foreground-muted text-sm max-w-sm mx-auto mb-6">
        {hasFilters
          ? locale === "zh"
            ? "尝试调整筛选条件，或清除筛选查看更多题目"
            : "Try adjusting your filters or clear them to see more"
          : activeTab === "custom"
          ? locale === "zh"
            ? "添加你的第一道题，开始个性化面试准备"
            : "Add your first question to start personalized preparation"
          : locale === "zh"
          ? "题库正在建设中，敬请期待"
          : "Question bank is under construction"}
      </p>
      {activeTab === "custom" && !hasFilters && (
        <button
          onClick={onAddQuestion}
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all shadow-lg shadow-accent/20"
        >
          <Plus className="w-5 h-5" />
          {locale === "zh" ? "添加第一道题目" : "Add your first question"}
        </button>
      )}
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 px-6 py-3 bg-surface text-foreground rounded-xl font-medium hover:bg-border transition-all"
        >
          <X className="w-4 h-4" />
          {locale === "zh" ? "清除筛选条件" : "Clear filters"}
        </button>
      )}
    </div>
  );
}

// 添加题目弹窗组件
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
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground">
              {locale === "zh" ? "添加专属题目" : "Add Custom Questions"}
            </h3>
            <p className="text-sm text-foreground-muted mt-1">
              {locale === "zh" ? "支持多种格式，AI 智能识别" : "Multiple formats supported, AI-powered parsing"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-foreground-muted hover:text-foreground hover:bg-surface rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {!parsedPreview ? (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-accent/5 to-transparent border border-accent/10 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {locale === "zh" ? "智能识别多种格式" : "Smart format recognition"}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {locale === "zh"
                        ? "支持 1. / - / (1) / 第一题：等各种编号格式，自动识别题型和难度"
                        : "Supports 1. / - / (1) / Question 1: formats with auto type & difficulty detection"}
                    </p>
                  </div>
                </div>
              </div>
              <textarea
                value={parseText}
                onChange={(e) => setParseText(e.target.value)}
                placeholder={
                  locale === "zh"
                    ? "在此粘贴你的面试题目...\n\n例如：\n1. 请介绍一下你自己\n2. React 的虚拟 DOM 原理是什么？\n3. 你最大的优点是什么？"
                    : "Paste your interview questions here..."
                }
                className="w-full h-56 px-4 py-4 bg-surface border border-border rounded-2xl text-foreground placeholder-foreground-muted focus:outline-none focus:border-accent/30 focus:ring-4 focus:ring-accent/5 resize-none transition-all"
              />
              <button
                onClick={onParse}
                disabled={!parseText.trim() || isParsing}
                className="w-full py-3.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark disabled:opacity-50 transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
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
              <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                <span className="font-medium text-foreground">
                  {locale === "zh" ? `共识别 ${parsedPreview.total} 道题目` : `${parsedPreview.total} questions found`}
                </span>
                <span className="text-sm text-accent font-medium">
                  {locale === "zh" ? `已选 ${selectedCount} 道` : `${selectedCount} selected`}
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
                        : "bg-surface border-border opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          q.selected ? "bg-accent border-accent" : "border-border"
                        }`}
                      >
                        {q.selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-foreground-muted font-mono">#{idx + 1}</span>
                          <span className="text-xs px-2 py-0.5 rounded-lg bg-accent/10 text-accent font-medium">
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

        {/* 底部按钮 */}
        {parsedPreview && (
          <div className="flex gap-3 p-6 border-t border-border">
            <button
              onClick={() => setParsedPreview(null)}
              className="px-6 py-3 border border-border rounded-xl font-medium text-foreground hover:bg-surface transition-all"
            >
              {locale === "zh" ? "重新编辑" : "Re-edit"}
            </button>
            <button
              onClick={onSave}
              disabled={selectedCount === 0}
              className="flex-1 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark disabled:opacity-50 transition-all shadow-lg shadow-accent/20"
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
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface rounded-xl"></div>
            <div className="h-8 bg-surface rounded-lg w-32"></div>
          </div>
          <div className="h-14 bg-surface rounded-full w-64"></div>
          <div className="h-16 bg-surface rounded-2xl"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 bg-surface rounded-2xl"></div>
            ))}
          </div>
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
