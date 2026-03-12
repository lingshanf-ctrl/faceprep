"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// 图表组件 - 折线图
function LineChart({
  data,
  xKey,
  yKey,
  color = "#0025E0",
  height = 200,
}: {
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}) {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => d[yKey] || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const padding = 20;
  const chartWidth = 100 - padding * 2;
  const chartHeight = 100 - padding * 2;

  const points = data
    .map((d, i) => {
      const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
      const y = padding + chartHeight - ((d[yKey] - min) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `${padding},${padding + chartHeight} ${points} ${100 - padding},${padding + chartHeight}`;

  return (
    <div style={{ height }} className="w-full">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* 网格线 */}
        <line
          x1="20"
          y1="20"
          x2="80"
          y2="20"
          stroke="#e5e7eb"
          strokeWidth="0.5"
        />
        <line
          x1="20"
          y1="50"
          x2="80"
          y2="50"
          stroke="#e5e7eb"
          strokeWidth="0.5"
        />
        <line
          x1="20"
          y1="80"
          x2="80"
          y2="80"
          stroke="#e5e7eb"
          strokeWidth="0.5"
        />

        {/* 面积 */}
        <polygon points={areaPoints} fill={`${color}20`} />

        {/* 线条 */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 数据点 */}
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
          const y =
            padding + chartHeight - ((d[yKey] - min) / range) * chartHeight;
          return <circle key={i} cx={x} cy={y} r="1.5" fill={color} />;
        })}
      </svg>
    </div>
  );
}

