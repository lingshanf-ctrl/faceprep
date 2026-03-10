"use client";

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Sparkles,
  Target,
  ThumbsUp,
  TrendingUp,
  BarChart3,
  Lightbulb,
  CheckCircle,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { motion } from "framer-motion";

interface InterviewAnswer {
  questionId: string;
  questionTitle?: string;
  answer: string;
  score: number;
  duration?: number;
  feedback?: {
    dimensions?: {
      content?: { score: number };
      structure?: { score: number };
      expression?: { score: number };
      highlights?: { score: number };
    };
    good?: string[];
    improve?: string[];
    suggestion?: string;
    optimizedAnswer?: string;
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
    optimizedExample: "优化示例",
    coachSuggestion: "教练建议",
    content: "内容",
    structure: "结构",
    expression: "表达",
    highlights: "亮点",
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
    optimizedExample: "Optimized Example",
    coachSuggestion: "Coach Suggestion",
    content: "Content",
    structure: "Structure",
    expression: "Expression",
    highlights: "Highlights",
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
            <p className="text-xs text-slate-500 mb-1">
              Q{index + 1}
            </p>
            <p className="font-medium text-slate-900 truncate max-w-md">
              {answer.questionTitle || `${locale === "zh" ? "问题" : "Question"} ${index + 1}`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dimension Scores */}
        {dims && (
          <div className="grid grid-cols-4 gap-2">
            <DimensionBadge label={t.content} score={dims.content?.score || 0} />
            <DimensionBadge label={t.structure} score={dims.structure?.score || 0} />
            <DimensionBadge label={t.expression} score={dims.expression?.score || 0} />
            <DimensionBadge label={t.highlights} score={dims.highlights?.score || 0} />
          </div>
        )}

        {/* Your Answer */}
        <div>
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
            {t.yourAnswer}
          </h4>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {answer.answer}
            </p>
          </div>
        </div>

        {/* Good & Improve */}
        <div className="grid md:grid-cols-2 gap-3">
          {answer.feedback?.good && answer.feedback.good.length > 0 && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <h5 className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {t.strengths}
              </h5>
              <ul className="space-y-1">
                {answer.feedback.good.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                    <span className="text-emerald-500">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {answer.feedback?.improve && answer.feedback.improve.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <h5 className="text-xs font-medium text-amber-700 mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {t.improvements}
              </h5>
              <ul className="space-y-1">
                {answer.feedback.improve.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                    <span className="text-amber-500">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Optimized Answer */}
        {answer.feedback?.optimizedAnswer && (
          <div className="p-3 bg-accent/5 rounded-lg border border-accent/10">
            <h5 className="text-xs font-medium text-accent mb-2">
              {t.optimizedExample}
            </h5>
            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {answer.feedback.optimizedAnswer}
            </p>
          </div>
        )}

        {/* Coach Suggestion */}
        {answer.feedback?.suggestion && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <h5 className="text-xs font-medium text-slate-500 mb-1">
              {t.coachSuggestion}
            </h5>
            <p className="text-sm text-slate-700">{answer.feedback.suggestion}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DimensionBadge({ label, score }: { label: string; score: number }) {
  return (
    <div
      className={`px-2 py-2 rounded-lg text-center ${
        score >= 80
          ? "bg-emerald-50 border border-emerald-100"
          : score >= 60
          ? "bg-amber-50 border border-amber-100"
          : "bg-rose-50 border border-rose-100"
      }`}
    >
      <div
        className={`text-lg font-bold ${
          score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-rose-600"
        }`}
      >
        {score}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
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
