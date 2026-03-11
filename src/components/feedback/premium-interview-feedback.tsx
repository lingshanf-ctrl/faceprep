"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Sparkles,
  Target,
  ThumbsUp,
  TrendingUp,
  BarChart3,
  Lightbulb,
  CheckCircle,
  Quote,
  Wand2,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { motion, AnimatePresence } from "framer-motion";

interface InterviewAnswer {
  questionId: string;
  questionTitle?: string;
  answer: string;
  score: number;
  duration?: number;
  feedback?: {
    totalScore?: number;
    dimensions?: {
      content?: { score: number; feedback?: string; missing?: string[] };
      structure?: { score: number; feedback?: string; issues?: string[] };
      expression?: { score: number; feedback?: string; suggestions?: string[] };
      highlights?: { score: number; feedback?: string; strongPoints?: string[] };
    };
    gapAnalysis?: {
      missing?: Array<{ location: string; description: string }>;
      insufficient?: Array<{ location: string; description: string; suggestion: string }>;
      good?: Array<{ location: string; description: string }>;
      excellent?: Array<{ location: string; description: string }>;
    };
    improvements?: Array<{
      priority: "high" | "medium" | "low";
      action: string;
      expectedGain: string;
    }>;
    quotes?: Array<{
      original: string;
      analysis: string;
      suggestion: string;
    }>;
    modificationExamples?: Array<{
      original: string;
      problem: string;
      improved: string;
      impact: string;
    }>;
    good?: string[];
    improve?: string[];
    suggestion?: string;
    optimizedAnswer?: string;
    coachMessage?: string;
  };
}

interface InterviewSession {
  id: string;
  title: string;
  overallScore: number;
  overallFeedback?: string;
  answers: InterviewAnswer[];
  strengths?: string[];
  improvements?: string[];
  nextSteps?: string[];
  dimensionScores?: {
    technical: number;
    project: number;
    behavioral: number;
    communication: number;
  };
  aiEvaluation?: {
    jobMatch?: {
      score: number;
      analysis: string;
    };
    coachSummary?: string;
  };
}

interface PremiumInterviewFeedbackProps {
  session: InterviewSession;
}

const translations = {
  zh: {
    premiumAnalysis: "专业版深度分析",
    premium: "专业版",
    overallScore: "综合评分",
    overview: "总览",
    details: "答题详情",
    strengths: "表现亮点",
    improvements: "提升空间",
    nextSteps: "后续建议",
    jobMatch: "岗位匹配度",
    overallAssessment: "整体评价",
    coachMessage: "教练寄语",
    performance: "表现",
    questionsAnswered: "道题已回答",
    // Dimension labels
    technical: "技术能力",
    project: "项目经验",
    behavioral: "行为面试",
    communication: "沟通表达",
    // Answer card labels
    yourAnswer: "你的回答",
    optimizedExample: "优化版回答",
    coachSuggestion: "教练建议",
    content: "内容",
    structure: "结构",
    expression: "表达",
    highlights: "亮点",
    // New labels
    quoteAnalysis: "原文引用分析",
    modificationExample: "修改示例",
    gapAnalysis: "差距分析",
    priority: "优先级",
    high: "高",
    medium: "中",
    low: "低",
    expectedGain: "预期收益",
    expand: "展开详情",
    collapse: "收起详情",
    dimensionDetail: "维度详情",
    missingPoints: "缺失要点",
    structureIssues: "结构问题",
    expressionSuggestions: "表达建议",
    strongPoints: "亮点提炼",
  },
  en: {
    premiumAnalysis: "Premium Deep Analysis",
    premium: "Premium",
    overallScore: "Overall Score",
    overview: "Overview",
    details: "Details",
    strengths: "Strengths",
    improvements: "Areas to Improve",
    nextSteps: "Next Steps",
    jobMatch: "Job Match",
    overallAssessment: "Overall Assessment",
    coachMessage: "Coach's Message",
    performance: "Performance",
    questionsAnswered: "questions answered",
    // Dimension labels
    technical: "Technical",
    project: "Project",
    behavioral: "Behavioral",
    communication: "Communication",
    // Answer card labels
    yourAnswer: "Your Answer",
    optimizedExample: "Optimized Answer",
    coachSuggestion: "Coach Suggestion",
    content: "Content",
    structure: "Structure",
    expression: "Expression",
    highlights: "Highlights",
    // New labels
    quoteAnalysis: "Quote Analysis",
    modificationExample: "Modification Example",
    gapAnalysis: "Gap Analysis",
    priority: "Priority",
    high: "High",
    medium: "Medium",
    low: "Low",
    expectedGain: "Expected Gain",
    expand: "Expand",
    collapse: "Collapse",
    dimensionDetail: "Dimension Details",
    missingPoints: "Missing Points",
    structureIssues: "Structure Issues",
    expressionSuggestions: "Expression Suggestions",
    strongPoints: "Strong Points",
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

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 p-4"
    >
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span
          className={`text-2xl font-bold ${
            value >= 80
              ? "text-emerald-600"
              : value >= 60
              ? "text-amber-600"
              : "text-rose-600"
          }`}
        >
          {value}
        </span>
        <span className="text-xs text-slate-400 mb-1">/100</span>
      </div>
    </motion.div>
  );
}

