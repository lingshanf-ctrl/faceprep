"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { getPracticeRecords, PracticeRecord } from "@/lib/practice-store";
import { getInterviewSessionsAsync, InterviewSession, updateInterviewTitle, cloneInterviewSession } from "@/lib/interview-store";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreBadge } from "@/components/ui/score-badge";
import { getScoreColor } from "@/lib/ui-helpers";
import { formatFriendlyDate } from "@/lib/ui-helpers";
import {
  Clock,
  TrendingUp,
  Flame,
  FileText,
  MessageSquare,
  ChevronRight,
  Pencil,
  RotateCcw,
  Check,
  X,
  History,
  Target,
  Calendar
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface CombinedRecord {
  id: string;
  type: "practice" | "interview";
  title: string;
  score: number;
  date: string;
  details?: string;
  questionCount?: number;
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
  const handleRetry = async (session: InterviewSession) => {
    const newSession = cloneInterviewSession(session.id);
    if (newSession) {
      // 刷新列表
      const allSessions = await getInterviewSessionsAsync();
      setInterviewSessions(allSessions.filter((s) => s.status === "completed"));
      // 跳转到新面试
      router.push(`/interview/${newSession.id}`);
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
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background gradient */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {locale === "zh" ? "学习记录" : "History"}
            </h1>
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/10 rounded-full blur-[120px]" />
        <div className="absolute top-40 -right-20 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 -left-20 w-[500px] h-[500px] bg-success/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 relative z-10">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
              <History className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-accent">
              {locale === "zh" ? "学习轨迹" : "Learning Journey"}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
            {locale === "zh" ? "学习记录" : "History"}
          </h1>
          <p className="text-foreground-muted text-base">
            {locale === "zh" ? "追踪你的进步轨迹，见证每一步成长" : "Track your progress and witness every step of growth"}
          </p>
        </motion.div>

        {/* 未登录用户提示 */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl"
          >
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
          </motion.div>
        )}

        {/* Stats - Enhanced with gradient effects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {/* Practice Count */}
          <div className="group relative bg-white rounded-2xl p-4 text-center border border-border overflow-hidden transition-all duration-300 hover:shadow-soft-lg hover:border-accent/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-1.5 text-foreground-muted mb-2">
                <div className="p-1.5 bg-gradient-to-br from-accent/20 to-accent/5 rounded-lg border border-accent/20">
                  <Target className="w-3.5 h-3.5 text-accent" />
                </div>
                <span className="text-xs font-medium">{locale === "zh" ? "练习" : "Practices"}</span>
              </div>
              <div className="text-2xl font-display font-bold text-foreground group-hover:text-accent transition-colors">
                {stats.totalPractices}
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className="group relative bg-white rounded-2xl p-4 text-center border border-border overflow-hidden transition-all duration-300 hover:shadow-soft-lg hover:border-success/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-1.5 text-foreground-muted mb-2">
                <div className="p-1.5 bg-gradient-to-br from-success/20 to-success/5 rounded-lg border border-success/20">
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                </div>
                <span className="text-xs font-medium">{locale === "zh" ? "平均分" : "Average"}</span>
              </div>
              <div className={`text-2xl font-display font-bold ${getScoreColor(stats.averageScore)}`}>
                {stats.averageScore > 0 ? stats.averageScore : "-"}
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="group relative bg-white rounded-2xl p-4 text-center border border-border overflow-hidden transition-all duration-300 hover:shadow-soft-lg hover:border-warning/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-1.5 text-foreground-muted mb-2">
                <div className="p-1.5 bg-gradient-to-br from-warning/20 to-warning/5 rounded-lg border border-warning/20">
                  <Flame className="w-3.5 h-3.5 text-warning" />
                </div>
                <span className="text-xs font-medium">{locale === "zh" ? "连续" : "Streak"}</span>
              </div>
              <div className="text-2xl font-display font-bold text-foreground flex items-center justify-center gap-1">
                {stats.streak}
                {stats.streak > 0 && (
                  <Flame className="w-5 h-5 text-warning fill-warning animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide"
        >
          <button
            onClick={() => setFilter("all")}
            className={`group relative px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
              filter === "all"
                ? "bg-gradient-to-r from-accent to-accent-light text-white shadow-glow scale-105"
                : "bg-white text-foreground-muted hover:text-foreground border border-border hover:border-accent/30 hover:shadow-soft-sm"
            }`}
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              {locale === "zh" ? "全部" : "All"}
            </span>
            <span className="ml-1.5 text-xs opacity-70">({stats.totalRecords})</span>
          </button>

          <button
            onClick={() => setFilter("practice")}
            className={`group relative px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
              filter === "practice"
                ? "bg-gradient-to-r from-accent to-accent-light text-white shadow-glow scale-105"
                : "bg-white text-foreground-muted hover:text-foreground border border-border hover:border-accent/30 hover:shadow-soft-sm"
            }`}
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              {locale === "zh" ? "练习" : "Practice"}
            </span>
            <span className="ml-1.5 text-xs opacity-70">({stats.totalPractices})</span>
          </button>

          <button
            onClick={() => setFilter("interview")}
            className={`group relative px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
              filter === "interview"
                ? "bg-gradient-to-r from-success to-success-light text-white shadow-glow scale-105"
                : "bg-white text-foreground-muted hover:text-foreground border border-border hover:border-success/30 hover:shadow-soft-sm"
            }`}
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              {locale === "zh" ? "面试" : "Interview"}
            </span>
            <span className="ml-1.5 text-xs opacity-70">({stats.totalInterviews})</span>
          </button>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-8"
        >
          {groupedRecords.map((group, groupIndex) => (
            <div key={group.date} className="animate-fade-up" style={{ animationDelay: `${0.3 + groupIndex * 0.1}s` }}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-accent/10 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{group.label}</span>
                </div>
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-xs font-medium text-foreground-muted bg-surface px-2.5 py-1 rounded-full border border-border">
                  {group.records.length} {locale === "zh" ? "条记录" : "records"}
                </span>
              </div>

              {/* Records */}
              <div className="space-y-3">
                {group.records.map((record, recordIndex) => {
                  const isEditing = editingId === record.id && record.type === "interview";
                  const isInterview = record.type === "interview";

                  return (
                    <div
                      key={`${record.type}-${record.id}`}
                      className="group p-4 bg-white rounded-2xl border-2 border-border hover:border-accent/30 hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-300"
                      style={{ animationDelay: `${recordIndex * 0.05}s` }}
                    >
                      {/* Mobile & Desktop Layout */}
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Type Icon - 固定大小 */}
                        <Link
                          href={
                            record.type === "practice"
                              ? `/practice/review/${record.id}`
                              : `/interview/${record.id}/report`
                          }
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            record.type === "practice"
                              ? "bg-gradient-to-br from-accent/20 to-accent/10 text-accent group-hover:shadow-soft-sm"
                              : "bg-gradient-to-br from-success/20 to-success/10 text-success group-hover:shadow-soft-sm"
                          }`}
                        >
                          {record.type === "practice" ? (
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </Link>

                        {/* Content - 占据剩余空间 */}
                        <div className="flex-1 min-w-0">
                          {/* Title Row: 标题 + 分数 */}
                          {isEditing ? (
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm bg-surface border-2 border-accent rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveTitle(record.id);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                              />
                              <button
                                onClick={() => saveTitle(record.id)}
                                className="p-2 text-success hover:bg-success/10 rounded-xl transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-2 text-foreground-muted hover:bg-surface rounded-xl transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-1.5">
                              <Link
                                href={
                                  record.type === "practice"
                                    ? `/practice/review/${record.id}`
                                    : `/interview/${record.id}/report`
                                }
                                className="flex-1 min-w-0"
                              >
                                <h4 className="font-semibold text-foreground text-sm sm:text-base leading-tight line-clamp-2 sm:line-clamp-1 group-hover:text-accent transition-colors">
                                  {record.title}
                                </h4>
                              </Link>
                              {/* Score Badge - 紧跟标题 */}
                              <Link
                                href={
                                  record.type === "practice"
                                    ? `/practice/review/${record.id}`
                                    : `/interview/${record.id}/report`
                                }
                                className="flex-shrink-0"
                              >
                                <ScoreBadge score={record.score} size="sm" className="sm:text-sm" />
                              </Link>
                            </div>
                          )}

                          {/* Meta Row: 时间 + 详情 + 操作按钮 */}
                          <div className="flex items-center justify-between gap-2">
                            {/* 时间和详情 */}
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-foreground-muted min-w-0 flex-1">
                              <span className="font-medium flex-shrink-0">{formatTime(record.date)}</span>
                              {record.details && (
                                <>
                                  <span className="text-border flex-shrink-0">•</span>
                                  <span className="truncate">{record.details}</span>
                                </>
                              )}
                              {record.questionCount && (
                                <>
                                  <span className="text-border flex-shrink-0">•</span>
                                  <span className="px-1.5 sm:px-2 py-0.5 bg-surface rounded-full border border-border font-medium flex-shrink-0">
                                    {record.questionCount} {locale === "zh" ? "题" : "Q"}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* 操作按钮 - 更紧凑的设计 */}
                            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                              {/* Interview Actions - 移动端始终显示，桌面端hover显示 */}
                              {isInterview && (
                                <>
                                  <button
                                    onClick={() => startEditTitle(record as unknown as InterviewSession)}
                                    className="p-1.5 sm:p-2 text-foreground-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                                    title={locale === "zh" ? "编辑名称" : "Edit name"}
                                  >
                                    <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRetry(record as unknown as InterviewSession)}
                                    className="p-1.5 sm:p-2 text-foreground-muted hover:text-success hover:bg-success/10 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                                    title={locale === "zh" ? "再练一次" : "Practice again"}
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                </>
                              )}

                              <Link
                                href={
                                  record.type === "practice"
                                    ? `/practice/review/${record.id}`
                                    : `/interview/${record.id}/report`
                                }
                                className="p-1.5 sm:p-2 text-foreground-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                              >
                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Load More / End */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface rounded-full border border-border">
            <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted/50" />
            <span className="text-sm text-foreground-muted">
              {locale === "zh" ? "已经到底了" : "End of records"}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted/50" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
