"use client";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ScoreRing({ score, size = 120, strokeWidth = 8, className = "" }: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedScore = Math.max(0, Math.min(100, score));
  const dashOffset = circumference - (clampedScore / 100) * circumference;

  const scoreColor = clampedScore >= 80 ? "#22c55e" : clampedScore >= 65 ? "#004ac6" : "#f59e0b";

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg]"
        style={{ width: size, height: size }}
      >
        {/* Background track */}
        <circle
          stroke="#e5e2e1"
          strokeWidth={strokeWidth}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        {/* Score arc */}
        <circle
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-display font-black" style={{ color: scoreColor }}>
          {clampedScore}
        </span>
      </div>
    </div>
  );
}
