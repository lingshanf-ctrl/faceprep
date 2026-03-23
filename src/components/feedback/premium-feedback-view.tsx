"use client";

import { useState } from "react";
import {
  CheckCircle,
  Lightbulb,
  Target,
  ListTodo,
  Wand2,
  User,
  Quote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";

// ==================== 工具函数 ====================

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return (
      (obj.text as string) ||
      (obj.description as string) ||
      (obj.primary as string) ||
      (obj.secondary as string) ||
      (obj.content as string) ||
      JSON.stringify(value)
    );
  }
  return String(value);
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => safeString(item));
}

// ==================== 类型定义 ====================

interface QuoteAnalysis {
  original: string;
  analysis: string;
  suggestion: string;
}

interface WordChoiceExample {
  original: string;
  improved: string;
  reason: string;
}

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

// ==================== i18n ====================

const translations = {
  zh: {
    multiDimensional: "多维度评估",
    content: "内容完整性",
    structure: "结构逻辑性",
    expression: "表达专业性",
    highlights: "差异化亮点",
    gapAnalysis: "差距分析",
    actionItems: "改进行动清单",
    optimizedAnswer: "AI 优化版回答",
    showComparison: "查看修改对比",
    showFull: "查看完整版",
    coachMessage: "教练寄语",
    coach: "面试教练",
    coachExp: "15 年经验",
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

// ==================== 分区标题 ====================

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
      <Icon className="w-4 h-4 text-[#004ac6]" />
      {title}
    </h3>
  );
}

// ==================== 亮点与提升（双列） ====================

