/**
 * LoadingState - 统一的加载状态组件
 * 用于替换所有不一致的加载显示
 */

import { cn } from "@/lib/ui-helpers";

export interface LoadingStateProps {
  /** 加载状态类型 */
  variant?: "spinner" | "skeleton" | "inline";
  /** 是否全屏显示 */
  fullScreen?: boolean;
  /** 加载提示文字 */
  message?: string;
  /** 自定义类名 */
  className?: string;
  /** 骨架屏高度（仅skeleton变体） */
  skeletonHeight?: string;
}

/**
 * 转圈加载图标
 */
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * 骨架屏组件
 */
function Skeleton({ height = "h-4", className }: { height?: string; className?: string }) {
  return (
    <div
      className={cn(
        "bg-surface rounded-lg animate-pulse",
        height,
        className
      )}
    />
  );
}

/**
 * LoadingState组件
 */
export function LoadingState({
  variant = "spinner",
  fullScreen = false,
  message,
  className,
  skeletonHeight = "h-4",
}: LoadingStateProps) {
  // 骨架屏变体
  if (variant === "skeleton") {
    return <Skeleton height={skeletonHeight} className={className} />;
  }

  // 行内加载（用于按钮内等）
  if (variant === "inline") {
    return <Spinner className={cn("w-4 h-4", className)} />;
  }

  // 转圈加载内容
  const spinnerContent = (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <Spinner className="w-5 h-5 text-accent" />
      {message && (
        <span className="text-sm font-medium text-foreground-muted">
          {message}
        </span>
      )}
    </div>
  );

  // 全屏加载
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinnerContent}
      </div>
    );
  }

  // 局部加载
  return <div className="flex justify-center py-8">{spinnerContent}</div>;
}

/**
 * 便捷方法：全屏加载
 */
export function FullScreenLoading({ message }: { message?: string }) {
  return <LoadingState variant="spinner" fullScreen message={message} />;
}

/**
 * 便捷方法：行内加载
 */
export function InlineLoading({ className }: { className?: string }) {
  return <LoadingState variant="inline" className={className} />;
}

/**
 * 便捷方法：骨架屏
 */
export function SkeletonLoading({ height, className }: { height?: string; className?: string }) {
  return <LoadingState variant="skeleton" skeletonHeight={height} className={className} />;
}
