/**
 * SuccessToast - 成功提示组件
 * 用于显示操作成功反馈
 */

"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/ui-helpers";
import { borderRadiusConfig } from "@/lib/design-tokens";

export interface SuccessToastProps {
  /** 成功信息 */
  message: string;
  /** 自动关闭时间（毫秒） */
  duration?: number;
  /** 关闭回调 */
  onClose?: () => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * SuccessToast组件
 */
export function SuccessToast({
  message,
  duration = 2000,
  onClose,
  className,
}: SuccessToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 bg-success text-white shadow-soft-lg animate-fade-in max-w-sm",
        borderRadiusConfig.card,
        className
      )}
    >
      {/* 成功图标 */}
      <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
        <Check className="w-3 h-3" />
      </div>

      {/* 成功信息 */}
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

/**
 * SuccessToast Hook
 * 用于在组件中管理成功提示的显示/隐藏
 */
export function useSuccessToast() {
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const showToast = (message: string) => {
    setToast({ message });
  };

  const hideToast = () => {
    setToast(null);
  };

  const ToastComponent = toast ? (
    <SuccessToast message={toast.message} onClose={hideToast} />
  ) : null;

  return { showToast, ToastComponent };
}
