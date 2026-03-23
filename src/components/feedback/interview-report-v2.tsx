"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Lightbulb,
  BarChart3,
  Target,
  ChevronRight,
  ArrowUpCircle,
  TrendingUp,
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

// ==================== 子组件 ====================

// 单题详情（展开内容）
function QuestionDetail({ answer, locale }: { answer: InterviewAnswer; locale: string }) {
  const [showComparison, setShowComparison] = useState(false);
  const feedback = answer.feedback;
  const dims = feedback?.dimensions;

  if (!feedback) {
    return <p className="text-sm text-slate-500">暂无详细反馈</p>;
  }

  return (
    <div className="space-y-4">
      {/* 你的回答 */}
      <div className="bg-slate-50 rounded-lg p-3">
        <p className="text-xs text-slate-500 mb-1">{locale === "zh" ? "你的回答" : "Your Answer"}</p>
        <p className="text-sm text-slate-700 line-clamp-4">{answer.answer}</p>
      </div>

      {/* 维度评分（带说明文字） */}
      {dims && (
        <div>
          <p className="text-xs font-medium text-slate-600 mb-2">
            {locale === "zh" ? "四维评分" : "4-Dimension Scores"}
          </p>
          <div className="space-y-2">
            {[
              {
                label: locale === "zh" ? "内容覆盖" : "Content",
                dim: dims.content,
              },
              {
                label: locale === "zh" ? "结构逻辑" : "Structure",
                dim: dims.structure,
              },
              {
                label: locale === "zh" ? "表达专业" : "Expression",
                dim: dims.expression,
              },
              {
                label: locale === "zh" ? "综合亮点" : "Highlights",
                dim: dims.highlights,
              },
            ].map(({ label, dim }) => (
              <div key={label}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500 w-16 shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBarColor(dim?.score ?? 0)}`}
                      style={{ width: `${dim?.score ?? 0}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold w-6 text-right ${getScoreColor(dim?.score ?? 0)}`}>
                    {dim?.score ?? "--"}
                  </span>
                </div>
                {dim?.feedback && (
                  <p className="text-xs text-slate-500 pl-[4.5rem] leading-relaxed">{safeString(dim.feedback)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 点评 */}
      {(feedback.good?.length || feedback.improve?.length || feedback.suggestion) && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-accent" />
            {locale === "zh" ? "AI 点评" : "AI Feedback"}
          </p>

          {feedback.good && feedback.good.length > 0 && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">
                  {locale === "zh" ? "亮点" : "Strengths"}
                </span>
              </div>
              <ul className="space-y-1">
                {feedback.good.map((item, idx) => (
                  <li key={idx} className="text-xs text-emerald-600 flex items-start gap-1">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{safeString(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.improve && feedback.improve.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-1 mb-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">
                  {locale === "zh" ? "提升空间" : "To Improve"}
                </span>
              </div>
              <ul className="space-y-1">
                {feedback.improve.map((item, idx) => (
                  <li key={idx} className="text-xs text-amber-600 flex items-start gap-1">
                    <span className="text-amber-400 mt-0.5">{idx + 1}.</span>
                    <span>{safeString(item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.suggestion && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-1 mb-1">
                <ArrowRight className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">
                  {locale === "zh" ? "建议" : "Suggestion"}
                </span>
              </div>
              <p className="text-xs text-blue-600 pl-4">{safeString(feedback.suggestion)}</p>
            </div>
          )}
        </div>
      )}

      {/* 优化答案 */}
      {feedback.optimizedAnswer && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-600">
              {locale === "zh" ? "优化版答案" : "Optimized Answer"}
            </p>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="text-xs px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              {showComparison
                ? locale === "zh" ? "只看优化版" : "Optimized only"
                : locale === "zh" ? "对比原答案" : "Compare"}
            </button>
          </div>

          {showComparison ? (
            <div className="grid md:grid-cols-2 gap-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-400 block mb-1">
                  {locale === "zh" ? "原答案" : "Original"}
                </span>
                <p className="text-xs text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                  {answer.answer}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-xs text-emerald-600 block mb-1">
                  {locale === "zh" ? "优化版" : "Optimized"}
                </span>
                <p className="text-xs text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                  {safeString(feedback.optimizedAnswer)}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {safeString(feedback.optimizedAnswer)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 教练寄语 */}
      {feedback.coachMessage && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-500 italic">"{safeString(feedback.coachMessage)}"</p>
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
  const [expandedAnswer, setExpandedAnswer] = useState<number | null>(null);

  const dims = session.dimensionScores || { technical: 0, project: 0, behavioral: 0, communication: 0 };

  const dimItems = [
    { key: "technical", label: locale === "zh" ? "技术能力" : "Technical", score: dims.technical },
    { key: "project", label: locale === "zh" ? "项目经验" : "Project", score: dims.project },
    { key: "behavioral", label: locale === "zh" ? "行为面试" : "Behavioral", score: dims.behavioral },
    { key: "communication", label: locale === "zh" ? "沟通表达" : "Communication", score: dims.communication },
  ];

  const hasDimScores = Object.values(dims).some((v) => v > 0);
  const maxScore = hasDimScores ? Math.max(...dimItems.map((i) => i.score)) : 0;
  const minScore = hasDimScores ? Math.min(...dimItems.map((i) => i.score)) : 0;
  const bestDim = dimItems.find((i) => i.score === maxScore && maxScore > 0);
  const weakDim = dimItems.find((i) => i.score === minScore && minScore > 0 && minScore !== maxScore);

  return (
    <div className="space-y-6">
      {/* 整体反馈 */}
      {(session.overallFeedback || session.strengths?.length || session.improvements?.length) && (
        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              {locale === "zh" ? "整体反馈" : "General Feedback"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {session.overallFeedback && (
                <p className="text-sm text-slate-700 leading-relaxed">{safeString(session.overallFeedback)}</p>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {session.strengths && session.strengths.length > 0 && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <h4 className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      {locale === "zh" ? "表现亮点" : "Strengths"}
                    </h4>
                    <ul className="space-y-1">
                      {session.strengths.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="text-xs text-emerald-600 flex items-start gap-1">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          <span>{safeString(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {session.improvements && session.improvements.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <h4 className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
                      <ArrowUpCircle className="w-3 h-3" />
                      {locale === "zh" ? "提升空间" : "Areas to Improve"}
                    </h4>
                    <ul className="space-y-1">
                      {session.improvements.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="text-xs text-amber-600 flex items-start gap-1">
                          <span className="text-amber-400 mt-0.5">{idx + 1}.</span>
                          <span>{safeString(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {session.nextSteps && session.nextSteps.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-medium text-slate-600 mb-2">
                    {locale === "zh" ? "后续建议" : "Next Steps"}
                  </h4>
                  <div className="space-y-2">
                    {session.nextSteps.slice(0, 3).map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">{safeString(step)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 能力分析（横向条形图） */}
      {hasDimScores && (
        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              {locale === "zh" ? "能力分析" : "Capability Analysis"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dimItems.map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-16 shrink-0">{item.label}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreBarColor(item.score)}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold w-6 text-right ${getScoreColor(item.score)}`}>
                    {item.score}
                  </span>
                </div>
              ))}
            </div>
            {bestDim && weakDim && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600">
                  <TrendingUp className="w-3 h-3 inline mr-1 text-slate-400" />
                  {locale === "zh"
                    ? `${bestDim.label}是优势项，${weakDim.label}还有提升空间，建议针对性练习。`
                    : `${bestDim.label} is your strength. Focus on improving ${weakDim.label}.`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 答题详情 */}
      <Card className="border border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            {locale === "zh" ? "答题详情" : "Answer Details"}
            <span className="text-xs font-normal text-slate-400 ml-auto">
              {locale === "zh" ? `共 ${session.answers.length} 题` : `${session.answers.length} questions`}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {session.answers?.map((answer, idx) => {
              const isExpanded = expandedAnswer === idx;
              return (
                <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedAnswer(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-slate-700 truncate max-w-[200px] text-left">
                        {answer.questionTitle || `${locale === "zh" ? "问题" : "Question"} ${idx + 1}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
                        className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-slate-100 pt-3">
                      <QuestionDetail answer={answer} locale={locale} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
