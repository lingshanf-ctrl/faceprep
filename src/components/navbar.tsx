"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./auth-provider";
import { useLanguage } from "./language-provider";

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
  const navItems = locale === "zh" ? navItemsZh : navItemsEn;

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <span className="text-white text-sm font-bold font-display">FP</span>
            </div>
            <span className="font-display text-lg font-semibold text-foreground tracking-tight hidden sm:block">
              {t.appName}
            </span>
          </Link>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-1">
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
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={toggleLocale}
              className="px-3 py-1.5 text-sm font-medium text-foreground-muted hover:text-foreground bg-surface rounded-full transition-colors"
            >
              {locale === "zh" ? "EN" : "中"}
            </button>

            {isLoading ? (
              <div className="w-20 h-10 bg-surface rounded-xl animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-surface rounded-full">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <span className="text-accent text-xs font-semibold">
                      {(user.name || user.email || "U")[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-foreground font-medium">
                    {user.name || user.email?.split("@")[0]}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
                >
                  {t.nav.logout}
                </button>
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
                  className="px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-full hover:bg-accent-dark transition-all duration-300 hover:shadow-glow"
                >
                  {t.nav.getStarted}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
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
    </nav>
  );
}
