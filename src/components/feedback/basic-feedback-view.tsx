"use client";

import { CheckCircle, TrendingUp, AlertCircle, Wand2 } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { UpgradePromptCard } from "./upgrade-prompt-card";

// ==================== 类型定义 ====================

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

interface SuggestionDetail {
  primary?: string;
  secondary?: string;
}

interface PracticeFeedback {
  totalScore?: number;
  score?: number;
  dimensions?: FeedbackDimensions;
  good?: string[];
  improve?: string[];
  suggestion?: string | SuggestionDetail;
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

// ==================== i18n ====================

const translations = {
  zh: {
    performanceSummary: "表现总结",
    dimensionAnalysis: "能力评估",
    content: "内容准确度",
    contentDesc: "与理想回答的匹配程度",
    structure: "表达流畅度",
    structureDesc: "结构逻辑与节奏",
    expression: "专业自信度",
    expressionDesc: "语言专业性与自信心",
    highlights: "综合亮点",
    highlightsDesc: "差异化表达与独特见解",
    keyStrengths: "核心优势",
    roomForImprovement: "提升方向",
    criticalMissing: "关键缺失",
    aiSuggestion: "AI建议",
    matchIdeal: "与理想答案的匹配度",
    fluency: "表达流畅度",
    confidence: "专业自信度",
  },
  en: {
    performanceSummary: "Performance Summary",
    dimensionAnalysis: "Skill Assessment",
    content: "Accuracy",
    contentDesc: "Match to Ideal Answer",
    structure: "Delivery",
    structureDesc: "Fluency & Pace",
    expression: "Tone",
    expressionDesc: "Professional Confidence",
    highlights: "Highlights",
    highlightsDesc: "Unique Insights & Differentiation",
    keyStrengths: "Key Strengths",
    roomForImprovement: "Room for Improvement",
    criticalMissing: "Critical Missing",
    aiSuggestion: "AI Suggestion",
    matchIdeal: "Match to Ideal Answer",
    fluency: "Fluency & Pace",
    confidence: "Professional Confidence",
  },
};

// ==================== 子组件 ====================

function DimensionCard({
  label,
  score,
  description,
  feedback,
  icon,
}: {
  label: string;
  score: number;
  description: string;
  feedback?: string;
  icon: string;
}) {
  const barColor =
    score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-[#004ac6]" : "bg-rose-500";

  return (
    <div className="bg-white rounded-xl p-4 border border-[#eae7e7]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      <div className="w-full bg-[#e4e4e4] rounded-full h-1.5 mb-3">
        <div
          className={`h-1.5 rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-[#5f5e5e]">
        {score}% {description}
      </p>
      {feedback && (
        <p className="text-xs text-[#5f5e5e] mt-1.5 leading-relaxed line-clamp-2">{feedback}</p>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

export function BasicFeedbackView({
  feedback,
  isUnauthenticated,
  onLogin,
  onUpgrade,
}: BasicFeedbackViewProps) {
  const { locale } = useLanguage();
  const t = translations[locale === "zh" ? "zh" : "en"];

  if (!feedback) return null;

  const dimensions = feedback.dimensions || {};
  const hasDimensions = !!(
    dimensions.content?.score ||
    dimensions.structure?.score ||
    dimensions.expression?.score ||
    dimensions.highlights?.score
  );

  const keyFindings = feedback.keyFindings || {
    strengths: feedback.good || [],
    weaknesses: feedback.improve || [],
  };

  // Performance Summary text
  let summaryText = "";
  if (typeof feedback.suggestion === "string") {
    summaryText = feedback.suggestion;
  } else if (feedback.suggestion?.primary) {
    summaryText = feedback.suggestion.primary;
    if (feedback.suggestion.secondary) summaryText += " " + feedback.suggestion.secondary;
  } else if (typeof feedback.quickAdvice === "string") {
    summaryText = feedback.quickAdvice;
  } else if (feedback.quickAdvice?.primary) {
    summaryText = feedback.quickAdvice.primary;
  }

  const upgradeTeaser = feedback.upgradeTeaser || {};

  return (
    <div className="space-y-8">
      {/* Performance Summary */}
      {summaryText && (
        <div className="bg-white rounded-xl p-5 border border-[#eae7e7]">
          <h3 className="text-sm font-semibold text-foreground mb-2">{t.performanceSummary}</h3>
          <p className="text-sm text-[#5f5e5e] leading-relaxed">{summaryText}</p>
        </div>
      )}

      {/* Dimension Cards */}
      {hasDimensions && (
        <div>
          <h3 className="text-sm font-semibold text-[#5f5e5e] uppercase tracking-widest mb-4">
            {t.dimensionAnalysis}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dimensions.content && (
              <DimensionCard
                label={t.content}
                score={dimensions.content.score}
                description={t.contentDesc}
                feedback={dimensions.content.feedback}
                icon="🎯"
              />
            )}
            {dimensions.structure && (
              <DimensionCard
                label={t.structure}
                score={dimensions.structure.score}
                description={t.structureDesc}
                feedback={dimensions.structure.feedback}
                icon="📢"
              />
            )}
            {dimensions.expression && (
              <DimensionCard
                label={t.expression}
                score={dimensions.expression.score}
                description={t.expressionDesc}
                feedback={dimensions.expression.feedback}
                icon="😊"
              />
            )}
            {dimensions.highlights && (
              <DimensionCard
                label={t.highlights}
                score={dimensions.highlights.score}
                description={t.highlightsDesc}
                feedback={dimensions.highlights.feedback}
                icon="⭐"
              />
            )}
          </div>
        </div>
      )}

      {/* Key Strengths + Room for Improvement */}
      {(keyFindings.strengths?.length || keyFindings.weaknesses?.length) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keyFindings.strengths && keyFindings.strengths.length > 0 && (
            <div className="bg-[#f6f3f2] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">{t.keyStrengths}</span>
              </div>
              <ul className="space-y-2">
                {keyFindings.strengths.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {keyFindings.weaknesses && keyFindings.weaknesses.length > 0 && (
            <div className="bg-[#f6f3f2] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">{t.roomForImprovement}</span>
              </div>
              <ul className="space-y-2">
                {keyFindings.weaknesses.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Critical Missing */}
      {keyFindings.criticalMissing && (
        <div className="flex items-start gap-3 text-sm text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">{t.criticalMissing}: </span>
            <span>{keyFindings.criticalMissing}</span>
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      <UpgradePromptCard
        isUnauthenticated={isUnauthenticated}
        onLogin={onLogin}
        onUpgrade={onUpgrade}
        teaserData={
          upgradeTeaser.gapHint || upgradeTeaser.optimizedPreview || upgradeTeaser.coachInsight
            ? upgradeTeaser
            : undefined
        }
      />
    </div>
  );
}
