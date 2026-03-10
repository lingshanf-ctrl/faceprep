"use client";

interface DimensionBarProps {
  label: string;
  score: number;
  color?: "blue" | "purple" | "amber" | "emerald" | "rose";
}

const colorMap = {
  blue: {
    bar: "bg-blue-500",
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  purple: {
    bar: "bg-purple-500",
    bg: "bg-purple-100",
    text: "text-purple-700",
  },
  amber: {
    bar: "bg-amber-500",
    bg: "bg-amber-100",
    text: "text-amber-700",
  },
  emerald: {
    bar: "bg-emerald-500",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
  },
  rose: {
    bar: "bg-rose-500",
    bg: "bg-rose-100",
    text: "text-rose-700",
  },
};

export function DimensionBar({
  label,
  score,
  color = "blue",
}: DimensionBarProps) {
  const colors = colorMap[color];
  const percentage = Math.min(100, Math.max(0, score));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">{label}</span>
        <span className={`text-sm font-medium ${colors.text}`}>
          {score}分
        </span>
      </div>
      <div className={`h-2 rounded-full ${colors.bg} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
