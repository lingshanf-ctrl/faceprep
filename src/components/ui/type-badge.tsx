/**
 * TypeBadge - 统一的类型标签组件
 * 用于显示题型、分类、难度等标签
 */

import { cn } from "@/lib/ui-helpers";
import {
  getTypeConfig,
  getCategoryConfig,
  getDifficultyConfig
} from "@/lib/design-tokens";
import { borderRadiusConfig } from "@/lib/design-tokens";

export interface TypeBadgeProps {
  /** 标签类型 */
  variant: "type" | "category" | "difficulty";
  /** 值 */
  value: string | number;
  /** 语言 */
  locale?: "zh" | "en";
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 尺寸 */
  size?: "sm" | "md";
  /** 自定义类名 */
  className?: string;
}

/**
 * TypeBadge组件
 */
export function TypeBadge({
  variant,
  value,
  locale = "zh",
  showIcon = true,
  size = "md",
  className,
}: TypeBadgeProps) {
  // 获取配置
  let config: {
    color: string;
    bg: string;
    label: string;
    icon?: string;
  };

  if (variant === "type") {
    config = getTypeConfig(String(value), locale);
  } else if (variant === "category") {
    config = getCategoryConfig(String(value), locale);
  } else {
    config = getDifficultyConfig(Number(value), locale);
  }

  // 尺寸样式
  const sizeStyles = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium whitespace-nowrap",
        config.bg,
        config.color,
        borderRadiusConfig.badge,
        sizeStyles[size],
        className
      )}
    >
      {showIcon && config.icon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
}

/**
 * 便捷方法：题型标签
 */
export function QuestionTypeBadge({
  type,
  locale = "zh",
  showIcon = true,
  className,
}: {
  type: string;
  locale?: "zh" | "en";
  showIcon?: boolean;
  className?: string;
}) {
  return (
    <TypeBadge
      variant="type"
      value={type}
      locale={locale}
      showIcon={showIcon}
      className={className}
    />
  );
}

/**
 * 便捷方法：分类标签
 */
export function CategoryBadge({
  category,
  locale = "zh",
  showIcon = true,
  className,
}: {
  category: string;
  locale?: "zh" | "en";
  showIcon?: boolean;
  className?: string;
}) {
  return (
    <TypeBadge
      variant="category"
      value={category}
      locale={locale}
      showIcon={showIcon}
      className={className}
    />
  );
}

/**
 * 便捷方法：难度标签
 */
export function DifficultyBadge({
  difficulty,
  locale = "zh",
  showIcon = false,
  className,
}: {
  difficulty: number;
  locale?: "zh" | "en";
  showIcon?: boolean;
  className?: string;
}) {
  return (
    <TypeBadge
      variant="difficulty"
      value={difficulty}
      locale={locale}
      showIcon={showIcon}
      className={className}
    />
  );
}
