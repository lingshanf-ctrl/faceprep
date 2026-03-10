/**
 * Tooltip - 工具提示组件
 * 用于显示补充说明信息
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/ui-helpers";

export interface TooltipProps {
  /** 触发元素 */
  children: React.ReactNode;
  /** 提示内容 */
  content: React.ReactNode;
  /** 位置 */
  position?: "top" | "bottom" | "left" | "right";
  /** 延迟显示（毫秒） */
  delay?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * Tooltip组件
 */
export function Tooltip({
  children,
  content,
  position = "top",
  delay = 300,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({ x: rect.left, y: rect.top });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 位置样式
  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className="relative inline-block">
      {/* 触发元素 */}
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="cursor-help"
      >
        {children}
      </div>

      {/* 提示内容 */}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-3 py-2 bg-foreground text-white text-xs rounded-lg shadow-soft-lg whitespace-nowrap pointer-events-none animate-fade-in",
            positionStyles[position],
            className
          )}
        >
          {content}

          {/* 箭头 */}
          <div
            className={cn(
              "absolute w-2 h-2 bg-foreground transform rotate-45",
              position === "top" && "bottom-[-4px] left-1/2 -translate-x-1/2",
              position === "bottom" && "top-[-4px] left-1/2 -translate-x-1/2",
              position === "left" && "right-[-4px] top-1/2 -translate-y-1/2",
              position === "right" && "left-[-4px] top-1/2 -translate-y-1/2"
            )}
          />
        </div>
      )}
    </div>
  );
}

/**
 * 简化的Tooltip（用于图标说明等）
 */
export function SimpleTooltip({
  children,
  text,
}: {
  children: React.ReactNode;
  text: string;
}) {
  return (
    <Tooltip content={text} position="top">
      {children}
    </Tooltip>
  );
}
