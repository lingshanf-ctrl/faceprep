"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Activity,
  TrendingUp,
  Target,
  RefreshCw,
  Lock,
  ChevronDown,
  ChevronUp,
  Search,
  Crown,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Cookie 操作工具
function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/";
}

function getCookie(name: string): string | undefined {
  return document.cookie.split("; ").find(row => row.startsWith(name + "="))?.split("=")[1];
}

// ============ 类型定义 ============
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
  };
  interviews: {
    total: number;
    completed: number;
    abandoned: number;
    completionRate: number;
  };
}

interface User {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  isAdmin: boolean;
  createdAt: string;
  _count: {
    memberships: number;
    practices: number;
    sessions: number;
  };
}

interface Membership {
  id: string;
  type: "CREDIT" | "MONTHLY";
  status: string;
  totalCredits: number | null;
  usedCredits: number;
  endDate: string | null;
  note: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"analytics" | "membership">("analytics");

  // 数据看板状态
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>("users");

  // 会员管理状态
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [grantType, setGrantType] = useState<"CREDIT" | "MONTHLY">("CREDIT");
  const [credits, setCredits] = useState(10);
  const [durationDays, setDurationDays] = useState(30);
  const [note, setNote] = useState("");
  const [isGranting, setIsGranting] = useState(false);
  const [grantMessage, setGrantMessage] = useState<{type: "success" | "error"; text: string} | null>(null);

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
      setCookie("admin-token", token, 7);
      setIsAuthenticated(true);
    }
  };

  // 退出登录
  const handleLogout = () => {
    setCookie("admin-token", "", 0);
    setIsAuthenticated(false);
    setToken("");
    setStats(null);
    setUsers([]);
    setSelectedUser(null);
  };

  // 获取统计数据
  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-token": token },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError("获取数据失败");
    } finally {
      setLoading(false);
    }
  };

  // 搜索用户
  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`, {
        headers: { "x-admin-token": token },
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setUsers(data.users);
    } catch (error) {
      setError("搜索失败");
    } finally {
      setIsSearching(false);
    }
  };

  // 获取用户会员信息
  const fetchUserMemberships = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/membership?userId=${userId}`, {
        headers: { "x-admin-token": token },
      });
      if (res.ok) {
        const data = await res.json();
        setMemberships(data.memberships);
      }
    } catch (error) {
      console.error("Error fetching memberships:", error);
    }
  };

  // 开通会员
  const grantMembership = async () => {
    if (!selectedUser) return;
    setIsGranting(true);
    setGrantMessage(null);
    try {
      const res = await fetch("/api/admin/membership/grant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          type: grantType,
          totalCredits: grantType === "CREDIT" ? credits : null,
          durationDays: grantType === "MONTHLY" ? durationDays : null,
          note: note || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGrantMessage({ type: "success", text: "开通成功" });
        fetchUserMemberships(selectedUser.id);
        setNote("");
      } else {
        setGrantMessage({ type: "error", text: data.error || "开通失败" });
      }
    } catch (error) {
      setGrantMessage({ type: "error", text: "网络错误" });
    } finally {
      setIsGranting(false);
    }
  };

  // 选择用户
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    fetchUserMemberships(user.id);
    setGrantMessage(null);
  };

  // 自动刷新数据看板
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === "analytics") {
      fetchStats();
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab]);

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
              管理员后台
            </h1>
            <p className="text-foreground-muted text-center mb-8">
              数据看板 + 会员管理
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
                进入后台
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
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  FacePrep 管理员后台
                </h1>
                <p className="text-sm text-foreground-muted">
                  数据看板 · 会员管理
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Tab Switcher */}
              <div className="flex bg-background rounded-lg p-1 border border-border">
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === "analytics"
                      ? "bg-accent text-white"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  数据看板
                </button>
                <button
                  onClick={() => setActiveTab("membership")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === "membership"
                      ? "bg-accent text-white"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  会员管理
                </button>
              </div>
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

        {/* ========== 数据看板选项卡 ========== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {!stats ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : (
              <>
                {/* 核心指标 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    icon={Users}
                    title="总用户数"
                    value={stats.users.total}
                    subValue={`+${stats.users.today} 今日`}
                    color="blue"
                  />
                  <StatCard
                    icon={Target}
                    title="总练习次数"
                    value={stats.practices.total}
                    subValue={`+${stats.practices.today} 今日`}
                    color="green"
                  />
                  <StatCard
                    icon={Activity}
                    title="面试完成率"
                    value={`${stats.interviews.completionRate}%`}
                    subValue={`${stats.interviews.completed}/${stats.interviews.total}`}
                    color="purple"
                  />
                  <StatCard
                    icon={TrendingUp}
                    title="平均得分"
                    value={stats.practices.avgScore ?? "-"}
                    color="orange"
                  />
                </div>

                {/* 详细数据 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Section
                    title="用户增长"
                    expanded={expandedSection === "users"}
                    onToggle={() => setExpandedSection(expandedSection === "users" ? null : "users")}
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <MetricItem label="今日新增" value={stats.users.today} />
                      <MetricItem label="本周新增" value={stats.users.week} />
                      <MetricItem label="本月新增" value={stats.users.month} />
                    </div>
                  </Section>

                  <Section
                    title="练习统计"
                    expanded={expandedSection === "practices"}
                    onToggle={() => setExpandedSection(expandedSection === "practices" ? null : "practices")}
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <MetricItem label="今日练习" value={stats.practices.today} />
                      <MetricItem label="本周练习" value={stats.practices.week} />
                      <MetricItem label="本月练习" value={stats.practices.month} />
                    </div>
                  </Section>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========== 会员管理选项卡 ========== */}
        {activeTab === "membership" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：用户搜索 */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-surface rounded-2xl p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-accent" />
                  搜索用户
                </h3>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="邮箱或姓名"
                    className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/20"
                    onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                  />
                  <Button
                    onClick={searchUsers}
                    disabled={isSearching}
                    className="bg-accent hover:bg-accent-dark"
                  >
                    {isSearching ? "搜索中..." : "搜索"}
                  </Button>
                </div>

                {/* 搜索结果 */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {users.length === 0 && !isSearching && (
                    <p className="text-foreground-muted text-center py-8">
                      输入关键词搜索用户
                    </p>
                  )}
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedUser?.id === user.id
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50 hover:bg-surface"
                      }`}
                    >
                      <div className="font-medium text-foreground truncate">
                        {user.email}
                      </div>
                      <div className="text-sm text-foreground-muted">
                        {user.name || "未设置昵称"} · {user._count.practices}次练习
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 右侧：会员详情 */}
            <div className="lg:col-span-2 space-y-4">
              {selectedUser ? (
                <>
                  {/* 用户信息 */}
                  <div className="bg-surface rounded-2xl p-6 border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {selectedUser.email}
                        </h3>
                        <p className="text-sm text-foreground-muted">
                          注册于 {new Date(selectedUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedUser.plan === "PRO"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}>
                          {selectedUser.plan}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-background rounded-xl">
                        <div className="text-2xl font-bold text-foreground">{selectedUser._count.practices}</div>
                        <div className="text-xs text-foreground-muted">练习次数</div>
                      </div>
                      <div className="p-3 bg-background rounded-xl">
                        <div className="text-2xl font-bold text-foreground">{selectedUser._count.sessions}</div>
                        <div className="text-xs text-foreground-muted">面试次数</div>
                      </div>
                      <div className="p-3 bg-background rounded-xl">
                        <div className="text-2xl font-bold text-foreground">{selectedUser._count.memberships}</div>
                        <div className="text-xs text-foreground-muted">会员订单</div>
                      </div>
                    </div>
                  </div>

                  {/* 会员列表 */}
                  <div className="bg-surface rounded-2xl p-6 border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-accent" />
                      会员记录
                    </h3>
                    {memberships.length === 0 ? (
                      <p className="text-foreground-muted text-center py-8">
                        暂无会员记录
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {memberships.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-4 bg-background rounded-xl border border-border"
                          >
                            <div className="flex items-center gap-3">
                              {m.type === "CREDIT" ? (
                                <CreditCard className="w-5 h-5 text-blue-500" />
                              ) : (
                                <Clock className="w-5 h-5 text-purple-500" />
                              )}
                              <div>
                                <div className="font-medium text-foreground">
                                  {m.type === "CREDIT" ? "次卡" : "月卡"}
                                  {m.type === "CREDIT" && m.totalCredits && (
                                    <span className="text-sm text-foreground-muted ml-2">
                                      {m.totalCredits - m.usedCredits}/{m.totalCredits} 次
                                    </span>
                                  )}
                                </div>
                                {m.note && (
                                  <div className="text-sm text-foreground-muted">{m.note}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {m.status === "ACTIVE" ? (
                                <span className="flex items-center gap-1 text-green-600 text-sm">
                                  <CheckCircle className="w-4 h-4" />
                                  有效
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-gray-500 text-sm">
                                  <XCircle className="w-4 h-4" />
                                  已过期
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 开通会员 */}
                  <div className="bg-surface rounded-2xl p-6 border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      开通会员
                    </h3>
                    {grantMessage && (
                      <div className={`mb-4 p-3 rounded-lg text-sm ${
                        grantMessage.type === "success"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {grantMessage.text}
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setGrantType("CREDIT")}
                          className={`flex-1 py-2 px-4 rounded-lg border transition-all ${
                            grantType === "CREDIT"
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border hover:border-accent/50"
                          }`}
                        >
                          次卡
                        </button>
                        <button
                          onClick={() => setGrantType("MONTHLY")}
                          className={`flex-1 py-2 px-4 rounded-lg border transition-all ${
                            grantType === "MONTHLY"
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border hover:border-accent/50"
                          }`}
                        >
                          月卡
                        </button>
                      </div>

                      {grantType === "CREDIT" ? (
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            次数
                          </label>
                          <input
                            type="number"
                            value={credits}
                            onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
                            min={1}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            天数
                          </label>
                          <input
                            type="number"
                            value={durationDays}
                            onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
                            min={1}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          备注（可选）
                        </label>
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="例如：活动赠送、测试账号"
                          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>

                      <Button
                        onClick={grantMembership}
                        disabled={isGranting}
                        className="w-full bg-accent hover:bg-accent-dark"
                      >
                        {isGranting ? "开通中..." : "确认开通"}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-surface rounded-2xl p-12 border border-border text-center">
                  <Crown className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                  <p className="text-foreground-muted">
                    选择左侧用户查看会员详情
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ============ 子组件 ============

function StatCard({
  icon: Icon,
  title,
  value,
  subValue,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subValue?: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  };

  return (
    <div className="bg-surface rounded-2xl p-6 border border-border">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-foreground-muted">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subValue && <p className="text-xs text-foreground-muted">{subValue}</p>}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  expanded,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-surface/80 transition-colors"
      >
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
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

function MetricItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="text-center p-4 bg-background rounded-xl">
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-foreground-muted mt-1">{label}</div>
    </div>
  );
}
