"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Sparkles,
  Wand2,
  User,
  CheckCircle,
  Lightbulb,
  Target,
  ListTodo,
  ArrowRight,
  Quote,
  GitCompare,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";

// ==================== 工具函数 ====================

/**
 * 安全地获取字符串值
 * 处理后端返回的字符串或对象格式
 */
function safeString(value: unknown, fallback = ""): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  // 处理对象格式，尝试提取常见字段
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return (obj.text as string) ||
           (obj.description as string) ||
           (obj.primary as string) ||
           (obj.secondary as string) ||
           (obj.content as string) ||
           JSON.stringify(value);
  }
  return String(value);
}

/**
 * 安全地获取字符串数组
 */
function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => safeString(item));
}

// 引用分析类型
interface QuoteAnalysis {
  original: string;
  analysis: string;
  suggestion: string;
}

// 用词改进示例
interface WordChoiceExample {
  original: string;
  improved: string;
  reason: string;
}

// 修改前后对比
interface ModificationExample {
  original: string;
  problem: string;
  improved: string;
  impact: string;
}

interface FeedbackDimensions {
  content?: {
    score: number;
    feedback: string;
    missing?: string[];
    quotes?: QuoteAnalysis[];
  };
  structure?: {
    score: number;
    feedback: string;
    issues?: string[];
    frameworkAnalysis?: string;
  };
  expression?: {
    score: number;
    feedback: string;
    suggestions?: string[];
    wordChoiceExamples?: WordChoiceExample[];
  };
  highlights?: {
    score: number;
    feedback: string;
    strongPoints?: string[];
    uniqueInsights?: string;
    potentialToExplore?: string;
  };
}

interface EnhancedGapItem {
  location: string;
  description: string;
  suggestion?: string;
  userQuote?: string;
  referenceQuote?: string;
  referenceContent?: string;
  why?: string;
}

interface GapAnalysis {
  missing: EnhancedGapItem[];
  insufficient: EnhancedGapItem[];
  good: EnhancedGapItem[];
  excellent: EnhancedGapItem[];
}

interface ImprovementAction {
  priority: "high" | "medium" | "low";
  action: string;
  expectedGain: string;
  example?: string;
}

interface PracticeFeedback {
  totalScore?: number;
  score?: number;
  dimensions?: FeedbackDimensions;
  gapAnalysis?: GapAnalysis;
  improvements?: ImprovementAction[];
  optimizedAnswer?: string;
  coachMessage?: string;
  modificationExamples?: ModificationExample[];
  good?: string[];
  improve?: string[];
  suggestion?: string;
}

interface PremiumFeedbackViewProps {
  feedback: PracticeFeedback | null;
}

const translations = {
  zh: {
    premiumAnalysis: "专业版深度分析",
    premium: "专业版",
    overallScore: "综合评分",
    multiDimensional: "多维度评估",
    content: "内容完整性",
    structure: "结构逻辑性",
    expression: "表达专业性",
    highlights: "差异化亮点",
    gapAnalysis: "差距分析",
    actionItems: "改进行动清单",
    optimizedAnswer: "AI优化版回答",
    showComparison: "显示修改对比",
    showFull: "显示完整版",
    modificationExamples: "修改前后对比",
    coachMessage: "教练寄语",
    coach: "面试教练",
    coachExp: "15年经验",
    strengths: "表现亮点",
    improvements: "提升建议",
    strengthsAndImprovements: "亮点与提升空间",
    missing: "缺失",
    insufficient: "不足",
    good: "良好",
    excellent: "亮点",
    highPriority: "高优先级",
    mediumPriority: "中优先级",
    lowPriority: "低优先级",
    original: "原文",
    improved: "改进后",
    problem: "问题",
    impact: "效果",
    yourAnswer: "你的回答",
    referenceAnswer: "参考回答",
    frameworkAnalysis: "框架分析",
    uniqueInsights: "独特见解",
    potentialToExplore: "可挖掘方向",
  },
  en: {
    premiumAnalysis: "Premium Deep Analysis",
    premium: "Premium",
    overallScore: "Overall Score",
    multiDimensional: "Multi-Dimensional Assessment",
    content: "Content Completeness",
    structure: "Structure Logic",
    expression: "Expression Professionalism",
    highlights: "Differentiation Highlights",
    gapAnalysis: "Gap Analysis",
    actionItems: "Action Items",
    optimizedAnswer: "AI-Optimized Answer",
    showComparison: "Show Comparison",
    showFull: "Show Full",
    modificationExamples: "Before & After",
    coachMessage: "Coach's Message",
    coach: "Interview Coach",
    coachExp: "15 Years Exp",
    strengths: "Strengths",
    improvements: "Improvements",
    strengthsAndImprovements: "Highlights & Areas to Improve",
    missing: "Missing",
    insufficient: "Insufficient",
    good: "Good",
    excellent: "Excellent",
    highPriority: "High Priority",
    mediumPriority: "Medium Priority",
    lowPriority: "Low Priority",
    original: "Original",
    improved: "Improved",
    problem: "Issue",
    impact: "Impact",
    yourAnswer: "Your Answer",
    referenceAnswer: "Reference",
    frameworkAnalysis: "Framework Analysis",
    uniqueInsights: "Unique Insights",
    potentialToExplore: "Potential to Explore",
  },
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-rose-400";
}

