// 全局常量定义

// 练习相关
export const DAILY_GOAL = 3;
export const MAX_RECORDS = 100;
export const MAX_STREAK_DAYS = 30;

// AI 相关
export const AI_TIMEOUT = 30000; // 30秒
export const AI_MAX_RETRIES = 2;
export const AI_MAX_TOKENS = 2000;

// 分页相关
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// 缓存时间
export const CACHE_TTL_SHORT = 60 * 1000;       // 1分钟
export const CACHE_TTL_MEDIUM = 5 * 60 * 1000;  // 5分钟
export const CACHE_TTL_LONG = 60 * 60 * 1000;   // 1小时

// 本地存储键名
export const STORAGE_KEYS = {
  PRACTICE_RECORDS: "job-pilot-practice-records", // 兼容旧版本
  FAVORITES: "job-pilot-favorites",
  INTERVIEW_SESSIONS: "job-pilot-interview-sessions",
  CUSTOM_QUESTIONS: "job-pilot-custom-questions",
  USER_PREFERENCES: "job-pilot-preferences",
  ONBOARDING_COMPLETED: "job-pilot-onboarding",
} as const;

// IndexedDB 配置
export const INDEXED_DB = {
  NAME: "job-pilot-db",
  VERSION: 1,
  STORES: {
    PRACTICES: "practices",
    SYNC_QUEUE: "sync-queue",
  },
} as const;

// 评分等级
export const SCORE_LEVELS = {
  EXCELLENT: { min: 90, label: "优秀", color: "green" },
  GOOD: { min: 70, label: "良好", color: "blue" },
  PASS: { min: 60, label: "及格", color: "yellow" },
  FAIL: { min: 0, label: "需改进", color: "red" },
} as const;

// 获取评分等级
export function getScoreLevel(score: number) {
  if (score >= SCORE_LEVELS.EXCELLENT.min) return SCORE_LEVELS.EXCELLENT;
  if (score >= SCORE_LEVELS.GOOD.min) return SCORE_LEVELS.GOOD;
  if (score >= SCORE_LEVELS.PASS.min) return SCORE_LEVELS.PASS;
  return SCORE_LEVELS.FAIL;
}

// 频率限制配置
export const RATE_LIMIT = {
  WINDOW_MS: 5 * 60 * 1000,    // 5分钟窗口
  MAX_ATTEMPTS: 5,              // 最多5次尝试
  BLOCK_DURATION_MS: 15 * 60 * 1000, // 封禁15分钟
} as const;

// 面试相关
export const INTERVIEW = {
  MIN_QUESTIONS: 3,
  MAX_QUESTIONS: 10,
  DEFAULT_QUESTIONS: 5,
} as const;
