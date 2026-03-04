"use client";

import { TrendingUp, Target, Award, Flame } from "lucide-react";

interface StatsCardsProps {
  totalPractices: number;
  averageScore: number;
  highestScore: number;
  streak: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  color: "blue" | "green" | "purple" | "orange";
}

function StatCard({ icon, label, value, suffix, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg border ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatsCards({
  totalPractices,
  averageScore,
  highestScore,
  streak,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Target className="w-5 h-5" />}
        label="练习次数"
        value={totalPractices}
        suffix="次"
        color="blue"
      />
      <StatCard
        icon={<TrendingUp className="w-5 h-5" />}
        label="平均分"
        value={averageScore}
        suffix="分"
        color="green"
      />
      <StatCard
        icon={<Award className="w-5 h-5" />}
        label="最高分"
        value={highestScore}
        suffix="分"
        color="purple"
      />
      <StatCard
        icon={<Flame className="w-5 h-5" />}
        label="连续练习"
        value={streak}
        suffix="天"
        color="orange"
      />
    </div>
  );
}
