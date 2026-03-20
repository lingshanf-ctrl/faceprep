"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";

// 用户类型
type UserType = "free" | "credit_exhausted" | "monthly_expired";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: UserType;
  creditsRemaining?: number | null;
  monthlyExpiresAt?: Date | null;
}

const translations = {
  zh: {
    // 免费用户
    freeTitle: "解锁 AI 深度分析",
    freeSubtitle: "获取专业的面试教练级反馈",
    freeCta: "立即开通会员",
    // 次卡用完
    creditExhaustedTitle: "次数已用完",
    creditExhaustedSubtitle: "你的次卡权益已用完，继续查看需要续费",
    creditExhaustedCta: "续费次卡",
    // 月卡过期
    monthlyExpiredTitle: "月卡已过期",
    monthlyExpiredSubtitle: "你的月卡已到期，续费可继续享受不限次分析",
    monthlyExpiredCta: "续费月卡",
    // 通用
    features: [
      "四维能力评估",
      "差距分析定位",
      "AI优化答案示例",
      "个性化改进建议",
      "教练寄语",
    ],
    freePlan: "免费版",
    freeDesc: "基础分析，关键点覆盖检查",
    creditPlan: "次卡",
    creditDesc: "按需使用，灵活便捷",
    monthlyPlan: "月卡",
    monthlyDesc: "畅享无限次专业分析",
    contactAdmin: "扫码进入小红书店铺下单",
    contactStep1: "① 扫描下方二维码",
    contactStep2: "② 小红书店铺下单领取早鸟价会员",
    contactStep3: "③ 下单后备注栏将收到会员激活链接",
    contactNote: "早鸟价限时优惠，先到先得",
    close: "暂不需要",
    currentPlan: "当前套餐",
    creditsLeft: "剩余",
    times: "次",
    expiresAt: "有效期至",
    expiredAt: "已于",
    expired: "过期",
    upgradeHint: "升级会员，享受专业面试辅导",
    renewHint: "续费后即刻恢复 AI 分析权益",
  },
  en: {
    // Free user
    freeTitle: "Unlock AI Deep Analysis",
    freeSubtitle: "Get professional interview coaching feedback",
    freeCta: "Activate Membership",
    // Credit exhausted
    creditExhaustedTitle: "Credits Exhausted",
    creditExhaustedSubtitle: "Your credit pack is used up, renewal required",
    creditExhaustedCta: "Renew Credits",
    // Monthly expired
    monthlyExpiredTitle: "Monthly Plan Expired",
    monthlyExpiredSubtitle: "Your monthly plan has expired, renew for unlimited access",
    monthlyExpiredCta: "Renew Monthly",
    // Common
    features: [
      "4-Dimension Assessment",
      "Gap Analysis",
      "AI-Optimized Answers",
      "Personalized Suggestions",
      "Coach Message",
    ],
    freePlan: "Free",
    freeDesc: "Basic analysis, key points coverage check",
    creditPlan: "Credit Pack",
    creditDesc: "Use as needed, flexible",
    monthlyPlan: "Monthly",
    monthlyDesc: "Unlimited professional analysis",
    contactAdmin: "Scan QR to order on Xiaohongshu",
    contactStep1: "① Scan the QR code below",
    contactStep2: "② Place order on Xiaohongshu at early bird price",
    contactStep3: "③ Activation link sent in order notes after purchase",
    contactNote: "Early bird pricing — limited time offer",
    close: "Not Now",
    currentPlan: "Current Plan",
    creditsLeft: "Remaining",
    times: "credits",
    expiresAt: "Valid until",
    expiredAt: "Expired on",
    expired: "",
    upgradeHint: "Upgrade for professional interview coaching",
    renewHint: "Renew to restore AI analysis access",
  },
};

export function UpgradeModal({
  isOpen,
  onClose,
  userType = "free",
  creditsRemaining,
  monthlyExpiresAt,
}: UpgradeModalProps) {
  const { locale } = useLanguage();
  const t = translations[locale === "zh" ? "zh" : "en"];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // 根据用户类型获取文案和主题
  const getContent = () => {
    switch (userType) {
      case "credit_exhausted":
        return {
          title: t.creditExhaustedTitle,
          subtitle: t.creditExhaustedSubtitle,
          cta: t.creditExhaustedCta,
          hint: t.renewHint,
          theme: {
            gradient: "from-amber-500 to-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-200",
            text: "text-amber-700",
            accent: "text-amber-600",
            icon: "text-amber-500",
          },
        };
      case "monthly_expired":
        return {
          title: t.monthlyExpiredTitle,
          subtitle: t.monthlyExpiredSubtitle,
          cta: t.monthlyExpiredCta,
          hint: t.renewHint,
          theme: {
            gradient: "from-purple-500 to-purple-600",
            bg: "bg-purple-50",
            border: "border-purple-200",
            text: "text-purple-700",
            accent: "text-purple-600",
            icon: "text-purple-500",
          },
        };
      default:
        return {
          title: t.freeTitle,
          subtitle: t.freeSubtitle,
          cta: t.freeCta,
          hint: t.upgradeHint,
          theme: {
            gradient: "from-accent to-accent-dark",
            bg: "bg-accent/5",
            border: "border-accent/10",
            text: "text-accent",
            accent: "text-accent",
            icon: "text-accent",
          },
        };
    }
  };

  const content = getContent();

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container - 使用 flex 居中 */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal */}
        <div className="relative bg-background rounded-2xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className={`bg-gradient-to-r ${content.theme.gradient} p-6 text-white`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">{content.title}</h2>
                <p className="text-sm text-white/80">{content.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* 功能亮点 — 紧凑横排 */}
            <div className="flex flex-wrap gap-2 mb-5">
              {t.features.map((feature, index) => (
                <span key={index} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  <svg className="w-3 h-3 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </span>
              ))}
            </div>

            {/* 开通步骤 + 二维码 — 左右布局 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 flex items-center gap-4">
              {/* 左：步骤 */}
              <div className="flex-1 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.contactAdmin}</p>
                {[t.contactStep1, t.contactStep2, t.contactStep3].map((step, i) => (
                  <p key={i} className="text-sm text-slate-700">{step}</p>
                ))}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-xs text-amber-600 font-medium">{t.contactNote}</p>
                </div>
              </div>

              {/* 右：二维码 */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/qrcode-xiaohongshu.jpg"
                    alt="小红书二维码"
                    className="w-28 h-28 object-contain rounded-lg"
                  />
                </div>
                <p className="text-xs text-slate-400">@是昭乐呀</p>
              </div>
            </div>

            {/* Actions */}
            <Button variant="outline" className="w-full" onClick={onClose}>
              {t.close}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
