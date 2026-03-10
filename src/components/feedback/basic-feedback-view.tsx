"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Lightbulb,
  Lock,
  AlertCircle,
  Target,
  Wand2,
  User,
  Sparkles,
  ListTodo,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { UpgradePromptCard } from "./upgrade-prompt-card";

interface FeedbackDimension {
  score: number;
  feedback?: string;
  preview?: string;
  potential?: string;
}

interface FeedbackDimensions {
  content?: FeedbackDimension;
  structure?: FeedbackDimension;
  expression?: FeedbackDimension;
  highlights?: FeedbackDimension;
}

interface KeyFindings {
  strengths?: string[];
  weaknesses?: string[];
  criticalMissing?: string;
}

interface QuickAdvice {
  primary?: string;
  secondary?: string;
}

interface UpgradeTeaser {
  gapHint?: string;
  optimizedPreview?: string;
  coachInsight?: string;
}

interface PracticeFeedback {
  totalScore?: number;
  score?: number;
  dimensions?: FeedbackDimensions;
  good?: string[];
  improve?: string[];
  suggestion?: string;
  keyFindings?: KeyFindings;
  quickAdvice?: QuickAdvice | string;
  upgradeTeaser?: UpgradeTeaser;
}

interface BasicFeedbackViewProps {
  feedback: PracticeFeedback | null;
  isUnauthenticated: boolean;
  onLogin: () => void;
  onUpgrade: () => void;
}

const translations = {
  zh: {
    overallScore: "综合评分",
    dimensionAnalysis: "四维能力分析",
    content: "内容覆盖",
    structure: "结构逻辑",
    expression: "表达专业",
    highlights: "综合亮点",
    keyFindings: "关键发现",
    strengths: "表现亮点",
    weaknesses: "提升空间",
    criticalMissing: "关键缺失",
    coreAdvice: "核心改进建议",
  },
  en: {
    overallScore: "Overall Score",
    dimensionAnalysis: "4-Dimension Analysis",
    content: "Content Coverage",
    structure: "Structure Logic",
    expression: "Expression",
    highlights: "Highlights",
    keyFindings: "Key Findings",
    strengths: "Strengths",
    weaknesses: "Areas to Improve",
    criticalMissing: "Critical Missing",
    coreAdvice: "Core Improvement Advice",
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

// 增强版维度卡片组件
function EnhancedDimensionCard({
  label,
  score,
  feedback,
  preview,
  icon: Icon,
  color,
}: {
  label: string;
  score: number;
  feedback?: string;
  preview?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
      {/* 维度标题和分数 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>

      {/* 分数条 */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${getScoreBarColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* 反馈内容 */}
      {feedback && (
        <p className="text-sm text-slate-600 leading-relaxed">{feedback}</p>
      )}

      {/* 深度分析预览（钩子） */}
      {preview && (
        <div className="flex items-center gap-2 text-xs text-accent bg-accent/5 p-2 rounded-lg border border-accent/10">
          <Lock className="w-3 h-3 shrink-0" />
          <span className="italic text-slate-500">{preview}</span>
        </div>
      )}
    </div>
  );
}

export function BasicFeedbackView({
  feedback,
  isUnauthenticated,
  onLogin,
  onUpgrade,
}: BasicFeedbackViewProps) {
  const { locale } = useLanguage();
  const t = translations[locale === "zh" ? "zh" : "en"];

  if (!feedback) return null;

  const score = feedback.totalScore || feedback.score || 0;
  const dimensions = feedback.dimensions || {};

  // 兼容新旧数据结构
  const keyFindings = feedback.keyFindings || {
    strengths: feedback.good || [],
    weaknesses: feedback.improve || [],
  };

  // 解析 quickAdvice（可能是字符串或对象）
  let quickAdvice: QuickAdvice = {};
  if (typeof feedback.quickAdvice === "string") {
    quickAdvice = { primary: feedback.quickAdvice };
  } else if (feedback.quickAdvice) {
    quickAdvice = feedback.quickAdvice;
  } else if (feedback.suggestion) {
    quickAdvice = { primary: feedback.suggestion };
  }

  const upgradeTeaser = feedback.upgradeTeaser || {};

  return (
    <div className="space-y-4">
      {/* 评分卡片 */}
      <Card className="border border-slate-200 bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">{t.overallScore}</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </span>
                <span className="text-sm text-slate-400">/100</span>
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium border ${getScoreBgColor(
                score
              )}`}
            >
              {getScoreLevel(score, locale)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 四维能力分析 */}
      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium">{t.dimensionAnalysis}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EnhancedDimensionCard
              label={t.content}
              score={dimensions.content?.score || 0}
              feedback={dimensions.content?.feedback}
              preview={dimensions.content?.preview}
              icon={CheckCircle}
              color="bg-blue-500"
            />
            <EnhancedDimensionCard
              label={t.structure}
              score={dimensions.structure?.score || 0}
              feedback={dimensions.structure?.feedback}
              preview={dimensions.structure?.preview}
              icon={ListTodo}
              color="bg-purple-500"
            />
            <EnhancedDimensionCard
              label={t.expression}
              score={dimensions.expression?.score || 0}
              feedback={dimensions.expression?.feedback}
              preview={dimensions.expression?.preview}
              icon={Lightbulb}
              color="bg-amber-500"
            />
            <EnhancedDimensionCard
              label={t.highlights}
              score={dimensions.highlights?.score || 0}
              feedback={dimensions.highlights?.feedback}
              preview={dimensions.highlights?.potential}
              icon={Sparkles}
              color="bg-emerald-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* 关键发现 */}
      {(keyFindings.strengths?.length || keyFindings.weaknesses?.length || keyFindings.criticalMissing) && (
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-medium">{t.keyFindings}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 亮点 */}
              {keyFindings.strengths && keyFindings.strengths.length > 0 && (
                <div className="bg-emerald-50/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-emerald-700 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {t.strengths}
                  </h4>
                  <ul className="space-y-2">
                    {keyFindings.strengths.map((item, idx) => (
                      <li key={idx} className="text-sm text-emerald-700 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 不足 */}
              {keyFindings.weaknesses && keyFindings.weaknesses.length > 0 && (
                <div className="bg-amber-50/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-amber-700 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    {t.weaknesses}
                  </h4>
                  <ul className="space-y-2">
                    {keyFindings.weaknesses.map((item, idx) => (
                      <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 关键缺失 */}
            {keyFindings.criticalMissing && (
              <div className="mt-4 flex items-start gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">{t.criticalMissing}:</span>{" "}
                  <span>{keyFindings.criticalMissing}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 核心改进建议 */}
      {(quickAdvice.primary || quickAdvice.secondary) && (
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              {t.coreAdvice}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 主要建议 */}
            {quickAdvice.primary && (
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-800">{quickAdvice.primary}</p>
              </div>
            )}

            {/* 次要建议 */}
            {quickAdvice.secondary && (
              <p className="text-sm text-slate-600 pl-4 border-l-2 border-slate-200">
                {quickAdvice.secondary}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 升级引导卡片（包含预览） */}
      <UpgradePromptCard
        isUnauthenticated={isUnauthenticated}
        onLogin={onLogin}
        onUpgrade={onUpgrade}
        teaserData={upgradeTeaser.gapHint || upgradeTeaser.optimizedPreview || upgradeTeaser.coachInsight ? upgradeTeaser : undefined}
      />
    </div>
  );
}