// 柱状图
function BarChart({
  data,
  xKey,
  yKey,
  color = "#0025E0",
  height = 200,
}: {
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}) {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => d[yKey] || 0);
  const max = Math.max(...values, 1);

  const padding = 10;
  const barWidth = (100 - padding * 2) / data.length - 2;

  return (
    <div style={{ height }} className="w-full">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {/* 基线 */}
        <line x1="5" y1="90" x2="95" y2="90" stroke="#e5e7eb" strokeWidth="1" />

        {data.map((d, i) => {
          const value = d[yKey] || 0;
          const barHeight = (value / max) * 80;
          const x = padding + i * ((100 - padding * 2) / data.length) + 1;
          const y = 90 - barHeight;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="1"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 饼图
function PieChart({
  data,
  valueKey,
  labelKey,
  height = 200,
}: {
  data: any[];
  valueKey: string;
  labelKey: string;
  height?: number;
}) {
  if (!data || data.length === 0) return null;

  const colors = ["#0025E0", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const total = data.reduce((sum, d) => sum + (d[valueKey] || 0), 0);

  let currentAngle = 0;

  return (
    <div style={{ height }} className="w-full flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ maxWidth: height }}
      >
        {data.map((d, i) => {
          const value = d[valueKey] || 0;
          const percentage = total > 0 ? value / total : 0;
          const angle = percentage * 360;

          const startAngle = currentAngle;
          currentAngle += angle;
          const endAngle = currentAngle;

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;

          const x1 = 50 + 40 * Math.cos(startRad);
          const y1 = 50 + 40 * Math.sin(startRad);
          const x2 = 50 + 40 * Math.cos(endRad);
          const y2 = 50 + 40 * Math.sin(endRad);

          const largeArcFlag = angle > 180 ? 1 : 0;

          const pathData = [
            `M 50 50`,
            `L ${x1} ${y1}`,
            `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `Z`,
          ].join(" ");

          return (
            <path
              key={i}
              d={pathData}
              fill={colors[i % colors.length]}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}

        {/* 中心圆 */}
        <circle cx="50" cy="50" r="20" fill="white" />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs font-bold fill-gray-800"
        >
          {total}
        </text>
      </svg>
    </div>
  );
}

// 漏斗图
function FunnelChart({
  data,
  height = 250,
}: {
  data: { name: string; count: number; percentage: number }[];
  height?: number;
}) {
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div style={{ height }} className="w-full">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {data.map((d, i) => {
          const width = (d.count / maxCount) * 80;
          const x = 50 - width / 2;
          const y = i * (100 / data.length) + 2;
          const barHeight = 100 / data.length - 4;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={width}
                height={barHeight}
                fill={`rgba(0, 37, 224, ${1 - i * 0.15})`}
                rx="2"
              />
              <text
                x={50}
                y={y + barHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[8px] fill-white font-medium"
              >
                {d.percentage}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AnalyticsDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 数据状态
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [conversionData, setConversionData] = useState<any>(null);

  // 检查管理员权限
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

  // 加载数据
  const loadData = async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const [analyticsRes, conversionRes] = await Promise.all([
        fetch(`/api/admin/analytics?period=${period}`),
        fetch(`/api/admin/analytics/conversion?period=${period}`),
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalyticsData(data);
      }

      if (conversionRes.ok) {
        const data = await conversionRes.json();
        setConversionData(data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, period]);

  // 自动刷新
  useEffect(() => {
    if (!isAdmin) return;

    const interval = setInterval(() => {
      loadData();
    }, 30000); // 30秒刷新一次

    return () => clearInterval(interval);
  }, [isAdmin, period]);

  // 加载中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  // 无权限
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>访问受限</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">需要管理员权限才能访问此页面。</p>
            <Button onClick={() => window.location.href = "/"} className="w-full bg-[#0025E0]">
              返回首页
            </Button>
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
              <h1 className="text-2xl font-bold text-gray-900">数据分析大屏</h1>
              <p className="text-sm text-gray-500 mt-1">
                实时洞察平台运营数据
                {lastUpdated && (
                  <span className="ml-2">
                    · 更新于 {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">时间范围:</span>
                <select
                  value={period}
                  onChange={(e) => setPeriod(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value={7}>近7天</option>
                  <option value={30}>近30天</option>
                  <option value={90}>近90天</option>
                </select>
              </div>
              <Button
                onClick={loadData}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? "刷新中..." : "刷新数据"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* 核心指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">总用户数</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {analyticsData?.summary?.totalUsers?.toLocaleString() || "-"}
              </p>
              <p className="text-xs text-green-600 mt-1">
                +{analyticsData?.summary?.newUsersInPeriod || 0} 新增
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">活跃用户 (MAU)</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {analyticsData?.summary?.activeUsersInPeriod?.toLocaleString() ||
                  "-"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {analyticsData?.summary?.totalUsers
                  ? Math.round(
                      (analyticsData.summary.activeUsersInPeriod /
                        analyticsData.summary.totalUsers) *
                        100,
                    )
                  : 0}
                % 活跃率
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">次日留存率</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {analyticsData?.summary?.retentionRate || "-"}%
              </p>
              <p className="text-xs text-gray-500 mt-1">平均水平</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500">会员转化率</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {conversionData?.conversionFunnel?.overallRate || "-"}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {conversionData?.summary?.totalMembers || 0} 位会员
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 用户增长趋势 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">用户增长趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={analyticsData?.userGrowth || []}
                xKey="date"
                yKey="newUsers"
                height={200}
              />
            </CardContent>
          </Card>

          {/* DAU趋势 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">日活跃用户 (DAU)</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={analyticsData?.dailyActiveUsers || []}
                xKey="date"
                yKey="dau"
                color="#10b981"
                height={200}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 用户分群 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">用户活跃度分布</CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart
                data={analyticsData?.userSegments?.segments || []}
                valueKey="count"
                labelKey="name"
                height={200}
              />
              <div className="mt-4 space-y-2">
                {analyticsData?.userSegments?.segments?.map(
                  (s: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: [
                              "#0025E0",
                              "#10b981",
                              "#f59e0b",
                              "#ef4444",
                            ][i],
                          }}
                        />
                        {s.name}
                      </span>
                      <span className="text-gray-500">
                        {s.count}人 ({s.percentage}%)
                      </span>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          {/* 转化漏斗 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">转化漏斗</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-8">
                <div className="flex-1">
                  <FunnelChart
                    data={conversionData?.conversionFunnel?.stages || []}
                    height={250}
                  />
                </div>
                <div className="w-48 space-y-3">
                  {conversionData?.conversionFunnel?.stages?.map(
                    (s: any, i: number) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">{s.name}</p>
                        <p className="text-xl font-bold text-gray-900">
                          {s.count.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {s.percentage}% 转化率
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 业务指标 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 练习数据统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">练习数据分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">总练习次数</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {analyticsData?.practiceStats?.total?.toLocaleString() ||
                      "-"}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">平均得分</p>
                  <p className="text-2xl font-bold text-green-900">
                    {analyticsData?.practiceStats?.avgScore || "-"}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-2">分数分布</p>
              <div className="space-y-2">
                {analyticsData?.practiceStats?.scoreDistribution?.map(
                  (d: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 w-16">
                        {d.range}
                      </span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0025E0] rounded-full"
                          style={{
                            width: `${Math.max(
                              (d.count /
                                (analyticsData?.practiceStats?.inPeriod || 1)) *
                                100,
                              5,
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-700 w-12 text-right">
                        {d.count}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          {/* 会员统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">会员业务分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">次卡用户</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {conversionData?.membership?.byType?.credit?.total || 0}
                  </p>
                  <p className="text-xs text-purple-500">
                    使用率{" "}
                    {conversionData?.membership?.byType?.credit?.usageRate || 0}
                    %
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-600">月卡用户</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {conversionData?.membership?.byType?.monthly?.total || 0}
                  </p>
                  <p className="text-xs text-orange-500">
                    活跃{" "}
                    {conversionData?.membership?.byType?.monthly?.active || 0}人
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-2">会员增长趋势</p>
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

        {/* 功能使用与时段分析 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">功能使用情况</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">语音输入使用率</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0025E0] rounded-full"
                        style={{
                          width: `${analyticsData?.featureUsage?.voiceUsageRate || 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {analyticsData?.featureUsage?.voiceUsageRate || 0}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">AI 评估使用率</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#10b981] rounded-full"
                        style={{
                          width: `${analyticsData?.featureUsage?.aiEvaluationRate || 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {analyticsData?.featureUsage?.aiEvaluationRate || 0}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">新增收藏</span>
                  <span className="text-sm font-medium text-gray-900">
                    {analyticsData?.featureUsage?.favoritesCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">自定义题目</span>
                  <span className="text-sm font-medium text-gray-900">
                    {analyticsData?.featureUsage?.customQuestionsCount || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">使用时段分布</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={analyticsData?.hourlyDistribution || []}
                xKey="hour"
                yKey="count"
                color="#f59e0b"
                height={200}
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                24小时分布
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 面试统计 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">模拟面试统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData?.interviewStats?.total || 0}
                </p>
                <p className="text-sm text-gray-500">总面试数</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-900">
                  {analyticsData?.interviewStats?.completed || 0}
                </p>
                <p className="text-sm text-green-600">完成数</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-900">
                  {analyticsData?.interviewStats?.abandoned || 0}
                </p>
                <p className="text-sm text-red-600">放弃数</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-900">
                  {analyticsData?.interviewStats?.avgScore || 0}
                </p>
                <p className="text-sm text-blue-600">平均分</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 高价值用户 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">TOP 10 高价值用户</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 font-medium text-gray-500">
                      用户
                    </th>
                    <th className="text-center py-2 px-4 font-medium text-gray-500">
                      练习次数
                    </th>
                    <th className="text-center py-2 px-4 font-medium text-gray-500">
                      面试次数
                    </th>
                    <th className="text-center py-2 px-4 font-medium text-gray-500">
                      会员订单
                    </th>
                    <th className="text-center py-2 px-4 font-medium text-gray-500">
                      使用次数
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {conversionData?.topUsers?.map((user: any, i: number) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user.name || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        {user.practices}
                      </td>
                      <td className="text-center py-3 px-4">
                        {user.interviews}
                      </td>
                      <td className="text-center py-3 px-4">
                        {user.memberships}
                      </td>
                      <td className="text-center py-3 px-4 font-medium text-[#0025E0]">
                        {user.usageCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
