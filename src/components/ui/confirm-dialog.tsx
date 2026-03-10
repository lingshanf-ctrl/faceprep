/**
 * ConfirmDialog - 确认对话框组件
 * 用于替换原生confirm()
 */

"use client";

import { borderRadiusConfig } from "@/lib/design-tokens";
import { cn } from "@/lib/ui-helpers";

export interface ConfirmDialogProps {
  /** 是否显示 */
  open: boolean;
  /** 标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 确认按钮变体 */
  confirmVariant?: "default" | "danger";
  /** 确认回调 */
  onConfirm: () => void;
  /** 取消回调 */
  onCancel: () => void;
}

/**
 * ConfirmDialog组件
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  confirmVariant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmButtonStyles = confirmVariant === "danger"
    ? "bg-error text-white hover:bg-error-dark"
    : "bg-accent text-white hover:bg-accent-dark hover:shadow-glow";

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onCancel}
      />

      {/* 对话框 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            "bg-white w-full max-w-md pointer-events-auto shadow-2xl border border-border animate-scale-in",
            borderRadiusConfig.dialog
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 内容 */}
          <div className="p-6">
            {/* 标题 */}
            <h3 className="font-display text-heading-lg font-semibold text-foreground mb-2">
              {title}
            </h3>

            {/* 描述 */}
            {description && (
              <p className="text-foreground-muted text-sm leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 p-6 pt-0">
            <button
              onClick={onCancel}
              className={cn(
                "flex-1 px-6 py-3 border-2 border-border bg-transparent text-foreground font-medium transition-all hover:bg-surface",
                borderRadiusConfig.button
              )}
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className={cn(
                "flex-1 px-6 py-3 font-semibold transition-all duration-300",
                borderRadiusConfig.button,
                confirmButtonStyles
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * ConfirmDialog Hook
 * 用于在组件中管理确认对话框的显示/隐藏
 */
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "danger";
    onConfirm?: () => void;
  }>({
    open: false,
    title: "",
  });

  const showConfirm = (options: {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "danger";
    onConfirm: () => void;
  }) => {
    setDialogState({
      open: true,
      ...options,
    });
  };

  const hideConfirm = () => {
    setDialogState((prev) => ({ ...prev, open: false }));
  };

  const DialogComponent = dialogState.open ? (
    <ConfirmDialog
      open={dialogState.open}
      title={dialogState.title}
      description={dialogState.description}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      confirmVariant={dialogState.variant}
      onConfirm={dialogState.onConfirm || (() => {})}
      onCancel={hideConfirm}
    />
  ) : null;

  return { showConfirm, DialogComponent };
}

// 修复：添加useState导入
import { useState } from "react";
