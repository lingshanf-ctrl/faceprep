"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ─── 图表组件 ──────────────────────────────────────────────────────────────────

function LineChart({
  data,
  xKey,
  yKey,
  color = "#0025E0",
  height = 200,
  nullAsGap = false,
}: {
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  nullAsGap?: boolean;
}) {
  if (!data || data.length === 0) return <div style={{ height }} className="flex items-center justify-center text-gray-400 text-sm">暂无数据</div>;

  const validValues = data.map((d) => d[yKey]).filter((v) => v != null);
  if (validValues.length === 0) return null;

  const max = Math.max(...validValues, 1);
  const min = Math.min(...validValues, 0);
  const range = max - min || 1;
  const pad = 20;
  const cw = 100 - pad * 2;
  const ch = 100 - pad * 2;

  const points = data
    .filter((d) => d[yKey] != null)
    .map((d, _, arr) => {
      const idx = data.indexOf(d);
      const x = pad + (idx / (data.length - 1 || 1)) * cw;
      const y = pad + ch - ((d[yKey] - min) / range) * ch;
      return `${x},${y}`;
    })
    .join(" ");

  const first = data[0];
  const last = data[data.length - 1];
  const fx = pad;
  const lx = pad + cw;
  const areaPoints = `${fx},${pad + ch} ${points} ${lx},${pad + ch}`;

  return (
    <div style={{ height }} className="w-full">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <line x1="20" y1="20" x2="80" y2="20" stroke="#e5e7eb" strokeWidth="0.5" />
        <line x1="20" y1="50" x2="80" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
        <line x1="20" y1="80" x2="80" y2="80" stroke="#e5e7eb" strokeWidth="0.5" />
        <polygon points={areaPoints} fill={`${color}20`} />
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          if (d[yKey] == null) return null;
          const x = pad + (i / (data.length - 1 || 1)) * cw;
          const y = pad + ch - ((d[yKey] - min) / range) * ch;
          return <circle key={i} cx={x} cy={y} r="1.5" fill={color} />;
        })}
      </svg>
    </div>
  );
}

