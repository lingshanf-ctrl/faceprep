"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Sparkles,
  Wand2,
  User,
  CheckCircle,
  Lightbulb,
  Target,
  ListTodo,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";

interface FeedbackDimensions {
  content?: {
    score: number;
    feedback: string;
    missing?: string[];
  };
  structure?: {
    score: number;
    feedback: string;
    issues?: string[];
  };
  expression?: {
    score: number;
    feedback: string;
    suggestions?: string[];
  };
  highlights?: {
    score: number;
    feedback: string;
    strongPoints?: string[];
  };
}

interface GapItem {
  location: string;
  description: string;
  suggestion?: string;
}

interface GapAnalysis {
  missing: GapItem[];
  insufficient: GapItem[];
  good: GapItem[];
  excellent: GapItem[];
}

interface ImprovementAction {
  priority: "high" | "medium" | "low";
  action: string;
  expectedGain: string;
}

interface PracticeFeedback {
  totalScore?: number;
  score?: number;
  dimensions?: FeedbackDimensions;
  gapAnalysis?: GapAnalysis;
  improvements?: ImprovementAction[];
  optimizedAnswer?: string;
  coachMessage?: string;
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
    coachMessage: "教练寄语",
    strengths: "表现亮点",
    improvements: "提升建议",
    strengthsAndImprovements: "亮点与提升空间",
    // Gap analysis
    missing: "缺失",
    insufficient: "不足",
    good: "良好",
    excellent: "亮点",
    // Action items
    highPriority: "高优先级",
    mediumPriority: "中优先级",
    lowPriority: "低优先级",
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
    coachMessage: "Coach's Message",
    strengths: "Strengths",
    improvements: "Improvements",
    strengthsAndImprovements: "Highlights & Areas to Improve",
    // Gap analysis
    missing: "Missing",
    insufficient: "Insufficient",
    good: "Good",
    excellent: "Excellent",
    // Action items
    highPriority: "High Priority",
    mediumPriority: "Medium Priority",
    lowPriority: "Low Priority",
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

function DimensionCard({
  title,
  score,
  feedback,
  icon: Icon,
  color,
}: {
  title: string;
  score: number;
  feedback: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-sm bg-white/50 backdrop-blur group">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">
                  {title}
                </span>
                <span
                  className={`text-lg font-bold ${
                    score >= 80
                      ? "text-emerald-600"
                      : score >= 60
                      ? "text-amber-600"
                      : "text-rose-600"
                  }`}
                >
                  {score}
                </span>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 group-hover:line-clamp-none transition-all duration-200 cursor-help" title={feedback}>
                {feedback}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// 差距分析子组件
function GapAnalysisSection({
  gapAnalysis,
  locale,
}: {
  gapAnalysis: GapAnalysis;
  locale: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];

  const { missing, insufficient, good, excellent } = gapAnalysis;

  if (
    missing.length === 0 &&
    insufficient.length === 0 &&
    good.length === 0 &&
    excellent.length === 0
  ) {
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
                <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-xs">
                  🔴
                </span>
                {t.missing} ({missing.length})
              </h4>
              <ul className="space-y-2">
                {missing.map((item, idx) => (
                  <li key={idx} className="text-sm text-slate-600">
                    <span className="text-rose-500 font-medium">
                      {item.location}:
                    </span>{" "}
                    {item.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insufficient.length > 0 && (
            <div className="border-l-4 border-amber-400 pl-4">
              <h4 className="text-sm font-medium text-amber-600 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-xs">
                  🟡
                </span>
                {t.insufficient} ({insufficient.length})
              </h4>
              <ul className="space-y-2">
                {insufficient.map((item, idx) => (
                  <li key={idx} className="text-sm text-slate-600">
                    <span className="text-amber-500 font-medium">
                      {item.location}:
                    </span>{" "}
                    {item.description}
                    {item.suggestion && (
                      <p className="text-xs text-amber-600 mt-1">
                        💡 {item.suggestion}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {good.length > 0 && (
            <div className="border-l-4 border-emerald-400 pl-4">
              <h4 className="text-sm font-medium text-emerald-600 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">
                  🟢
                </span>
                {t.good} ({good.length})
              </h4>
              <ul className="space-y-2">
                {good.map((item, idx) => (
                  <li key={idx} className="text-sm text-slate-600">
                    <span className="text-emerald-500 font-medium">
                      {item.location}:
                    </span>{" "}
                    {item.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {excellent.length > 0 && (
            <div className="border-l-4 border-purple-400 pl-4">
              <h4 className="text-sm font-medium text-purple-600 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-xs">
                  🌟
                </span>
                {t.excellent} ({excellent.length})
              </h4>
              <ul className="space-y-2">
                {excellent.map((item, idx) => (
                  <li key={idx} className="text-sm text-slate-600">
                    <span className="text-purple-500 font-medium">
                      {item.location}:
                    </span>{" "}
                    {item.description}
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

// 改进行动清单子组件
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
      color: "bg-rose-100 text-rose-700 border-rose-200",
    },
    medium: {
      label: t.mediumPriority,
      color: "bg-amber-100 text-amber-700 border-amber-200",
    },
    low: {
      label: t.lowPriority,
      color: "bg-blue-100 text-blue-700 border-blue-200",
    },
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
          {improvements.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
            >
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                  priorityConfig[item.priority].color
                }`}
              >
                {priorityConfig[item.priority].label}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">
                  {item.action}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  📈 {item.expectedGain}
                </p>
              </div>
            </div>
          ))}
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
            {locale === "zh"
              ? "正在加载深度分析数据，请稍候..."
              : "Loading deep analysis data, please wait..."}
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
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 text-accent"
      >
        <Crown className="w-5 h-5" />
        <span className="text-sm font-medium">{t.premiumAnalysis}</span>
        <Badge className="bg-accent text-white border-0 ml-auto">
          <Sparkles className="w-3 h-3 mr-1" />
          {t.premium}
        </Badge>
      </motion.div>

      {/* 评分卡片 - 高级版（带渐变背景） */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">{t.overallScore}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    {score}
                  </span>
                  <span className="text-slate-500">/100</span>
                </div>
                <p className={`mt-1 ${getScoreColor(score)}`}>
                  {getScoreLevel(score, locale)}
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getScoreColor(
                    score
                  )} bg-white/10`}
                >
                  <Sparkles className="w-4 h-4" />
                  {locale === "zh" ? "AI深度评估" : "AI Deep Analysis"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 亮点与提升 - good 和 improve 字段 - 左右布局 */}
      {(feedback.good?.length || feedback.improve?.length) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              {t.strengthsAndImprovements}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 亮点 - 左侧 */}
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
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* 提升空间 - 右侧 */}
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
                          <span>{item}</span>
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
          <DimensionCard
            title={t.content}
            score={dims.content?.score || 0}
            feedback={dims.content?.feedback || ""}
            icon={CheckCircle}
            color="bg-blue-500"
          />
          <DimensionCard
            title={t.structure}
            score={dims.structure?.score || 0}
            feedback={dims.structure?.feedback || ""}
            icon={ListTodo}
            color="bg-purple-500"
          />
          <DimensionCard
            title={t.expression}
            score={dims.expression?.score || 0}
            feedback={dims.expression?.feedback || ""}
            icon={Lightbulb}
            color="bg-amber-500"
          />
          <DimensionCard
            title={t.highlights}
            score={dims.highlights?.score || 0}
            feedback={dims.highlights?.feedback || ""}
            icon={Sparkles}
            color="bg-emerald-500"
          />
        </div>
      </div>

      {/* 差距分析 */}
      {feedback.gapAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GapAnalysisSection gapAnalysis={feedback.gapAnalysis} locale={locale} />
        </motion.div>
      )}

      {/* 改进行动清单 */}
      {feedback.improvements && feedback.improvements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ActionItemsSection improvements={feedback.improvements} locale={locale} />
        </motion.div>
      )}

      {/* 优化示例 */}
      {feedback.optimizedAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-accent" />
                {t.optimizedAnswer}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4 border border-accent/10">
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {feedback.optimizedAnswer}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 教练寄语 */}
      {feedback.coachMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 bg-gradient-to-r from-accent/5 to-purple-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 mb-1">
                    {t.coachMessage}
                  </p>
                  <p className="text-slate-600 italic">
                    &ldquo;{feedback.coachMessage}&rdquo;
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
