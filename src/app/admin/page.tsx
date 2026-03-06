"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Activity,
  TrendingUp,
  Bug,
  Mic,
  Target,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Cookie 操作工具
function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/";
}

function getCookie(name: string): string | undefined {
  return document.cookie.split("; ").find(row => row.startsWith(name + "="))?.split("=")[1];
}

interface StatsData {
  timestamp: string;
  users: {
    total: number;
    today: number;
    week: number;
    month: number;
    activeToday: number;
  };
  practices: {
    total: number;
    today: number;
    week: number;
    month: number;
    avgScore: number | null;
    repeatCount: number;
    voiceUsageRate: number;
  };
  interviews: {
    total: number;
    completed: number;
    abandoned: number;
    completionRate: number;
  };
  bugs: {
    total: number;
    open: number;
    resolved: number;
  };
  popularQuestions: Array<{
    questionId: string;
    _count: { questionId: number };
    question: {
      id: string;
      title: string;
      category: string;
    };
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>("users");

  // 检查是否已有 cookie
  useEffect(() => {
    const savedToken = getCookie("admin-token");
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // 登录验证
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      // 设置 cookie，7天有效期
      setCookie("admin-token", token, 7);
      setIsAuthenticated(true);
      fetchStats();
    }
  };

  // 退出登录
  const handleLogout = () => {
    setCookie("admin-token", "", 0); // 删除 cookie
    setIsAuthenticated(false);
    setToken("");
    setStats(null);
  };

  // 获取统计数据
  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-token": token },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthenticated(false);
          throw new Error("Invalid token");
        }
        throw new Error("Failed to fetch stats");
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  // 自动刷新（每30秒）
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => fetchStats(), 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // 登录页面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl p-8 shadow-soft-lg">
            <div className="flex items-center justify-center w-16 h-16 bg-accent/10 rounded-2xl mx-auto mb-6">
              <Lock className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-center text-foreground mb-2">
              管理员看板
            </h1>
            <p className="text-foreground-muted text-center mb-8">
              请输入管理员密钥访问数据
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Admin Token"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/20"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all"
              >
                进入看板
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  FacePrep 数据看板
                </h1>
                <p className="text-sm text-foreground-muted">
                  实时数据监控
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground-muted">
                上次更新: {stats ? new Date(stats.timestamp).toLocaleTimeString() : "-"}
              </span>
              <button
                onClick={fetchStats}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                刷新
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-foreground-muted hover:text-foreground transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error rounded-xl">
            {error}
          </div>
        )}

        {!stats ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 核心指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Users}
                title="总用户数"
                value={stats.users.total}
                today={stats.users.today}
                color="accent"
              />
              <StatCard
                icon={Target}
                title="总练习次数"
                value={stats.practices.total}
                today={stats.practices.today}
                color="success"
              />
              <StatCard
                icon={Mic}
                title="语音使用率"
                value={`${stats.practices.voiceUsageRate}%`}
                subtitle={`${stats.practices.repeatCount} 次重复练习`}
                color="warning"
              />
              <StatCard
                icon={TrendingUp}
                title="平均得分"
                value={stats.practices.avgScore ?? "-"}
                subtitle="所有练习"
                color="info"
              />
            </div>

            {/* 详细数据 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 用户增长趋势 */}
              <Section
                title="用户增长"
                icon={Users}
                expanded={expandedSection === "users"}
                onToggle={() => setExpandedSection(expandedSection === "users" ? null : "users")}
              >
                <div className="grid grid-cols-3 gap-4">
                  <MetricItem label="今日新增" value={stats.users.today} />
                  <MetricItem label="本周新增" value={stats.users.week} />
                  <MetricItem label="本月新增" value={stats.users.month} />
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <MetricItem
                    label="今日活跃用户"
                    value={stats.users.activeToday}
                    subtitle="至少完成1次练习"
                  />
                </div>
              </Section>

              {/* 练习数据 */}
              <Section
                title="练习数据"
                icon={Target}
                expanded={expandedSection === "practices"}
                onToggle={() => setExpandedSection(expandedSection === "practices" ? null : "practices")}
              >
                <div className="grid grid-cols-3 gap-4">
                  <MetricItem label="今日练习" value={stats.practices.today} />
                  <MetricItem label="本周练习" value={stats.practices.week} />
                  <MetricItem label="本月练习" value={stats.practices.month} />
                </div>
                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <MetricItem
                    label="人均练习次数"
                    value={stats.users.total > 0 ? Math.round(stats.practices.total / stats.users.total) : 0}
                    subtitle="总练习 / 总用户"
                  />
                  <MetricItem
                    label="重复练习率"
                    value={`${stats.practices.total > 0 ? Math.round((stats.practices.repeatCount / stats.practices.total) * 100) : 0}%`}
                    subtitle={`${stats.practices.repeatCount} 次重复 / ${stats.practices.total} 次总练习`}
                  />
                </div>
              </Section>

              {/* 模拟面试数据 */}
              <Section
                title="模拟面试"
                icon={Activity}
                expanded={expandedSection === "interviews"}
                onToggle={() => setExpandedSection(expandedSection === "interviews" ? null : "interviews")}
              >
                <div className="grid grid-cols-3 gap-4">
                  <MetricItem label="总面试数" value={stats.interviews.total} />
                  <MetricItem label="已完成" value={stats.interviews.completed} color="success" />
                  <MetricItem label="已放弃" value={stats.interviews.abandoned} color="error" />
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">完成率</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-surface rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success rounded-full transition-all"
                          style={{ width: `${stats.interviews.completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {stats.interviews.completionRate}%
                      </span>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Bug反馈 */}
              <Section
                title="Bug反馈"
                icon={Bug}
                expanded={expandedSection === "bugs"}
                onToggle={() => setExpandedSection(expandedSection === "bugs" ? null : "bugs")}
              >
                <div className="grid grid-cols-3 gap-4">
                  <MetricItem label="总反馈数" value={stats.bugs.total} />
                  <MetricItem label="待处理" value={stats.bugs.open} color="warning" />
                  <MetricItem label="已解决" value={stats.bugs.resolved} color="success" />
                </div>
                {stats.bugs.open > 0 && (
                  <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-sm text-warning">
                      有 {stats.bugs.open} 个待处理的反馈需要关注
                    </p>
                  </div>
                )}
              </Section>
            </div>

            {/* 热门题目 */}
            <Section
              title="热门题目 TOP10"
              icon={TrendingUp}
              expanded={expandedSection === "popular"}
              onToggle={() => setExpandedSection(expandedSection === "popular" ? null : "popular")}
            >
              <div className="space-y-3">
                {stats.popularQuestions.map((item, index) => (
                  <div
                    key={item.questionId}
                    className="flex items-center gap-4 p-3 bg-surface rounded-xl"
                  >
                    <span className="w-8 h-8 flex items-center justify-center bg-accent/10 text-accent rounded-lg font-bold">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">
                        {item.question?.title || "未知题目"}
                      </p>
                      <p className="text-sm text-foreground-muted">
                        {item.question?.category} · 练习 {item._count.questionId} 次
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}

// 统计卡片组件
function StatCard({
  icon: Icon,
  title,
  value,
  today,
  subtitle,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  today?: number;
  subtitle?: string;
  color: "accent" | "success" | "warning" | "info";
}) {
  const colors = {
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-blue-500/10 text-blue-500",
  };

  return (
    <div className="bg-surface rounded-2xl p-6 shadow-soft">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {today !== undefined && (
          <span className="text-sm text-success font-medium">
            +{today} 今日
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-foreground-muted mt-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-foreground-muted mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// 展开/折叠区块组件
function Section({
  title,
  icon: Icon,
  children,
  expanded,
  onToggle,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-surface rounded-2xl shadow-soft overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-surface/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-foreground-muted" />
        ) : (
          <ChevronDown className="w-5 h-5 text-foreground-muted" />
        )}
      </button>
      {expanded && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

// 指标项组件
function MetricItem({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: "success" | "error" | "warning";
}) {
  const colorClasses = {
    success: "text-success",
    error: "text-error",
    warning: "text-warning",
  };

  return (
    <div>
      <p className="text-sm text-foreground-muted">{label}</p>
      <p className={`text-2xl font-bold ${color ? colorClasses[color] : "text-foreground"}`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-foreground-muted mt-1">{subtitle}</p>}
    </div>
  );
}
