/**
 * ErrorBanner - 统一的错误提示组件
 * 用于显示表单错误、操作错误等
 */

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/ui-helpers";
import { borderRadiusConfig } from "@/lib/design-tokens";

export interface ErrorBannerProps {
  /** 错误信息 */
  message: string;
  /** 变体 */
  variant?: "inline" | "banner" | "toast";
  /** 是否可关闭 */
  dismissible?: boolean;
  /** 关闭回调 */
  onDismiss?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * ErrorBanner组件
 */
export function ErrorBanner({
  message,
  variant = "inline",
  dismissible = false,
  onDismiss,
  className,
}: ErrorBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  // 基础样式
  const baseStyles = "flex items-start gap-3 bg-error/5 border border-error/20 text-error";

  // 变体样式
  const variantStyles = {
    inline: `p-4 ${borderRadiusConfig.cardLarge}`,
    banner: `p-4 ${borderRadiusConfig.card} shadow-sm`,
    toast: `fixed bottom-6 right-6 z-50 p-4 ${borderRadiusConfig.card} shadow-soft-lg animate-fade-in max-w-sm`,
  };

  return (
    <div className={cn(baseStyles, variantStyles[variant], className)}>
      {/* 图标 */}
      <svg
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>

      {/* 错误信息 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
      </div>

      {/* 关闭按钮 */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-error hover:bg-error/10 rounded-lg transition-colors"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
