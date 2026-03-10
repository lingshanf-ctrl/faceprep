/**
 * Design Tokens - 统一管理所有设计系统的Token
 * 用于消除硬编码颜色，建立一致的视觉语言
 */

// ============================================
// 题型颜色配置（使用设计系统颜色）
// ============================================
export const typeColorConfig = {
  INTRO: {
    color: "text-accent" as const,
    bg: "bg-accent/10" as const,
    border: "border-accent/20" as const,
    label: { zh: "自我介绍", en: "Intro" },
    icon: "👋" as const,
  },
  PROJECT: {
    color: "text-accent" as const,
    bg: "bg-accent/5" as const,
    border: "border-accent/10" as const,
    label: { zh: "项目经历", en: "Project" },
    icon: "💼" as const,
  },
  TECHNICAL: {
    color: "text-success" as const,
    bg: "bg-success/10" as const,
    border: "border-success/20" as const,
    label: { zh: "技术问题", en: "Technical" },
    icon: "⚡" as const,
  },
  BEHAVIORAL: {
    color: "text-warning" as const,
    bg: "bg-warning/10" as const,
    border: "border-warning/20" as const,
    label: { zh: "行为面试", en: "Behavioral" },
    icon: "🎯" as const,
  },
  HR: {
    color: "text-foreground-muted" as const,
    bg: "bg-surface" as const,
    border: "border-border" as const,
    label: { zh: "HR面试", en: "HR" },
    icon: "💬" as const,
  },
} as const;

export type QuestionType = keyof typeof typeColorConfig;

// ============================================
// 分类颜色配置
// ============================================
export const categoryColorConfig = {
  FRONTEND: {
    color: "text-accent" as const,
    bg: "bg-accent/10" as const,
    label: { zh: "前端", en: "Frontend" },
    icon: "💻" as const,
  },
  BACKEND: {
    color: "text-success" as const,
    bg: "bg-success/10" as const,
    label: { zh: "后端", en: "Backend" },
    icon: "⚙️" as const,
  },
  PRODUCT: {
    color: "text-warning" as const,
    bg: "bg-warning/10" as const,
    label: { zh: "产品", en: "Product" },
    icon: "📱" as const,
  },
  DESIGN: {
    color: "text-accent-light" as const,
    bg: "bg-accent/5" as const,
    label: { zh: "设计", en: "Design" },
    icon: "🎨" as const,
  },
  OPERATION: {
    color: "text-warning" as const,
    bg: "bg-warning/10" as const,
    label: { zh: "运营", en: "Operation" },
    icon: "📊" as const,
  },
  GENERAL: {
    color: "text-foreground-muted" as const,
    bg: "bg-surface" as const,
    label: { zh: "通用", en: "General" },
    icon: "🎯" as const,
  },
} as const;

export type CategoryType = keyof typeof categoryColorConfig;

// ============================================
// 难度颜色配置
// ============================================
export const difficultyColorConfig = {
  1: {
    label: { zh: "简单", en: "Easy" },
    color: "text-success" as const,
    bg: "bg-success/10" as const,
    border: "border-success/20" as const,
  },
  2: {
    label: { zh: "中等", en: "Medium" },
    color: "text-warning" as const,
    bg: "bg-warning/10" as const,
    border: "border-warning/20" as const,
  },
  3: {
    label: { zh: "困难", en: "Hard" },
    color: "text-error" as const,
    bg: "bg-error/10" as const,
    border: "border-error/20" as const,
  },
} as const;

export type DifficultyLevel = keyof typeof difficultyColorConfig;

// ============================================
// 分数颜色配置
// ============================================
export const scoreColorConfig = {
  excellent: {
    threshold: 80,
    color: "text-success" as const,
    bg: "bg-success/10" as const,
    border: "border-success/20" as const,
    label: { zh: "优秀", en: "Excellent" },
  },
  good: {
    threshold: 60,
    color: "text-warning" as const,
    bg: "bg-warning/10" as const,
    border: "border-warning/20" as const,
    label: { zh: "良好", en: "Good" },
  },
  poor: {
    threshold: 0,
    color: "text-error" as const,
    bg: "bg-error/10" as const,
    border: "border-error/20" as const,
    label: { zh: "需提升", en: "Needs Improvement" },
  },
} as const;

// ============================================
// 统一圆角配置
// ============================================
export const borderRadiusConfig = {
  button: "rounded-full" as const,
  card: "rounded-xl" as const,
  cardLarge: "rounded-2xl" as const,
  input: "rounded-2xl" as const,
  badge: "rounded-lg" as const,
  dialog: "rounded-3xl" as const,
} as const;

// ============================================
// 响应式间距配置
// ============================================
export const spacingConfig = {
  section: {
    mobile: "py-6 px-4" as const,
    desktop: "md:py-12 md:px-6" as const,
    combined: "py-6 px-4 md:py-12 md:px-6" as const,
  },
  card: {
    mobile: "p-4" as const,
    desktop: "md:p-6" as const,
    combined: "p-4 md:p-6" as const,
  },
  gap: {
    mobile: "gap-4" as const,
    desktop: "md:gap-6" as const,
    combined: "gap-4 md:gap-6" as const,
  },
} as const;

// ============================================
// 维度标签配置（用于Dashboard盲点分析）
// ============================================
export const dimensionConfig = {
  content: {
    label: { zh: "内容", en: "Content" },
    description: { zh: "观点深度、知识准确性", en: "Depth and accuracy" },
    icon: "📝" as const,
  },
  structure: {
    label: { zh: "结构", en: "Structure" },
    description: { zh: "逻辑清晰、层次分明", en: "Clear logic and structure" },
    icon: "🏗️" as const,
  },
  expression: {
    label: { zh: "表达", en: "Expression" },
    description: { zh: "语言流畅、用词准确", en: "Fluent and precise" },
    icon: "💬" as const,
  },
  highlights: {
    label: { zh: "亮点", en: "Highlights" },
    description: { zh: "创新观点、实战案例", en: "Innovation and examples" },
    icon: "✨" as const,
  },
} as const;

export type DimensionType = keyof typeof dimensionConfig;

// ============================================
// 辅助函数：获取配置
// ============================================
export function getTypeConfig(type: string, locale: "zh" | "en" = "zh") {
  const config = typeColorConfig[type as QuestionType];
  if (!config) {
    return {
      color: "text-foreground-muted",
      bg: "bg-surface",
      border: "border-border",
      label: type,
      icon: "📄",
    };
  }
  return {
    ...config,
    label: config.label[locale],
  };
}

export function getCategoryConfig(category: string, locale: "zh" | "en" = "zh") {
  const config = categoryColorConfig[category as CategoryType];
  if (!config) {
    return {
      color: "text-foreground-muted",
      bg: "bg-surface",
      label: category,
      icon: "📂",
    };
  }
  return {
    ...config,
    label: config.label[locale],
  };
}

export function getDifficultyConfig(difficulty: number, locale: "zh" | "en" = "zh") {
  const config = difficultyColorConfig[difficulty as DifficultyLevel];
  if (!config) {
    return {
      color: "text-foreground-muted",
      bg: "bg-surface",
      border: "border-border",
      label: "未知",
    };
  }
  return {
    ...config,
    label: config.label[locale],
  };
}

export function getDimensionConfig(dimension: string, locale: "zh" | "en" = "zh") {
  const config = dimensionConfig[dimension as DimensionType];
  if (!config) {
    return {
      label: dimension,
      description: "",
      icon: "📊",
    };
  }
  return {
    ...config,
    label: config.label[locale],
    description: config.description[locale],
  };
}
