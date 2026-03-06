"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getPracticeRecords, getStats, PracticeRecord } from "@/lib/practice-store";
import { getInterviewSessions, getInterviewStats, InterviewSession } from "@/lib/interview-store";

const translations = {
  zh: {
    history: {
      title: "学习历史",
      subtitle: "追踪你的进步轨迹，见证成长的力量",
      stats: {
        practices: "练习次数",
        average: "平均分",
        best: "最高分",
        streak: "连续天数",
      },
      growthCurve: "成长曲线",
      skillAnalysis: "能力分析",
      unlockAnalysis: "再练习几次，解锁能力分析",
      practiceRecords: "练习记录",
      empty: {
        title: "还没有练习记录",
        desc: "开始你的第一次练习，开启成长之旅",
        button: "开始练习",
      },
    },
  },
  en: {
    history: {
      title: "Learning History",
      subtitle: "Track your progress and witness the power of growth",
      stats: {
        practices: "Practices",
        average: "Average",
        best: "Best",
        streak: "Streak",
      },
      growthCurve: "Growth Curve",
      skillAnalysis: "Skill Analysis",
      unlockAnalysis: "Practice a few more times to unlock skill analysis",
      practiceRecords: "Practice Records",
      empty: {
        title: "No practice records yet",
        desc: "Start your first practice and begin your growth journey",
        button: "Start Practice",
      },
    },
  },
};

// Growth Chart Component
function GrowthChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  });

  const pathData = points.join(" ");

  return (
    <svg viewBox="0 0 100 100" className="w-full h-32 overflow-visible" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        points={pathData}
        className="text-accent"
        vectorEffect="non-scaling-stroke"
      />
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="1.5"
            className="fill-accent"
          />
        );
      })}
    </svg>
  );
}

