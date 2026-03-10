"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import {
  getInterviewSessionAsync,
  InterviewSession,
  InterviewAnswer,
  fetchAIEvaluation,
  updateSessionWithAIEvaluationAsync,
} from "@/lib/interview-store";
import { LoadingState } from "@/components/ui/loading-state";
import { UpgradeModal } from "@/components/upgrade-modal";
import { BasicInterviewFeedback, PremiumInterviewFeedback } from "@/components/feedback";

// 评估状态类型
interface EvaluationStatus {
  total: number;
  completed: number;
  pending: number;
  processing: number;
  failed: number;
  answers: {
    questionId: string;
    questionTitle: string;
    status: string;
    error: string | null;
    retries: number;
  }[];
}

// 分数颜色
function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-500";
  return "text-rose-500";
}

function getScoreBgColor(score: number) {
  if (score >= 80) return "bg-emerald-50 border-emerald-100";
  if (score >= 60) return "bg-amber-50 border-amber-100";
  return "bg-rose-50 border-rose-100";
}

function getScoreLevel(score: number, locale: string) {
  if (score >= 90) return locale === "zh" ? "优秀" : "Excellent";
  if (score >= 80) return locale === "zh" ? "良好" : "Good";
  if (score >= 60) return locale === "zh" ? "及格" : "Fair";
  return locale === "zh" ? "需提升" : "Needs Work";
}

