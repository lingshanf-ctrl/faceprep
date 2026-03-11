"use client";

interface MembershipBadgeProps {
  type: "MONTHLY" | "CREDIT" | "FREE";
  creditsRemaining?: number | null;
  className?: string;
  onUpgrade?: () => void;
}

export function MembershipBadge({
  type,
  creditsRemaining,
  className = "",
  onUpgrade,
}: MembershipBadgeProps) {
  // 月卡用户 - 显示紫色渐变徽章
  if (type === "MONTHLY") {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm ${className}`}
      >
        会员
      </span>
    );
  }

  // 次卡用户 - 显示剩余次数
  if (type === "CREDIT" && creditsRemaining !== null && creditsRemaining !== undefined) {
    const isLow = creditsRemaining <= 3;
    return (
      <span
        className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap ${
          isLow
            ? "bg-warning/10 text-warning border-warning/20"
            : "bg-accent/10 text-accent border-accent/20"
        } ${className}`}
      >
        <span className="hidden sm:inline">剩{creditsRemaining}次</span>
        <span className="sm:hidden">{creditsRemaining}次</span>
      </span>
    );
  }

  // 免费用户 - 显示升级标签（仅展示，点击请使用下拉菜单中的按钮）
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-accent/10 text-accent border border-accent/20 ${className}`}
    >
      免费版
    </span>
  );
}