// Ability Radar Component
function AbilityRadar({ abilities }: { abilities: { name: string; value: number }[] }) {
  const size = 200;
  const center = size / 2;
  const radius = 70;
  const angleStep = (Math.PI * 2) / abilities.length;

  const points = abilities.map((ability, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (ability.value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  });

  const pathData = points
    .map((p, index) => `${index === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ") + " Z";

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-40">
      {/* Background grid */}
      {[0.2, 0.4, 0.6, 0.8, 1].map((level) => (
        <polygon
          key={level}
          points={abilities
            .map((_, index) => {
              const angle = index * angleStep - Math.PI / 2;
              const r = level * radius;
              return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
            })
            .join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-border"
        />
      ))}

      {/* Data area */}
      <path
        d={pathData}
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
        className="text-accent"
      />

      {/* Labels */}
      {abilities.map((ability, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const labelRadius = radius + 20;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        return (
          <text
            key={ability.name}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground-muted text-xs"
          >
            {ability.name}
          </text>
        );
      })}
    </svg>
  );
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-rose-500";
}

function formatDateLabel(dateStr: string, locale: string, t: any) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return locale === "zh" ? "今天" : "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return locale === "zh" ? "昨天" : "Yesterday";
  } else {
    return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

// Virtual Practice Records Component
function VirtualPracticeRecords({
  records,
  groupedRecords,
  t,
  locale,
}: {
  records: PracticeRecord[];
  groupedRecords: { date: string; label: string; records: PracticeRecord[] }[];
  t: any;
  locale: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Flatten records for virtualization
  const flattenedItems = useMemo(() => {
    const items: Array<{ type: "header"; label: string; date: string } | { type: "record"; record: PracticeRecord }> = [];
    groupedRecords.forEach((group) => {
      items.push({ type: "header", label: group.label, date: group.date });
      group.records.forEach((record) => {
        items.push({ type: "record", record });
      });
    });
    return items;
  }, [groupedRecords]);

  const virtualizer = useVirtualizer({
    count: flattenedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // 估计每项高度
    overscan: 5, // 预渲染5项
  });

  const virtualItems = virtualizer.getVirtualItems();

  // 如果记录少于20条，不使用虚拟列表
  if (records.length < 20) {
    return (
      <div>
        <h3 className="font-display text-heading-xl font-semibold text-foreground mb-8">{t.history.practiceRecords}</h3>
        <div className="space-y-8">
          {groupedRecords.map((group) => (
            <div key={group.date}>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-small font-medium text-foreground-muted uppercase tracking-wider">{group.label}</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              <div className="space-y-3">
                {group.records.map((record) => (
                  <Link
                    key={record.id}
                    href={`/practice/review/${record.id}`}
                    className="block bg-surface rounded-2xl p-5 hover:bg-accent/5 border border-border hover:border-accent/10 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground group-hover:text-accent transition-colors truncate">
                          {record.questionTitle}
                        </h4>
                        <p className="text-small text-foreground-muted mt-1 line-clamp-1">{record.answer.slice(0, 80)}...</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-display text-heading-xl font-bold ${getScoreColor(record.score)}`}>
                          {record.score}
                        </span>
                        <svg className="w-5 h-5 text-foreground-muted group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display text-heading-xl font-semibold text-foreground mb-8">
        {t.history.practiceRecords}
        <span className="ml-2 text-sm font-normal text-foreground-muted">({records.length} 条记录)</span>
      </h3>
      <div ref={parentRef} className="h-[600px] overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualItem) => {
            const item = flattenedItems[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {item.type === "header" ? (
                  <div className="flex items-center gap-4 mb-4 mt-6 first:mt-0">
                    <span className="text-small font-medium text-foreground-muted uppercase tracking-wider">{item.label}</span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                ) : (
                  <Link
                    href={`/practice/review/${item.record.id}`}
                    className="block bg-surface rounded-2xl p-5 hover:bg-accent/5 border border-border hover:border-accent/10 transition-all group mb-3"
                  >
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground group-hover:text-accent transition-colors truncate">
                          {item.record.questionTitle}
                        </h4>
                        <p className="text-small text-foreground-muted mt-1 line-clamp-1">{item.record.answer.slice(0, 80)}...</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-display text-heading-xl font-bold ${getScoreColor(item.record.score)}`}>
                          {item.record.score}
                        </span>
                        <svg className="w-5 h-5 text-foreground-muted group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Practice History Component
function PracticeHistory({ locale, t }: { locale: string; t: any }) {
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [stats, setStats] = useState({
    totalPractices: 0,
    averageScore: 0,
    highestScore: 0,
    recentTrend: [] as number[],
    categoryScores: [] as { category: string; avgScore: number; count: number }[],
    streak: 0,
  });
  useEffect(() => {
    async function loadData() {
      const [allRecords, statsData] = await Promise.all([
        getPracticeRecords(),
        getStats(),
      ]);
      setRecords(allRecords);
      setStats(statsData);
    }
    loadData();
  }, []);

  const groupedRecords = useMemo(() => {
    const groups: { date: string; label: string; records: PracticeRecord[] }[] = [];
    records.forEach((record) => {
      const recordDate = new Date(record.createdAt).toDateString();
      let label = formatDateLabel(record.createdAt, locale, t);
      const existingGroup = groups.find((g) => g.date === recordDate);
      if (existingGroup) {
        existingGroup.records.push(record);
      } else {
        groups.push({ date: recordDate, label, records: [record] });
      }
    });
    return groups;
  }, [records, locale, t]);

  const abilities = useMemo(() => {
    // 如果有分类统计数据，使用真实数据
    if (stats.categoryScores && stats.categoryScores.length > 0) {
      // 将分类映射到能力维度
      const categoryMap: Record<string, { zh: string; en: string }> = {
        FRONTEND: { zh: "前端", en: "Frontend" },
        BACKEND: { zh: "后端", en: "Backend" },
        PRODUCT: { zh: "产品", en: "Product" },
        DESIGN: { zh: "设计", en: "Design" },
        OPERATION: { zh: "运营", en: "Operation" },
        GENERAL: { zh: "通用", en: "General" },
      };

      // 取前4个分类，或填充到4个
      const mapped = stats.categoryScores.slice(0, 4).map((cat) => ({
        name: locale === "zh" ? categoryMap[cat.category]?.zh : categoryMap[cat.category]?.en,
        value: cat.avgScore,
      }));

      // 如果不足4个，用默认值填充
      while (mapped.length < 4) {
        mapped.push({
          name: locale === "zh" ? `维度${mapped.length + 1}` : `Dim${mapped.length + 1}`,
          value: stats.averageScore || 60,
        });
      }

      return mapped;
    }

    // 无数据时使用默认平均分
    const avgScore = stats.averageScore || 60;
    return [
      { name: locale === "zh" ? "内容" : "Content", value: avgScore },
      { name: locale === "zh" ? "结构" : "Structure", value: avgScore },
      { name: locale === "zh" ? "逻辑" : "Logic", value: avgScore },
      { name: locale === "zh" ? "表达" : "Expression", value: avgScore },
    ];
  }, [stats.categoryScores, stats.averageScore, locale]);

  const improvement = useMemo(() => {
    if (stats.recentTrend.length < 2) return null;
    const first = stats.recentTrend[0];
    const last = stats.recentTrend[stats.recentTrend.length - 1];
    return last - first;
  }, [stats.recentTrend]);

  if (records.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h3 className="font-display text-heading-xl font-semibold text-foreground mb-3">{t.history.empty.title}</h3>
        <p className="text-foreground-muted mb-8 max-w-sm mx-auto">{t.history.empty.desc}</p>
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-medium hover:bg-accent-dark transition-all hover:shadow-glow"
        >
          {t.history.empty.button}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-surface rounded-2xl p-6 text-center border border-border">
          <div className="font-display text-display font-bold text-foreground">{stats.totalPractices}</div>
          <div className="text-small text-foreground-muted mt-2 uppercase tracking-wider">{t.history.stats.practices}</div>
        </div>
        <div className="bg-surface rounded-2xl p-6 text-center border border-border">
          <div className={`font-display text-display font-bold ${getScoreColor(stats.averageScore)}`}>
            {stats.averageScore}
          </div>
          <div className="text-small text-foreground-muted mt-2 uppercase tracking-wider">{t.history.stats.average}</div>
        </div>
        <div className="bg-surface rounded-2xl p-6 text-center border border-border">
          <div className="font-display text-display font-bold text-success">{stats.highestScore}</div>
          <div className="text-small text-foreground-muted mt-2 uppercase tracking-wider">{t.history.stats.best}</div>
        </div>
        <div className="bg-surface rounded-2xl p-6 text-center border border-border">
          <div className="font-display text-display font-bold text-foreground flex items-center justify-center gap-2">
            {stats.streak}
            {stats.streak > 0 && <span className="text-2xl">🔥</span>}
          </div>
          <div className="text-small text-foreground-muted mt-2 uppercase tracking-wider">{t.history.stats.streak}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-16">
        {/* Growth curve */}
        <div className="bg-surface rounded-2xl p-8 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-heading font-semibold text-foreground">{t.history.growthCurve}</h3>
            {improvement !== null && (
              <span className={`text-sm font-medium ${improvement >= 0 ? "text-success" : "text-error"}`}>
                {improvement >= 0 ? "↑" : "↓"} {Math.abs(improvement)} pts
              </span>
            )}
          </div>
          {stats.recentTrend.length >= 2 ? (
            <>
              <GrowthChart data={stats.recentTrend} />
              <div className="flex justify-between text-sm text-foreground-muted mt-4">
                <span>{locale === "zh" ? "首次" : "First"}</span>
                <span>{locale === "zh" ? "最新" : "Latest"}</span>
              </div>
            </>
          ) : (
            <div className="h-32 flex items-center justify-center text-foreground-muted">
              {locale === "zh" ? "多练习几次，查看你的成长曲线" : "Practice a few more times to see your growth curve"}
            </div>
          )}
        </div>

        {/* Ability radar */}
        <div className="bg-surface rounded-2xl p-8 border border-border">
          <h3 className="font-display text-heading font-semibold text-foreground mb-6">{t.history.skillAnalysis}</h3>
          {stats.totalPractices >= 3 ? (
            <AbilityRadar abilities={abilities} />
          ) : (
            <div className="h-40 flex items-center justify-center text-foreground-muted">{t.history.unlockAnalysis}</div>
          )}
        </div>
      </div>

      {/* Practice Records with Virtual List */}
      <VirtualPracticeRecords
        records={records}
        groupedRecords={groupedRecords}
        t={t}
        locale={locale}
      />
    </>
  );
}

// Interview History Component
function InterviewHistory({ locale }: { locale: string }) {
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);
  const [interviewStats, setInterviewStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    bestScore: 0,
  });

  useEffect(() => {
    setInterviewSessions(getInterviewSessions());
    setInterviewStats(getInterviewStats());
  }, []);

  const completedSessions = interviewSessions.filter((s) => s.status === "completed");

  if (completedSessions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-foreground-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="font-display text-heading-xl font-semibold text-foreground mb-3">
          {locale === "zh" ? "还没有面试记录" : "No interviews yet"}
        </h3>
        <p className="text-foreground-muted mb-8 max-w-sm mx-auto">
          {locale === "zh"
            ? "去练习页面生成一套面试题，开始你的第一次完整面试吧！"
            : "Go to Practice to generate interview questions and start your first full interview!"}
        </p>
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-medium hover:bg-accent-dark transition-all hover:shadow-glow"
        >
          {locale === "zh" ? "去生成面试题" : "Generate Questions"}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Interview Stats */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        <div className="bg-surface rounded-2xl p-6 text-center border border-border">
          <div className="font-display text-display font-bold text-foreground">{interviewStats.totalInterviews}</div>
          <div className="text-small text-foreground-muted mt-2 uppercase tracking-wider">
            {locale === "zh" ? "面试次数" : "Interviews"}
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-6 text-center border border-border">
          <div className={`font-display text-display font-bold ${getScoreColor(interviewStats.averageScore)}`}>
            {interviewStats.averageScore}
          </div>
          <div className="text-small text-foreground-muted mt-2 uppercase tracking-wider">
            {locale === "zh" ? "平均分" : "Average"}
          </div>
        </div>
        <div className="bg-surface rounded-2xl p-6 text-center border border-border">
          <div className="font-display text-display font-bold text-success">{interviewStats.bestScore}</div>
          <div className="text-small text-foreground-muted mt-2 uppercase tracking-wider">
            {locale === "zh" ? "最高分" : "Best"}
          </div>
        </div>
      </div>

      {/* Interview List */}
      <div className="space-y-4">
        {completedSessions.map((session) => (
          <Link
            key={session.id}
            href={`/interview/${session.id}/report`}
            className="block bg-surface rounded-2xl p-6 hover:bg-accent/5 border border-border hover:border-accent/10 transition-all group"
          >
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <h4 className="font-display text-heading font-semibold text-foreground group-hover:text-accent transition-colors">
                  {session.title}
                </h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-foreground-muted">
                  <span>{new Date(session.completedAt || "").toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")}</span>
                  <span>•</span>
                  <span>
                    {session.questions.length} {locale === "zh" ? "道题" : "questions"}
                  </span>
                  {session.jobInfo.company && (
                    <>
                      <span>•</span>
                      <span>{session.jobInfo.company}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={`font-display text-heading-xl font-bold ${getScoreColor(session.overallScore)}`}>
                    {session.overallScore}
                  </span>
                  <div className="text-xs text-foreground-muted">{locale === "zh" ? "总分" : "Total"}</div>
                </div>
                <svg className="w-5 h-5 text-foreground-muted group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Dimension Scores Preview */}
            <div className="flex gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-foreground-muted">{locale === "zh" ? "技术" : "Tech"}</span>
                <span className="font-medium">{session.dimensionScores.technical}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-foreground-muted">{locale === "zh" ? "项目" : "Project"}</span>
                <span className="font-medium">{session.dimensionScores.project}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-foreground-muted">{locale === "zh" ? "行为" : "Behavior"}</span>
                <span className="font-medium">{session.dimensionScores.behavioral}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-foreground-muted">{locale === "zh" ? "沟通" : "Comm"}</span>
                <span className="font-medium">{session.dimensionScores.communication}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

// Main History Page
export default function HistoryPage() {
  const { locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<"practice" | "interview">("practice");
  const [mounted, setMounted] = useState(false);

  const t = translations[locale === "zh" ? "zh" : "en"];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="animate-pulse">
            <div className="h-12 bg-surface rounded-lg w-48 mb-4"></div>
            <div className="h-5 bg-surface rounded w-64 mb-10"></div>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="h-56 bg-surface rounded-2xl"></div>
              <div className="h-56 bg-surface rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-display text-display-sm font-bold text-foreground tracking-tight mb-4">{t.history.title}</h1>
          <p className="text-body-lg text-foreground-muted">{t.history.subtitle}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-surface rounded-xl mb-12 w-fit">
          <button
            onClick={() => setActiveTab("practice")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === "practice" ? "bg-foreground text-white" : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {locale === "zh" ? "练习历史" : "Practice History"}
          </button>
          <button
            onClick={() => setActiveTab("interview")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === "interview" ? "bg-foreground text-white" : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {locale === "zh" ? "面试历史" : "Interview History"}
          </button>
        </div>

        {/* Content */}
        {activeTab === "practice" ? <PracticeHistory locale={locale} t={t} /> : <InterviewHistory locale={locale} />}
      </div>
    </div>
  );
}
