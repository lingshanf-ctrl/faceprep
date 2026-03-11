"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Lightbulb,
  BarChart3,
  FileText,
  Award,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { motion, AnimatePresence } from "framer-motion";

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

// ==================== 类型定义 ====================

interface InterviewAnswer {
  questionId: string;
  questionTitle?: string;
  answer: string;
  score: number;
  duration?: number;
  feedback?: {
    dimensions?: {
      content?: { score: number; feedback?: string };
      structure?: { score: number; feedback?: string };
      expression?: { score: number; feedback?: string };
      highlights?: { score: number; feedback?: string };
    };
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
}

// ==================== 工具函数 ====================

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-50 border-emerald-200";
  if (score >= 60) return "bg-amber-50 border-amber-200";
  return "bg-rose-50 border-rose-200";
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
  return "Needs Work";
}

// ==================== 子组件 ====================

// 1. 顶部简化 Header
function ReportHeader({ session, locale }: { session: InterviewSession; locale: string }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-200">
      <div className="flex items-center gap-3">
        <a
          href="/history"
          className="text-slate-500 hover:text-slate-700 transition-colors"
        >
          ← 返回
        </a>
        <h1 className="text-lg font-semibold text-slate-900 truncate max-w-md">
          {session.title}
        </h1>
      </div>
      <div className={`px-4 py-2 rounded-lg border ${getScoreBgColor(session.overallScore)}`}>
        <span className={`text-xl font-bold ${getScoreColor(session.overallScore)}`}>
          {session.overallScore}
        </span>
        <span className="text-sm text-slate-500 ml-1">
          {getScoreLevel(session.overallScore, locale)}
        </span>
      </div>
    </div>
  );
}

