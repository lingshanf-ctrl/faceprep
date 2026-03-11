"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MembershipBadge } from "./membership-badge";
import { UpgradeModal } from "./upgrade-modal";
import { Settings, LogOut, Crown, CreditCard, Sparkles } from "lucide-react";

interface UserMenuProps {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  membershipStatus: {
    membershipType: "MONTHLY" | "CREDIT" | "FREE";
    creditsRemaining: number | null;
    monthlyExpiresAt: string | null;
  } | null;
  onLogout: () => Promise<void>;
}

export function UserMenu({ user, membershipStatus, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ESC 键关闭菜单
  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await onLogout();
  };

  const type = membershipStatus?.membershipType || "FREE";
  const creditsRemaining = membershipStatus?.creditsRemaining;
  const expiresAt = membershipStatus?.monthlyExpiresAt;

  // 格式化到期日期
  const formatExpiry = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // 计算剩余天数
  const getDaysRemaining = (dateStr: string) => {
    const end = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <div ref={menuRef} className="relative">
      {/* 用户卡片触发器 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-surface hover:bg-accent/5 rounded-full transition-all duration-200 hover:shadow-md group"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* 头像 */}
        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-accent text-xs font-semibold">
            {(user.name || user.email || "U")[0].toUpperCase()}
          </span>
        </div>

        {/* 用户名 - 桌面端显示 */}
        <span className="hidden sm:block text-sm text-foreground font-medium max-w-[100px] truncate">
          {user.name || user.email?.split("@")[0]}
        </span>

        {/* 会员徽章 - 仅桌面端显示 */}
        <MembershipBadge
          type={type}
          creditsRemaining={creditsRemaining}
          className="hidden sm:inline-flex"
        />

        {/* 下拉箭头 */}
        <svg
          className={`w-4 h-4 text-foreground-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-border py-2 animate-fade-in z-50 max-w-[calc(100vw-1rem)]"
          style={{
            animation: "fadeIn 0.1s ease-out",
          }}
        >
          {/* 用户信息头部 */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-accent text-sm font-semibold">
                  {(user.name || user.email || "U")[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.name || user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-foreground-muted truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* 会员信息区域 */}
          <div className="px-3 py-2">
            {/* 月卡用户 */}
            {type === "MONTHLY" && expiresAt && (
              <div className="px-3 py-2 bg-purple-50 rounded-lg mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700">
                    会员专享
                  </span>
                </div>
                <p className="text-xs text-purple-600">
                  {getDaysRemaining(expiresAt)}天后到期（{formatExpiry(expiresAt)}）
                </p>
              </div>
            )}

            {/* 次卡用户 */}
            {type === "CREDIT" && creditsRemaining !== null && creditsRemaining !== undefined && (
              <div className="px-3 py-2 bg-accent/5 rounded-lg mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">
                    剩余次数
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (creditsRemaining / 10) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-foreground-muted">
                    {creditsRemaining}次
                  </span>
                </div>
              </div>
            )}

            {/* 免费用户 */}
            {type === "FREE" && (
              <button
                className="w-full flex items-center gap-2 px-3 py-2 bg-accent/5 hover:bg-accent/10 rounded-lg mb-2 transition-colors group text-left"
                onClick={() => {
                  setIsOpen(false);
                  setShowUpgradeModal(true);
                }}
              >
                <Sparkles className="w-4 h-4 text-accent" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-accent">升级到会员</p>
                  <p className="text-xs text-foreground-muted">
                    解锁 AI 深度评估
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* 菜单项 */}
          <div className="border-t border-border pt-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent/5 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg
                className="w-4 h-4 text-foreground-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              控制台
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent/5 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4 text-foreground-muted" />
              设置
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent/5 transition-colors"
            >
              <LogOut className="w-4 h-4 text-foreground-muted" />
              退出登录
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* 升级弹窗 */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userType={type === "FREE" ? "free" : type === "CREDIT" && creditsRemaining === 0 ? "credit_exhausted" : "monthly_expired"}
        creditsRemaining={creditsRemaining}
        monthlyExpiresAt={expiresAt ? new Date(expiresAt) : null}
      />
    </div>
  );
}
