"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  ThumbsUp,
  TrendingUp,
  BarChart3,
  Lightbulb,
  CheckCircle,
  ArrowUpCircle,
  Quote,
  Wand2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  FileText,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";

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
    highlightsAndImprovements: "表现亮点 / 改进空间",
    improvementSuggestions: "改进建议",
    scoreLevel: {
      excellent: "优秀",
      good: "良好",
      pass: "及格",
      needsWork: "需提升",
    },
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
    highlightsAndImprovements: "Strengths / Areas to Improve",
    improvementSuggestions: "Improvement Suggestions",
    scoreLevel: {
      excellent: "Excellent",
      good: "Good",
      pass: "Pass",
      needsWork: "Needs Work",
    },
  },
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 60) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

function getScoreLevel(score: number, locale: string): string {
  const t = translations[locale === "zh" ? "zh" : "en"];
  if (score >= 90) return t.scoreLevel.excellent;
  if (score >= 80) return t.scoreLevel.good;
  if (score >= 60) return t.scoreLevel.pass;
  return t.scoreLevel.needsWork;
}

// 维度详情卡片 - 紧凑条形样式
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

  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{label}</span>
        <div className="flex items-center gap-1">
          <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${getScoreBarColor(score)} rounded-full`}
          style={{ width: `${score}%` }}
        />
      </div>
      {feedback && (
        <p className="text-xs text-slate-600 leading-relaxed mb-1">{feedback}</p>
      )}
      {details && details.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
        >
          {isExpanded ? t.collapse : t.expand}
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}
      {isExpanded && details && details.length > 0 && (
        <ul className="space-y-1 mt-2 pt-2 border-t border-slate-200">
          {details.map((item, idx) => (
            <li key={idx} className="text-xs text-slate-600 flex items-start gap-1">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!quotes || quotes.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-slate-500 flex items-center gap-1">
        <Quote className="w-3 h-3" />
        {locale === "zh" ? "原文引用分析" : "Quote Analysis"}
      </h4>
      {quotes.slice(0, 2).map((quote, idx) => {
        const isExpanded = expandedIndex === idx;
        return (
          <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
            <div
              className="cursor-pointer"
              onClick={() => setExpandedIndex(isExpanded ? null : idx)}
            >
              <p className="text-xs text-slate-500 mb-1">{locale === "zh" ? "引用" : "Quote"}</p>
              <p className="text-sm text-slate-700 italic line-clamp-2">&ldquo;{quote.original}&rdquo;</p>
            </div>
            {isExpanded && (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-500">{locale === "zh" ? "分析" : "Analysis"}</p>
                <p className="text-xs text-slate-700 mt-1">{quote.analysis}</p>
                <p className="text-xs text-accent mt-2">{quote.suggestion}</p>
              </div>
            )}
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
  const [showImproved, setShowImproved] = useState(false);

  if (!examples || examples.length === 0) return null;

  const example = examples[0];

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-slate-500 flex items-center gap-1">
        <Wand2 className="w-3 h-3" />
        {locale === "zh" ? "修改示例" : "Modification Example"}
      </h4>
      <div className="bg-white rounded-lg p-3 border border-slate-200">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setShowImproved(false)}
            className={`text-xs px-2 py-1 rounded ${
              !showImproved ? "bg-slate-100 shadow-sm text-slate-700" : "text-slate-500"
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
        <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
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

// 可展开区块
function ExpandableSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors bg-white"
      >
        <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-slate-500" />
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 border-t border-slate-100 pt-3 bg-white">
          {children}
        </div>
      )}
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
  const [isExpanded, setIsExpanded] = useState(false);
  const dims = answer.feedback?.dimensions;

  const hasGoodOrImprove =
    (answer.feedback?.good?.length || 0) > 0 ||
    (answer.feedback?.improve?.length || 0) > 0;
  const hasImprovements = (answer.feedback?.improvements?.length || 0) > 0;
  const hasOptimized = !!answer.feedback?.optimizedAnswer;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* 答案头部 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors bg-white"
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 shrink-0">
            {index + 1}
          </span>
          <p className="text-sm text-slate-700 truncate max-w-[180px] text-left">
            {answer.questionTitle ||
              `${locale === "zh" ? "问题" : "Question"} ${index + 1}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={`text-xs ${
              answer.score >= 80
                ? "bg-emerald-100 text-emerald-700"
                : answer.score >= 60
                ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {answer.score || "--"}
          </Badge>
          <ChevronRight
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        </div>
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-white px-3 pb-3 pt-3 space-y-3">
          {/* 四维度分数条 - 始终显示 */}
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

          {/* 表现亮点 / 改进空间 */}
          {hasGoodOrImprove && (
            <ExpandableSection
              title={t.highlightsAndImprovements}
              icon={ThumbsUp}
            >
              <div className="grid md:grid-cols-2 gap-3">
                {answer.feedback?.good && answer.feedback.good.length > 0 && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <h4 className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {locale === "zh" ? "表现亮点" : "Strengths"}
                    </h4>
                    <ul className="space-y-1.5">
                      {answer.feedback.good.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-emerald-700 flex items-start gap-1"
                        >
                          <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {answer.feedback?.improve && answer.feedback.improve.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <h4 className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
                      <ArrowUpCircle className="w-3 h-3" />
                      {locale === "zh" ? "改进空间" : "Areas to Improve"}
                    </h4>
                    <ul className="space-y-1.5">
                      {answer.feedback.improve.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-amber-700 flex items-start gap-1"
                        >
                          <ArrowUpCircle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ExpandableSection>
          )}

          {/* 改进建议（优先级列表） */}
          {hasImprovements && (
            <ExpandableSection
              title={t.improvementSuggestions}
              icon={TrendingUp}
            >
              <ImprovementsList
                improvements={answer.feedback!.improvements!}
                locale={locale}
              />
            </ExpandableSection>
          )}

          {/* 优化版回答 */}
          {hasOptimized && (
            <ExpandableSection
              title={t.optimizedExample}
              icon={Wand2}
            >
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {answer.feedback!.optimizedAnswer}
                  </p>
                </div>
                {answer.feedback?.modificationExamples &&
                  answer.feedback.modificationExamples.length > 0 && (
                    <ModificationExamplesCard
                      examples={answer.feedback.modificationExamples}
                      locale={locale}
                    />
                  )}
              </div>
            </ExpandableSection>
          )}

          {/* 教练寄语 - 始终显示（如有） */}
          {answer.feedback?.coachMessage && (
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <h5 className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                {t.coachMessage}
              </h5>
              <p className="text-sm text-slate-700 italic">
                &ldquo;{answer.feedback.coachMessage}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
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

export function PremiumInterviewFeedback({ session }: PremiumInterviewFeedbackProps) {
  const { locale } = useLanguage();
  const t = translations[locale === "zh" ? "zh" : "en"];
  const [activeTab, setActiveTab] = useState<"overview" | "details">("overview");

  const overallScore =
    session.overallScore ||
    Math.round(
      session.answers.reduce((sum, a) => sum + (a.score || 0), 0) /
        (session.answers.length || 1)
    );

  return (
    <div className="space-y-6">
      {/* 整体评分 - 白色简洁卡片 */}
      <Card className="border border-slate-200 bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">{t.overallScore}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}
                </span>
                <span className="text-sm text-slate-400">/100</span>
              </div>
              <p className={`text-sm mt-1 ${getScoreColor(overallScore)}`}>
                {getScoreLevel(overallScore, locale)}
              </p>
            </div>
            <div className="text-right">
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium border ${getScoreBgColor(
                  overallScore
                )}`}
              >
                {session.answers?.length} {t.questionsAnswered}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 切换标签 */}
      <TabSwitch activeTab={activeTab} onTabChange={setActiveTab} t={t} />

      {/* 总览标签页 */}
      {activeTab === "overview" ? (
        <div className="space-y-4">
          {/* 整体评价 */}
          {session.overallFeedback && (
            <Card className="border border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" />
                  {t.overallAssessment}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {session.overallFeedback}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 岗位匹配度 */}
          {session.aiEvaluation?.jobMatch && (
            <Card className="border border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" />
                  {t.jobMatch}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center border ${getScoreBgColor(
                      session.aiEvaluation.jobMatch.score
                    )}`}
                  >
                    <span className={`text-xl font-bold ${getScoreColor(session.aiEvaluation.jobMatch.score)}`}>
                      {session.aiEvaluation.jobMatch.score}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {session.aiEvaluation.jobMatch.analysis}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 亮点与提升空间 */}
          {((session.strengths?.length || 0) > 0 ||
            (session.improvements?.length || 0) > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              {session.strengths && session.strengths.length > 0 && (
                <Card className="border border-emerald-200 bg-emerald-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2 text-emerald-700">
                      <ThumbsUp className="w-4 h-4" />
                      {t.strengths}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {session.strengths.map((s, i) => (
                        <li
                          key={i}
                          className="text-sm text-emerald-700 flex items-start gap-2"
                        >
                          <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-xs shrink-0">
                            {i + 1}
                          </span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {session.improvements && session.improvements.length > 0 && (
                <Card className="border border-amber-200 bg-amber-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2 text-amber-700">
                      <TrendingUp className="w-4 h-4" />
                      {t.improvements}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {session.improvements.map((m, i) => (
                        <li
                          key={i}
                          className="text-sm text-amber-700 flex items-start gap-2"
                        >
                          <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center text-xs shrink-0">
                            {i + 1}
                          </span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* 教练寄语 */}
          {session.aiEvaluation?.coachSummary && (
            <Card className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">{t.coachMessage}</p>
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      &ldquo;{session.aiEvaluation.coachSummary}&rdquo;
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 后续建议 */}
          {session.nextSteps && session.nextSteps.length > 0 && (
            <Card className="border border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">{t.nextSteps}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.nextSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* 答题详情标签页 */
        <div className="space-y-3">
          {session.answers.map((answer, idx) => (
            <AnswerCard key={answer.questionId} answer={answer} index={idx} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
