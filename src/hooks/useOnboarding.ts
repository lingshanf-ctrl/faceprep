// 首次使用引导 Hook

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "job-pilot-onboarding-completed";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "欢迎使用 JobPilot",
    description: "这是你的面试练习助手，让我们一起开始准备面试吧！",
  },
  {
    id: "practice",
    title: "开始练习",
    description: "选择题目开始练习，AI 会为你的回答打分并给出建议。",
    targetSelector: "[data-tour='practice']",
    position: "bottom",
  },
  {
    id: "interview",
    title: "模拟面试",
    description: "进入模拟面试模式，体验真实的面试场景。",
    targetSelector: "[data-tour='interview']",
    position: "bottom",
  },
  {
    id: "progress",
    title: "查看进度",
    description: "在这里查看你的练习统计和进步曲线。",
    targetSelector: "[data-tour='progress']",
    position: "right",
  },
];

export function useOnboarding(steps: OnboardingStep[] = DEFAULT_STEPS) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(true);

  // 检查是否已完成引导
  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (!completed) {
        setHasCompleted(false);
        setIsOpen(true);
      }
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const skipOnboarding = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsOpen(false);
    setHasCompleted(true);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const restartOnboarding = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    currentStep,
    totalSteps: steps.length,
    stepData: steps[currentStep],
    hasCompleted,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
    restartOnboarding,
  };
}