// 2. Executive Summary - 核心摘要
function ExecutiveSummary({ session, locale }: { session: InterviewSession; locale: string }) {
  const topStrengths = session.strengths?.slice(0, 3) || [];
  const topImprovements = session.improvements?.slice(0, 3) || [];

  // 截断整体评价到100字
  const summary = session.overallFeedback
    ? session.overallFeedback.slice(0, 100) + (session.overallFeedback.length > 100 ? "..." : "")
    : "";

  return (
    <Card className="border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">面试总结</h2>
        </div>

        {/* 整体评价 */}
        {summary && (
          <p className="text-slate-700 mb-5 leading-relaxed">{safeString(summary)}</p>
        )}

        {/* 亮点与改进 */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* 亮点 */}
          {topStrengths.length > 0 && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <h3 className="text-sm font-medium text-emerald-800 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                亮点
              </h3>
              <ul className="space-y-2">
                {topStrengths.map((item, idx) => (
                  <li key={idx} className="text-sm text-emerald-700 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{safeString(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 改进点 */}
          {topImprovements.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <h3 className="text-sm font-medium text-amber-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                优先改进
              </h3>
              <ul className="space-y-2">
                {topImprovements.map((item, idx) => (
                  <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">{idx + 1}.</span>
                    <span>{safeString(item)}</span>
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

// 3. Capability Radar - 能力雷达（简化条形图版）
function CapabilityRadar({
  dimensionScores,
  locale,
}: {
  dimensionScores: InterviewSession["dimensionScores"];
  locale: string;
}) {
  const dims = dimensionScores || { technical: 0, project: 0, behavioral: 0, communication: 0 };

  const items = [
    { key: "technical", label: locale === "zh" ? "技术能力" : "Technical", score: dims.technical },
    { key: "project", label: locale === "zh" ? "项目经验" : "Project", score: dims.project },
    { key: "behavioral", label: locale === "zh" ? "行为面试" : "Behavioral", score: dims.behavioral },
    { key: "communication", label: locale === "zh" ? "沟通表达" : "Communication", score: dims.communication },
  ];

  const maxScore = Math.max(...items.map((i) => i.score));
  const minScore = Math.min(...items.map((i) => i.score));
  const bestDim = items.find((i) => i.score === maxScore);
  const weakDim = items.find((i) => i.score === minScore);

  return (
    <Card className="border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">能力分析</h2>
        </div>

        {/* 维度条形图 */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-20">{item.label}</span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.score >= 80
                      ? "bg-emerald-500"
                      : item.score >= 60
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
              <span className={`text-sm font-semibold w-8 text-right ${getScoreColor(item.score)}`}>
                {item.score}
              </span>
            </div>
          ))}
        </div>

        {/* 建议 */}
        {bestDim && weakDim && (
          <div className="mt-5 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <span className="font-medium">💡 建议：</span>
              {bestDim.label}是优势项，{weakDim.label}还有提升空间，建议针对性练习。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 4. Question List - 题目列表
function QuestionList({
  answers,
  locale,
}: {
  answers: InterviewAnswer[];
  locale: string;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold">题目表现</h2>
        <span className="text-sm text-slate-400 ml-auto">共 {answers.length} 题</span>
      </div>

      <div className="space-y-2">
        {answers.map((answer, idx) => (
          <QuestionItem
            key={answer.questionId}
            answer={answer}
            index={idx}
            isExpanded={expandedIndex === idx}
            onToggle={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}

// 5. Question Item - 单个题目（可展开）
function QuestionItem({
  answer,
  index,
  isExpanded,
  onToggle,
  locale,
}: {
  answer: InterviewAnswer;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  locale: string;
}) {
  return (
    <Card className={`border-slate-200 overflow-hidden ${isExpanded ? "ring-1 ring-accent/20" : ""}`}>
      {/* 头部 - 始终显示 */}
      <div
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getScoreBgColor(answer.score)}`}>
          <span className={`font-bold ${getScoreColor(answer.score)}`}>{answer.score}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400">Q{index + 1}</span>
            <Badge
              variant="outline"
              className={`text-xs ${
                answer.score >= 80
                  ? "border-emerald-200 text-emerald-700"
                  : answer.score >= 60
                  ? "border-amber-200 text-amber-700"
                  : "border-rose-200 text-rose-700"
              }`}
            >
              {getScoreLevel(answer.score, locale)}
            </Badge>
          </div>
          <p className="text-sm font-medium text-slate-900 truncate">
            {answer.questionTitle || `问题 ${index + 1}`}
          </p>
        </div>

        <button className="text-slate-400">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* 详情 - 展开时显示 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100">
              <CardContent className="p-4 space-y-5">
                <QuestionDetail answer={answer} locale={locale} />
              </CardContent>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// 6. Question Detail - 单题详情（精简版3区块）
function QuestionDetail({ answer, locale }: { answer: InterviewAnswer; locale: string }) {
  const [showComparison, setShowComparison] = useState(false);
  const feedback = answer.feedback;
  const dims = feedback?.dimensions;

  if (!feedback) {
    return <p className="text-sm text-slate-500">暂无详细反馈</p>;
  }

  return (
    <div className="space-y-5">
      {/* 区块1: 维度评分（简化版） */}
      {dims && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">维度评分</h4>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "内容", score: dims.content?.score || 0 },
              { label: "结构", score: dims.structure?.score || 0 },
              { label: "表达", score: dims.expression?.score || 0 },
              { label: "亮点", score: dims.highlights?.score || 0 },
            ].map((d) => (
              <div
                key={d.label}
                className={`p-2 rounded-lg text-center ${getScoreBgColor(d.score)}`}
              >
                <div className={`text-lg font-bold ${getScoreColor(d.score)}`}>{d.score}</div>
                <div className="text-xs text-slate-600">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 区块2: AI 点评（三段式） */}
      {(feedback.good?.length || feedback.improve?.length || feedback.suggestion) && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-accent" />
            AI 点评
          </h4>

          {/* 亮点 */}
          {feedback.good && feedback.good.length > 0 && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">亮点</span>
              </div>
              <ul className="space-y-1">
                {feedback.good.map((item, idx) => (
                  <li key={idx} className="text-sm text-emerald-700 pl-6">
                    {safeString(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 问题 */}
          {feedback.improve && feedback.improve.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">问题</span>
              </div>
              <ul className="space-y-1">
                {feedback.improve.map((item, idx) => (
                  <li key={idx} className="text-sm text-amber-700 pl-6">
                    {safeString(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 建议 */}
          {feedback.suggestion && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">建议</span>
              </div>
              <p className="text-sm text-blue-700 pl-6">{safeString(feedback.suggestion)}</p>
            </div>
          )}
        </div>
      )}

      {/* 区块3: 优化版本 */}
      {feedback.optimizedAnswer && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700">优化版本</h4>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors"
            >
              {showComparison ? "只看优化版" : "对比原答案"}
            </button>
          </div>

          {showComparison ? (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 block mb-2">原答案</span>
                <p className="text-sm text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {answer.answer}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-xs text-emerald-600 block mb-2">优化版</span>
                <p className="text-sm text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {safeString(feedback.optimizedAnswer)}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {safeString(feedback.optimizedAnswer)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 教练寄语 */}
      {feedback.coachMessage && (
        <div className="p-3 bg-gradient-to-r from-accent/5 to-purple-500/5 rounded-lg border border-accent/10">
          <p className="text-sm text-slate-600 italic">"{safeString(feedback.coachMessage)}"</p>
        </div>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

interface InterviewReportV2Props {
  session: InterviewSession;
}

export function InterviewReportV2({ session }: InterviewReportV2Props) {
  const { locale } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      {/* 1. 简化 Header */}
      <ReportHeader session={session} locale={locale} />

      {/* 2. Executive Summary - 核心摘要 */}
      <ExecutiveSummary session={session} locale={locale} />

      {/* 3. Capability Radar - 能力雷达 */}
      <CapabilityRadar dimensionScores={session.dimensionScores} locale={locale} />

      {/* 4. Question List - 题目列表 */}
      <QuestionList answers={session.answers} locale={locale} />

      {/* 5. Next Steps - 后续建议 */}
      {session.nextSteps && session.nextSteps.length > 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold mb-4">后续建议</h2>
            <div className="space-y-3">
              {session.nextSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-slate-700">{safeString(step)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
