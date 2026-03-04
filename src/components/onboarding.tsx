"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, ChevronLeft, X, Target, MessageSquare, TrendingUp } from "lucide-react";

const steps = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "欢迎来到 FacePrep",
    description: "你的 AI 面试练习助手，帮助你系统化准备面试，提升面试表现。",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "practice",
    icon: Target,
    title: "智能练习",
    description: "选择题库中的面试题进行练习，AI 会实时为你的回答打分，并给出具体的改进建议。",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "interview",
    icon: MessageSquare,
    title: "模拟面试",
    description: "进入模拟面试模式，体验真实的面试场景。系统会生成完整的面试报告。",
    color: "from-purple-500 to-violet-600",
  },
  {
    id: "progress",
    icon: TrendingUp,
    title: "追踪进步",
    description: "查看练习统计数据，了解自己的能力提升轨迹。连续练习还能获得成就徽章！",
    color: "from-orange-500 to-red-600",
  },
];

export function Onboarding() {
  const [mounted, setMounted] = useState(false);
  const {
    isOpen,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipOnboarding,
  } = useOnboarding(steps);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={skipOnboarding}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={skipOnboarding}
            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-accent-light"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="pt-12 pb-8 px-8">
            {/* Icon */}
            <motion.div
              key={step.id}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
            >
              <Icon className="w-10 h-10 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h2
              key={`title-${step.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-center text-gray-900 mb-3"
            >
              {step.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              key={`desc-${step.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center text-gray-600 leading-relaxed mb-8"
            >
              {step.description}
            </motion.p>

            {/* Step indicators */}
            <div className="flex justify-center gap-2 mb-8">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-accent w-6"
                      : index < currentStep
                      ? "bg-accent/50"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {!isFirst && (
                <button
                  onClick={prevStep}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  上一步
                </button>
              )}
              <button
                onClick={nextStep}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all hover:shadow-lg"
              >
                {isLast ? "开始使用" : "下一步"}
                {!isLast && <ChevronRight className="w-5 h-5" />}
              </button>
            </div>

            {/* Skip button */}
            {isFirst && (
              <button
                onClick={skipOnboarding}
                className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                跳过引导
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
