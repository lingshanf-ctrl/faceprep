"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Edit3, Clock, User } from "lucide-react";
import { useIsMobile } from "@/hooks/useMediaQuery";

const navItems = [
  { href: "/dashboard", label: "首页", icon: Home },
  { href: "/questions", label: "题库", icon: BookOpen },
  { href: "/practice", label: "练习", icon: Edit3 },
  { href: "/history", label: "历史", icon: Clock },
];

export function MobileNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // 只在移动端显示
  if (!isMobile) return null;

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active
                  ? "text-accent"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-accent/10" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