function BarChart({
  data,
  xKey,
  yKey,
  color = "#0025E0",
  height = 160,
}: {
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}) {
  if (!data || data.length === 0) return <div style={{ height }} className="flex items-center justify-center text-gray-400 text-sm">暂无数据</div>;

  const values = data.map((d) => d[yKey] || 0);
  const max = Math.max(...values, 1);
  const pad = 8;
  const barWidth = (100 - pad * 2) / data.length - 1.5;

  return (
    <div style={{ height }} className="w-full">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <line x1="5" y1="90" x2="95" y2="90" stroke="#e5e7eb" strokeWidth="0.8" />
        {data.map((d, i) => {
          const value = d[yKey] || 0;
          const bh = (value / max) * 80;
          const x = pad + i * ((100 - pad * 2) / data.length) + 0.75;
          const y = 90 - bh;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={bh} fill={color} rx="1" opacity="0.85" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function FunnelSteps({ stages }: { stages: { name: string; count: number; percentage: number }[] }) {
  if (!stages || stages.length === 0) return null;
  const colors = ["#0025E0", "#3b5bff", "#6b82ff", "#a0b0ff"];

  return (
    <div className="space-y-2">
      {stages.map((s, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{s.name}</span>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-900">{s.count.toLocaleString()}</span>
              {i > 0 && (
                <span className="text-xs text-gray-400 ml-1">({s.percentage}%)</span>
              )}
            </div>
          </div>
          <div className="h-7 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className="h-full rounded-lg flex items-center px-3 transition-all"
              style={{
                width: `${Math.max(s.percentage, 3)}%`,
                backgroundColor: colors[i] || "#0025E0",
              }}
            >
              {s.percentage >= 10 && (
                <span className="text-xs text-white font-medium">{s.percentage}%</span>
              )}
            </div>
          </div>
          {i < stages.length - 1 && (
            <div className="text-xs text-gray-400 text-center mt-1">
              ↓ {stages[i + 1].percentage}% 进入下一步
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  color = "blue",
  large = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "orange" | "purple" | "red" | "gray";
  large?: boolean;
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 text-blue-900",
    green: "bg-green-50 text-green-600 text-green-900",
    orange: "bg-orange-50 text-orange-600 text-orange-900",
    purple: "bg-purple-50 text-purple-600 text-purple-900",
    red: "bg-red-50 text-red-600 text-red-900",
    gray: "bg-gray-50 text-gray-500 text-gray-900",
  };
  const [bg, labelColor, valueColor] = colorMap[color].split(" ");

  return (
    <div className={`${bg} rounded-xl p-4`}>
      <p className={`text-xs font-medium ${labelColor} mb-1`}>{label}</p>
      <p className={`${large ? "text-3xl" : "text-2xl"} font-bold ${valueColor}`}>{value}</p>
      {sub && <p className={`text-xs ${labelColor} mt-1 opacity-80`}>{sub}</p>}
    </div>
  );
}

// ─── 主页面 ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "growth", label: "增长漏斗" },
  { id: "learning", label: "学习效果" },
  { id: "content", label: "内容健康" },
  { id: "business", label: "商业分析" },
  { id: "behavior", label: "用户行为" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AnalyticsDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("growth");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [growthData, setGrowthData] = useState<any>(null);
  const [learningData, setLearningData] = useState<any>(null);
  const [contentData, setContentData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [conversionData, setConversionData] = useState<any>(null);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(data.user?.isAdmin || false);
        }
      } finally {
        setIsLoading(false);
      }
    }
    checkAdmin();
  }, []);

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [growthRes, learningRes, contentRes, analyticsRes, conversionRes] = await Promise.all([
        fetch(`/api/admin/analytics/growth?period=${period}`),
        fetch(`/api/admin/analytics/learning?period=${period}`),
        fetch(`/api/admin/analytics/content?period=${period}`),
        fetch(`/api/admin/analytics?period=${period}`),
        fetch(`/api/admin/analytics/conversion?period=${period}`),
      ]);

      if (growthRes.ok) setGrowthData(await growthRes.json());
      if (learningRes.ok) setLearningData(await learningRes.json());
      if (contentRes.ok) setContentData(await contentRes.json());
      if (analyticsRes.ok) setAnalyticsData(await analyticsRes.json());
      if (conversionRes.ok) setConversionData(await conversionRes.json());

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, period]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>访问受限</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">需要管理员权限才能访问此页面。</p>
            <Button onClick={() => (window.location.href = "/")} className="w-full bg-[#0025E0]">返回首页</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">← 管理后台</Link>
                <h1 className="text-xl font-bold text-gray-900">数据分析</h1>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {lastUpdated ? `更新于 ${lastUpdated.toLocaleTimeString()}` : "加载中..."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value={7}>近7天</option>
                <option value={30}>近30天</option>
                <option value={90}>近90天</option>
              </select>
              <Button onClick={loadData} disabled={loading} variant="outline" size="sm">
                {loading ? "刷新中..." : "刷新"}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#0025E0] text-[#0025E0] bg-blue-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* ── 增长漏斗 ── */}
        {activeTab === "growth" && (
          <div className="space-y-6">
            {/* 核心激活指标 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="期内新注册"
                value={growthData?.activationFunnel?.totalNew?.toLocaleString() ?? "-"}
                sub={`近${period}天`}
                color="blue"
              />
              <MetricCard
                label="48小时激活率"
                value={`${growthData?.activationFunnel?.activationRate ?? "-"}%`}
                sub={`${growthData?.activationFunnel?.activatedCount ?? 0} 人激活`}
                color="green"
              />
              <MetricCard
                label="新用户付费率"
                value={`${growthData?.activationFunnel?.paidRate ?? "-"}%`}
                sub={`${growthData?.activationFunnel?.paidCount ?? 0} 人付费`}
                color="purple"
              />
              <MetricCard
                label="体验卡→付费"
                value={`${growthData?.trialConversion?.conversionRate ?? "-"}%`}
                sub={`${growthData?.trialConversion?.convertedCount ?? 0}/${growthData?.trialConversion?.totalTrials ?? 0} 人转化`}
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 增长漏斗 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">注册→激活→付费 漏斗</CardTitle>
                  <p className="text-xs text-gray-400">近{period}天新注册用户的转化路径</p>
                </CardHeader>
                <CardContent>
                  <FunnelSteps
                    stages={[
                      {
                        name: "注册用户",
                        count: growthData?.activationFunnel?.totalNew ?? 0,
                        percentage: 100,
                      },
                      {
                        name: "48小时内首次练习（激活）",
                        count: growthData?.activationFunnel?.activatedCount ?? 0,
                        percentage: growthData?.activationFunnel?.activationRate ?? 0,
                      },
                      {
                        name: "购买会员（付费）",
                        count: growthData?.activationFunnel?.paidCount ?? 0,
                        percentage: growthData?.activationFunnel?.paidRate ?? 0,
                      },
                    ]}
                  />
                </CardContent>
              </Card>

              {/* 体验卡转化 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">体验卡转化分析</CardTitle>
                  <p className="text-xs text-gray-400">领取免费体验卡的用户后续付费情况</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <MetricCard
                      label="领取体验卡总人数"
                      value={growthData?.trialConversion?.totalTrials ?? "-"}
                      color="blue"
                    />
                    <MetricCard
                      label="转化为付费用户"
                      value={growthData?.trialConversion?.convertedCount ?? "-"}
                      color="green"
                    />
                    <MetricCard
                      label="转化率"
                      value={`${growthData?.trialConversion?.conversionRate ?? "-"}%`}
                      color="purple"
                    />
                    <MetricCard
                      label="平均转化天数"
                      value={`${growthData?.trialConversion?.avgDaysToConvert ?? "-"}天`}
                      color="orange"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 付费触发点 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">付费触发点</CardTitle>
                  <p className="text-xs text-gray-400">
                    用户平均练习{" "}
                    <span className="text-[#0025E0] font-bold">
                      {growthData?.payTrigger?.avgPracticesBeforePay ?? "-"}
                    </span>{" "}
                    次后购买会员
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {growthData?.payTrigger?.distribution?.map((d: any, i: number) => {
                      const total = growthData.payTrigger.distribution.reduce(
                        (s: number, x: any) => s + x.count,
                        0
                      );
                      const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{d.range}</span>
                            <span className="text-gray-900 font-medium">{d.count} 人 ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0025E0] rounded-full"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* 7日/14日/30日留存 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">首次练习后留存率</CardTitle>
                  <p className="text-xs text-gray-400">期内激活用户（{growthData?.retentionFromFirstPractice?.total ?? 0}人）的后续回访情况</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "7日留存", key: "day7" },
                      { label: "14日留存", key: "day14" },
                      { label: "30日留存", key: "day30" },
                    ].map((item) => {
                      const rate = growthData?.retentionFromFirstPractice?.[item.key];
                      return (
                        <div key={item.key} className="text-center p-4 bg-gray-50 rounded-xl">
                          <p className="text-3xl font-bold text-gray-900">
                            {rate != null ? `${rate}%` : "-"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 mb-2">每日激活率趋势</p>
                    <LineChart
                      data={growthData?.dailyActivation || []}
                      xKey="date"
                      yKey="rate"
                      color="#10b981"
                      height={120}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── 学习效果 ── */}
        {activeTab === "learning" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="用户进步率"
                value={`${learningData?.improvementRate?.improvedRate ?? "-"}%`}
                sub={`${learningData?.improvementRate?.improvedCount ?? 0}/${learningData?.improvementRate?.eligibleUsers ?? 0} 人进步`}
                color="green"
              />
              <MetricCard
                label="平均得分提升"
                value={
                  learningData?.improvementRate?.avgImprovement != null
                    ? `${learningData.improvementRate.avgImprovement > 0 ? "+" : ""}${learningData.improvementRate.avgImprovement}分`
                    : "-"
                }
                sub="前3次 vs 近3次均分"
                color={learningData?.improvementRate?.avgImprovement >= 0 ? "green" : "red"}
              />
              <MetricCard
                label="低分重做率"
                value={`${learningData?.redoRate?.redoRate ?? "-"}%`}
                sub={`${learningData?.redoRate?.redoCount ?? 0}/${learningData?.redoRate?.total ?? 0} 次`}
                color="orange"
              />
              <MetricCard
                label="符合统计用户"
                value={learningData?.improvementRate?.eligibleUsers ?? "-"}
                sub="练习≥5次且有评分"
                color="blue"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 进步分布 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">用户进步分布</CardTitle>
                  <p className="text-xs text-gray-400">对比首3次与近3次练习均分变化</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {learningData?.improvementRate?.distribution?.map((d: any, i: number) => {
                      const total = learningData.improvementRate.eligibleUsers || 1;
                      const pct = Math.round((d.count / total) * 100);
                      const segColors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{d.label}</span>
                            <span className="font-medium">{d.count} 人 ({pct}%)</span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(pct, 2)}%`,
                                backgroundColor: segColors[i],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600">
                      💡 低分重做率反映用户主动改进的意愿。当前{" "}
                      <span className="font-bold">{learningData?.redoRate?.redoRate ?? 0}%</span> 的低分用户选择重新练习该题。
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 分类平均分 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">各分类平均得分</CardTitle>
                  <p className="text-xs text-gray-400">近{period}天，识别难度异常的题目分类</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {learningData?.categoryScores
                      ?.slice(0, 8)
                      .map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-16 shrink-0">{c.categoryName}</span>
                          <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden">
                            <div
                              className="h-full rounded-md flex items-center px-2"
                              style={{
                                width: `${c.avgScore}%`,
                                backgroundColor:
                                  c.avgScore >= 75
                                    ? "#10b981"
                                    : c.avgScore >= 60
                                    ? "#f59e0b"
                                    : "#ef4444",
                              }}
                            >
                              <span className="text-xs text-white font-medium">{c.avgScore}</span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 w-12 text-right">{c.count}次</span>
                        </div>
                      ))}
                    {(!learningData?.categoryScores || learningData.categoryScores.length === 0) && (
                      <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 得分趋势 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">平台整体得分趋势</CardTitle>
                <p className="text-xs text-gray-400">趋势上升代表题库难度适中且用户在持续进步</p>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={(learningData?.scoreTrend || []).filter((d: any) => d.count > 0)}
                  xKey="date"
                  yKey="avgScore"
                  color="#0025E0"
                  height={200}
                  nullAsGap
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── 内容健康 ── */}
        {activeTab === "content" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="题目总数"
                value={contentData?.coverage?.totalQuestions ?? "-"}
                sub="官方题库"
                color="blue"
              />
              <MetricCard
                label="题目覆盖率"
                value={`${contentData?.coverage?.coverageRate ?? "-"}%`}
                sub={`${contentData?.coverage?.practicedCount ?? 0} 道题有练习`}
                color="green"
              />
              <MetricCard
                label="从未被练习"
                value={contentData?.coverage?.neverPracticedCount ?? "-"}
                sub="道题"
                color="orange"
              />
              <MetricCard
                label="新方向题目"
                value={contentData?.newCategoryAdoption?.reduce((s: number, c: any) => s + c.totalPractices, 0) ?? "-"}
                sub="DATA/AI/营销/管理 累计练习"
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 新分类采用情况 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">新分类采用情况</CardTitle>
                  <p className="text-xs text-gray-400">4个新增方向（共80道题）的使用数据</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contentData?.newCategoryAdoption?.map((c: any, i: number) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-800">{c.categoryName}</span>
                          <span className="text-xs text-[#0025E0] font-medium">
                            近{period}天 {c.recentPractices} 次
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">{c.totalPractices}</p>
                            <p className="text-xs text-gray-400">总练习次数</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">{c.uniqueUsers}</p>
                            <p className="text-xs text-gray-400">独立用户数</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!contentData?.newCategoryAdoption || contentData.newCategoryAdoption.length === 0) && (
                      <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 分类覆盖热图 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">各分类练习量分布</CardTitle>
                  <p className="text-xs text-gray-400">可识别冷门分类，考虑加强内容推荐</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {contentData?.coverage?.byCategoryBreakdown
                      ?.sort((a: any, b: any) => b.practiceCount - a.practiceCount)
                      .map((c: any, i: number) => {
                        const maxCount = Math.max(
                          ...(contentData?.coverage?.byCategoryBreakdown?.map((x: any) => x.practiceCount) || [1]),
                          1
                        );
                        const pct = Math.round((c.practiceCount / maxCount) * 100);
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-16 shrink-0">{c.categoryName}</span>
                            <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                              <div
                                className="h-full bg-[#0025E0] rounded flex items-center px-2 transition-all"
                                style={{ width: `${Math.max(pct, 2)}%`, opacity: 0.7 + pct * 0.003 }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-14 text-right">
                              {c.practiceCount} 次
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 高分题 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-green-700">高分题 TOP 5</CardTitle>
                  <p className="text-xs text-gray-400">近{period}天均分最高（≥3次练习）</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {contentData?.questionPerformance?.topScored?.map((q: any, i: number) => (
                      <div key={i} className="flex items-start justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-600 flex-1 line-clamp-2">{q.title}</span>
                        <span className="text-sm font-bold text-green-700 shrink-0">{q.avgScore}</span>
                      </div>
                    ))}
                    {(!contentData?.questionPerformance?.topScored?.length) && (
                      <p className="text-sm text-gray-400 text-center py-4">数据不足</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 低分题 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-red-700">低分题 TOP 5</CardTitle>
                  <p className="text-xs text-gray-400">近{period}天均分最低（≥3次练习）</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {contentData?.questionPerformance?.lowScored?.map((q: any, i: number) => (
                      <div key={i} className="flex items-start justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-600 flex-1 line-clamp-2">{q.title}</span>
                        <span className="text-sm font-bold text-red-600 shrink-0">{q.avgScore}</span>
                      </div>
                    ))}
                    {(!contentData?.questionPerformance?.lowScored?.length) && (
                      <p className="text-sm text-gray-400 text-center py-4">数据不足</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 从未练习的题 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-orange-700">从未被练习</CardTitle>
                  <p className="text-xs text-gray-400">这些题目可考虑加强推荐或检查内容</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {contentData?.questionPerformance?.neverPracticed?.slice(0, 8).map((q: any, i: number) => (
                      <div key={i} className="flex items-start justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-600 flex-1 line-clamp-2">{q.title}</span>
                        <span className="text-xs text-gray-400 shrink-0">{q.category}</span>
                      </div>
                    ))}
                    {(!contentData?.questionPerformance?.neverPracticed?.length) && (
                      <p className="text-sm text-green-600 text-center py-4">✓ 所有题目均有练习记录</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── 商业分析 ── */}
        {activeTab === "business" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="总会员订单"
                value={conversionData?.summary?.totalMembers ?? "-"}
                sub={`${conversionData?.summary?.activeMembers ?? 0} 个有效`}
                color="purple"
              />
              <MetricCard
                label="整体转化率"
                value={`${conversionData?.conversionFunnel?.overallRate ?? "-"}%`}
                sub="注册→付费"
                color="blue"
              />
              <MetricCard
                label="复购率"
                value={`${conversionData?.conversionFunnel?.repeatPurchaseRate ?? "-"}%`}
                sub="付费→再次付费"
                color="green"
              />
              <MetricCard
                label="次卡使用率"
                value={`${conversionData?.membership?.byType?.credit?.usageRate ?? "-"}%`}
                sub={`${conversionData?.membership?.byType?.credit?.totalCreditsUsed ?? 0}/${conversionData?.membership?.byType?.credit?.totalCreditsSold ?? 0} 次`}
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 转化漏斗 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">全量转化漏斗</CardTitle>
                </CardHeader>
                <CardContent>
                  <FunnelSteps stages={conversionData?.conversionFunnel?.stages || []} />
                </CardContent>
              </Card>

              {/* 会员类型分析 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">会员类型拆解</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <p className="text-xs text-purple-600 font-medium mb-1">次卡</p>
                      <p className="text-2xl font-bold text-purple-900">{conversionData?.membership?.byType?.credit?.total ?? 0}</p>
                      <p className="text-xs text-purple-500 mt-1">
                        均 {conversionData?.membership?.byType?.credit?.avgCredits ?? 0} 次/单
                      </p>
                      <p className="text-xs text-purple-500">
                        使用率 {conversionData?.membership?.byType?.credit?.usageRate ?? 0}%
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl">
                      <p className="text-xs text-orange-600 font-medium mb-1">月卡</p>
                      <p className="text-2xl font-bold text-orange-900">{conversionData?.membership?.byType?.monthly?.total ?? 0}</p>
                      <p className="text-xs text-orange-500 mt-1">
                        活跃 {conversionData?.membership?.byType?.monthly?.active ?? 0} 人
                      </p>
                      <p className="text-xs text-orange-500">
                        均 {conversionData?.membership?.byType?.monthly?.avgDurationDays ?? 0} 天/单
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">会员增长趋势（近{period}天）</p>
                  <BarChart
                    data={conversionData?.membershipTrend?.slice(-14) || []}
                    xKey="date"
                    yKey="total"
                    color="#8b5cf6"
                    height={120}
                  />
                </CardContent>
              </Card>
            </div>

            {/* TOP 10 高价值用户 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">TOP 10 高价值用户</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["用户", "练习次数", "面试次数", "会员订单", "消费次数"].map((h) => (
                          <th key={h} className="py-2 px-3 text-left font-medium text-gray-400 text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {conversionData?.topUsers?.map((u: any) => (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5 px-3">
                            <p className="font-medium text-gray-900 text-xs">{u.email}</p>
                            <p className="text-xs text-gray-400">{u.name || "-"}</p>
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">{u.practices}</td>
                          <td className="py-2.5 px-3 text-gray-700">{u.interviews}</td>
                          <td className="py-2.5 px-3 text-gray-700">{u.memberships}</td>
                          <td className="py-2.5 px-3 font-bold text-[#0025E0]">{u.usageCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── 用户行为 ── */}
        {activeTab === "behavior" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="总用户"
                value={analyticsData?.summary?.totalUsers?.toLocaleString() ?? "-"}
                sub={`+${analyticsData?.summary?.newUsersInPeriod ?? 0} 近${period}天`}
                color="blue"
              />
              <MetricCard
                label="活跃用户"
                value={analyticsData?.summary?.activeUsersInPeriod?.toLocaleString() ?? "-"}
                sub={`${analyticsData?.summary?.totalUsers ? Math.round((analyticsData.summary.activeUsersInPeriod / analyticsData.summary.totalUsers) * 100) : 0}% 活跃率`}
                color="green"
              />
              <MetricCard
                label="平均练习次数"
                value={analyticsData?.practiceStats?.avgPerUser ?? "-"}
                sub="活跃用户人均"
                color="orange"
              />
              <MetricCard
                label="平台均分"
                value={analyticsData?.practiceStats?.avgScore ?? "-"}
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">日活跃用户趋势（DAU）</CardTitle></CardHeader>
                <CardContent>
                  <LineChart data={analyticsData?.dailyActiveUsers || []} xKey="date" yKey="dau" color="#10b981" height={200} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">用户增长趋势</CardTitle></CardHeader>
                <CardContent>
                  <LineChart data={analyticsData?.userGrowth || []} xKey="date" yKey="newUsers" height={200} />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 用户分群 */}
              <Card>
                <CardHeader><CardTitle className="text-base">用户活跃度分布</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData?.userSegments?.segments?.map((s: any, i: number) => {
                      const segColors = ["#0025E0", "#10b981", "#f59e0b", "#d1d5db"];
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: segColors[i] }} />
                              {s.name}
                            </span>
                            <span className="text-gray-600">{s.count}人 <span className="text-gray-400">({s.percentage}%)</span></span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${s.percentage}%`, backgroundColor: segColors[i] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* 功能使用 */}
              <Card>
                <CardHeader><CardTitle className="text-base">功能使用情况</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: "语音输入", value: analyticsData?.featureUsage?.voiceUsageRate ?? 0, color: "#0025E0" },
                      { label: "AI 评估", value: analyticsData?.featureUsage?.aiEvaluationRate ?? 0, color: "#10b981" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium">{item.value}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">新增收藏</span>
                        <span className="font-medium">{analyticsData?.featureUsage?.favoritesCount ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">自定义题目</span>
                        <span className="font-medium">{analyticsData?.featureUsage?.customQuestionsCount ?? 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 使用时段 */}
              <Card>
                <CardHeader><CardTitle className="text-base">使用时段分布</CardTitle></CardHeader>
                <CardContent>
                  <BarChart data={analyticsData?.hourlyDistribution || []} xKey="hour" yKey="count" color="#f59e0b" height={180} />
                  <p className="text-xs text-gray-400 text-center mt-2">24小时分布</p>
                </CardContent>
              </Card>
            </div>

            {/* 留存矩阵 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cohort 留存矩阵</CardTitle>
                <p className="text-xs text-gray-400">各周批次新用户的后续练习留存情况</p>
              </CardHeader>
              <CardContent>
                {analyticsData?.retention?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-2 px-3 text-gray-400 font-medium">批次</th>
                          <th className="text-center py-2 px-3 text-gray-400 font-medium">用户数</th>
                          {[1, 3, 7, 14, 30].map((d) => (
                            <th key={d} className="text-center py-2 px-3 text-gray-400 font-medium">{d}日</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.retention.map((cohort: any, i: number) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="py-2 px-3 text-gray-600">{cohort.cohort}</td>
                            <td className="py-2 px-3 text-center text-gray-700">{cohort.users}</td>
                            {[1, 3, 7, 14, 30].map((day) => {
                              const r = cohort.retention?.find((x: any) => x.day === day);
                              const rate = r?.rate;
                              return (
                                <td key={day} className="py-2 px-3 text-center">
                                  {rate != null ? (
                                    <span
                                      className="px-2 py-0.5 rounded text-white text-xs"
                                      style={{
                                        backgroundColor:
                                          rate >= 40 ? "#10b981" : rate >= 20 ? "#f59e0b" : "#d1d5db",
                                      }}
                                    >
                                      {rate}%
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">暂无留存数据</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
