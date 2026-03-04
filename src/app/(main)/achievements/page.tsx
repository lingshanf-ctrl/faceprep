"use client";

import { useState, useEffect } from "react";
import { achievements, achievementCategories, Achievement } from "@/data/achievements";
import {
  getUnlockedAchievements,
  getAllAchievementProgress,
  isAchievementUnlocked,
  AchievementProgress,
} from "@/lib/achievement-store";
import { formatDate } from "@/lib/utils";

// 成就卡片组件
function AchievementCard({
  achievement,
  progress,
  unlocked,
  unlockedAt,
}: {
  achievement: Achievement;
  progress: AchievementProgress | null;
  unlocked: boolean;
  unlockedAt?: string;
}) {
  return (
    <div
      className={`
        relative p-5 rounded-2xl border transition-all duration-300
        ${unlocked
          ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
          : "bg-white border-gray-100 opacity-75"
        }
      `}
    >
      {/* 解锁标记 */}
      {unlocked && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-2xl
            ${unlocked ? "bg-amber-100" : "bg-gray-100 grayscale"}
          `}
        >
          {achievement.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1">{achievement.title}</h3>
          <p className="text-sm text-gray-500 mb-3">{achievement.description}</p>

          {/* 进度条 */}
          {progress && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">
                  {unlocked ? "已完成" : "进行中"}
                </span>
                <span className="text-gray-700">
                  {progress.current} / {progress.target}
                </span>
              </div>              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`
                    h-full rounded-full transition-all duration-500
                    ${unlocked ? "bg-amber-500" : "bg-gray-300"}
                  `}
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* 解锁时间 */}
          {unlocked && unlockedAt && (
            <p className="text-xs text-amber-600 mt-2">
              解锁于 {formatDate(unlockedAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// 分类标签组件
function CategoryTab({
  category,
  isActive,
  onClick,
  unlockedCount,
  totalCount,
}: {
  category: typeof achievementCategories[number];
  isActive: boolean;
  onClick: () => void;
  unlockedCount: number;
  totalCount: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all
        ${isActive
          ? "bg-primary text-white ring-2 ring-offset-2 ring-offset-surface ring-primary"
          : "bg-white text-text-secondary hover:text-primary hover:bg-white/80"
        }
      `}
    >
      <span>{category.icon}</span>
      <span>{category.name}</span>
      <span
        className={`
          ml-1 px-2 py-0.5 rounded-full text-xs
          ${isActive ? "bg-white/20" : "bg-surface"}
        `}
      >
        {unlockedCount}/{totalCount}
      </span>
    </button>
  );
}

export default function AchievementsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [mounted, setMounted] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [progressList, setProgressList] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    async function loadData() {
      const [unlocked, allProgress] = await Promise.all([
        getUnlockedAchievements(),
        getAllAchievementProgress(),
      ]);
      setUnlockedIds(new Set(unlocked.map((u) => u.id)));
      setProgressList(allProgress);
      setLoading(false);
    }

    loadData();
  }, []);

  // 过滤成就
  const filteredAchievements = achievements.filter((a) => {
    if (activeCategory === "ALL") return true;
    return a.category === activeCategory;
  });

  // 获取成就进度
  const getProgress = (achievementId: string) => {
    return progressList.find((p) => p.achievementId === achievementId) || null;
  };

  // 获取已解锁信息
  const getUnlockedInfo = (id: string) => {
    const unlocked = getUnlockedAchievements();
    return unlocked.find((u) => u.id === id);
  };

  // 计算统计
  const stats = {
    total: achievements.length,
    unlockedCount: progressList.filter((p) => p.current >= p.target).length,
    percentage: Math.round(
      (progressList.filter((p) => p.current >= p.target).length / achievements.length) * 100
    ),
    byCategory: achievementCategories.reduce((acc, cat) => {
      const catAchievements = achievements.filter((a) => a.category === cat.key);
      const catProgress = catAchievements.map((a) => getProgress(a.id));
      acc[cat.key] = {
        total: catAchievements.length,
        unlocked: catProgress.filter((p) => p && p.current >= p.target).length,
      };
      return acc;
    }, {} as Record<string, { total: number; unlocked: number }>),
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-surface py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-white/50 rounded-lg w-48 mb-4"></div>
            <div className="h-4 bg-white/50 rounded-lg w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-white/50 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-5xl mx-auto px-6">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-primary mb-2">
            成就中心
          </h1>
          <p className="text-text-secondary">
            完成练习，解锁成就，记录你的成长之路
          </p>
        </div>

        {/* 总体进度 */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">成就收集进度</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-display font-bold">
                  {stats.unlockedCount}
                </span>
                <span className="text-white/60">/ {stats.total}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-display font-bold">
                {stats.percentage}%
              </div>
              <p className="text-white/80 text-sm">已完成</p>
            </div>
          </div>
          <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

        {/* 分类统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {achievementCategories.map((cat) => {
            const catStats = stats.byCategory[cat.key] || { total: 0, unlocked: 0 };
            return (
              <div
                key={cat.key}
                className={`${cat.color} rounded-xl p-4 text-center`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="font-semibold">{catStats.unlocked}/{catStats.total}</div>
                <div className="text-xs opacity-70">{cat.name}</div>
              </div>
            );
          })}
        </div>

        {/* 分类筛选 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all
              ${activeCategory === "ALL"
                ? "bg-primary text-white ring-2 ring-offset-2 ring-offset-surface ring-primary"
                : "bg-white text-text-secondary hover:text-primary hover:bg-white/80"
              }
            `}
          >
            <span>🌟</span>
            <span>全部</span>
            <span className={`
              ml-1 px-2 py-0.5 rounded-full text-xs
              ${activeCategory === "ALL" ? "bg-white/20" : "bg-surface"}
            `}>
              {stats.unlockedCount}/{stats.total}
            </span>
          </button>
          {achievementCategories.map((cat) => {
            const catStats = stats.byCategory[cat.key] || { total: 0, unlocked: 0 };
            return (
              <CategoryTab
                key={cat.key}
                category={cat}
                isActive={activeCategory === cat.key}
                onClick={() => setActiveCategory(cat.key)}
                unlockedCount={catStats.unlocked}
                totalCount={catStats.total}
              />
            );
          })}
        </div>

        {/* 成就列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAchievements.map((achievement) => {
            const unlocked = unlockedIds.has(achievement.id);
            const unlockedInfo = getUnlockedInfo(achievement.id);
            const progress = getProgress(achievement.id);

            return (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                progress={progress}
                unlocked={unlocked}
                unlockedAt={unlockedInfo?.unlockedAt}
              />
            );
          })}
        </div>

        {/* 空状态 */}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <p className="text-text-secondary">没有找到相关成就</p>
          </div>
        )}
      </div>
    </div>
  );
}