function StrengthsAndImprovements({
  good,
  improve,
  locale,
}: {
  good: string[];
  improve: string[];
  locale: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {good.length > 0 && (
        <div className="bg-[#f6f3f2] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">{t.strengths}</span>
          </div>
          <ul className="space-y-2">
            {good.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>{safeString(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {improve.length > 0 && (
        <div className="bg-[#f6f3f2] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">{t.improvements}</span>
          </div>
          <ul className="space-y-2">
            {improve.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span>{safeString(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ==================== 维度卡片 ====================

function DimensionCard({
  title,
  score,
  feedback,
  icon,
  barColor,
  locale,
  frameworkAnalysis,
  uniqueInsights,
  potentialToExplore,
}: {
  title: string;
  score: number;
  feedback: string;
  icon: string;
  barColor: string;
  locale: string;
  frameworkAnalysis?: string;
  uniqueInsights?: string;
  potentialToExplore?: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];
  const scoreColor =
    score >= 80 ? "text-emerald-600" : score >= 60 ? "text-[#004ac6]" : "text-rose-600";

  return (
    <div className="bg-white rounded-xl p-4 border border-[#eae7e7]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className={`text-sm font-bold ml-auto ${scoreColor}`}>{score}</span>
      </div>
      <div className="w-full bg-[#e4e4e4] rounded-full h-1.5 mb-3">
        <div className={`h-1.5 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-[#5f5e5e] leading-relaxed">{safeString(feedback)}</p>
      {frameworkAnalysis && (
        <div className="mt-3 bg-[#f6f3f2] rounded-lg p-3">
          <p className="text-xs font-medium text-[#5f5e5e] mb-1">{t.frameworkAnalysis}</p>
          <p className="text-xs text-foreground">{safeString(frameworkAnalysis)}</p>
        </div>
      )}
      {uniqueInsights && (
        <div className="mt-2 bg-[#f6f3f2] rounded-lg p-3">
          <p className="text-xs font-medium text-[#5f5e5e] mb-1">{t.uniqueInsights}</p>
          <p className="text-xs text-foreground">{safeString(uniqueInsights)}</p>
        </div>
      )}
      {potentialToExplore && (
        <div className="mt-2 bg-[#f6f3f2] rounded-lg p-3">
          <p className="text-xs font-medium text-[#5f5e5e] mb-1">{t.potentialToExplore}</p>
          <p className="text-xs text-foreground">{safeString(potentialToExplore)}</p>
        </div>
      )}
    </div>
  );
}

// ==================== 差距分析 ====================

function GapAnalysisSection({
  gapAnalysis,
  locale,
}: {
  gapAnalysis: GapAnalysis;
  locale: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];
  const { missing, insufficient, good, excellent } = gapAnalysis;

  if (!missing.length && !insufficient.length && !good.length && !excellent.length) return null;

  const groups = [
    {
      items: missing,
      label: t.missing,
      borderColor: "border-rose-400",
      textColor: "text-rose-600",
      labelColor: "text-rose-500",
      dot: "bg-rose-400",
    },
    {
      items: insufficient,
      label: t.insufficient,
      borderColor: "border-amber-400",
      textColor: "text-amber-600",
      labelColor: "text-amber-500",
      dot: "bg-amber-400",
    },
    {
      items: good,
      label: t.good,
      borderColor: "border-emerald-400",
      textColor: "text-emerald-600",
      labelColor: "text-emerald-500",
      dot: "bg-emerald-400",
    },
    {
      items: excellent,
      label: t.excellent,
      borderColor: "border-purple-400",
      textColor: "text-purple-600",
      labelColor: "text-purple-500",
      dot: "bg-purple-400",
    },
  ];

  return (
    <div>
      <SectionTitle icon={Target} title={t.gapAnalysis} />
      <div className="bg-[#f6f3f2] rounded-xl p-5 space-y-5">
        {groups
          .filter((g) => g.items.length > 0)
          .map((group) => (
            <div key={group.label} className={`border-l-4 ${group.borderColor} pl-4`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${group.textColor}`}>
                {group.label} ({group.items.length})
              </p>
              <ul className="space-y-3">
                {group.items.map((item, idx) => (
                  <li key={idx} className="text-sm">
                    <span className={`font-medium ${group.labelColor}`}>{safeString(item.location)}: </span>
                    <span className="text-foreground">{safeString(item.description)}</span>
                    {item.suggestion && (
                      <p className={`text-xs mt-1 ${group.textColor}`}>💡 {safeString(item.suggestion)}</p>
                    )}
                    {item.referenceContent && (
                      <div className="mt-2 bg-white rounded-lg p-3 border border-[#eae7e7]">
                        <p className="text-xs text-[#5f5e5e] mb-1">{t.referenceAnswer}:</p>
                        <p className="text-xs text-foreground italic">&ldquo;{safeString(item.referenceContent)}&rdquo;</p>
                      </div>
                    )}
                    {(item.userQuote || item.referenceQuote) && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {item.userQuote && (
                          <div className="bg-white rounded-lg p-2.5 border border-[#eae7e7]">
                            <p className="text-xs text-[#5f5e5e] mb-1">{t.yourAnswer}:</p>
                            <p className="text-xs text-foreground italic">&ldquo;{safeString(item.userQuote)}&rdquo;</p>
                          </div>
                        )}
                        {item.referenceQuote && (
                          <div className="bg-white rounded-lg p-2.5 border border-[#eae7e7]">
                            <p className="text-xs text-[#5f5e5e] mb-1">{t.referenceAnswer}:</p>
                            <p className="text-xs text-foreground italic">&ldquo;{safeString(item.referenceQuote)}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}

// ==================== 改进行动清单 ====================

function ActionItemsSection({
  improvements,
  locale,
}: {
  improvements: ImprovementAction[];
  locale: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];

  const priorityConfig = {
    high: {
      label: t.highPriority,
      color: "bg-rose-100 text-rose-700 border border-rose-200",
      dot: "bg-rose-400",
    },
    medium: {
      label: t.mediumPriority,
      color: "bg-amber-100 text-amber-700 border border-amber-200",
      dot: "bg-amber-400",
    },
    low: {
      label: t.lowPriority,
      color: "bg-[#eef1ff] text-[#004ac6] border border-[#c5d0f5]",
      dot: "bg-[#004ac6]",
    },
  };

  return (
    <div>
      <SectionTitle icon={ListTodo} title={t.actionItems} />
      <div className="space-y-3">
        {improvements.map((item, idx) => {
          const priority = priorityConfig[item.priority] || priorityConfig.medium;
          const actionText = safeString(item.action);
          if (!actionText) return null;

          return (
            <div key={idx} className="bg-[#f6f3f2] rounded-xl p-4 flex items-start gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 mt-0.5 ${priority.color}`}>
                {priority.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{actionText}</p>
                {safeString(item.example) && (
                  <p className="text-xs text-[#5f5e5e] mt-1 italic">{safeString(item.example)}</p>
                )}
                {safeString(item.expectedGain) && (
                  <p className="text-xs text-emerald-600 mt-1">↑ {safeString(item.expectedGain)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== AI 优化答案 ====================

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
    <div>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={Wand2} title={t.optimizedAnswer} />
        {hasExamples && (
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#004ac6] hover:opacity-80 transition-opacity"
          >
            {showComparison ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                {t.showFull}
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                {t.showComparison}
              </>
            )}
          </button>
        )}
      </div>

      {showComparison && hasExamples ? (
        <div className="space-y-3">
          {modificationExamples!.map((example, idx) => (
            <div key={idx} className="bg-[#f6f3f2] rounded-xl overflow-hidden border border-[#eae7e7]">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#eae7e7]">
                <div className="p-4">
                  <p className="text-xs font-medium text-rose-600 mb-2">{t.original}</p>
                  <p className="text-sm text-foreground italic">&ldquo;{safeString(example.original)}&rdquo;</p>
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium text-emerald-600 mb-2">{t.improved}</p>
                  <p className="text-sm text-foreground italic">&ldquo;{safeString(example.improved)}&rdquo;</p>
                </div>
              </div>
              <div className="px-4 py-2.5 bg-white border-t border-[#eae7e7] text-xs text-[#5f5e5e]">
                <span className="font-medium">{t.problem}:</span> {safeString(example.problem)}
                <span className="mx-2">→</span>
                <span className="text-emerald-600">{safeString(example.impact)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#eef1ff] rounded-xl p-5 border border-[#c5d0f5]">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {safeString(optimizedAnswer)}
          </p>
        </div>
      )}
    </div>
  );
}

// ==================== 教练寄语 ====================

function CoachMessageSection({
  message,
  locale,
}: {
  message: string | Record<string, unknown>;
  locale: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];
  const messageText = safeString(message);
  if (!messageText) return null;

  return (
    <div className="bg-[#f6f3f2] rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-[#004ac6] flex items-center justify-center shrink-0">
          <User className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-semibold text-foreground">{t.coach}</p>
            <span className="text-xs px-2 py-0.5 bg-[#eef1ff] text-[#004ac6] rounded-full border border-[#c5d0f5]">
              {t.coachExp}
            </span>
          </div>
          <div className="relative">
            <Quote className="absolute -top-1 -left-1 w-5 h-5 text-[#004ac6]/20" />
            <p className="text-sm text-[#5f5e5e] leading-relaxed italic pl-5">{messageText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== 主组件 ====================

export function PremiumFeedbackView({ feedback }: PremiumFeedbackViewProps) {
  const { locale } = useLanguage();
  const t = translations[locale === "zh" ? "zh" : "en"];

  if (!feedback) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-700 text-sm">
        {locale === "zh"
          ? "正在加载深度分析数据，请稍候..."
          : "Loading deep analysis data, please wait..."}
      </div>
    );
  }

  const dims = feedback.dimensions || {};
  const good = safeStringArray(feedback.good);
  const improve = safeStringArray(feedback.improve);

  return (
    <div className="space-y-8">
      {/* 亮点与提升 */}
      {(good.length > 0 || improve.length > 0) && (
        <StrengthsAndImprovements good={good} improve={improve} locale={locale} />
      )}

      {/* 多维度评估 */}
      {(dims.content || dims.structure || dims.expression || dims.highlights) && (
        <div>
          <SectionTitle icon={Target} title={t.multiDimensional} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dims.content && (
              <DimensionCard
                title={t.content}
                score={dims.content.score}
                feedback={dims.content.feedback || ""}
                icon="🎯"
                barColor="bg-[#004ac6]"
                locale={locale}
              />
            )}
            {dims.structure && (
              <DimensionCard
                title={t.structure}
                score={dims.structure.score}
                feedback={dims.structure.feedback || ""}
                icon="📢"
                barColor="bg-purple-500"
                frameworkAnalysis={dims.structure.frameworkAnalysis}
                locale={locale}
              />
            )}
            {dims.expression && (
              <DimensionCard
                title={t.expression}
                score={dims.expression.score}
                feedback={dims.expression.feedback || ""}
                icon="😊"
                barColor="bg-amber-500"
                locale={locale}
              />
            )}
            {dims.highlights && (
              <DimensionCard
                title={t.highlights}
                score={dims.highlights.score}
                feedback={dims.highlights.feedback || ""}
                icon="⭐"
                barColor="bg-emerald-500"
                uniqueInsights={dims.highlights.uniqueInsights}
                potentialToExplore={dims.highlights.potentialToExplore}
                locale={locale}
              />
            )}
          </div>
        </div>
      )}

      {/* 差距分析 */}
      {feedback.gapAnalysis && (
        <GapAnalysisSection gapAnalysis={feedback.gapAnalysis} locale={locale} />
      )}

      {/* 改进行动清单 */}
      {Array.isArray(feedback.improvements) && feedback.improvements.length > 0 && (
        <ActionItemsSection improvements={feedback.improvements} locale={locale} />
      )}

      {/* AI 优化版回答 */}
      {feedback.optimizedAnswer && (
        <OptimizedAnswerSection
          optimizedAnswer={feedback.optimizedAnswer}
          modificationExamples={feedback.modificationExamples}
          locale={locale}
        />
      )}

      {/* 教练寄语 */}
      {feedback.coachMessage && (
        <CoachMessageSection message={feedback.coachMessage} locale={locale} />
      )}
    </div>
  );
}
