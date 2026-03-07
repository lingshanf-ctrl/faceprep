"use client";

import { useEffect, useState } from "react";
import { ScoreTrendChart, StatsCards, StreakDisplay } from "./charts";
import { AnonymousStatsWarning } from "./anonymous-warning";
import { Loader2 } from "lucide-react";

interface StatsData {
  totalPractices: number;
  averageScore: number;
  highestScore: number;
  recentTrend: number[];
  streak: number;
  isAnonymous: boolean;
  todayPractices?: number;
}

export function StatsDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const response = await fetch("/api/stats");

        if (!response.ok) {
          if (response.status === 401) {
            // 未授权，显示空状态
            setStats({
              totalPractices: 0,
              averageScore: 0,
              highestScore: 0,
              recentTrend: [],
              streak: 0,
              isAnonymous: true,
            });
            return;
          }
          throw new Error("获取统计数据失败");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取失败");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>加载失败，请稍后重试</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats.isAnonymous && <AnonymousStatsWarning />}

      {/* 统计卡片 */}
      <StatsCards
        totalPractices={stats.totalPractices}
        averageScore={stats.averageScore}
        highestScore={stats.highestScore}
        todayPractices={stats.todayPractices || 0}
        dailyGoal={3}
      />

      {/* 趋势图表和连续打卡 */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">近期得分趋势</h3>
          <ScoreTrendChart data={stats.recentTrend} height={240} />
        </div>

        <div className="lg:col-span-1">
          <StreakDisplay streak={stats.streak} />
        </div>
      </div>
    </div>
  );
}
