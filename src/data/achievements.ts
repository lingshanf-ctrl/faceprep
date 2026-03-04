// 成就系统数据定义

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "PRACTICE" | "SKILL" | "DEDICATION" | "SPECIAL";
  condition: {
    type: "practice_count" | "score_reach" | "streak_days" | "category_complete" | "daily_practice" | "perfect_score";
    target: number;
    extra?: string; // 额外参数，如类目名称
  };
  reward?: {
    type: "badge" | "title" | "theme";
    value: string;
  };
}

// 成就列表
export const achievements: Achievement[] = [
  // ========== 练习成就 (PRACTICE) ==========
  {
    id: "first_practice",
    title: "初试啼声",
    description: "完成第一次面试练习",
    icon: "🎯",
    category: "PRACTICE",
    condition: { type: "practice_count", target: 1 },
    reward: { type: "badge", value: "新手" },
  },
  {
    id: "practice_5",
    title: "小试牛刀",
    description: "累计完成5次面试练习",
    icon: "📝",
    category: "PRACTICE",
    condition: { type: "practice_count", target: 5 },
  },
  {
    id: "practice_10",
    title: "渐入佳境",
    description: "累计完成10次面试练习",
    icon: "📚",
    category: "PRACTICE",
    condition: { type: "practice_count", target: 10 },
    reward: { type: "title", value: "勤奋练习者" },
  },
  {
    id: "practice_30",
    title: "百炼成钢",
    description: "累计完成30次面试练习",
    icon: "🔥",
    category: "PRACTICE",
    condition: { type: "practice_count", target: 30 },
    reward: { type: "title", value: "面试达人" },
  },
  {
    id: "practice_100",
    title: "千锤百炼",
    description: "累计完成100次面试练习",
    icon: "👑",
    category: "PRACTICE",
    condition: { type: "practice_count", target: 100 },
    reward: { type: "title", value: "面试大师" },
  },

  // ========== 技能成就 (SKILL) ==========
  {
    id: "score_60",
    title: "及格线",
    description: "单次练习得分达到60分",
    icon: "⭐",
    category: "SKILL",
    condition: { type: "score_reach", target: 60 },
  },
  {
    id: "score_80",
    title: "表现优秀",
    description: "单次练习得分达到80分",
    icon: "🌟",
    category: "SKILL",
    condition: { type: "score_reach", target: 80 },
    reward: { type: "badge", value: "优秀" },
  },
  {
    id: "score_95",
    title: "完美回答",
    description: "单次练习得分达到95分",
    icon: "💎",
    category: "SKILL",
    condition: { type: "score_reach", target: 95 },
    reward: { type: "title", value: "完美主义者" },
  },
  {
    id: "perfect_score",
    title: "满分状元",
    description: "单次练习获得满分100分",
    icon: "🏆",
    category: "SKILL",
    condition: { type: "perfect_score", target: 100 },
    reward: { type: "title", value: "满分状元" },
  },
  {
    id: "category_frontend",
    title: "前端专家",
    description: "完成所有前端类题目练习",
    icon: "💻",
    category: "SKILL",
    condition: { type: "category_complete", target: 1, extra: "FRONTEND" },
  },
  {
    id: "category_backend",
    title: "后端高手",
    description: "完成所有后端类题目练习",
    icon: "⚙️",
    category: "SKILL",
    condition: { type: "category_complete", target: 1, extra: "BACKEND" },
  },
  {
    id: "category_product",
    title: "产品思维",
    description: "完成所有产品类题目练习",
    icon: "📱",
    category: "SKILL",
    condition: { type: "category_complete", target: 1, extra: "PRODUCT" },
  },
  {
    id: "all_categories",
    title: "全栈通才",
    description: "完成所有类目的题目练习",
    icon: "🎓",
    category: "SKILL",
    condition: { type: "category_complete", target: 6 },
    reward: { type: "title", value: "全栈通才" },
  },

  // ========== 坚持成就 (DEDICATION) ==========
  {
    id: "streak_3",
    title: "三日连击",
    description: "连续3天进行练习",
    icon: "🔥",
    category: "DEDICATION",
    condition: { type: "streak_days", target: 3 },
  },
  {
    id: "streak_7",
    title: "一周打卡",
    description: "连续7天进行练习",
    icon: "📅",
    category: "DEDICATION",
    condition: { type: "streak_days", target: 7 },
    reward: { type: "badge", value: "坚持" },
  },
  {
    id: "streak_30",
    title: "月度达人",
    description: "连续30天进行练习",
    icon: "🌙",
    category: "DEDICATION",
    condition: { type: "streak_days", target: 30 },
    reward: { type: "title", value: "月度达人" },
  },
  {
    id: "daily_3",
    title: "日理万机",
    description: "单日完成3次练习",
    icon: "⚡",
    category: "DEDICATION",
    condition: { type: "daily_practice", target: 3 },
  },
  {
    id: "daily_5",
    title: "废寝忘食",
    description: "单日完成5次练习",
    icon: "🚀",
    category: "DEDICATION",
    condition: { type: "daily_practice", target: 5 },
    reward: { type: "title", value: "练习狂魔" },
  },

  // ========== 特殊成就 (SPECIAL) ==========
  {
    id: "early_bird",
    title: "早起的鸟儿",
    description: "在早上8点前完成练习",
    icon: "🌅",
    category: "SPECIAL",
    condition: { type: "daily_practice", target: 1, extra: "early" },
  },
  {
    id: "night_owl",
    title: "夜猫子",
    description: "在晚上10点后完成练习",
    icon: "🦉",
    category: "SPECIAL",
    condition: { type: "daily_practice", target: 1, extra: "night" },
  },
];

// 成就分类配置
export const achievementCategories = [
  { key: "PRACTICE", name: "练习成就", icon: "📝", color: "bg-blue-50 text-blue-600" },
  { key: "SKILL", name: "技能成就", icon: "⭐", color: "bg-purple-50 text-purple-600" },
  { key: "DEDICATION", name: "坚持成就", icon: "🔥", color: "bg-orange-50 text-orange-600" },
  { key: "SPECIAL", name: "特殊成就", icon: "🎁", color: "bg-pink-50 text-pink-600" },
] as const;

// 获取成就总数
export function getTotalAchievementCount(): number {
  return achievements.length;
}

// 按分类获取成就
export function getAchievementsByCategory(category: Achievement["category"]) {
  return achievements.filter((a) => a.category === category);
}

// 获取单个成就
export function getAchievementById(id: string) {
  return achievements.find((a) => a.id === id);
}
