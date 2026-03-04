"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  hasDismissedDataWarning,
  dismissDataWarning,
  isAnonymousUser,
} from "@/lib/anonymous-user";

interface AnonymousWarningProps {
  showOnLimit?: boolean; // 达到限制时显示
  limitType?: "practice" | "record";
  className?: string;
}

// 顶部横幅提示
export function AnonymousBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 检查是否是匿名用户且未关闭警告
    if (isAnonymousUser() && !hasDismissedDataWarning()) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm text-amber-800">
            <span className="font-medium">您当前未登录。</span>
            练习数据仅保存在当前设备，清除浏览器数据会丢失。
            <Link
              href="/login"
              className="underline font-medium hover:text-amber-900 ml-1"
            >
              登录后可永久保存
            </Link>
          </p>
        </div>
        <button
          onClick={() => {
            dismissDataWarning();
            setShow(false);
          }}
          className="text-amber-600 hover:text-amber-800 p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// 达到限制时的提示弹窗
export function AnonymousLimitModal({
  isOpen,
  onClose,
  type = "record",
}: {
  isOpen: boolean;
  onClose: () => void;
  type?: "practice" | "record";
}) {
  if (!isOpen) return null;

  const messages = {
    practice: "匿名用户每题最多保存3条练习记录",
    record: "匿名用户最多保存20条练习记录",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            达到保存上限
          </h3>
          <p className="text-gray-600 mb-6">{messages[type]}</p>

          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full py-3 px-4 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors"
            >
              登录以继续保存
            </Link>
            <button
              onClick={onClose}
              className="block w-full py-3 px-4 text-gray-600 hover:text-gray-900 transition-colors"
            >
              继续浏览（不保存）
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 练习页面的提示卡片
export function AnonymousPracticeWarning() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isAnonymousUser() && !hasDismissedDataWarning()) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <span className="text-xl">💡</span>
        <div className="flex-1">
          <p className="text-sm text-amber-800 mb-2">
            您当前以访客模式使用，练习数据仅保存在当前设备。
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-amber-900 underline hover:no-underline"
            >
              登录保存数据
            </Link>
            <button
              onClick={() => {
                dismissDataWarning();
                setShow(false);
              }}
              className="text-sm text-amber-600 hover:text-amber-800"
            >
              知道了
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 数据统计页面的提示
export function AnonymousStatsWarning() {
  if (!isAnonymousUser()) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3">
        <span className="text-xl">📊</span>
        <p className="text-sm text-blue-800">
          当前显示的是访客模式数据。
          <Link href="/login" className="font-medium underline ml-1">
            登录后可同步所有设备数据
          </Link>
        </p>
      </div>
    </div>
  );
}

// 通用的登录引导卡片
export function LoginPromptCard({
  title = "登录以解锁更多功能",
  description = "登录后可永久保存练习记录，在所有设备同步数据",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-2xl">
          🔐
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-foreground-muted mb-4">{description}</p>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-dark transition-colors"
            >
              立即登录
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/register"
              className="text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              注册新账号
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
