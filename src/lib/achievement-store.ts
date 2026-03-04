// 成就系统本地存储管理

import { Achievement, achievements } from "@/data/achievements";
import { getPracticeRecords, PracticeRecord } from "./practice-store";

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  percentage: number;
}

const ACHIEVEMENT_KEY = "job-pilot-achievements";

// 获取已解锁的成就
export function getUnlockedAchievements(): UnlockedAchievement[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(ACHIEVEMENT_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 解锁成就
export function unlockAchievement(achievementId: string): UnlockedAchievement | null {
  const unlocked = getUnlockedAchievements();

  // 检查是否已解锁
  if (unlocked.some((a) => a.id === achievementId)) {
    return null;
  }

  const newUnlock: UnlockedAchievement = {
    id: achievementId,
    unlockedAt: new Date().toISOString(),
  };

  unlocked.push(newUnlock);
  localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(unlocked));

  return newUnlock;
}

// 检查成就是否已解锁
export function isAchievementUnlocked(achievementId: string): boolean {
  const unlocked = getUnlockedAchievements();
  return unlocked.some((a) => a.id === achievementId);
}

// 获取成就进度（异步）
export async function getAchievementProgress(achievement: Achievement): Promise<AchievementProgress> {
  const records = await getPracticeRecords();
  let current = 0;

  switch (achievement.condition.type) {
    case "practice_count":
      current = records.length;
      break;

    case "score_reach":
      // 最高分数
      current = records.length > 0 ? Math.max(...records.map((r) => r.score)) : 0;
      break;

    case "perfect_score":
      // 是否获得满分
      current = records.some((r) => r.score === 100) ? 100 : 0;
      break;

    case "streak_days":
      current = await calculateStreak();
      break;

    case "daily_practice": {
      const today = new Date().toDateString();
      current = records.filter((r) => new Date(r.createdAt).toDateString() === today).length;
      break;
    }

    case "category_complete": {
      if (achievement.condition.extra) {
        // 特定类目完成数量（简化：该类目至少练习过一次）
        const categoryRecords = records.filter((r) => {
          // 通过题目ID前缀判断类目（需要根据实际数据结构调整）
          // 这里简化处理，实际应该关联questions数据
          return true;
        });
        current = categoryRecords.length > 0 ? 1 : 0;
      } else {
        // 完成的类目数量
        current = new Set(records.map((r) => r.questionId)).size;
      }
      break;
    }

    default:
      current = 0;
  }

  return {
    achievementId: achievement.id,
    current,
    target: achievement.condition.target,
    percentage: Math.min(Math.round((current / achievement.condition.target) * 100), 100),
  };
}

// 计算连续练习天数（异步）
async function calculateStreak(): Promise<number> {
  const records = await getPracticeRecords();
  return calculateStreakFromRecords(records);
}

// 从记录计算连续天数
function calculateStreakFromRecords(records: PracticeRecord[]): number {
  if (records.length === 0) return 0;

  const practiceDates = new Set<string>();
  records.forEach((r) => {
    const date = new Date(r.createdAt).toDateString();
    practiceDates.add(date);
  });

  const sortedDates = Array.from(practiceDates).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i + 1]);
    const diffDays = Math.round((current.getTime() - next.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// 检查并解锁成就（异步）
export async function checkAndUnlockAchievements(): Promise<Achievement[]> {
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of achievements) {
    const progress = await getAchievementProgress(achievement);
    if (progress.current >= progress.target) {
      const unlocked = unlockAchievement(achievement.id);
      if (unlocked) {
        newlyUnlocked.push(achievement);
      }
    }
  }

  return newlyUnlocked;
}

// 获取所有成就进度（异步）
export async function getAllAchievementProgress(): Promise<AchievementProgress[]> {
  return Promise.all(achievements.map(a => getAchievementProgress(a)));
}
