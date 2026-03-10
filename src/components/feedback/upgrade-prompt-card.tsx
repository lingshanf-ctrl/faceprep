"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Crown, Check } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface UpgradePromptCardProps {
  isUnauthenticated: boolean;
  onLogin: () => void;
  onUpgrade: () => void;
}

const translations = {
  zh: {
    loginToUnlock: "登录解锁更多功能",
    loginToUnlockDesc: "登录后可保存练习记录，获得AI深度反馈",
    login: "立即登录",
    upgradeToUnlock: "升级解锁专业分析",
    upgradeDesc: "获得专业面试教练级别的深度反馈与指导",
    upgradeNow: "立即升级",
    featureGapAnalysis: "差距分析与参考答案对比",
    featureActionItems: "个性化改进行动清单",
    featureOptimizedAnswer: "AI优化版回答示例",
    featureCoachMessage: "专业教练寄语与建议",
  },
  en: {
    loginToUnlock: "Login to Unlock More",
    loginToUnlockDesc: "Save practice records and get AI in-depth feedback after login",
    login: "Login Now",
    upgradeToUnlock: "Upgrade for Professional Analysis",
    upgradeDesc: "Get professional interview coach-level in-depth feedback",
    upgradeNow: "Upgrade Now",
    featureGapAnalysis: "Gap analysis with reference answer comparison",
    featureActionItems: "Personalized improvement action list",
    featureOptimizedAnswer: "AI-optimized answer examples",
    featureCoachMessage: "Professional coach message and advice",
  },
};

export function UpgradePromptCard({
  isUnauthenticated,
  onLogin,
  onUpgrade,
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
    <Card className="border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-purple-500/5 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />

      <CardContent className="pt-6 relative z-10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {t.upgradeToUnlock}
            </h3>
            <p className="text-sm text-slate-600 mb-4">{t.upgradeDesc}</p>

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
  );
}
