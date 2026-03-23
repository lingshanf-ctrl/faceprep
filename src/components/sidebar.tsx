"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Zap,
  Clock,
  Sparkles,
  Shuffle,
  Brain,
  Bookmark,
  Heart,
  Trophy,
} from "lucide-react";
import { useAuth } from "./auth-provider";
import type { MembershipStatus } from "./auth-provider";
import { useLanguage } from "./language-provider";
import { UpgradeModal } from "./upgrade-modal";

interface NavSubItem {
  href: string;
  labelZh: string;
  labelEn: string;
  icon: React.ElementType;
}

interface NavItemDef {
  href: string;
  labelZh: string;
  labelEn: string;
  icon: React.ElementType;
  subItems?: NavSubItem[];
}

const navItems: NavItemDef[] = [
  {
    href: "/dashboard",
    labelZh: "首页",
    labelEn: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/questions",
    labelZh: "题库",
    labelEn: "Questions",
    icon: BookOpen,
    subItems: [
      { href: "/questions", labelZh: "全部题目", labelEn: "All Questions", icon: BookOpen },
      { href: "/favorites", labelZh: "我的收藏", labelEn: "Favorites", icon: Heart },
    ],
  },
  {
    href: "/practice",
    labelZh: "练习",
    labelEn: "Practice",
    icon: Zap,
    subItems: [
      { href: "/questions", labelZh: "随机挑战", labelEn: "Random", icon: Shuffle },
      { href: "/practice", labelZh: "完整模拟", labelEn: "Mock", icon: Brain },
      { href: "/practice/ai-custom", labelZh: "AI 自定义", labelEn: "AI Custom", icon: Sparkles },
      { href: "/favorites", labelZh: "收藏题目", labelEn: "Bookmarked", icon: Bookmark },
    ],
  },
  {
    href: "/history",
    labelZh: "历史",
    labelEn: "History",
    icon: Clock,
    subItems: [
      { href: "/history", labelZh: "练习记录", labelEn: "Practice Records", icon: Clock },
      { href: "/achievements", labelZh: "成就中心", labelEn: "Achievements", icon: Trophy },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, membershipStatus } = useAuth();
  const { locale } = useLanguage();
  const isFreeUser = !membershipStatus || membershipStatus.membershipType === "FREE";
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-[#f6f3f2] z-40 p-4 space-y-2">
      {/* Logo */}
      <div className="mb-8 px-4 pt-2">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary-gradient shadow-glow group-hover:scale-105 transition-transform duration-300">
            <span className="text-white text-sm font-bold font-display">FP</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-foreground text-base tracking-tight leading-tight">FacePrep</h1>
            <p className="text-[10px] text-foreground-muted font-medium tracking-widest uppercase">AI Mentor</p>
          </div>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 px-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const label = locale === "zh" ? item.labelZh : item.labelEn;
          const showSubItems = active && item.subItems && item.subItems.length > 0;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  active
                    ? "bg-white text-[#004ac6] shadow-sm"
                    : "text-[#5f5e5e] hover:bg-[#eae7e7] hover:translate-x-1 hover:text-[#1c1b1b]"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-body font-medium">{label}</span>
              </Link>

              {showSubItems && (
                <div className="ml-3 mt-1 mb-1 space-y-0.5 border-l-2 border-[#c3c6d7]/40 pl-3">
                  {item.subItems!.map((sub) => {
                    const SubIcon = sub.icon;
                    const subActive = pathname === sub.href;
                    const subLabel = locale === "zh" ? sub.labelZh : sub.labelEn;
                    return (
                      <Link
                        key={sub.href + sub.labelEn}
                        href={sub.href}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                          subActive
                            ? "bg-[#004ac6]/8 text-[#004ac6] font-semibold"
                            : "text-[#5f5e5e] hover:bg-[#eae7e7] hover:text-[#1c1b1b]"
                        }`}
                      >
                        <SubIcon className="w-3.5 h-3.5 shrink-0" />
                        {subLabel}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Upgrade Card (FREE users only) */}
      {user && isFreeUser && (
        <div className="mt-auto px-0 pb-2">
          <div className="p-4 bg-[#dbe1ff] rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#004ac6]" />
              <p className="text-xs font-bold text-[#00174b]">
                {locale === "zh" ? "升级 Pro" : "Upgrade to Pro"}
              </p>
            </div>
            <p className="text-[10px] text-[#003ea8] mb-3 leading-relaxed">
              {locale === "zh"
                ? "解锁无限 AI 分析和模拟面试"
                : "Unlock advanced AI analysis and unlimited mocks."}
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="block w-full py-2 bg-[#004ac6] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity text-center"
            >
              {locale === "zh" ? "立即升级" : "Go Premium"}
            </button>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userType="free"
      />
    </aside>
  );
}
