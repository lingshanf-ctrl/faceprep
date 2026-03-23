"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { getPracticeRecords, PracticeRecord } from "@/lib/practice-store";
import { getInterviewSessionsAsync, InterviewSession, updateInterviewTitle, cloneInterviewSessionAsync } from "@/lib/interview-store";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { getScoreColor } from "@/lib/ui-helpers";
import { formatFriendlyDate } from "@/lib/ui-helpers";
import {
  TrendingUp,
  Flame,
  FileText,
  Pencil,
  ChevronRight,
  Check,
  X,
  Target,
  Calendar,
  Loader2,
  Users,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useRouter } from "next/navigation";

interface CombinedRecord {
  id: string;
  type: "practice" | "interview";
  title: string;
  score: number;
  date: string;
  details?: string;
  questionCount?: number;
  questionId?: string;
  evaluationStatus?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  isAIUpgrading?: boolean;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryPage() {
  const { locale } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<"all" | "practice" | "interview">("all");
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 编辑标题状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    setMounted(true);
    // Load practice records from API
    async function loadData() {
      try {
        const records = await getPracticeRecords();
        setPracticeRecords(records);
      } catch (error) {
        console.error("Failed to load practice records:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 使用 state 来管理面试会话，以便编辑后刷新
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);

  useEffect(() => {
    async function loadInterviewSessions() {
      try {
        const allSessions = await getInterviewSessionsAsync();
        const sessions = allSessions.filter((s) => s.status === "completed");
        setInterviewSessions(sessions);
      } catch (error) {
        console.error("Failed to load interview sessions:", error);
      }
    }
    loadInterviewSessions();
  }, []);

  // 开始编辑标题
  const startEditTitle = (session: InterviewSession) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  // 保存标题
  const saveTitle = async (id: string) => {
    if (editTitle.trim()) {
      updateInterviewTitle(id, editTitle.trim());
      // 刷新列表
      const allSessions = await getInterviewSessionsAsync();
      setInterviewSessions(allSessions.filter((s) => s.status === "completed"));
    }
    setEditingId(null);
    setEditTitle("");
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  // 再练一次
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const handleRetry = async (session: InterviewSession) => {
    setRetryingId(session.id);
    try {
      const newSession = await cloneInterviewSessionAsync(session.id);
      if (newSession) {
        router.push(`/interview/${newSession.id}`);
      }
    } finally {
      setRetryingId(null);
    }
  };

  // Combine and sort records
  const combinedRecords: CombinedRecord[] = useMemo(() => {
    const practices: CombinedRecord[] = practiceRecords.map((r) => ({
      id: r.id,
      type: "practice",
      title: r.questionTitle,
      score: r.score,
      date: r.createdAt,
      details: r.answer.slice(0, 60) + "...",
      questionId: r.questionId,
      evaluationStatus: r.evaluationStatus,
      isAIUpgrading: !!(r.evaluationStatus === "COMPLETED" && (r.feedback as unknown as { aiUpgrading?: boolean })?.aiUpgrading),
    }));

    const interviews: CombinedRecord[] = interviewSessions.map((s) => ({
      id: s.id,
      type: "interview",
      title: s.title,
      score: s.overallScore || 0,
      date: s.completedAt || s.createdAt,
      details: s.jobInfo.company || undefined,
      questionCount: s.questions.length,
    }));

    return [...practices, ...interviews].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [practiceRecords, interviewSessions]);

  // Filter records
  const filteredRecords = useMemo(() => {
    if (filter === "all") return combinedRecords;
    return combinedRecords.filter((r) => r.type === filter);
  }, [combinedRecords, filter]);

  // Group by date
  const groupedRecords = useMemo(() => {
    const groups: { date: string; label: string; records: CombinedRecord[] }[] = [];
    filteredRecords.forEach((record) => {
      const recordDate = new Date(record.date).toDateString();
      let label = formatFriendlyDate(record.date, locale as "zh" | "en");
      const existingGroup = groups.find((g) => g.date === recordDate);
      if (existingGroup) {
        existingGroup.records.push(record);
      } else {
        groups.push({ date: recordDate, label, records: [record] });
      }
    });
    return groups;
  }, [filteredRecords, locale]);

  // Stats
  const stats = useMemo(() => {
    const totalPractices = practiceRecords.length;
    const totalInterviews = interviewSessions.length;
    const allScores = [
      ...practiceRecords.map((r) => r.score),
      ...interviewSessions.map((s) => s.overallScore || 0),
    ].filter((s) => s > 0);

    const averageScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0;

    // Calculate streak
    const practiceDates = new Set(
      practiceRecords.map((r) => new Date(r.createdAt).toDateString())
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      if (practiceDates.has(checkDate.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      totalPractices,
      totalInterviews,
      averageScore,
      streak,
      totalRecords: totalPractices + totalInterviews,
    };
  }, [practiceRecords, interviewSessions]);

  // 检查用户登录状态
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me");
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState
          variant="skeleton"
          fullScreen
          message={locale === "zh" ? "加载记录中..." : "Loading records..."}
        />
      </div>
    );
  }

  // Empty state
  if (!loading && combinedRecords.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              {locale === "zh" ? "学习记录" : "History"}
            </h1>
            <p className="text-sm text-foreground-muted">{locale === "zh" ? "追踪你的进步轨迹" : "Track your progress"}</p>
          </div>

          {/* 未登录用户提示 */}
          {!isAuthenticated && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-amber-900 mb-1">
                    {locale === "zh" ? "数据仅保存在当前设备" : "Data only saved on this device"}
                  </h3>
                  <p className="text-sm text-amber-700 mb-3">
                    {locale === "zh"
                      ? "登录后可以永久保存练习记录，在任何设备上查看"
                      : "Login to permanently save your practice records and access them from any device"}
                  </p>
                  <Link
                    href="/login?redirect=/history"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 hover:text-amber-900 underline"
                  >
                    {locale === "zh" ? "立即登录" : "Login now"}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}

          <EmptyState
            icon="📊"
            title={locale === "zh" ? "还没有学习记录" : "No records yet"}
            description={locale === "zh" ? "开始练习，记录你的成长轨迹" : "Start practicing to track your progress"}
            action={{
              label: locale === "zh" ? "开始练习" : "Start Practice",
              href: "/practice"
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={locale === "zh" ? "练习历史" : "Practice History"}
        subtitle={locale === "zh" ? "Session Archives" : "Session Archives"}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-0">

        {/* 未登录用户提示 */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-amber-900 mb-1">
                  {locale === "zh" ? "数据仅保存在当前设备" : "Data only saved on this device"}
                </h3>
                <p className="text-sm text-amber-700 mb-3">
                  {locale === "zh"
                    ? "登录后可以永久保存练习记录，在任何设备上查看"
                    : "Login to permanently save your practice records and access them from any device"}
                </p>
                <Link
                  href="/login?redirect=/history"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 hover:text-amber-900 underline"
                >
                  {locale === "zh" ? "立即登录" : "Login now"}
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats KPI Panel */}
        <div className="bg-[#f6f3f2] rounded-xl mb-6 overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-border/10">
            <div className="p-4 text-center">
              <div className="text-xs text-foreground-muted mb-1.5 flex items-center justify-center gap-1">
                <Target className="w-3.5 h-3.5" />
                {locale === "zh" ? "练习" : "Practices"}
              </div>
              <div className="text-2xl font-bold tabular-nums text-foreground">{stats.totalPractices}</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-xs text-foreground-muted mb-1.5 flex items-center justify-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                {locale === "zh" ? "平均分" : "Average"}
              </div>
              <div className={`text-2xl font-bold tabular-nums ${getScoreColor(stats.averageScore)}`}>
                {stats.averageScore > 0 ? stats.averageScore : "—"}
              </div>
            </div>
            <div className="p-4 text-center">
              <div className="text-xs text-foreground-muted mb-1.5 flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {locale === "zh" ? "连续天" : "Streak"}
              </div>
              <div className="text-2xl font-bold tabular-nums text-foreground flex items-center justify-center gap-1">
                {stats.streak}
                {stats.streak > 0 && <Flame className="w-4 h-4 text-warning fill-warning" />}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-8 mb-10 border-b border-[#eae7e7]">
          {([
            { value: "all" as const, label: locale === "zh" ? "全部" : "All", count: stats.totalRecords },
            { value: "practice" as const, label: locale === "zh" ? "练习" : "Practice", count: stats.totalPractices },
            { value: "interview" as const, label: locale === "zh" ? "面试" : "Interview", count: stats.totalInterviews },
          ]).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex items-center gap-1.5 pb-4 text-sm tracking-wide transition-all duration-200 ${
                filter === tab.value
                  ? "font-bold text-[#004ac6] border-b-2 border-[#004ac6]"
                  : "font-medium text-[#5f5e5e] hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="text-xs tabular-nums text-foreground-muted">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-10">
          {groupedRecords.map((group) => (
            <div key={group.date}>
              {/* Date Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#004ac6] flex-shrink-0" />
                  <span className="text-xs font-semibold text-foreground-muted uppercase tracking-widest">
                    {group.label}
                  </span>
                </div>
                <span className="text-xs text-foreground-muted">
                  {group.records.length} {locale === "zh" ? "条" : "records"}
                </span>
              </div>

              {/* Records */}
              <div className="space-y-3">
                {group.records.map((record) => {
                  const isEditing = editingId === record.id && record.type === "interview";

                  const reportHref = record.type === "practice"
                    ? `/practice/review/${record.id}`
                    : `/interview/${record.id}/report`;

                  return (
                    <div
                      key={`${record.type}-${record.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => { if (!isEditing) router.push(reportHref); }}
                      onKeyDown={(e) => { if (!isEditing && (e.key === "Enter" || e.key === " ")) router.push(reportHref); }}
                      className="group flex items-start md:items-center gap-2 md:gap-4 p-3 md:p-5 bg-[#f6f3f2] rounded-xl hover:bg-white hover:shadow-[0_20px_40px_rgba(28,27,27,0.06)] transition-all cursor-pointer"
                    >
                      {/* Icon box */}
                      <div className={`w-9 h-9 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        record.type === "interview" ? "bg-[#eef1ff]" : "bg-[#f2f2f2]"
                      }`}>
                        {record.type === "interview"
                          ? <Users className="w-4 h-4 md:w-6 md:h-6 text-[#004ac6]" />
                          : <User className="w-4 h-4 md:w-6 md:h-6 text-[#888]" />
                        }
                      </div>

                      {/* Middle */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-48 sm:w-64 px-3 py-2 text-sm bg-surface border-2 border-accent rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveTitle(record.id);
                                if (e.key === "Escape") cancelEdit();
                              }}
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); saveTitle(record.id); }}
                              className="p-2 text-success hover:bg-success/10 rounded-xl transition-colors"
                              aria-label={locale === "zh" ? "保存" : "Save"}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                              className="p-2 text-foreground-muted hover:bg-surface rounded-xl transition-colors"
                              aria-label={locale === "zh" ? "取消" : "Cancel"}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="mb-1.5">
                            {/* title + pencil on same line, never wrap between them */}
                            <div className="flex items-center gap-1.5 mb-1">
                              <h4 className="font-bold text-foreground text-sm sm:text-base leading-tight group-hover:text-accent transition-colors truncate">
                                {record.title}
                              </h4>
                              {record.type === "interview" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); startEditTitle(record as unknown as InterviewSession); }}
                                  className="p-1 text-foreground-muted hover:text-accent transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                                  aria-label={locale === "zh" ? "编辑标题" : "Edit title"}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            {/* type badge on its own line */}
                            <span className="inline-block text-[10px] px-2 py-0.5 rounded font-semibold tracking-wider uppercase bg-[#eef1ff] text-[#004ac6] border border-[#c5d0f5]">
                              {record.type === "interview"
                                ? (locale === "zh" ? "模拟面试" : "Mock Interview")
                                : (locale === "zh" ? "练习" : "Practice")}
                            </span>
                          </div>
                        )}
                        {/* meta row */}
                        <div className="flex items-center gap-3 text-xs text-foreground-muted flex-wrap">
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Calendar className="w-3 h-3" />
                            {new Date(record.date).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                          {record.questionCount && (
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <FileText className="w-3 h-3" />
                              {record.questionCount} {locale === "zh" ? "道题" : "questions"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score box */}
                      <div className="flex-shrink-0 text-center md:min-w-[100px]">
                        {record.type === "practice" && (record.evaluationStatus === "PENDING" || record.evaluationStatus === "PROCESSING") ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="hidden md:inline">{locale === "zh" ? "分析中" : "Analyzing"}</span>
                          </span>
                        ) : (
                          <>
                            <div className="text-xs text-foreground-muted mb-0.5 hidden md:block">
                              {locale === "zh" ? "得分" : "Score"}
                            </div>
                            <div className="text-xl md:text-2xl font-bold text-[#004ac6] leading-none md:mb-1.5">
                              {record.score}<span className="text-xs md:text-base font-semibold">%</span>
                            </div>
                            <span className="hidden md:inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                              {locale === "zh" ? "已完成" : "Completed"}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Practice Again */}
                      {record.type === "interview" ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRetry(record as unknown as InterviewSession); }}
                          disabled={retryingId === record.id}
                          className="flex-shrink-0 px-2.5 py-1 md:px-4 md:py-2.5 bg-[#004ac6] text-white text-xs md:text-sm font-semibold rounded-lg md:rounded-xl hover:bg-[#003aad] transition-colors whitespace-nowrap disabled:opacity-60"
                        >
                          {retryingId === record.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>{locale === "zh" ? "再练" : "Retry"}<span className="hidden md:inline">{locale === "zh" ? "一次" : " Again"}</span></>
                          )}
                        </button>
                      ) : record.questionId && record.evaluationStatus === "COMPLETED" ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/questions/${record.questionId}`); }}
                          className="flex-shrink-0 px-2.5 py-1 md:px-4 md:py-2.5 bg-[#004ac6] text-white text-xs md:text-sm font-semibold rounded-lg md:rounded-xl hover:bg-[#003aad] transition-colors whitespace-nowrap"
                        >
                          {locale === "zh" ? "再练" : "Retry"}
                          <span className="hidden md:inline">{locale === "zh" ? "一次" : " Again"}</span>
                        </button>
                      ) : null}

                      {/* Arrow */}
                      <svg
                        className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 text-[#c3c6d7] group-hover:text-[#004ac6] transition-colors"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Load More / End */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface rounded-full border border-border">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted/50" />
            <span className="text-sm text-foreground-muted">
              {locale === "zh" ? "已经到底了" : "End of records"}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted/50" />
          </div>
        </div>
      </div>
    </div>
  );
}