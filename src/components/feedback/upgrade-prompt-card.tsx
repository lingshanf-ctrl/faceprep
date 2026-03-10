"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Crown, Check, X, ChevronRight, Zap } from "lucide-react";
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
    upgradeToUnlock: "解锁专业版深度分析",
    upgradeDesc: "获得专业面试教练级别的深度反馈与指导",
    upgradeNow: "立即升级",
    featureGapAnalysis: "差距分析与参考答案对比",
    featureActionItems: "个性化改进行动清单",
    featureOptimizedAnswer: "AI优化版回答示例",
    featureCoachMessage: "专业教练寄语与建议",
    // 新增翻译
    free: "免费版",
    premium: "专业版",
    priceAnchor: "原价 ¥199/月",
    currentPrice: "限时 ¥49/月",
    saveAmount: "省 ¥150",
    previewTitle: "专业版分析预览",
    gapHintTitle: "🎯 差距分析要点",
    optimizedPreviewTitle: "✨ 优化版预览",
    coachInsightTitle: "💡 教练洞察",
    viewMore: "查看完整分析",
    comparisonTitle: "功能对比",
    basicAnalysis: "基础AI分析",
    advancedAnalysis: "深度AI分析（Kimi 2.5）",
    dimensionCount: "2个维度评分",
    dimensionCountPremium: "4个维度深度评估",
    quoteAnalysis: "原文引用分析",
    modificationExample: "修改前后对比",
    optimizedAnswer: "完整优化答案",
    coachMessage: "教练寄语",
    gapAnalysis: "差距分析",
    unlimited: "无限次练习",
    limited: "每日5次限制",
  },
  en: {
    loginToUnlock: "Login to Unlock More",
    loginToUnlockDesc: "Save practice records and get AI in-depth feedback after login",
    login: "Login Now",
    upgradeToUnlock: "Unlock Professional Analysis",
    upgradeDesc: "Get professional interview coach-level in-depth feedback",
    upgradeNow: "Upgrade Now",
    featureGapAnalysis: "Gap analysis with reference answer comparison",
    featureActionItems: "Personalized improvement action list",
    featureOptimizedAnswer: "AI-optimized answer examples",
    featureCoachMessage: "Professional coach message and advice",
    // New translations
    free: "Free",
    premium: "Premium",
    priceAnchor: "Was ¥199/month",
    currentPrice: "Now ¥49/month",
    saveAmount: "Save ¥150",
    previewTitle: "Premium Preview",
    gapHintTitle: "🎯 Gap Analysis Highlight",
    optimizedPreviewTitle: "✨ Optimized Preview",
    coachInsightTitle: "💡 Coach Insight",
    viewMore: "View Full Analysis",
    comparisonTitle: "Feature Comparison",
    basicAnalysis: "Basic AI Analysis",
    advancedAnalysis: "Advanced AI (Kimi 2.5)",
    dimensionCount: "2 dimensions",
    dimensionCountPremium: "4 dimensions deep",
    quoteAnalysis: "Quote-based analysis",
    modificationExample: "Before/after comparison",
    optimizedAnswer: "Full optimized answer",
    coachMessage: "Coach message",
    gapAnalysis: "Gap analysis",
    unlimited: "Unlimited practice",
    limited: "5 times/day limit",
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
          <Button onClick={onLogin} variant="outline" className="w-full">
            {t.login}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 升级提示主卡片 */}
      <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-purple-500/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />

        {/* 价格锚点标签 */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="text-xs text-slate-400 line-through">{t.priceAnchor}</span>
          <Badge className="bg-red-500 text-white text-xs">
            {t.saveAmount}
          </Badge>
        </div>

        <CardContent className="pt-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-slate-900">
                  {t.upgradeToUnlock}
                </h3>
                <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              </div>
              <p className="text-sm text-slate-600 mb-3">{t.upgradeDesc}</p>

              {/* 当前价格 */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-accent">{t.currentPrice}</span>
                <span className="text-sm text-slate-400">{t.priceAnchor}</span>
              </div>

              {/* 功能对比列表 */}
              <ul className="space-y-2 mb-4">
                {[
                  t.featureGapAnalysis,
                  t.featureActionItems,
                  t.featureOptimizedAnswer,
                  t.featureCoachMessage,
                ].map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <Check className="w-4 h-4 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={onUpgrade}
                className="w-full bg-accent hover:bg-accent/90"
              >
                <Crown className="w-4 h-4 mr-2" />
                {t.upgradeNow}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 功能对比表 */}
      <Card className="border border-slate-200">
        <CardContent className="pt-4 pb-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            {t.comparisonTitle}
          </h4>
          <div className="space-y-2">
            {/* 表头 */}
            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-slate-500 pb-2 border-b">
              <span>功能</span>
              <span className="text-center">{t.free}</span>
              <span className="text-center text-accent">{t.premium}</span>
            </div>

            {/* 对比项 */}
            <ComparisonRow
              feature={t.basicAnalysis}
              free={<Check className="w-4 h-4 text-slate-400 mx-auto" />}
              premium={<Check className="w-4 h-4 text-accent mx-auto" />}
            />
            <ComparisonRow
              feature={t.advancedAnalysis}
              free={<X className="w-4 h-4 text-slate-300 mx-auto" />}
              premium={<Badge className="bg-accent/10 text-accent text-xs mx-auto">Kimi 2.5</Badge>}
            />
            <ComparisonRow
              feature={t.dimensionCount}
              free={<span className="text-xs text-slate-400 text-center block">2</span>}
              premium={<span className="text-xs text-accent text-center block font-medium">4</span>}
            />
            <ComparisonRow
              feature={t.quoteAnalysis}
              free={<X className="w-4 h-4 text-slate-300 mx-auto" />}
              premium={<Check className="w-4 h-4 text-accent mx-auto" />}
            />
            <ComparisonRow
              feature={t.modificationExample}
              free={<X className="w-4 h-4 text-slate-300 mx-auto" />}
              premium={<Check className="w-4 h-4 text-accent mx-auto" />}
            />
            <ComparisonRow
              feature={t.optimizedAnswer}
              free={<span className="text-xs text-slate-400 text-center block">{t.limited}</span>}
              premium={<span className="text-xs text-accent text-center block">{t.unlimited}</span>}
            />
          </div>
        </CardContent>
      </Card>

      {/* 预览内容（如果有） */}
      {teaserData && (
        <Card className="border border-accent/20 bg-accent/5">
          <CardContent className="pt-4 pb-4">
            <h4 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {t.previewTitle}
            </h4>

            <div className="space-y-3">
              {/* 差距分析要点 */}
              {teaserData.gapHint && (
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <h5 className="text-xs font-medium text-slate-700 mb-1">
                    {t.gapHintTitle}
                  </h5>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {teaserData.gapHint}
                  </p>
                </div>
              )}

              {/* 优化版预览 */}
              {teaserData.optimizedPreview && (
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <h5 className="text-xs font-medium text-slate-700 mb-1">
                    {t.optimizedPreviewTitle}
                  </h5>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {teaserData.optimizedPreview}
                  </p>
                </div>
              )}

              {/* 教练洞察 */}
              {teaserData.coachInsight && (
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <h5 className="text-xs font-medium text-slate-700 mb-1">
                    {t.coachInsightTitle}
                  </h5>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {teaserData.coachInsight}
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={onUpgrade}
              variant="ghost"
              className="w-full mt-3 text-accent hover:text-accent/80 hover:bg-accent/10"
            >
              {t.viewMore}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 对比行组件
function ComparisonRow({
  feature,
  free,
  premium
}: {
  feature: string;
  free: React.ReactNode;
  premium: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 text-xs py-1.5 hover:bg-slate-50 rounded">
      <span className="text-slate-600">{feature}</span>
      <div className="flex justify-center">{free}</div>
      <div className="flex justify-center">{premium}</div>
    </div>
  );
}
