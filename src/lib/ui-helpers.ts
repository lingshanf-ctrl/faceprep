/**
 * UI辅助函数 - 统一的UI工具函数
 * 消除代码重复，提供一致的视觉反馈
 */

import { scoreColorConfig } from "./design-tokens";

// ============================================
// 分数相关函数
// ============================================

/**
 * 根据分数返回对应的颜色类名
 * @param score 分数（0-100）
 * @returns Tailwind颜色类名
 */
export function getScoreColor(score: number): string {
  if (score >= scoreColorConfig.excellent.threshold) {
    return scoreColorConfig.excellent.color;
  }
  if (score >= scoreColorConfig.good.threshold) {
    return scoreColorConfig.good.color;
  }
  return scoreColorConfig.poor.color;
}

/**
 * 根据分数返回背景颜色类名
 * @param score 分数（0-100）
 * @returns Tailwind背景颜色类名
 */
export function getScoreBgColor(score: number): string {
  if (score >= scoreColorConfig.excellent.threshold) {
    return scoreColorConfig.excellent.bg;
  }
  if (score >= scoreColorConfig.good.threshold) {
    return scoreColorConfig.good.bg;
  }
  return scoreColorConfig.poor.bg;
}

/**
 * 根据分数返回边框颜色类名
 * @param score 分数（0-100）
 * @returns Tailwind边框颜色类名
 */
export function getScoreBorderColor(score: number): string {
  if (score >= scoreColorConfig.excellent.threshold) {
    return scoreColorConfig.excellent.border;
  }
  if (score >= scoreColorConfig.good.threshold) {
    return scoreColorConfig.good.border;
  }
  return scoreColorConfig.poor.border;
}

/**
 * 根据分数返回评级标签
 * @param score 分数（0-100）
 * @param locale 语言
 * @returns 评级标签
 */
export function getScoreLabel(score: number, locale: "zh" | "en" = "zh"): string {
  if (score >= scoreColorConfig.excellent.threshold) {
    return scoreColorConfig.excellent.label[locale];
  }
  if (score >= scoreColorConfig.good.threshold) {
    return scoreColorConfig.good.label[locale];
  }
  return scoreColorConfig.poor.label[locale];
}

/**
 * 根据分数返回Badge变体
 * @param score 分数（0-100）
 * @returns Badge变体
 */
export function getScoreBadgeVariant(score: number): "success" | "warning" | "error" {
  if (score >= scoreColorConfig.excellent.threshold) {
    return "success";
  }
  if (score >= scoreColorConfig.good.threshold) {
    return "warning";
  }
  return "error";
}

// ============================================
// 时间格式化函数
// ============================================

/**
 * 格式化相对时间
 * @param date 日期
 * @param locale 语言
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: Date | string, locale: "zh" | "en" = "zh"): string {
  const now = new Date();
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return locale === "zh" ? "刚刚" : "Just now";
  }
  if (diffMins < 60) {
    return locale === "zh" ? `${diffMins}分钟前` : `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return locale === "zh" ? `${diffHours}小时前` : `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return locale === "zh" ? `${diffDays}天前` : `${diffDays}d ago`;
  }

  // 超过7天显示具体日期
  return target.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US");
}

/**
 * 格式化日期为友好格式
 * @param date 日期
 * @param locale 语言
 * @returns 友好的日期字符串
 */
export function formatFriendlyDate(date: Date | string, locale: "zh" | "en" = "zh"): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  if (targetDate.getTime() === today.getTime()) {
    return locale === "zh" ? "今天" : "Today";
  }
  if (targetDate.getTime() === yesterday.getTime()) {
    return locale === "zh" ? "昨天" : "Yesterday";
  }

  // 本周内
  const daysDiff = Math.floor((today.getTime() - targetDate.getTime()) / 86400000);
  if (daysDiff < 7 && daysDiff > 0) {
    const weekdays = locale === "zh"
      ? ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return weekdays[target.getDay()];
  }

  // 超过一周显示完整日期
  return target.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    month: locale === "zh" ? "numeric" : "short",
    day: "numeric",
    year: target.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// ============================================
// 类名合并函数
// ============================================

/**
 * 合并类名（简单版本，如果需要更复杂的逻辑可以使用clsx/classnames）
 * @param classes 类名数组
 * @returns 合并后的类名字符串
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ============================================
// 数字格式化函数
// ============================================

/**
 * 格式化数字（添加千分位分隔符）
 * @param num 数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * 格式化百分比
 * @param value 值
 * @param total 总数
 * @param decimals 小数位数
 * @returns 百分比字符串
 */
export function formatPercentage(value: number, total: number, decimals: number = 0): string {
  if (total === 0) return "0%";
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
}

// ============================================
// 时长格式化函数
// ============================================

/**
 * 格式化时长（秒转为 mm:ss 或 hh:mm:ss）
 * @param seconds 秒数
 * @returns 格式化后的时长字符串
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * 格式化时长为友好格式（例如：2小时30分钟）
 * @param seconds 秒数
 * @param locale 语言
 * @returns 友好的时长字符串
 */
export function formatFriendlyDuration(seconds: number, locale: "zh" | "en" = "zh"): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(locale === "zh" ? `${hours}小时` : `${hours}h`);
  }
  if (minutes > 0) {
    parts.push(locale === "zh" ? `${minutes}分钟` : `${minutes}m`);
  }
  if (secs > 0 && hours === 0) {
    parts.push(locale === "zh" ? `${secs}秒` : `${secs}s`);
  }

  return parts.join(locale === "zh" ? "" : " ") || (locale === "zh" ? "0秒" : "0s");
}

// ============================================
// 文本处理函数
// ============================================

/**
 * 截断文本
 * @param text 文本
 * @param maxLength 最大长度
 * @param suffix 后缀
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number, suffix: string = "..."): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 获取名字首字母（用于头像）
 * @param name 名字
 * @returns 首字母
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
