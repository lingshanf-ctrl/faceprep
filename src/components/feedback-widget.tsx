"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Bug, Send, CheckCircle, GripVertical } from "lucide-react";

interface FeedbackData {
  type: "bug" | "feature" | "other";
  content: string;
  pageUrl: string;
  userAgent: string;
}

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 拖拽状态
  const [position, setPosition] = useState({ x: 0, y: 0 }); // 相对于右下角的偏移
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [feedback, setFeedback] = useState<FeedbackData>({
    type: "bug",
    content: "",
    pageUrl: "",
    userAgent: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFeedback((prev) => ({
        ...prev,
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
      }));
    }
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => setIsAnimating(true), 10);
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
      setIsSubmitted(false);
      setFeedback((prev) => ({
        ...prev,
        type: "bug",
        content: "",
      }));
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.content.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/feedback/bug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedback),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        throw new Error("提交失败");
      }
    } catch (error) {
      alert("提交失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  // 拖拽开始
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      initialX: position.x,
      initialY: position.y,
    };
  }, [position.x, position.y]);

  // 拖拽移动
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = dragStartRef.current.x - clientX;
    const deltaY = dragStartRef.current.y - clientY;

    // 限制移动范围（屏幕内）
    const maxOffset = Math.min(window.innerWidth, window.innerHeight) * 0.4;
    const newX = Math.max(-maxOffset, Math.min(maxOffset, dragStartRef.current.initialX + deltaX));
    const newY = Math.max(-maxOffset, Math.min(maxOffset, dragStartRef.current.initialY + deltaY));

    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 鼠标事件
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.close-btn')) return;
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // 触摸事件
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.close-btn')) return;
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
    }
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // 添加全局事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // 计算弹窗位置（按钮上方或下方）
  const getPopupPosition = () => {
    const isMobile = window.innerWidth < 640;
    const popupWidth = isMobile ? 320 : 384; // w-80 or w-96
    const popupHeight = 400;

    // 默认在按钮左上方
    let left = position.x;
    let bottom = position.y + 70; // 按钮高度 + 间距

    // 如果太靠左，向右调整
    if (window.innerWidth - 24 - position.x < popupWidth) {
      left = position.x - popupWidth + 56;
    }

    // 如果太靠上，向下调整（显示在按钮下方）
    if (window.innerHeight - 24 - position.y < popupHeight) {
      bottom = position.y - popupHeight - 10;
    }

    return { left, bottom };
  };

  // 啄木鸟图标按钮
  if (!isOpen) {
    return (
      <button
        ref={buttonRef}
        onClick={handleOpen}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          transform: `translate(${-position.x}px, ${-position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center group select-none touch-none"
        title="啄木鸟 - 问题反馈（可拖动）"
      >
        {/* 拖拽指示器 */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3 h-3 text-white/70 rotate-90" />
        </div>
        <Bug className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
      </button>
    );
  }

  const popupPos = getPopupPosition();

  return (
    <>
      {/* 遮罩层 */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-200 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* 弹窗 */}
      <div
        style={{
          right: `${24 + popupPos.left}px`,
          bottom: `${24 + popupPos.bottom}px`,
        }}
        className={`fixed z-50 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl transition-all duration-200 ${
          isAnimating
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95"
        }`}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Bug className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">啄木鸟</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400">问题反馈与建议</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="close-btn p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* 反馈类型 */}
            <div className="flex gap-2">
              {[
                { key: "bug", label: "Bug", color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
                { key: "feature", label: "建议", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
                { key: "other", label: "其他", color: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    setFeedback((prev) => ({ ...prev, type: item.key as FeedbackData["type"] }))
                  }
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    feedback.type === item.key
                      ? item.color
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 反馈内容 */}
            <div>
              <textarea
                value={feedback.content}
                onChange={(e) =>
                  setFeedback((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="请描述您遇到的问题或建议..."
                className="w-full h-32 px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl resize-none focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm text-gray-900 dark:text-white"
                maxLength={500}
              />
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>详细描述有助于我们更快定位问题</span>
                <span>{feedback.content.length}/500</span>
              </div>
            </div>

            {/* 页面信息 */}
            <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                <span className="font-medium">当前页面：</span>
                {feedback.pageUrl}
              </p>
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={!feedback.content.trim() || isLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  提交反馈
                </>
              )}
            </button>
          </form>
        ) : (
          /* 提交成功 */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">感谢您的反馈！</h4>
            <p className="text-sm text-gray-500 dark:text-zinc-400">我们会尽快查看并处理问题</p>
          </div>
        )}
      </div>
    </>
  );
}
