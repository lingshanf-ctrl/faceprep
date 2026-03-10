/**
 * ScoreBadge - 统一的分数徽章组件
 * 根据分数自动选择颜色和标签
 */

import { cn } from "@/lib/ui-helpers";
import { getScoreColor, getScoreBgColor, getScoreLabel } from "@/lib/ui-helpers";
import { borderRadiusConfig } from "@/lib/design-tokens";

export interface ScoreBadgeProps {
  /** 分数（0-100） */
  score: number;
  /** 是否显示标签（优秀/良好/需提升） */
  showLabel?: boolean;
  /** 语言 */
  locale?: "zh" | "en";
  /** 尺寸 */
  size?: "sm" | "md" | "lg";
  /** 自定义类名 */
  className?: string;
}

/**
 * ScoreBadge组件
 */
export function ScoreBadge({
  score,
  showLabel = false,
  locale = "zh",
  size = "md",
  className,
}: ScoreBadgeProps) {
  const colorClass = getScoreColor(score);
  const bgClass = getScoreBgColor(score);
  const label = getScoreLabel(score, locale);

  // 尺寸样式
  const sizeStyles = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold transition-all",
        bgClass,
        colorClass,
        borderRadiusConfig.badge,
        sizeStyles[size],
        className
      )}
    >
      {/* 分数 */}
      <span>{score}</span>

      {/* 标签（可选） */}
      {showLabel && (
        <span className="text-xs opacity-75">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * 大型分数显示（用于详情页等）
 */
export function LargeScoreBadge({
  score,
  locale = "zh",
  className,
}: Omit<ScoreBadgeProps, "size" | "showLabel">) {
  const colorClass = getScoreColor(score);
  const bgClass = getScoreBgColor(score);
  const label = getScoreLabel(score, locale);

  return (
    <div className={cn("text-center", className)}>
      {/* 大号分数 */}
      <div
        className={cn(
          "inline-flex flex-col items-center justify-center w-24 h-24 rounded-2xl font-display font-bold",
          bgClass
        )}
      >
        <span className={cn("text-4xl", colorClass)}>{score}</span>
        <span className={cn("text-xs mt-1 opacity-75", colorClass)}>
          {label}
        </span>
      </div>
    </div>
  );
}
