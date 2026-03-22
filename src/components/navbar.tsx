"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UpgradeModal } from "./upgrade-modal";
import { useAuth } from "./auth-provider";
import { useLanguage } from "./language-provider";
import { UserMenu } from "./user-menu";

interface MembershipStatus {
  membershipType: "MONTHLY" | "CREDIT" | "FREE";
  creditsRemaining: number | null;
  monthlyExpiresAt: string | null;
}

const navItemsZh = [
  { href: "/dashboard", label: "首页" },
  { href: "/questions", label: "题库" },
  { href: "/practice", label: "练习" },
  { href: "/history", label: "历史" },
];

const navItemsEn = [
  { href: "/dashboard", label: "Home" },
  { href: "/questions", label: "Questions" },
  { href: "/practice", label: "Practice" },
  { href: "/history", label: "History" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { locale, toggleLocale, t } = useLanguage();
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const navItems = locale === "zh" ? navItemsZh : navItemsEn;

  // 获取会员状态
  const fetchMembershipStatus = () => {
    if (user) {
      fetch("/api/membership/status")
        .then((res) => res.json())
        .then((data) => {
          if (data.status) {
            setMembershipStatus(data.status);
          }
        })
        .catch(() => {
          // 静默处理错误，不展示徽章
          setMembershipStatus(null);
        });
    }
  };

  useEffect(() => {
    fetchMembershipStatus();
  }, [user]);

  // 监听会员状态更新事件（扣费成功后触发）
  useEffect(() => {
    const handleMembershipUpdate = () => {
      fetchMembershipStatus();
    };

    window.addEventListener("membership:updated", handleMembershipUpdate);
    return () => {
      window.removeEventListener("membership:updated", handleMembershipUpdate);
    };
  }, []);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-[20px]" style={{ boxShadow: "0 1px 0 rgba(195,198,215,0.25)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 bg-primary-gradient shadow-glow">
              <span className="text-white text-sm font-bold font-display">FP</span>
            </div>
            <span className="font-display text-lg font-semibold text-foreground tracking-tight hidden sm:block">
              {t.appName}
            </span>
          </Link>

          {/* Nav Links - Desktop Only (hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                  ${isActive(item.href)
                    ? "text-accent"
                    : "text-foreground-muted hover:text-foreground"
                  }
                `}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute inset-0 bg-accent/5 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            {/* Language Toggle */}
            <button
              onClick={toggleLocale}
              className="px-2 sm:px-3 py-1.5 text-sm font-medium text-foreground-muted hover:text-foreground bg-surface rounded-full transition-colors"
            >
              {locale === "zh" ? "EN" : "中"}
            </button>

            {isLoading ? (
              <div className="w-20 h-10 bg-surface rounded-xl animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                {/* 用户菜单 */}
                <UserMenu
                  user={user}
                  membershipStatus={membershipStatus}
                  onLogout={logout}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-all duration-300 bg-primary-gradient shadow-glow hover:shadow-glow-lg"
                >
                  {t.nav.getStarted}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in" style={{ borderTop: "1px solid rgba(195,198,215,0.25)" }}>
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    px-4 py-3 rounded-xl text-base font-medium transition-colors
                    ${isActive(item.href)
                      ? "bg-accent/5 text-accent"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface"
                    }
                  `}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 升级弹窗 */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userType={membershipStatus?.membershipType === "FREE" ? "free" : "monthly_expired"}
        creditsRemaining={membershipStatus?.creditsRemaining}
        monthlyExpiresAt={membershipStatus?.monthlyExpiresAt ? new Date(membershipStatus.monthlyExpiresAt) : null}
      />
    </nav>
  );
}
