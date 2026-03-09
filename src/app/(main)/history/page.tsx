"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { getPracticeRecords, PracticeRecord } from "@/lib/practice-store";
import { getInterviewSessionsAsync, InterviewSession, updateInterviewTitle, cloneInterviewSession } from "@/lib/interview-store";
import { Clock, TrendingUp, Flame, FileText, MessageSquare, ChevronRight, Pencil, RotateCcw, Trash2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface CombinedRecord {
  id: string;
  type: "practice" | "interview";
  title: string;
  score: number;
  date: string;
  details?: string;
  questionCount?: number;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-rose-500";
}

function formatDateLabel(dateStr: string, locale: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return locale === "zh" ? "今天" : "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return locale === "zh" ? "昨天" : "Yesterday";
  } else {
    return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
    });
  }
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
      let label = formatDateLabel(record.date, locale);
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-surface rounded-lg w-32"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-surface rounded-xl"></div>
              <div className="h-20 bg-surface rounded-xl"></div>
              <div className="h-20 bg-surface rounded-xl"></div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-surface rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && combinedRecords.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-bold text-foreground mb-8">
            {locale === "zh" ? "学习记录" : "History"}
          </h1>

          <div className="text-center py-20">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-foreground-muted" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {locale === "zh" ? "还没有学习记录" : "No records yet"}
            </h3>
            <p className="text-foreground-muted mb-8">
              {locale === "zh" ? "开始练习，记录你的成长" : "Start practicing to track your progress"}
            </p>
            <Link
              href="/practice"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all"
            >
              {locale === "zh" ? "开始练习" : "Start Practice"}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {locale === "zh" ? "学习记录" : "History"}
          </h1>
          <p className="text-foreground-muted">
            {locale === "zh" ? "追踪你的进步轨迹" : "Track your learning journey"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-surface rounded-2xl p-4 text-center border border-border">
            <div className="flex items-center justify-center gap-1 text-foreground-muted mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs">{locale === "zh" ? "练习" : "Practices"}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.totalPractices}</div>
          </div>
          <div className="bg-surface rounded-2xl p-4 text-center border border-border">
            <div className="flex items-center justify-center gap-1 text-foreground-muted mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">{locale === "zh" ? "平均" : "Average"}</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
              {stats.averageScore}
            </div>
          </div>
          <div className="bg-surface rounded-2xl p-4 text-center border border-border">
            <div className="flex items-center justify-center gap-1 text-foreground-muted mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs">{locale === "zh" ? "连续" : "Streak"}</span>
            </div>
            <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
              {stats.streak}
              {stats.streak > 0 && <span className="text-lg">🔥</span>}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === "all"
                ? "bg-foreground text-white"
                : "bg-surface text-foreground-muted hover:text-foreground border border-border"
            }`}
          >
            {locale === "zh" ? "全部" : "All"} ({stats.totalRecords})
          </button>
          <button
            onClick={() => setFilter("practice")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === "practice"
                ? "bg-accent text-white"
                : "bg-surface text-foreground-muted hover:text-foreground border border-border"
            }`}
          >
            🔵 {locale === "zh" ? "练习" : "Practice"} ({stats.totalPractices})
          </button>
          <button
            onClick={() => setFilter("interview")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === "interview"
                ? "bg-emerald-600 text-white"
                : "bg-surface text-foreground-muted hover:text-foreground border border-border"
            }`}
          >
            🟢 {locale === "zh" ? "面试" : "Interview"} ({stats.totalInterviews})
          </button>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {groupedRecords.map((group) => (
            <div key={group.date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-medium text-foreground">{group.label}</span>
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-xs text-foreground-muted">
                  {group.records.length} {locale === "zh" ? "条记录" : "records"}
                </span>
              </div>

              {/* Records */}
              <div className="space-y-2">
                {group.records.map((record) => {
                  const isEditing = editingId === record.id && record.type === "interview";
                  const isInterview = record.type === "interview";

                  return (
                    <div
                      key={`${record.type}-${record.id}`}
                      className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border hover:border-accent/30 transition-all group"
                    >
                      {/* Type Icon */}
                      <Link
                        href={
                          record.type === "practice"
                            ? `/practice/review/${record.id}`
                            : `/interview/${record.id}/report`
                        }
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          record.type === "practice"
                            ? "bg-accent/10 text-accent"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        {record.type === "practice" ? (
                          <FileText className="w-5 h-5" />
                        ) : (
                          <MessageSquare className="w-5 h-5" />
                        )}
                      </Link>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="flex-1 px-3 py-1.5 text-sm bg-background border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveTitle(record.id);
                                if (e.key === "Escape") cancelEdit();
                              }}
                            />
                            <button
                              onClick={() => saveTitle(record.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 text-foreground-muted hover:bg-foreground-muted/10 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <Link
                            href={
                              record.type === "practice"
                                ? `/practice/review/${record.id}`
                                : `/interview/${record.id}/report`
                            }
                          >
                            <h4 className="font-medium text-foreground truncate group-hover:text-accent transition-colors">
                              {record.title}
                            </h4>
                          </Link>
                        )}
                        <div className="flex items-center gap-2 text-xs text-foreground-muted mt-0.5">
                          <span>{formatTime(record.date)}</span>
                          {record.details && (
                            <>
                              <span>•</span>
                              <span className="truncate">{record.details}</span>
                            </>
                          )}
                          {record.questionCount && (
                            <>
                              <span>•</span>
                              <span>
                                {record.questionCount} {locale === "zh" ? "道题" : "questions"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {/* Score */}
                        <Link
                          href={
                            record.type === "practice"
                              ? `/practice/review/${record.id}`
                              : `/interview/${record.id}/report`
                          }
                          className="flex items-center gap-3"
                        >
                          <span
                            className={`text-xl font-bold ${getScoreColor(record.score)}`}
                          >
                            {record.score}
                          </span>
                        </Link>

                        {/* Interview Actions */}
                        {isInterview && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditTitle(record as unknown as InterviewSession)}
                              className="p-1.5 text-foreground-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                              title={locale === "zh" ? "编辑名称" : "Edit name"}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRetry(record as unknown as InterviewSession)}
                              className="p-1.5 text-foreground-muted hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title={locale === "zh" ? "再练一次" : "Practice again"}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        <Link
                          href={
                            record.type === "practice"
                              ? `/practice/review/${record.id}`
                              : `/interview/${record.id}/report`
                          }
                        >
                          <ChevronRight className="w-5 h-5 text-foreground-muted group-hover:text-accent transition-colors" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Load More / End */}
        <div className="mt-8 text-center text-sm text-foreground-muted">
          {locale === "zh" ? "— 已经到底了 —" : "— End of records —"}
        </div>
      </div>
    </div>
  );
}
