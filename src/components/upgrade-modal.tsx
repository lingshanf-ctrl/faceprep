"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/language-provider";
import { Check, X, Zap, Shield, Users, Sparkles } from "lucide-react";

type UserType = "free" | "credit_exhausted" | "monthly_expired" | "renew";
type PlanTab = "credit" | "monthly";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: UserType;
  creditsRemaining?: number | null;
  monthlyExpiresAt?: Date | null;
}

const translations = {
  zh: {
    badge: "已有 50,000+ 求职者在使用",
    freeTitle: "FacePrep Pro 会员",
    freeSubtitle: "开启 AI 深度分析，系统性了解自己的面试表现与改进方向",
    creditExhaustedTitle: "AI 分析次数已用完",
    creditExhaustedSubtitle: "续费后即可继续获取深度反馈，查看每次练习的详细分析报告",
    monthlyExpiredTitle: "月卡会员已到期",
    monthlyExpiredSubtitle: "续费后继续享受不限次 AI 深度分析与全部 Pro 功能",
    renewTitle: "续费 Pro 会员",
    renewSubtitle: "提前续费，会员权益无缝延续，不中断使用体验",
    compareTitle: "功能对比",
    freePlan: "免费版",
    proPlan: "Pro",
    features: [
      { label: "题库练习", free: true },
      { label: "基础答题记录", free: true },
      { label: "AI 深度评分", free: false },
      { label: "四维能力评估", free: false },
      { label: "差距分析定位", free: false },
      { label: "AI 优化答案示例", free: false },
      { label: "个性化改进建议", free: false },
      { label: "教练寄语", free: false },
    ],
    creditTab: "次卡",
    monthlyTab: "月卡",
    bestValue: "推荐",
    creditPrice: "¥9.9",
    creditUnit: "/ 10次",
    creditDesc: "灵活按需，用完再购",
    creditHighlight: "早鸟体验价",
    monthlyPrice: "¥19.9",
    monthlyUnit: "/ 月",
    monthlyDesc: "不限次数，畅享全部 Pro 功能",
    monthlyHighlight: "早鸟价 ¥9.9 限时开放",
    scanTitle: "扫码前往小红书店铺下单",
    step1: "扫描下方二维码",
    step2: "在小红书店铺选购早鸟套餐",
    step3: "下单后备注栏会收到激活链接",
    urgency: "早鸟体验价 ¥9.9，限时开放",
    secureText: "安全支付，隐私保护",
    close: "暂不需要",
  },
  en: {
    badge: "50,000+ job seekers using FacePrep",
    freeTitle: "FacePrep Pro",
    freeSubtitle: "Access AI-powered deep analysis to understand your interview performance and where to improve",
    creditExhaustedTitle: "Analysis Credits Used Up",
    creditExhaustedSubtitle: "Top up to continue receiving detailed AI feedback on your practice sessions",
    monthlyExpiredTitle: "Monthly Plan Expired",
    monthlyExpiredSubtitle: "Renew to continue unlimited AI analysis and all Pro features",
    renewTitle: "Renew Pro Membership",
    renewSubtitle: "Renew early to extend your benefits without any interruption",
    compareTitle: "Feature Comparison",
    freePlan: "Free",
    proPlan: "Pro",
    features: [
      { label: "Question Bank", free: true },
      { label: "Practice History", free: true },
      { label: "AI Deep Scoring", free: false },
      { label: "4-Dimension Assessment", free: false },
      { label: "Gap Analysis", free: false },
      { label: "AI-Optimized Answers", free: false },
      { label: "Personalized Suggestions", free: false },
      { label: "Coach Message", free: false },
    ],
    creditTab: "Credits",
    monthlyTab: "Monthly",
    bestValue: "Popular",
    creditPrice: "¥9.9",
    creditUnit: "/ 10 uses",
    creditDesc: "Flexible, pay as you go",
    creditHighlight: "Early bird price",
    monthlyPrice: "¥19.9",
    monthlyUnit: "/ mo",
    monthlyDesc: "Unlimited AI analysis, all Pro features",
    monthlyHighlight: "Early bird ¥9.9 — limited time",
    scanTitle: "Order via Xiaohongshu",
    step1: "Scan the QR code below",
    step2: "Select the early bird plan on Xiaohongshu",
    step3: "Activation link will be sent in your order notes",
    urgency: "Early bird price ¥9.9 — limited time",
    secureText: "Secure checkout, privacy protected",
    close: "Maybe Later",
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
  const [selectedPlan, setSelectedPlan] = useState<PlanTab>("monthly");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const getTitle = () => {
    switch (userType) {
      case "credit_exhausted": return t.creditExhaustedTitle;
      case "monthly_expired": return t.monthlyExpiredTitle;
      case "renew": return t.renewTitle;
      default: return t.freeTitle;
    }
  };

  const getSubtitle = () => {
    switch (userType) {
      case "credit_exhausted": return t.creditExhaustedSubtitle;
      case "monthly_expired": return t.monthlyExpiredSubtitle;
      case "renew": return t.renewSubtitle;
      default: return t.freeSubtitle;
    }
  };

  const planData = selectedPlan === "monthly"
    ? { price: t.monthlyPrice, unit: t.monthlyUnit, desc: t.monthlyDesc, highlight: t.monthlyHighlight }
    : { price: t.creditPrice, unit: t.creditUnit, desc: t.creditDesc, highlight: t.creditHighlight };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[720px] overflow-hidden">

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header — Klein Blue */}
          <div className="bg-[#004ac6] px-7 pt-7 pb-6 relative overflow-hidden">
            {/* Subtle dot grid */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            {/* Soft glow */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-white/90 text-xs font-medium px-3 py-1 rounded-full mb-4">
                <Users className="w-3 h-3" />
                {t.badge}
              </div>
              <h2 className="font-display text-2xl font-extrabold text-white tracking-tight mb-1.5">
                {getTitle()}
              </h2>
              <p className="text-sm text-white/70 leading-relaxed max-w-lg">
                {getSubtitle()}
              </p>
            </div>
          </div>

          {/* Body — two columns */}
          <div className="flex flex-col md:flex-row">

            {/* Left: Feature comparison */}
            <div className="flex-1 px-7 py-6 border-b md:border-b-0 md:border-r border-[#eae7e7]">
              <p className="text-[11px] font-semibold text-[#5f5e5e] uppercase tracking-wider mb-4">
                {t.compareTitle}
              </p>

              {/* Column headers */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-5 mb-2 px-1">
                <span />
                <span className="text-xs font-medium text-[#5f5e5e] w-10 text-center">{t.freePlan}</span>
                <span className="text-xs font-bold text-[#004ac6] w-10 text-center">{t.proPlan}</span>
              </div>

              <div className="space-y-0.5">
                {t.features.map((feature, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[1fr_auto_auto] gap-x-5 items-center px-2 py-2.5 rounded-lg ${
                      !feature.free ? "bg-[#eef1ff]/40" : ""
                    }`}
                  >
                    <span className={`text-sm ${feature.free ? "text-[#5f5e5e]" : "text-[#1c1b1b] font-medium"}`}>
                      {feature.label}
                    </span>
                    <span className="w-10 flex justify-center">
                      {feature.free
                        ? <Check className="w-4 h-4 text-[#5f5e5e]" />
                        : <X className="w-3.5 h-3.5 text-[#c3c6d7]" />
                      }
                    </span>
                    <span className="w-10 flex justify-center">
                      <Check className="w-4 h-4 text-[#004ac6]" strokeWidth={2.5} />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Purchase panel */}
            <div className="w-full md:w-[280px] px-6 py-6 flex flex-col gap-4 shrink-0">

              {/* Plan toggle */}
              <div className="flex bg-[#f6f3f2] rounded-xl p-1 gap-1">
                {(["credit", "monthly"] as PlanTab[]).map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      selectedPlan === plan
                        ? "bg-white text-[#1c1b1b] shadow-sm"
                        : "text-[#5f5e5e] hover:text-[#1c1b1b]"
                    }`}
                  >
                    {plan === "monthly" && selectedPlan === "monthly" && (
                      <Sparkles className="w-3 h-3 text-[#004ac6]" />
                    )}
                    {plan === "credit" ? t.creditTab : t.monthlyTab}
                    {plan === "monthly" && (
                      <span className="bg-[#004ac6] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {t.bestValue}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Price display */}
              <div className="bg-[#f6f3f2] rounded-xl px-4 py-3.5">
                <div className="flex items-baseline gap-1 mb-0.5">
                  <span className="text-3xl font-extrabold text-[#1c1b1b] font-display">{planData.price}</span>
                  <span className="text-sm text-[#5f5e5e]">{planData.unit}</span>
                </div>
                <p className="text-xs text-[#5f5e5e] mb-2.5">{planData.desc}</p>
                <div className="inline-flex items-center gap-1 bg-[#004ac6]/10 text-[#004ac6] text-xs font-semibold px-2.5 py-1 rounded-full">
                  <Zap className="w-3 h-3" />
                  {planData.highlight}
                </div>
              </div>

              {/* QR + Steps */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-[#5f5e5e] uppercase tracking-wider">
                  {t.scanTitle}
                </p>
                <div className="flex gap-3 items-start">
                  {/* QR code */}
                  <div className="bg-white rounded-xl p-1.5 border border-[#eae7e7] shadow-sm shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/qrcode-xiaohongshu.jpg"
                      alt="小红书二维码"
                      className="w-[72px] h-[72px] object-contain rounded-lg"
                    />
                  </div>
                  {/* Steps */}
                  <div className="space-y-2 flex-1 min-w-0">
                    {[t.step1, t.step2, t.step3].map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-[#004ac6]/10 text-[#004ac6] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs text-[#5f5e5e] leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Urgency badge */}
                <div className="flex items-center gap-2 bg-[#eef1ff] border border-[#c5d0f5] rounded-lg px-3 py-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#004ac6] animate-pulse shrink-0" />
                  <p className="text-xs text-[#004ac6] font-medium">{t.urgency}</p>
                </div>
              </div>

              {/* Security + Close */}
              <div className="flex flex-col gap-2 mt-auto pt-1">
                <div className="flex items-center justify-center gap-1.5 text-[#5f5e5e]">
                  <Shield className="w-3 h-3" />
                  <span className="text-xs">{t.secureText}</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-2 text-sm font-medium text-[#5f5e5e] hover:text-[#1c1b1b] border border-[#eae7e7] rounded-xl hover:bg-[#f6f3f2] transition-colors"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