export default function InterviewReportPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLanguage();
  const interviewId = params.id as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isGeneratingAIReport, setIsGeneratingAIReport] = useState(false);

  // 评估状态轮询
  const [evaluationStatus, setEvaluationStatus] = useState<EvaluationStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // 会员权限状态
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userType, setUserType] = useState<"free" | "credit_exhausted" | "monthly_expired">("free");
  const [membershipInfo, setMembershipInfo] = useState<{
    creditsRemaining: number | null;
    monthlyExpiresAt: Date | null;
  }>({ creditsRemaining: null, monthlyExpiresAt: null });

  // 处理登录跳转
  const handleLogin = () => {
    const currentPath = window.location.pathname;
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  // 仅检查权限，不消费（用于评估进行中的情况）
  const checkAccessOnly = async (sessionId: string) => {
    try {
      const checkResponse = await fetch(`/api/membership/check-access?type=INTERVIEW_SESSION&id=${sessionId}`);
      if (!checkResponse.ok) {
        if (checkResponse.status === 401) {
          setIsUnauthenticated(true);
          setHasAccess(false);
          setUserType("free");
          return false;
        }
        setHasAccess(false);
        setUserType("free");
        return false;
      }

      setIsUnauthenticated(false);
      const checkData = await checkResponse.json();
      setMembershipInfo({
        creditsRemaining: checkData.membershipStatus?.creditsRemaining ?? null,
        monthlyExpiresAt: checkData.membershipStatus?.monthlyExpiresAt ?? null,
      });

      const monthlyExpired = checkData.membershipStatus?.monthlyExpiresAt &&
        new Date(checkData.membershipStatus.monthlyExpiresAt) < new Date();
      const creditsExhausted = checkData.membershipStatus?.creditsRemaining === 0;

      if (monthlyExpired) {
        setUserType("monthly_expired");
      } else if (creditsExhausted) {
        setUserType("credit_exhausted");
      } else if (!checkData.membershipStatus?.hasMembership) {
        setUserType("free");
      }

      const hasPermission = checkData.alreadyPaid || checkData.hasAccess;
      setHasAccess(hasPermission);
      return hasPermission;
    } catch (error) {
      console.error("Access check failed:", error);
      setHasAccess(false);
      setIsUnauthenticated(false);
      setUserType("free");
      return false;
    }
  };

  // 检查权限并处理消费
  const checkAccessAndConsume = async (sessionId: string, sessionTitle?: string) => {
    try {
      const checkResponse = await fetch(`/api/membership/check-access?type=INTERVIEW_SESSION&id=${sessionId}`);
      if (!checkResponse.ok) {
        // 401 表示未登录
        if (checkResponse.status === 401) {
          setIsUnauthenticated(true);
          setHasAccess(false);
          setUserType("free");
          return false;
        }
        // 其他错误，默认显示简化反馈
        setHasAccess(false);
        setUserType("free");
        return false;
      }

      // 已登录，重置未登录状态
      setIsUnauthenticated(false);

      const checkData = await checkResponse.json();
      setMembershipInfo({
        creditsRemaining: checkData.membershipStatus?.creditsRemaining ?? null,
        monthlyExpiresAt: checkData.membershipStatus?.monthlyExpiresAt ?? null,
      });

      // 根据会员状态设置用户类型
      const monthlyExpired = checkData.membershipStatus?.monthlyExpiresAt &&
        new Date(checkData.membershipStatus.monthlyExpiresAt) < new Date();
      const creditsExhausted = checkData.membershipStatus?.creditsRemaining === 0;

      if (monthlyExpired) {
        setUserType("monthly_expired");
      } else if (creditsExhausted) {
        setUserType("credit_exhausted");
      } else if (!checkData.membershipStatus?.hasMembership) {
        setUserType("free");
      }

      if (checkData.alreadyPaid) {
        setAlreadyPaid(true);
        setHasAccess(true);
        return true;
      }

      if (checkData.hasAccess) {
        const consumeResponse = await fetch("/api/membership/consume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceType: "INTERVIEW_SESSION",
            sourceId: sessionId,
            sourceTitle: sessionTitle,
          }),
        });

        if (consumeResponse.ok) {
          const consumeData = await consumeResponse.json();
          if (consumeData.success) {
            setHasAccess(true);
            if (consumeData.creditsRemaining !== undefined) {
              setMembershipInfo((prev) => ({
                ...prev,
                creditsRemaining: consumeData.creditsRemaining,
              }));
            }
            // 触发全局事件，通知 Navbar 更新会员状态
            window.dispatchEvent(new Event("membership:updated"));
            return true;
          }
        }
      }

      setHasAccess(false);
      return false;
    } catch (error) {
      console.error("Access check failed:", error);
      // API 失败时降级显示简化反馈
      setHasAccess(false);
      setIsUnauthenticated(false); // 网络错误时不显示登录引导
      setUserType("free");
      return false;
    }
  };

  useEffect(() => {
    async function loadSession() {
      const loadedSession = await getInterviewSessionAsync(interviewId);
      if (!loadedSession) {
        router.push("/practice");
        return;
      }

      if (loadedSession.status !== "completed") {
        router.push(`/interview/${interviewId}`);
        return;
      }

      setSession(loadedSession);

      // Strategy A: 先获取评估状态，根据状态决定是否消费积分
      const status = await fetchEvaluationStatus();
      const hasPendingEvaluations = status && (status.pending > 0 || status.processing > 0);
      const hasAIEvaluation = loadedSession.aiEvaluation ||
        (status && status.completed === status.total && status.total > 0);

      let accessGranted = false;

      if (hasPendingEvaluations && !hasAIEvaluation) {
        // 评估进行中：只检查权限，不消费积分
        // 如果用户有权限，后续的 useEffect 会触发评估
        accessGranted = await checkAccessOnly(interviewId);
      } else {
        // 评估已完成或有 AI 评价：检查权限并消费积分
        accessGranted = await checkAccessAndConsume(interviewId, loadedSession.title);
      }

      // 如果有权限且没有 AI 评价，异步获取（仅当评估已完成时）
      if (accessGranted && !loadedSession.aiEvaluation && loadedSession.answers.length > 0 && !hasPendingEvaluations) {
        setIsGeneratingAIReport(true);
        const aiEvaluation = await fetchAIEvaluation(loadedSession);
        if (aiEvaluation) {
          const updated = await updateSessionWithAIEvaluationAsync(interviewId, aiEvaluation);
          if (updated) {
            setSession(updated);
          }
        }
        setIsGeneratingAIReport(false);
      }
    }

    loadSession();
  }, [interviewId, router]);

  // 获取评估状态
  const fetchEvaluationStatus = async () => {
    try {
      const response = await fetch(`/api/interview/evaluation-status?sessionId=${interviewId}`);
      if (response.ok) {
        const status = await response.json();
        setEvaluationStatus(status);
        return status;
      }
    } catch (error) {
      console.error("获取评估状态失败:", error);
    }
    return null;
  };

  // 处理待评估的答案
  const processEvaluations = async () => {
    try {
      const response = await fetch("/api/interview/process-evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: interviewId }),
      });
      if (response.ok) {
        // 刷新会话数据
        const updatedSession = await getInterviewSessionAsync(interviewId);
        if (updatedSession) {
          setSession(updatedSession);
        }
      }
    } catch (error) {
      console.error("处理评估失败:", error);
    }
  };

  // 重试失败的评估
  const retryFailedEvaluations = async () => {
    setIsRetrying(true);
    try {
      // 重置所有失败的评估
      await fetch("/api/interview/evaluation-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: interviewId, retryAll: true }),
      });
      // 触发评估处理
      await processEvaluations();
      // 刷新状态
      await fetchEvaluationStatus();
    } catch (error) {
      console.error("重试评估失败:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  // 评估状态轮询
  useEffect(() => {
    if (!session) return;

    // 初始获取状态
    fetchEvaluationStatus().then((status) => {
      // Strategy A: 只有在用户有权限时才触发评估处理
      if (status && (status.pending > 0 || status.processing > 0) && hasAccess === true) {
        setIsPolling(true);
        // 触发评估处理
        processEvaluations();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  // 轮询检测评估进度
  useEffect(() => {
    if (!isPolling || !session) return;

    const pollInterval = setInterval(async () => {
      const status = await fetchEvaluationStatus();
      if (status) {
        // 如果所有评估都完成或失败，停止轮询并刷新数据
        if (status.pending === 0 && status.processing === 0) {
          setIsPolling(false);
          // 刷新会话数据以获取最新反馈
          const updatedSession = await getInterviewSessionAsync(interviewId);
          if (updatedSession) {
            setSession(updatedSession);
          }
        }
      }
    }, 3000); // 每 3 秒轮询一次

    return () => clearInterval(pollInterval);
  }, [isPolling, session?.id, interviewId]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <LoadingState
          variant="spinner"
          fullScreen
          message={locale === "zh" ? "加载报告中..." : "Loading report..."}
        />
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const totalDuration = session.answers.reduce((acc, a) => acc + (a.duration || 0), 0);
  const avgScore = Math.round(session.answers.reduce((acc, a) => acc + a.score, 0) / session.answers.length);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-foreground-muted mb-6">
            <Link href="/history" className="hover:text-accent transition-colors">
              {locale === "zh" ? "学习记录" : "History"}
            </Link>
            <span>/</span>
            <span className="text-foreground">{locale === "zh" ? "面试报告" : "Interview Report"}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Title & Meta */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3 truncate">{session.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-muted">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {new Date(session.completedAt || "").toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formatDuration(totalDuration)}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  {session.questions.length} {locale === "zh" ? "道题" : "questions"}
                </span>
              </div>
            </div>

            {/* Score Card */}
            <div className={`flex-shrink-0 px-6 py-4 rounded-2xl border ${getScoreBgColor(session.overallScore)}`}>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-1 ${getScoreColor(session.overallScore)}`}>
                  {session.overallScore}
                </div>
                <div className={`text-sm font-medium ${getScoreColor(session.overallScore)}`}>
                  {getScoreLevel(session.overallScore, locale)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Status Banner */}
      {isGeneratingAIReport && (
        <div className="bg-accent/5 border-b border-accent/10">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <div className="flex items-center gap-3 text-sm text-accent">
              <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              <span>{locale === "zh" ? "AI 正在生成深度分析报告..." : "AI is generating analysis..."}</span>
            </div>
          </div>
        </div>
      )}

      {/* 评估进度 Banner */}
      {evaluationStatus && (evaluationStatus.pending > 0 || evaluationStatus.processing > 0) && (
        <div className="bg-blue-50 border-b border-blue-100">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-blue-700">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                <span>
                  {locale === "zh"
                    ? `AI 正在分析答案... (${evaluationStatus.completed}/${evaluationStatus.total})`
                    : `AI analyzing answers... (${evaluationStatus.completed}/${evaluationStatus.total})`}
                </span>
              </div>
              <div className="w-32 h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(evaluationStatus.completed / evaluationStatus.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 评估失败 Banner */}
      {evaluationStatus && evaluationStatus.failed > 0 && evaluationStatus.pending === 0 && evaluationStatus.processing === 0 && (
        <div className="bg-rose-50 border-b border-rose-100">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-rose-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  {locale === "zh"
                    ? `${evaluationStatus.failed} 道题评估失败`
                    : `${evaluationStatus.failed} answer(s) failed to evaluate`}
                </span>
              </div>
              <button
                onClick={retryFailedEvaluations}
                disabled={isRetrying}
                className="px-3 py-1 text-sm font-medium text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors disabled:opacity-50"
              >
                {isRetrying
                  ? locale === "zh"
                    ? "重试中..."
                    : "Retrying..."
                  : locale === "zh"
                    ? "重试"
                    : "Retry"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 双模型架构：免费用户显示基础版，付费用户显示专业版 */}
        {hasAccess === false && session && (
          <BasicInterviewFeedback
            session={session}
            isUnauthenticated={isUnauthenticated}
            onLogin={handleLogin}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        )}

        {hasAccess === true && session && (
          <PremiumInterviewFeedback session={session} />
        )}

        {/* 权限检查中 */}
        {hasAccess === null && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-12 pt-8 border-t border-slate-100">
          <Link
            href="/practice"
            className="flex-1 py-3 px-6 bg-white border border-slate-200 text-foreground rounded-xl font-medium hover:bg-slate-50 transition-all text-center"
          >
            {locale === "zh" ? "继续练习" : "Continue Practice"}
          </Link>
          <Link
            href="/history"
            className="flex-1 py-3 px-6 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all text-center"
          >
            {locale === "zh" ? "返回记录" : "Back to History"}
          </Link>
        </div>
      </div>

      {/* 升级弹窗 */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={async () => {
          setShowUpgradeModal(false);
          // 关闭弹窗后重新检查权限（用户可能已开通会员）
          if (session) {
            const accessGranted = await checkAccessAndConsume(interviewId, session.title);
            if (accessGranted) {
              // 如果用户现在有了权限，异步获取 AI 评价
              if (!session.aiEvaluation && session.answers.length > 0) {
                const aiEvaluation = await fetchAIEvaluation(session);
                if (aiEvaluation) {
                  const updated = await updateSessionWithAIEvaluationAsync(interviewId, aiEvaluation);
                  if (updated) {
                    setSession(updated);
                  }
                }
              }
            }
          }
        }}
        userType={userType}
        creditsRemaining={membershipInfo.creditsRemaining}
        monthlyExpiresAt={membershipInfo.monthlyExpiresAt}
      />
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ session, locale }: { session: InterviewSession; locale: string }) {
  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label={locale === "zh" ? "技术能力" : "Technical"}
          value={session.dimensionScores.technical}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          }
        />
        <StatCard
          label={locale === "zh" ? "项目经验" : "Project"}
          value={session.dimensionScores.project}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          }
        />
        <StatCard
          label={locale === "zh" ? "行为面试" : "Behavioral"}
          value={session.dimensionScores.behavioral}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
        <StatCard
          label={locale === "zh" ? "沟通表达" : "Communication"}
          value={session.dimensionScores.communication}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          }
        />
      </div>

      {/* Job Match - if available */}
      {session.aiEvaluation?.jobMatch && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center ${getScoreBgColor(session.aiEvaluation.jobMatch.score)}`}
            >
              <span className={`text-2xl font-bold ${getScoreColor(session.aiEvaluation.jobMatch.score)}`}>
                {session.aiEvaluation.jobMatch.score}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1">
                {locale === "zh" ? "岗位匹配度" : "Job Match Score"}
              </h3>
              <p className="text-sm text-foreground-muted leading-relaxed">{session.aiEvaluation.jobMatch.analysis}</p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Feedback */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{locale === "zh" ? "整体评价" : "Overall Assessment"}</h2>
        <p className="text-foreground-muted leading-relaxed">{session.overallFeedback}</p>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-emerald-700">{locale === "zh" ? "表现亮点" : "Strengths"}</h3>
          </div>
          <ul className="space-y-3">
            {session.strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-foreground">
                <span className="flex-shrink-0 w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-medium">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-amber-700">{locale === "zh" ? "提升空间" : "Areas to Improve"}</h3>
          </div>
          <ul className="space-y-3">
            {session.improvements.map((improvement, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-foreground">
                <span className="flex-shrink-0 w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-medium">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Coach Summary */}
      {session.aiEvaluation?.coachSummary && (
        <div className="bg-gradient-to-r from-accent/5 to-accent/10 rounded-2xl border border-accent/10 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">{locale === "zh" ? "教练寄语" : "Coach's Words"}</h3>
              <p className="text-foreground-muted italic leading-relaxed">"{session.aiEvaluation.coachSummary}"</p>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-semibold text-foreground mb-4">{locale === "zh" ? "后续建议" : "Next Steps"}</h3>
        <div className="space-y-3">
          {session.nextSteps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
              <span className="flex-shrink-0 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-medium">
                {idx + 1}
              </span>
              <p className="text-sm text-foreground leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Details Tab Component
function DetailsTab({
  session,
  locale,
  expandedQuestion,
  setExpandedQuestion,
}: {
  session: InterviewSession;
  locale: string;
  expandedQuestion: string | null;
  setExpandedQuestion: (id: string | null) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-foreground-muted">{locale === "zh" ? "答题进度" : "Progress"}</span>
          <span className="font-medium text-foreground">
            {session.answers.length}/{session.questions.length}
          </span>
        </div>
        <div className="flex gap-1">
          {session.questions.map((q, idx) => {
            const answer = session.answers.find((a) => a.questionId === q.id);
            const score = answer?.score || 0;
            return (
              <div
                key={q.id}
                className={`flex-1 h-2 rounded-full ${
                  score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-amber-400" : score > 0 ? "bg-rose-400" : "bg-slate-200"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Question Cards */}
      {session.answers.map((answer, idx) => (
        <QuestionCard
          key={`${answer.questionId}-${idx}`}
          index={idx}
          answer={answer}
          question={session.questions.find((q) => q.id === answer.questionId)}
          isExpanded={expandedQuestion === `${answer.questionId}-${idx}`}
          onToggle={() =>
            setExpandedQuestion(expandedQuestion === `${answer.questionId}-${idx}` ? null : `${answer.questionId}-${idx}`)
          }
          locale={locale}
        />
      ))}
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-foreground-muted mb-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${getScoreColor(value)}`}>{value}</span>
        <span className="text-xs text-foreground-muted mb-1">/100</span>
      </div>
    </div>
  );
}

// Question Card Component
function QuestionCard({
  index,
  answer,
  question,
  isExpanded,
  onToggle,
  locale,
}: {
  index: number;
  answer: InterviewAnswer;
  question?: { title: string; type: string };
  isExpanded: boolean;
  onToggle: () => void;
  locale: string;
}) {
  if (!question) return null;

  const typeLabels: Record<string, string> = {
    INTRO: locale === "zh" ? "自我介绍" : "Intro",
    PROJECT: locale === "zh" ? "项目经历" : "Project",
    TECHNICAL: locale === "zh" ? "技术问题" : "Technical",
    BEHAVIORAL: locale === "zh" ? "行为面试" : "Behavioral",
    HR: locale === "zh" ? "HR面试" : "HR",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium ${
            answer.score >= 80
              ? "bg-emerald-100 text-emerald-600"
              : answer.score >= 60
                ? "bg-amber-100 text-amber-600"
                : "bg-rose-100 text-rose-500"
          }`}
        >
          {answer.score}
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-foreground-muted rounded-full">
              {typeLabels[question.type] || question.type}
            </span>
            <span className="text-xs text-foreground-muted">Q{index + 1}</span>
          </div>
          <p className="font-medium text-foreground truncate">{question.title}</p>
        </div>
        <svg
          className={`w-5 h-5 text-foreground-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="pt-4 space-y-4">
            {/* Your Answer */}
            <div>
              <h4 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2">
                {locale === "zh" ? "你的回答" : "Your Answer"}
              </h4>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{answer.answer}</p>
              </div>
            </div>

            {/* Dimension Scores */}
            {answer.feedback.dimensions && (
              <div className="grid grid-cols-4 gap-2">
                <DimensionBadge
                  label={locale === "zh" ? "内容" : "Content"}
                  score={answer.feedback.dimensions.content.score}
                />
                <DimensionBadge
                  label={locale === "zh" ? "结构" : "Structure"}
                  score={answer.feedback.dimensions.structure.score}
                />
                <DimensionBadge
                  label={locale === "zh" ? "表达" : "Expression"}
                  score={answer.feedback.dimensions.expression.score}
                />
                <DimensionBadge
                  label={locale === "zh" ? "亮点" : "Highlights"}
                  score={answer.feedback.dimensions.highlights.score}
                />
              </div>
            )}

            {/* Good & Improve */}
            <div className="grid md:grid-cols-2 gap-3">
              {answer.feedback.good.length > 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <h5 className="text-xs font-medium text-emerald-700 mb-2">{locale === "zh" ? "优点" : "Strengths"}</h5>
                  <ul className="space-y-1.5">
                    {answer.feedback.good.map((item, idx) => (
                      <li key={idx} className="text-xs text-foreground flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">+</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {answer.feedback.improve.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl">
                  <h5 className="text-xs font-medium text-amber-700 mb-2">{locale === "zh" ? "改进" : "Improvements"}</h5>
                  <ul className="space-y-1.5">
                    {answer.feedback.improve.map((item, idx) => (
                      <li key={idx} className="text-xs text-foreground flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">!</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Optimized Answer */}
            {answer.feedback.optimizedAnswer && (
              <div className="p-3 bg-accent/5 rounded-xl border border-accent/10">
                <h5 className="text-xs font-medium text-accent mb-2">
                  {locale === "zh" ? "优化示例" : "Optimized Example"}
                </h5>
                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {answer.feedback.optimizedAnswer}
                </p>
              </div>
            )}

            {/* Coach Suggestion */}
            <div className="p-3 bg-slate-50 rounded-xl">
              <h5 className="text-xs font-medium text-foreground-muted mb-1">
                {locale === "zh" ? "教练建议" : "Coach Suggestion"}
              </h5>
              <p className="text-sm text-foreground">{answer.feedback.suggestion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dimension Badge Component
function DimensionBadge({ label, score }: { label: string; score: number }) {
  return (
    <div
      className={`px-3 py-2 rounded-lg text-center ${
        score >= 80
          ? "bg-emerald-50 border border-emerald-100"
          : score >= 60
            ? "bg-amber-50 border border-amber-100"
            : "bg-rose-50 border border-rose-100"
      }`}
    >
      <div className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</div>
      <div className="text-xs text-foreground-muted">{label}</div>
    </div>
  );
}
