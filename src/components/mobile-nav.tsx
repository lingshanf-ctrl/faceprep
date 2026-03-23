"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Edit3, Clock } from "lucide-react";
import { useLanguage } from "./language-provider";

const navItemsDef = [
  { href: "/dashboard", labelZh: "首页", labelEn: "Home", icon: Home },
  { href: "/questions", labelZh: "题库", labelEn: "Questions", icon: BookOpen },
  { href: "/practice", labelZh: "练习", labelEn: "Practice", icon: Edit3 },
  { href: "/history", labelZh: "历史", labelEn: "History", icon: Clock },
];

export function MobileNav() {
  const pathname = usePathname();
  const { locale } = useLanguage();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItemsDef.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const label = locale === "zh" ? item.labelZh : item.labelEn;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active ? "text-accent" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-accent/10" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium mt-0.5">{label}</span>
            </Link>
          );
        })}

      </div>
    </nav>
  );
}
