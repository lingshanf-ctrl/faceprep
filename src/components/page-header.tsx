"use client";

import { useAuth } from "./auth-provider";
import { useLanguage } from "./language-provider";
import { UserMenu } from "./user-menu";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  const { user, logout, membershipStatus } = useAuth();
  const { locale, toggleLocale } = useLanguage();

  return (
    <header className="sticky top-0 z-30 bg-[#fcf9f8]/80 backdrop-blur-md px-6 md:px-8 py-4 md:py-6 flex justify-between items-center border-b border-[#c3c6d7]/20">
      <div>
        <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="text-[#5f5e5e] text-sm mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleLocale}
          className="text-xs font-bold text-[#004ac6] bg-white px-2.5 py-1 rounded-full border border-[#c5d0f5] hover:bg-[#eef1ff] transition-colors"
        >
          {locale === "zh" ? "EN" : "中"}
        </button>
        {user && (
          <UserMenu
            user={user}
            membershipStatus={membershipStatus}
            onLogout={logout}
          />
        )}
      </div>
    </header>
  );
}
