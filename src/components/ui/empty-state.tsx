/**
 * EmptyState - 统一的空状态组件
 * 用于显示无数据、无搜索结果等状态
 */

import Link from "next/link";
import { cn } from "@/lib/ui-helpers";
import { borderRadiusConfig } from "@/lib/design-tokens";

export interface EmptyStateProps {
  /** 图标（emoji或React组件） */
  icon?: React.ReactNode | string;
  /** 标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 操作按钮 */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** 自定义类名 */
  className?: string;
}

/**
 * EmptyState组件
 */
export function EmptyState({
  icon = "📝",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12 sm:py-16 px-4", className)}>
      {/* 图标 */}
      <div className="mb-4">
        {typeof icon === "string" ? (
          <div className="text-5xl sm:text-6xl">{icon}</div>
        ) : (
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto">
            {icon}
          </div>
        )}
      </div>

      {/* 标题 */}
      <h3 className="font-display text-heading font-semibold text-foreground mb-2">
        {title}
      </h3>

      {/* 描述 */}
      {description && (
        <p className="text-foreground-muted text-sm sm:text-base max-w-md mx-auto mb-6">
          {description}
        </p>
      )}

      {/* 操作按钮 */}
      {action && (
        <div className="flex justify-center">
          {action.href ? (
            <Link
              href={action.href}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 bg-accent text-white text-sm font-semibold transition-all duration-300 hover:bg-accent-dark hover:shadow-glow",
                borderRadiusConfig.button
              )}
            >
              {action.label}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 bg-accent text-white text-sm font-semibold transition-all duration-300 hover:bg-accent-dark hover:shadow-glow",
                borderRadiusConfig.button
              )}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 预设的空状态
 */
export const EmptyStatePresets = {
  noPractice: (locale: "zh" | "en" = "zh") => ({
    icon: "📝",
    title: locale === "zh" ? "还没有练习记录" : "No practice yet",
    description: locale === "zh" ? "开始你的第一次练习，获取AI反馈" : "Start your first practice to get AI feedback",
    action: {
      label: locale === "zh" ? "开始练习" : "Start Practice",
      href: "/questions",
    },
  }),

  noFavorites: (locale: "zh" | "en" = "zh") => ({
    icon: "⭐",
    title: locale === "zh" ? "还没有收藏的题目" : "No favorites yet",
    description: locale === "zh" ? "收藏重要题目，方便随时复习" : "Bookmark important questions for quick access",
    action: {
      label: locale === "zh" ? "浏览题库" : "Browse Questions",
      href: "/questions",
    },
  }),

  noResults: (locale: "zh" | "en" = "zh") => ({
    icon: "🔍",
    title: locale === "zh" ? "没有找到符合条件的题目" : "No questions found",
    description: locale === "zh" ? "试试调整筛选条件或搜索关键词" : "Try adjusting your filters or search keywords",
  }),

  noQuestions: (locale: "zh" | "en" = "zh") => ({
    icon: "📚",
    title: locale === "zh" ? "还没有题目" : "No questions yet",
    description: locale === "zh" ? "添加你的第一道题开始练习" : "Add your first question to start practicing",
  }),

  noHistory: (locale: "zh" | "en" = "zh") => ({
    icon: "🕐",
    title: locale === "zh" ? "暂无历史记录" : "No history yet",
    description: locale === "zh" ? "你的练习记录会显示在这里" : "Your practice history will appear here",
    action: {
      label: locale === "zh" ? "开始练习" : "Start Practice",
      href: "/practice",
    },
  }),

  noAchievements: (locale: "zh" | "en" = "zh") => ({
    icon: "🏆",
    title: locale === "zh" ? "还没有成就" : "No achievements yet",
    description: locale === "zh" ? "完成更多练习来解锁成就" : "Complete more practices to unlock achievements",
  }),
};
