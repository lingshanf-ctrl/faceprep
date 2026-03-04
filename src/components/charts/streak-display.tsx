"use client";

import { Flame, Calendar } from "lucide-react";

interface StreakDisplayProps {
  streak: number;
  maxDays?: number;
}

export function StreakDisplay({ streak, maxDays = 7 }: StreakDisplayProps) {
  // 生成本周日期
  const getWeekDays = () => {
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    const today = new Date();
    const weekDays = [];

    for (let i = maxDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      weekDays.push({
        day: days[date.getDay()],
        date: date.getDate(),
        isToday: i === 0,
        isActive: i < streak,
      });
    }

    return weekDays;
  };

  const weekDays = getWeekDays();

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">连续练习</h3>
        </div>
        <span className="text-2xl font-bold text-orange-500">
          {streak}
          <span className="text-sm font-normal text-gray-500 ml-1">天</span>
        </span>
      </div>

      <div className="flex justify-between">
        {weekDays.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-400">{day.day}</span>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                day.isActive
                  ? "bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-md"
                  : day.isToday
                  ? "bg-orange-100 text-orange-600 border-2 border-orange-300"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {day.isActive ? (
                <Flame className="w-4 h-4" />
              ) : (
                day.date
              )}
            </div>
          </div>
        ))}
      </div>

      {streak === 0 && (
        <p className="text-center text-sm text-gray-500 mt-4">
          今天开始练习，开启你的连续打卡之旅吧！
        </p>
      )}
      {streak > 0 && streak < 7 && (
        <p className="text-center text-sm text-gray-500 mt-4">
          继续保持，再坚持 {7 - streak} 天就能获得周达标徽章！
        </p>
      )}
      {streak >= 7 && (
        <p className="text-center text-sm text-orange-600 font-medium mt-4">
          太棒了！你已坚持连续练习 {streak} 天
        </p>
      )}
    </div>
  );
}

// 日历热力图风格的连续打卡显示
interface HeatmapStreakProps {
  practiceDates: string[]; // ISO 日期字符串数组
}

export function HeatmapStreak({ practiceDates }: HeatmapStreakProps) {
  // 生成最近30天的日期网格
  const getDays = () => {
    const days = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      days.push({
        date: dateStr,
        day: date.getDate(),
        hasPractice: practiceDates.includes(dateStr),
      });
    }

    return days;
  };

  const days = getDays();
  const activeDays = days.filter((d) => d.hasPractice).length;

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-gray-900">本月练习</h3>
        </div>
        <span className="text-sm text-gray-500">
          已练习 <span className="font-semibold text-accent">{activeDays}</span> 天
        </span>
      </div>

      <div className="grid grid-cols-10 gap-1.5">
        {days.map((day, index) => (
          <div
            key={index}
            className={`aspect-square rounded-md transition-colors ${
              day.hasPractice
                ? "bg-accent"
                : "bg-gray-100"
            }`}
            title={day.date}
          />
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-400">
        <span>少</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-gray-100" />
          <div className="w-3 h-3 rounded-sm bg-accent/30" />
          <div className="w-3 h-3 rounded-sm bg-accent/60" />
          <div className="w-3 h-3 rounded-sm bg-accent" />
        </div>
        <span>多</span>
      </div>
    </div>
  );
}