function getScoreLevel(score: number, locale: string): string {
  if (locale === "zh") {
    if (score >= 90) return "优秀";
    if (score >= 80) return "良好";
    if (score >= 60) return "及格";
    return "需提升";
  }
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Pass";
  return "Needs Improvement";
}

// 增强版维度卡片
function EnhancedDimensionCard({
  title,
  score,
  feedback,
  icon: Icon,
  color,
  quotes,
  frameworkAnalysis,
  uniqueInsights,
  potentialToExplore,
  locale,
}: {
  title: string;
  score: number;
  feedback: string;
  icon: React.ElementType;
  color: string;
  quotes?: QuoteAnalysis[];
  frameworkAnalysis?: string;
  uniqueInsights?: string;
  potentialToExplore?: string;
  locale: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-sm bg-white/50 backdrop-blur">
        <CardContent className="pt-4 space-y-3">
          {/* 标题和分数 */}
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">{title}</span>
                <span className={`text-lg font-bold ${score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                  {score}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{safeString(feedback)}</p>
            </div>
          </div>

          {/* 框架分析 */}
          {frameworkAnalysis && (
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <p className="text-xs font-medium text-purple-600 mb-1">{t.frameworkAnalysis}</p>
              <p className="text-sm text-purple-700">{safeString(frameworkAnalysis)}</p>
            </div>
          )}

          {/* 独特见解 */}
          {uniqueInsights && (
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
              <p className="text-xs font-medium text-emerald-600 mb-1">{t.uniqueInsights}</p>
              <p className="text-sm text-emerald-700">{safeString(uniqueInsights)}</p>
            </div>
          )}

          {/* 可挖掘方向 */}
          {potentialToExplore && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <p className="text-xs font-medium text-blue-600 mb-1">{t.potentialToExplore}</p>
              <p className="text-sm text-blue-700">{safeString(potentialToExplore)}</p>
            </div>
          )}

          {/* 引用分析 */}
          {quotes && quotes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {quotes.map((quote, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <Quote className="w-3 h-3 text-slate-400 mt-1 shrink-0" />
                    <p className="text-sm text-slate-600 italic">&ldquo;{safeString(quote.original)}&rdquo;</p>
                  </div>
                  <p className="text-xs text-rose-600 mb-1">{safeString(quote.analysis)}</p>
                  <p className="text-xs text-emerald-600">💡 {safeString(quote.suggestion)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// 修改前后对比组件
function ModificationExamplesSection({
  examples,
  locale,
}: {
  examples: ModificationExample[];
  locale: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-accent" />
          {t.modificationExamples}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {examples.map((example, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {/* 对比区域 */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                {/* 原文 */}
                <div className="p-4 bg-rose-50/30">
                  <p className="text-xs font-medium text-rose-600 mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    {t.original}
                  </p>
                  <p className="text-sm text-slate-700 italic">&ldquo;{safeString(example.original)}&rdquo;</p>
                </div>
                {/* 改进后 */}
                <div className="p-4 bg-emerald-50/30">
                  <p className="text-xs font-medium text-emerald-600 mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {t.improved}
                  </p>
                  <p className="text-sm text-slate-700 italic">&ldquo;{safeString(example.improved)}&rdquo;</p>
                </div>
              </div>
              {/* 分析说明 */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                <div className="flex flex-wrap gap-4 text-xs">
                  <div>
                    <span className="font-medium text-slate-500">{t.problem}:</span>{" "}
                    <span className="text-slate-600">{safeString(example.problem)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-emerald-600">{t.impact}:</span>{" "}
                    <span className="text-emerald-700">{safeString(example.impact)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 增强版差距分析
function EnhancedGapAnalysisSection({
  gapAnalysis,
  locale,
}: {
  gapAnalysis: GapAnalysis;
  locale: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];

  const { missing, insufficient, good, excellent } = gapAnalysis;

  if (missing.length === 0 && insufficient.length === 0 && good.length === 0 && excellent.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" />
          {t.gapAnalysis}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {missing.length > 0 && (
            <div className="border-l-4 border-rose-400 pl-4">
              <h4 className="text-sm font-medium text-rose-600 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-xs">🔴</span>
                {t.missing} ({missing.length})
              </h4>
              <ul className="space-y-3">
                {missing.map((item, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="text-rose-500 font-medium">{safeString(item.location)}:</span>{" "}
                    <span className="text-slate-600">{safeString(item.description)}</span>
                    {item.referenceContent && (
                      <div className="mt-2 bg-rose-50 rounded p-2 border border-rose-100">
                        <p className="text-xs text-rose-600 font-medium mb-1">{t.referenceAnswer}:</p>
                        <p className="text-xs text-slate-600 italic">&ldquo;{safeString(item.referenceContent)}&rdquo;</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insufficient.length > 0 && (
            <div className="border-l-4 border-amber-400 pl-4">
              <h4 className="text-sm font-medium text-amber-600 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-xs">🟡</span>
                {t.insufficient} ({insufficient.length})
              </h4>
              <ul className="space-y-3">
                {insufficient.map((item, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="text-amber-500 font-medium">{safeString(item.location)}:</span>{" "}
                    <span className="text-slate-600">{safeString(item.description)}</span>
                    {(item.userQuote || item.referenceQuote) && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {item.userQuote && (
                          <div className="bg-amber-50 rounded p-2 border border-amber-100">
                            <p className="text-xs text-amber-600 font-medium mb-1">{t.yourAnswer}:</p>
                            <p className="text-xs text-slate-600 italic">&ldquo;{safeString(item.userQuote)}&rdquo;</p>
                          </div>
                        )}
                        {item.referenceQuote && (
                          <div className="bg-emerald-50 rounded p-2 border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-medium mb-1">{t.referenceAnswer}:</p>
                            <p className="text-xs text-slate-600 italic">&ldquo;{safeString(item.referenceQuote)}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    )}
                    {item.suggestion && (
                      <p className="text-xs text-amber-600 mt-2">💡 {safeString(item.suggestion)}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {good.length > 0 && (
            <div className="border-l-4 border-emerald-400 pl-4">
              <h4 className="text-sm font-medium text-emerald-600 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">🟢</span>
                {t.good} ({good.length})
              </h4>
              <ul className="space-y-2">
                {good.map((item, idx) => (
                  <li key={idx} className="text-sm text-slate-600">
                    <span className="text-emerald-500 font-medium">{safeString(item.location)}:</span>{" "}
                    {safeString(item.description)}
                    {item.userQuote && (
                      <p className="text-xs text-emerald-600 mt-1 italic">&ldquo;{safeString(item.userQuote)}&rdquo;</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {excellent.length > 0 && (
            <div className="border-l-4 border-purple-400 pl-4">
              <h4 className="text-sm font-medium text-purple-600 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-xs">🌟</span>
                {t.excellent} ({excellent.length})
              </h4>
              <ul className="space-y-2">
                {excellent.map((item, idx) => (
                  <li key={idx} className="text-sm text-slate-600">
                    <span className="text-purple-500 font-medium">{safeString(item.location)}:</span>{" "}
                    {safeString(item.description)}
                    {item.why && (
                      <p className="text-xs text-purple-600 mt-1">✨ {safeString(item.why)}</p>
                    )}
                    {item.userQuote && (
                      <p className="text-xs text-purple-600 mt-1 italic">&ldquo;{safeString(item.userQuote)}&rdquo;</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 改进行动清单
function ActionItemsSection({
  improvements,
  locale,
}: {
  improvements: ImprovementAction[];
  locale: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];

  const priorityConfig = {
    high: { label: t.highPriority, color: "bg-rose-100 text-rose-700 border-rose-200" },
    medium: { label: t.mediumPriority, color: "bg-amber-100 text-amber-700 border-amber-200" },
    low: { label: t.lowPriority, color: "bg-blue-100 text-blue-700 border-blue-200" },
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-accent" />
          {t.actionItems}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {improvements.map((item, idx) => {
            const priority = priorityConfig[item.priority] || priorityConfig.medium;
            // 确保字段是字符串
            const actionText = safeString(item.action);
            const exampleText = safeString(item.example);
            const gainText = safeString(item.expectedGain);

            if (!actionText) return null;

            return (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-start gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${priority.color}`}>
                  {priority.label}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{actionText}</p>
                  {exampleText && (
                    <p className="text-xs text-slate-500 mt-1 italic">{exampleText}</p>
                  )}
                  {gainText && (
                    <p className="text-xs text-emerald-600 mt-1">📈 {gainText}</p>
                  )}
                </div>
              </div>
            </div>
          );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// 优化答案展示（带对比切换）
function OptimizedAnswerSection({
  optimizedAnswer,
  modificationExamples,
  locale,
}: {
  optimizedAnswer: string;
  modificationExamples?: ModificationExample[];
  locale: string;
}) {
  const [showComparison, setShowComparison] = useState(false);
  const t = translations[locale === "zh" ? "zh" : "en"];

  const hasExamples = modificationExamples && modificationExamples.length > 0;

  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-accent" />
            {t.optimizedAnswer}
          </CardTitle>
          {hasExamples && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
              className="text-accent hover:text-accent/80"
            >
              {showComparison ? t.showFull : t.showComparison}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showComparison && hasExamples ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-3">
              {locale === "zh" ? "以下是主要修改点，帮助你理解如何改进：" : "Here are the key modifications to help you understand how to improve:"}
            </p>
            {modificationExamples!.map((example, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                  <div className="p-3 bg-rose-50/30">
                    <p className="text-xs font-medium text-rose-600 mb-1">{t.original}</p>
                    <p className="text-sm text-slate-700 italic">&ldquo;{safeString(example.original)}&rdquo;</p>
                  </div>
                  <div className="p-3 bg-emerald-50/30">
                    <p className="text-xs font-medium text-emerald-600 mb-1">{t.improved}</p>
                    <p className="text-sm text-slate-700 italic">&ldquo;{safeString(example.improved)}&rdquo;</p>
                  </div>
                </div>
                <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-xs">
                  <span className="text-slate-500">{t.problem}:</span> <span className="text-slate-600">{safeString(example.problem)}</span>
                  <span className="mx-2">→</span>
                  <span className="text-emerald-600">{safeString(example.impact)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-4 border border-accent/10">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{safeString(optimizedAnswer)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 增强版教练寄语
function EnhancedCoachMessage({ message, locale }: { message: string | { primary?: string; secondary?: string } | any; locale: string }) {
  const t = translations[locale === "zh" ? "zh" : "en"];

  // 处理对象格式
  const messageText = safeString(message);

  if (!messageText) return null;

  return (
    <Card className="border-0 bg-gradient-to-r from-accent/5 to-purple-500/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center shrink-0 shadow-lg">
            <User className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-semibold text-slate-900">{t.coach}</p>
              <Badge variant="secondary" className="text-xs bg-accent/10 text-accent border-0">
                {t.coachExp}
              </Badge>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 relative">
              {/* 引号装饰 */}
              <Quote className="absolute -top-2 -left-2 w-6 h-6 text-accent/20" />
              <p className="text-slate-700 leading-relaxed italic pl-4">{messageText}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PremiumFeedbackView({ feedback }: PremiumFeedbackViewProps) {
  const { locale } = useLanguage();
  const t = translations[locale === "zh" ? "zh" : "en"];

  if (!feedback) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <p className="text-amber-700">
            {locale === "zh" ? "正在加载深度分析数据，请稍候..." : "Loading deep analysis data, please wait..."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const score = feedback.totalScore || feedback.score || 0;
  const dims = feedback.dimensions || {};

  return (
    <div className="space-y-6">
      {/* 尊享标识 */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-accent">
        <Crown className="w-5 h-5" />
        <span className="text-sm font-medium">{t.premiumAnalysis}</span>
        <Badge className="bg-accent text-white border-0 ml-auto">
          <Sparkles className="w-3 h-3 mr-1" />
          {t.premium}
        </Badge>
      </motion.div>

      {/* 评分卡片 */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Card className="border border-slate-200 bg-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.04] to-transparent pointer-events-none" />
          <CardContent className="pt-5 pb-5 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">{t.overallScore}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-5xl font-bold tabular-nums ${getScoreColor(score)}`}>{score}</span>
                  <span className="text-sm text-slate-300 font-light">/100</span>
                </div>
                <p className={`text-sm mt-1.5 font-medium ${getScoreColor(score)}`}>{getScoreLevel(score, locale)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {/* 环形进度指示 */}
                <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                  <circle
                    cx="32" cy="32" r="26" fill="none"
                    stroke={score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 163.4} 163.4`}
                  />
                </svg>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-accent" />
                  {locale === "zh" ? "AI深度评估" : "AI Analysis"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 亮点与提升 */}
      {(feedback.good?.length || feedback.improve?.length) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              {t.strengthsAndImprovements}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedback.good && feedback.good.length > 0 && (
                <Card className="border-0 shadow-sm bg-emerald-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-700">
                      <CheckCircle className="w-4 h-4" />
                      {t.strengths}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {feedback.good.map((item, idx) => (
                        <li key={idx} className="text-sm text-emerald-700 flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span>{safeString(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {feedback.improve && feedback.improve.length > 0 && (
                <Card className="border-0 shadow-sm bg-amber-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-700">
                      <Lightbulb className="w-4 h-4" />
                      {t.improvements}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {feedback.improve.map((item, idx) => (
                        <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>{safeString(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* 多维度详细评估 */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" />
          {t.multiDimensional}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EnhancedDimensionCard
            title={t.content}
            score={dims.content?.score || 0}
            feedback={dims.content?.feedback || ""}
            icon={CheckCircle}
            color="bg-blue-500"
            quotes={dims.content?.quotes}
            locale={locale}
          />
          <EnhancedDimensionCard
            title={t.structure}
            score={dims.structure?.score || 0}
            feedback={dims.structure?.feedback || ""}
            icon={ListTodo}
            color="bg-purple-500"
            frameworkAnalysis={dims.structure?.frameworkAnalysis}
            locale={locale}
          />
          <EnhancedDimensionCard
            title={t.expression}
            score={dims.expression?.score || 0}
            feedback={dims.expression?.feedback || ""}
            icon={Lightbulb}
            color="bg-amber-500"
            locale={locale}
          />
          <EnhancedDimensionCard
            title={t.highlights}
            score={dims.highlights?.score || 0}
            feedback={dims.highlights?.feedback || ""}
            icon={Sparkles}
            color="bg-emerald-500"
            uniqueInsights={dims.highlights?.uniqueInsights}
            potentialToExplore={dims.highlights?.potentialToExplore}
            locale={locale}
          />
        </div>
      </div>

      {/* 修改前后对比（独立展示） */}
      {feedback.modificationExamples && feedback.modificationExamples.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ModificationExamplesSection examples={feedback.modificationExamples} locale={locale} />
        </motion.div>
      )}

      {/* 差距分析 */}
      {feedback.gapAnalysis && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <EnhancedGapAnalysisSection gapAnalysis={feedback.gapAnalysis} locale={locale} />
        </motion.div>
      )}

      {/* 改进行动清单 */}
      {Array.isArray(feedback.improvements) && feedback.improvements.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <ActionItemsSection improvements={feedback.improvements} locale={locale} />
        </motion.div>
      )}

      {/* 优化示例 */}
      {feedback.optimizedAnswer && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <OptimizedAnswerSection
            optimizedAnswer={feedback.optimizedAnswer}
            modificationExamples={feedback.modificationExamples}
            locale={locale}
          />
        </motion.div>
      )}

      {/* 教练寄语 */}
      {feedback.coachMessage && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <EnhancedCoachMessage message={feedback.coachMessage} locale={locale} />
        </motion.div>
      )}
    </div>
  );
}
