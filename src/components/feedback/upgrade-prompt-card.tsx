"use client";

import { Lock, Zap } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface UpgradeTeaserData {
  gapHint?: string;
  optimizedPreview?: string;
  coachInsight?: string;
}

interface UpgradePromptCardProps {
  isUnauthenticated: boolean;
  onLogin: () => void;
  onUpgrade: () => void;
  teaserData?: UpgradeTeaserData;
}

const translations = {
  zh: {
    loginToUnlock: "登录后查看完整报告",
    loginToUnlockDesc: "登录即可保存练习记录，获取 AI 深度反馈与改进建议。",
    login: "立即登录",
    badge: "基础版报告",
    headline: "想知道你的表达逻辑是否打动了面试官？",
    desc: "基础版报告仅展示表面数据。升级 Pro 可获取四维深度评估、差距分析、AI 优化答案及教练寄语。",
    cta: "解锁深度分析",
    gapHintTitle: "差距分析要点",
    optimizedPreviewTitle: "优化版预览",
    coachInsightTitle: "教练洞察",
  },
  en: {
    loginToUnlock: "Login to View Full Report",
    loginToUnlockDesc: "Save your practice records and unlock AI in-depth feedback after logging in.",
    login: "Login Now",
    badge: "LIMITED VIEW",
    headline: "Want to see how your answer logic landed with the interviewer?",
    desc: "The Basic report only scratches the surface. Upgrade to Pro for 4-dimension deep analysis, gap comparison, AI-optimized answers, and coach insights.",
    cta: "Unlock Deep-Dive Analysis",
    gapHintTitle: "Gap Analysis Highlight",
    optimizedPreviewTitle: "Optimized Preview",
    coachInsightTitle: "Coach Insight",
  },
};

export function UpgradePromptCard({
  isUnauthenticated,
  onLogin,
  onUpgrade,
  teaserData,
}: UpgradePromptCardProps) {
  const { locale } = useLanguage();
  const t = translations[locale === "zh" ? "zh" : "en"];

  if (isUnauthenticated) {
    return (
      <div className="border-2 border-[#004ac6] rounded-2xl p-6">
        <span className="inline-block text-xs font-semibold text-[#004ac6] bg-[#eef1ff] px-2.5 py-1 rounded-full border border-[#c5d0f5] mb-4">
          {t.badge}
        </span>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground mb-2">{t.loginToUnlock}</h3>
            <p className="text-sm text-[#5f5e5e] leading-relaxed">{t.loginToUnlockDesc}</p>
          </div>
          <button
            onClick={onLogin}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#004ac6] hover:bg-[#003aa0] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Lock className="w-4 h-4" />
            {t.login}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-[#004ac6] rounded-2xl p-6">
      {/* Badge */}
      <span className="inline-block text-xs font-semibold text-[#004ac6] bg-[#eef1ff] px-2.5 py-1 rounded-full border border-[#c5d0f5] mb-4">
        {t.badge}
      </span>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground mb-2 leading-snug">{t.headline}</h3>
          <p className="text-sm text-[#5f5e5e] leading-relaxed">{t.desc}</p>

          {/* Teaser previews */}
          {teaserData && (
            <div className="mt-4 space-y-2">
              {teaserData.gapHint && (
                <div className="bg-[#f6f3f2] rounded-lg p-3">
                  <p className="text-xs font-medium text-[#5f5e5e] mb-1">{t.gapHintTitle}</p>
                  <p className="text-xs text-foreground line-clamp-2">{teaserData.gapHint}</p>
                </div>
              )}
              {teaserData.optimizedPreview && (
                <div className="bg-[#f6f3f2] rounded-lg p-3">
                  <p className="text-xs font-medium text-[#5f5e5e] mb-1">{t.optimizedPreviewTitle}</p>
                  <p className="text-xs text-foreground line-clamp-2">{teaserData.optimizedPreview}</p>
                </div>
              )}
              {teaserData.coachInsight && (
                <div className="bg-[#f6f3f2] rounded-lg p-3">
                  <p className="text-xs font-medium text-[#5f5e5e] mb-1">{t.coachInsightTitle}</p>
                  <p className="text-xs text-foreground line-clamp-2">{teaserData.coachInsight}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onUpgrade}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#004ac6] hover:bg-[#003aa0] text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          <Zap className="w-4 h-4" />
          {t.cta}
        </button>
      </div>
    </div>
  );
}
