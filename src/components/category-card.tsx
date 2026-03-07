"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Target, Award, TrendingUp } from "lucide-react";

interface CategoryCardProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  questionCount: number;
  practicedCount: number;
  averageScore: number;
  subCategories: { id: string; name: string; count: number }[];
  locale: string;
}

export function CategoryCard({
  id,
  title,
  subtitle,
  icon,
  color,
  questionCount,
  practicedCount,
  averageScore,
  subCategories,
  locale,
}: CategoryCardProps) {
  const progress = questionCount > 0 ? Math.round((practicedCount / questionCount) * 100) : 0;

  return (
    <div className="group bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-lg hover:border-accent/20 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-2xl`}>
            {icon}
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-foreground-muted">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold text-foreground">{questionCount}</div>
          <div className="text-xs text-foreground-muted">{locale === "zh" ? "道题" : "questions"}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-foreground-muted">
            {locale === "zh" ? `已完成 ${practicedCount}/${questionCount}` : `${practicedCount}/${questionCount} practiced`}
          </span>
          <span className="font-medium text-accent">{progress}%</span>
        </div>
        <div className="h-2 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        {averageScore > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <Award className="w-4 h-4 text-warning" />
            <span className="text-foreground-muted">{locale === "zh" ? "平均分" : "Avg"}</span>
            <span className={`font-semibold ${
              averageScore >= 80 ? "text-success" : averageScore >= 60 ? "text-warning" : "text-error"
            }`}>
              {averageScore}
            </span>
          </div>
        )}
      </div>

      {/* Sub Categories */}
      <div className="flex flex-wrap gap-2 mb-5">
        {subCategories.slice(0, 5).map((sub) => (
          <span
            key={sub.id}
            className="px-2.5 py-1 text-xs bg-surface text-foreground-muted rounded-lg"
          >
            {sub.name} · {sub.count}
          </span>
        ))}
        {subCategories.length > 5 && (
          <span className="px-2.5 py-1 text-xs bg-surface text-foreground-muted rounded-lg">
            +{subCategories.length - 5}
          </span>
        )}
      </div>

      {/* Action Button */}
      <Link
        href={`/questions/category/${id}`}
        className="flex items-center justify-center gap-2 w-full py-3 bg-accent/5 text-accent font-medium rounded-xl hover:bg-accent hover:text-white transition-all duration-300 group/btn"
      >
        <BookOpen className="w-4 h-4" />
        {locale === "zh" ? "进入练习" : "Start Practice"}
        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
      </Link>
    </div>
  );
}

// 分类配置
export const categoryGroups = [
  {
    id: "internet",
    title: { zh: "互联网题库", en: "Tech Industry" },
    subtitle: { zh: "互联网大厂面试真题", en: "Big tech interview questions" },
    icon: "💻",
    color: "bg-blue-50 text-blue-600",
    categories: ["FRONTEND", "BACKEND", "PRODUCT", "DESIGN", "OPERATION"],
  },
  {
    id: "postgraduate",
    title: { zh: "考研题库", en: "Postgraduate" },
    subtitle: { zh: "研究生复试面试题目", en: "Grad school interview prep" },
    icon: "🎓",
    color: "bg-purple-50 text-purple-600",
    categories: ["GENERAL"], // 暂时使用通用分类
  },
  {
    id: "civil-service",
    title: { zh: "公务员题库", en: "Civil Service" },
    subtitle: { zh: "公务员/事业单位面试", en: "Government job interview" },
    icon: "🏛️",
    color: "bg-amber-50 text-amber-600",
    categories: ["GENERAL"], // 暂时使用通用分类
  },
  {
    id: "general",
    title: { zh: "通用能力", en: "General Skills" },
    subtitle: { zh: "面试通用技巧和题型", en: "Universal interview skills" },
    icon: "🎯",
    color: "bg-emerald-50 text-emerald-600",
    categories: ["GENERAL"],
  },
];

// 子分类映射
export const subCategoryMap: Record<string, { zh: string; en: string }> = {
  FRONTEND: { zh: "前端", en: "Frontend" },
  BACKEND: { zh: "后端", en: "Backend" },
  PRODUCT: { zh: "产品", en: "Product" },
  DESIGN: { zh: "设计", en: "Design" },
  OPERATION: { zh: "运营", en: "Operation" },
  GENERAL: { zh: "通用", en: "General" },
};