function TabSwitch({
  activeTab,
  onTabChange,
  t,
}: {
  activeTab: "overview" | "details";
  onTabChange: (tab: "overview" | "details") => void;
  t: { overview: string; details: string };
}) {
  return (
    <div className="grid w-full grid-cols-2 bg-slate-100 rounded-lg p-1">
      <button
        onClick={() => onTabChange("overview")}
        className={`py-2 px-4 text-sm font-medium rounded-md transition-all ${
          activeTab === "overview"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        {t.overview}
      </button>
      <button
        onClick={() => onTabChange("details")}
        className={`py-2 px-4 text-sm font-medium rounded-md transition-all ${
          activeTab === "details"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        {t.details}
      </button>
    </div>
  );
}

// 维度详情卡片
function DimensionDetailCard({
  label,
  score,
  feedback,
  details,
  type,
  locale,
}: {
  label: string;
  score: number;
  feedback?: string;
  details?: string[];
  type: "content" | "structure" | "expression" | "highlights";
  locale: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];
  const [isExpanded, setIsExpanded] = useState(false);

  const colors = {
    content: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
    structure: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
    expression: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
    highlights: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  };

  const c = colors[type];

  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span
            className={`text-lg font-bold ${
              score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-rose-600"
            }`}
          >
            {score}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          {isExpanded ? t.collapse : t.expand}
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>
      {feedback && <p className="text-xs text-slate-600 mb-2">{feedback}</p>}
      <AnimatePresence>
        {isExpanded && details && details.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="space-y-1 mt-2 pt-2 border-t border-slate-200/50">
              {details.map((item, idx) => (
                <li key={idx} className={`text-xs ${c.text} flex items-start gap-1`}>
                  <span className="mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 原文引用分析
function QuoteAnalysisCard({
  quotes,
  locale,
}: {
  quotes: Array<{ original: string; analysis: string; suggestion: string }>;
  locale: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!quotes || quotes.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-slate-500 flex items-center gap-1">
        <Quote className="w-3 h-3" />
        {t.quoteAnalysis}
      </h4>
      {quotes.slice(0, 2).map((quote, idx) => {
        const isExpanded = expandedIndex === idx;
        return (
          <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div
              className="cursor-pointer"
              onClick={() => setExpandedIndex(isExpanded ? null : idx)}
            >
              <p className="text-xs text-slate-500 mb-1">{locale === "zh" ? "引用" : "Quote"}</p>
              <p className="text-sm text-slate-700 italic line-clamp-2">&ldquo;{quote.original}&rdquo;</p>
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-500">{locale === "zh" ? "分析" : "Analysis"}</p>
                    <p className="text-xs text-slate-700 mt-1">{quote.analysis}</p>
                    <p className="text-xs text-accent mt-2">{quote.suggestion}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// 修改示例
function ModificationExamplesCard({
  examples,
  locale,
}: {
  examples: Array<{ original: string; problem: string; improved: string; impact: string }>;
  locale: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];
  const [showImproved, setShowImproved] = useState(false);

  if (!examples || examples.length === 0) return null;

  const example = examples[0];

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-slate-500 flex items-center gap-1">
        <Wand2 className="w-3 h-3" />
        {t.modificationExample}
      </h4>
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setShowImproved(false)}
            className={`text-xs px-2 py-1 rounded ${
              !showImproved ? "bg-white shadow-sm text-slate-700" : "text-slate-500"
            }`}
          >
            {locale === "zh" ? "原文" : "Original"}
          </button>
          <button
            onClick={() => setShowImproved(true)}
            className={`text-xs px-2 py-1 rounded ${
              showImproved ? "bg-emerald-50 text-emerald-700 shadow-sm" : "text-slate-500"
            }`}
          >
            {locale === "zh" ? "优化版" : "Improved"}
          </button>
        </div>
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {showImproved ? example.improved : example.original}
        </p>
        <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
          {showImproved ? example.impact : example.problem}
        </p>
      </div>
    </div>
  );
}

// 改进建议列表
function ImprovementsList({
  improvements,
  locale,
}: {
  improvements: Array<{ priority: "high" | "medium" | "low"; action: string; expectedGain: string }>;
  locale: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];

  if (!improvements || improvements.length === 0) return null;

  const priorityColors = {
    high: "bg-rose-100 text-rose-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-emerald-100 text-emerald-700",
  };

  const priorityLabels = {
    high: t.high,
    medium: t.medium,
    low: t.low,
  };

  return (
    <div className="space-y-2">
      {improvements.slice(0, 3).map((item, idx) => (
        <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`text-xs ${priorityColors[item.priority]}`}>
              {priorityLabels[item.priority]}
            </Badge>
          </div>
          <p className="text-sm text-slate-700">{item.action}</p>
          <p className="text-xs text-slate-500 mt-1">
            {t.expectedGain}: {item.expectedGain}
          </p>
        </div>
      ))}
    </div>
  );
}

function AnswerCard({
  answer,
  index,
  locale,
}: {
  answer: InterviewAnswer;
  index: number;
  locale: string;
}) {
  const t = translations[locale === "zh" ? "zh" : "en"];
  const dims = answer.feedback?.dimensions;
  const [activeSection, setActiveSection] = useState<"dimensions" | "quotes" | "optimized" | "comparison">("dimensions");

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              answer.score >= 80
                ? "bg-emerald-100 text-emerald-600"
                : answer.score >= 60
                ? "bg-amber-100 text-amber-600"
                : "bg-rose-100 text-rose-600"
            }`}
          >
            <span className="font-bold">{answer.score}</span>
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1">Q{index + 1}</p>
            <p className="font-medium text-slate-900 truncate max-w-md">
              {answer.questionTitle || `${locale === "zh" ? "问题" : "Question"} ${index + 1}`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 切换标签 */}
        <div className="flex gap-2 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveSection("dimensions")}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              activeSection === "dimensions"
                ? "bg-accent text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.dimensionDetail}
          </button>
          {answer.feedback?.quotes && answer.feedback.quotes.length > 0 && (
            <button
              onClick={() => setActiveSection("quotes")}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                activeSection === "quotes"
                  ? "bg-accent text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.quoteAnalysis}
            </button>
          )}
          {answer.feedback?.optimizedAnswer && (
            <>
              <button
                onClick={() => setActiveSection("optimized")}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  activeSection === "optimized"
                    ? "bg-accent text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.optimizedExample}
              </button>
              <button
                onClick={() => setActiveSection("comparison")}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  activeSection === "comparison"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {locale === "zh" ? "对比查看" : "Compare"}
              </button>
            </>
          )}
        </div>

        {/* 维度详情 */}
        {activeSection === "dimensions" && (
          <div className="space-y-4">
            {/* 四维度评分卡片 */}
            {dims && (
              <div className="grid grid-cols-2 gap-3">
                <DimensionDetailCard
                  label={t.content}
                  score={dims.content?.score || 0}
                  feedback={dims.content?.feedback}
                  details={dims.content?.missing}
                  type="content"
                  locale={locale}
                />
                <DimensionDetailCard
                  label={t.structure}
                  score={dims.structure?.score || 0}
                  feedback={dims.structure?.feedback}
                  details={dims.structure?.issues}
                  type="structure"
                  locale={locale}
                />
                <DimensionDetailCard
                  label={t.expression}
                  score={dims.expression?.score || 0}
                  feedback={dims.expression?.feedback}
                  details={dims.expression?.suggestions}
                  type="expression"
                  locale={locale}
                />
                <DimensionDetailCard
                  label={t.highlights}
                  score={dims.highlights?.score || 0}
                  feedback={dims.highlights?.feedback}
                  details={dims.highlights?.strongPoints}
                  type="highlights"
                  locale={locale}
                />
              </div>
            )}

            {/* Good & Improve - 优点与改进 */}
            {((answer.feedback?.good?.length || 0) > 0 || (answer.feedback?.improve?.length || 0) > 0) && (
              <div className="grid md:grid-cols-2 gap-3">
                {answer.feedback?.good && answer.feedback.good.length > 0 && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <h4 className="text-xs font-medium text-emerald-700 mb-3 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {locale === "zh" ? "表现亮点" : "Strengths"}
                    </h4>
                    <ul className="space-y-2">
                      {answer.feedback.good.map((item, idx) => (
                        <li key={idx} className="text-sm text-emerald-800 flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {answer.feedback?.improve && answer.feedback.improve.length > 0 && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <h4 className="text-xs font-medium text-amber-700 mb-3 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {locale === "zh" ? "改进空间" : "Areas to Improve"}
                    </h4>
                    <ul className="space-y-2">
                      {answer.feedback.improve.map((item, idx) => (
                        <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">→</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Suggestion - 教练建议 */}
            {answer.feedback?.suggestion && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  {locale === "zh" ? "改进建议" : "Suggestion"}
                </h4>
                <p className="text-sm text-blue-800 leading-relaxed">{answer.feedback.suggestion}</p>
              </div>
            )}

            {/* 改进建议（优先级列表） */}
            {answer.feedback?.improvements && answer.feedback.improvements.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {t.improvements}
                </h4>
                <ImprovementsList improvements={answer.feedback.improvements} locale={locale} />
              </div>
            )}
          </div>
        )}

        {/* 原文引用分析 */}
        {activeSection === "quotes" && answer.feedback?.quotes && (
          <QuoteAnalysisCard quotes={answer.feedback.quotes} locale={locale} />
        )}

        {/* 优化答案 */}
        {activeSection === "optimized" && answer.feedback?.optimizedAnswer && (
          <div className="space-y-3">
            <div className="bg-accent/5 rounded-lg p-4 border border-accent/10">
              <h5 className="text-xs font-medium text-accent mb-2 flex items-center gap-1">
                <Wand2 className="w-3 h-3" />
                {t.optimizedExample}
              </h5>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {answer.feedback.optimizedAnswer}
              </p>
            </div>
            {answer.feedback.modificationExamples && answer.feedback.modificationExamples.length > 0 && (
              <ModificationExamplesCard
                examples={answer.feedback.modificationExamples}
                locale={locale}
              />
            )}
          </div>
        )}

        {/* 对比查看 */}
        {activeSection === "comparison" && answer.feedback?.optimizedAnswer && (
          <div className="space-y-4">
            {/* 对比展示 */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* 原答案 */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h5 className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600">原</span>
                  {locale === "zh" ? "你的原答案" : "Your Original Answer"}
                </h5>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {answer.answer}
                </p>
              </div>
              {/* 优化版 */}
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <h5 className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-200 flex items-center justify-center text-[10px] text-emerald-700">优</span>
                  {locale === "zh" ? "AI 优化版" : "AI Optimized Version"}
                </h5>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {answer.feedback.optimizedAnswer}
                </p>
              </div>
            </div>

            {/* 关键改进点 */}
            {((answer.feedback?.good?.length || 0) > 0 || (answer.feedback?.improve?.length || 0) > 0) && (
              <div className="bg-accent/5 rounded-lg p-4 border border-accent/10">
                <h5 className="text-xs font-medium text-accent mb-3 flex items-center gap-1">
                  <Wand2 className="w-3 h-3" />
                  {locale === "zh" ? "优化要点" : "Key Improvements"}
                </h5>
                <div className="grid md:grid-cols-2 gap-3">
                  {answer.feedback?.improve && answer.feedback.improve.length > 0 && (
                    <ul className="space-y-1.5">
                      {answer.feedback.improve.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">→</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {answer.feedback?.good && answer.feedback.good.length > 0 && (
                    <ul className="space-y-1.5">
                      {answer.feedback.good.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* 优化说明 */}
            {answer.feedback.modificationExamples && answer.feedback.modificationExamples.length > 0 && (
              <ModificationExamplesCard
                examples={answer.feedback.modificationExamples}
                locale={locale}
              />
            )}
          </div>
        )}

        {/* 教练寄语 */}
        {answer.feedback?.coachMessage && (
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <h5 className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              {t.coachMessage}
            </h5>
            <p className="text-sm text-slate-700 italic">&ldquo;{answer.feedback.coachMessage}&rdquo;</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PremiumInterviewFeedback({ session }: PremiumInterviewFeedbackProps) {
  const { locale } = useLanguage();
  const t = translations[locale === "zh" ? "zh" : "en"];
  const [activeTab, setActiveTab] = useState<"overview" | "details">("overview");

  const dims = session.dimensionScores || {
    technical: 0,
    project: 0,
    behavioral: 0,
    communication: 0,
  };

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

      {/* 整体评分 - 高级版 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">{t.overallScore}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    {session.overallScore}
                  </span>
                  <span className="text-slate-500">/100</span>
                </div>
                <p className={`mt-1 ${getScoreColor(session.overallScore)}`}>
                  {getScoreLevel(session.overallScore, locale)}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {session.answers?.length} {t.questionsAnswered}
                </p>
              </div>
              <div className="space-y-3">
                {/* 各维度评分 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{t.technical}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${dims.technical}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{dims.technical}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{t.project}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${dims.project}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{dims.project}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{t.behavioral}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${dims.behavioral}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{dims.behavioral}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{t.communication}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-400 rounded-full"
                        style={{ width: `${dims.communication}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{dims.communication}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs for Overview and Details */}
      <TabSwitch activeTab={activeTab} onTabChange={setActiveTab} t={t} />

      {activeTab === "overview" ? (
        <div className="space-y-6 mt-6">
          {/* 岗位匹配度 */}
          {session.aiEvaluation?.jobMatch && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-accent/20 bg-accent/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    {t.jobMatch}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center ${
                        session.aiEvaluation.jobMatch.score >= 80
                          ? "bg-emerald-100"
                          : session.aiEvaluation.jobMatch.score >= 60
                          ? "bg-amber-100"
                          : "bg-rose-100"
                      }`}
                    >
                      <span
                        className={`text-2xl font-bold ${
                          session.aiEvaluation.jobMatch.score >= 80
                            ? "text-emerald-600"
                            : session.aiEvaluation.jobMatch.score >= 60
                            ? "text-amber-600"
                            : "text-rose-600"
                        }`}
                      >
                        {session.aiEvaluation.jobMatch.score}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {session.aiEvaluation.jobMatch.analysis}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 整体评价 */}
          {session.overallFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-0 bg-gradient-to-r from-accent/5 to-purple-500/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    {t.overallAssessment}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed">{session.overallFeedback}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 四维度评分卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <StatCard label={t.technical} value={dims.technical} icon={Lightbulb} />
            <StatCard label={t.project} value={dims.project} icon={Target} />
            <StatCard label={t.behavioral} value={dims.behavioral} icon={ThumbsUp} />
            <StatCard label={t.communication} value={dims.communication} icon={BarChart3} />
          </motion.div>

          {/* 亮点与提升 */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Strengths */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
                    <ThumbsUp className="w-4 h-4" />
                    {t.strengths}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {session.strengths?.map((s, i) => (
                      <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                        <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-xs shrink-0">
                          {i + 1}
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Improvements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                    <TrendingUp className="w-4 h-4" />
                    {t.improvements}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {session.improvements?.map((m, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-xs shrink-0">
                          {i + 1}
                        </span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* 教练寄语 */}
          {session.aiEvaluation?.coachSummary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="border-0 bg-gradient-to-r from-accent/5 to-purple-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 mb-1">{t.coachMessage}</p>
                      <p className="text-slate-600 italic">
                        &ldquo;{session.aiEvaluation.coachSummary}&rdquo;
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* 后续建议 */}
          {session.nextSteps && session.nextSteps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{t.nextSteps}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {session.nextSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-4 mt-6">
          {/* 答题详情 */}
          {session.answers.map((answer, idx) => (
            <motion.div
              key={answer.questionId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <AnswerCard answer={answer} index={idx} locale={locale} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
