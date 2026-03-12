"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Lock, Sparkles, Check, ChevronRight } from "lucide-react";
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
    loginToUnlock: "登录解锁更多功能",
    loginToUnlockDesc: "登录后可保存练习记录，获得AI深度反馈",
    login: "立即登录",
    upgradeToUnlock: "了解更多分析维度",
    upgradeDesc: "获取完整的四维能力评估与改进建议",
    upgradeNow: "了解详情",
    featureGapAnalysis: "差距分析与参考答案对比",
    featureActionItems: "个性化改进行动清单",
    featureOptimizedAnswer: "AI优化版回答示例",
    featureCoachMessage: "专业教练寄语与建议",
    previewTitle: "深度分析预览",
    gapHintTitle: "差距分析要点",
    optimizedPreviewTitle: "优化版预览",
    coachInsightTitle: "教练洞察",
    viewMore: "查看完整分析",
  },
  en: {
    loginToUnlock: "Login to Unlock More",
    loginToUnlockDesc: "Save practice records and get AI in-depth feedback after login",
    login: "Login Now",
    upgradeToUnlock: "Explore More Analysis",
    upgradeDesc: "Get complete 4-dimension assessment and improvement suggestions",
    upgradeNow: "Learn More",
    featureGapAnalysis: "Gap analysis with reference answer comparison",
    featureActionItems: "Personalized improvement action list",
    featureOptimizedAnswer: "AI-optimized answer examples",
    featureCoachMessage: "Professional coach message and advice",
    previewTitle: "Deep Analysis Preview",
    gapHintTitle: "Gap Analysis Highlight",
    optimizedPreviewTitle: "Optimized Preview",
    coachInsightTitle: "Coach Insight",
    viewMore: "View Full Analysis",
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
      <Card className="border-2 border-dashed border-slate-300 bg-slate-50/50">
        <CardContent className="pt-6 text-center">
          <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t.loginToUnlock}</h3>
          <p className="text-sm text-slate-500 mb-4 max-w-xs mx-auto">
            {t.loginToUnlockDesc}
          </p>
          <button
            onClick={onLogin}
            className="w-full px-4 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {t.login}
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 升级提示主卡片 - 简化设计 */}
      <Card className="border border-slate-200 bg-slate-50/50">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-slate-700 mb-1">
                {t.upgradeToUnlock}
              </h3>
              <p className="text-xs text-slate-500 mb-3">{t.upgradeDesc}</p>

              {/* 功能列表 - 更紧凑 */}
              <ul className="space-y-1.5 mb-3">
                {[
                  t.featureGapAnalysis,
                  t.featureActionItems,
                  t.featureOptimizedAnswer,
                  t.featureCoachMessage,
                ].map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-xs text-slate-500"
                  >
                    <Check className="w-3 h-3 text-slate-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={onUpgrade}
                className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
              >
                {t.upgradeNow}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* 预览内容（如果有） */}
      {teaserData && (
        <Card className="border border-slate-200 bg-slate-50/30">
          <CardContent className="pt-4 pb-4">
            <h4 className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-2">
              <Lock className="w-3 h-3" />
              {t.previewTitle}
            </h4>

            <div className="space-y-2">
              {/* 差距分析要点 */}
              {teaserData.gapHint && (
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <h5 className="text-xs font-medium text-slate-600 mb-1">
                    {t.gapHintTitle}
                  </h5>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {teaserData.gapHint}
                  </p>
                </div>
              )}

              {/* 优化版预览 */}
              {teaserData.optimizedPreview && (
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <h5 className="text-xs font-medium text-slate-600 mb-1">
                    {t.optimizedPreviewTitle}
                  </h5>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {teaserData.optimizedPreview}
                  </p>
                </div>
              )}

              {/* 教练洞察 */}
              {teaserData.coachInsight && (
                <div className="bg-white rounded-lg p-3 border border-slate-100">
                  <h5 className="text-xs font-medium text-slate-600 mb-1">
                    {t.coachInsightTitle}
                  </h5>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {teaserData.coachInsight}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={onUpgrade}
              className="w-full mt-3 text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 transition-colors"
            >
              {t.viewMore}
              <ChevronRight className="w-3 h-3" />
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

