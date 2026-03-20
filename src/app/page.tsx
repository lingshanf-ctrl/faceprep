"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Mic,
  Sparkles,
  BookOpen,
  Zap,
  Target,
} from "lucide-react";

const reveal = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded bg-accent flex items-center justify-center">
                <span className="text-white text-xs font-bold font-display tracking-tight">FP</span>
              </div>
              <span className="font-display font-semibold text-foreground tracking-tight">FacePrep</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/questions"
                className="text-sm text-foreground-muted hover:text-foreground transition-colors hidden sm:block"
              >
                题库
              </Link>
              <Link
                href="/login"
                className="text-sm text-foreground-muted hover:text-foreground transition-colors hidden sm:block"
              >
                登录
              </Link>
              <Link
                href="/practice"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
              >
                开始使用 <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-32 overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #CFCFCF 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.55,
          }}
        />
        {/* Fade edges */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0) 40%, #fff 100%)",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_440px] gap-16 lg:gap-20 items-center">

            {/* Left */}
            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={reveal} custom={0} className="mb-7">
                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-accent bg-accent/8 border border-accent/15 rounded-full px-3.5 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent inline-block" />
                  AI 面试教练 · 国内可用
                </span>
              </motion.div>

              <motion.h1
                variants={reveal}
                custom={1}
                className="font-display text-5xl md:text-6xl lg:text-[4.5rem] font-bold text-foreground leading-[1.05] tracking-tight mb-8"
              >
                让面试
                <br />
                <span className="text-accent">不再焦虑</span>
              </motion.h1>

              <motion.p
                variants={reveal}
                custom={2}
                className="text-lg text-foreground-muted leading-relaxed max-w-md mb-10"
              >
                真实题库 · AI 即时反馈 · 盲点定位
                <br />
                系统性备战，陪你拿下下一个 offer。
              </motion.p>

              <motion.div
                variants={reveal}
                custom={3}
                className="flex flex-wrap gap-3 mb-10"
              >
                <Link
                  href="/practice"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
                >
                  免费开始练习
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/questions"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white border border-border px-7 text-sm font-medium text-foreground hover:border-border-hover transition-colors"
                >
                  浏览题库
                </Link>
              </motion.div>

              <motion.div
                variants={reveal}
                custom={4}
                className="flex flex-wrap items-center gap-5 text-sm text-foreground-muted"
              >
                {["免费开始", "无需注册", "国内直连"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                    {t}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — Mock Product UI */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="hidden lg:block"
            >
              <div className="bg-white rounded-2xl border border-border shadow-soft-xl overflow-hidden">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface/60">
                  <div className="h-2.5 w-2.5 rounded-full bg-error/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-success/70" />
                  <div className="ml-auto text-xs text-foreground-muted tabular-nums">FacePrep</div>
                </div>

                <div className="p-5">
                  {/* Question */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                        项目经历
                      </span>
                      <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                        中等
                      </span>
                    </div>
                    <div className="font-display text-sm font-semibold text-foreground leading-snug">
                      "介绍一个你负责过的最有挑战的项目，你是如何解决核心问题的？"
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="bg-surface rounded-xl border border-border/60 p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Mic className="h-3.5 w-3.5 text-accent" />
                      </div>
                      <div className="flex-1 space-y-2 pt-0.5">
                        <div className="h-1.5 bg-border rounded-full w-full" />
                        <div className="h-1.5 bg-border rounded-full w-5/6" />
                        <div className="h-1.5 bg-border rounded-full w-2/3" />
                        <div className="h-1.5 bg-border/50 rounded-full w-1/2" />
                      </div>
                    </div>
                  </div>

                  {/* AI Feedback */}
                  <div className="bg-accent/[0.04] rounded-xl border border-accent/10 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                        <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                          AI 评估
                        </span>
                      </div>
                      <div className="tabular-nums font-display text-2xl font-bold text-foreground">
                        78
                        <span className="text-sm font-normal text-foreground-muted ml-0.5">分</span>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: "内容完整", w: "78%" },
                        { label: "结构清晰", w: "82%" },
                        { label: "表达流畅", w: "70%" },
                        { label: "亮点突出", w: "65%" },
                      ].map(({ label, w }) => (
                        <div key={label} className="flex items-center gap-3">
                          <div className="text-xs text-foreground-muted w-16 shrink-0">{label}</div>
                          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: w }} />
                          </div>
                          <div className="tabular-nums text-xs text-foreground-muted w-7 text-right">{w}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats Band ──────────────────────────────────────── */}
      <section className="border-y border-border/60">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/50">
            {[
              { value: "150+", label: "精选面试题", sub: "覆盖各类题型" },
              { value: "5",    label: "AI 评估维度", sub: "深度量化反馈" },
              { value: "11",   label: "职能方向",   sub: "前端·后端·产品等" },
              { value: "∞",    label: "免费练习",   sub: "基础版无限次" },
            ].map(({ value, label, sub }) => (
              <div key={label} className="px-8 py-10 text-center bg-white">
                <div className="tabular-nums font-display text-4xl font-bold text-foreground mb-1">
                  {value}
                </div>
                <div className="text-sm font-semibold text-foreground mb-0.5">{label}</div>
                <div className="text-xs text-foreground-muted">{sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground-muted mb-4">
              功能
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              你需要的，<br className="md:hidden" />都在这里
            </h2>
          </motion.div>

          {/* gap-px panel grid — editorial feel */}
          <div className="grid md:grid-cols-3 gap-px bg-border/40 rounded-2xl overflow-hidden border border-border/40">
            {[
              {
                num: "01",
                Icon: BookOpen,
                title: "题库系统",
                desc: "覆盖自我介绍、项目复盘、技术深挖、行为面试，按职能方向精选分类，找准你的练习方向。",
              },
              {
                num: "02",
                Icon: Zap,
                title: "AI 即时反馈",
                desc: "每次作答获得量化得分、优点分析、改进建议和 AI 参考答案，精准深入，而非泛泛评论。",
              },
              {
                num: "03",
                Icon: Target,
                title: "盲点定位",
                desc: "多维度追踪得分趋势，精准识别短板，针对性强化，让每一分钟的练习都有价值。",
              },
            ].map(({ num, Icon, title, desc }) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4 }}
                className="bg-white p-8 md:p-10 group"
              >
                {/* Ghost number */}
                <div className="tabular-nums font-display text-6xl font-bold text-border/80 mb-6 leading-none select-none">
                  {num}
                </div>
                <div className="h-10 w-10 rounded-xl bg-accent/8 flex items-center justify-center mb-5 group-hover:bg-accent/15 transition-colors">
                  <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">{title}</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-[#FAFAFA] border-y border-border/50">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground-muted mb-4">
              流程
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              三步，系统性备战
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="border border-border/50 rounded-2xl overflow-hidden bg-white"
          >
            {[
              {
                step: "01",
                title: "选题",
                desc: "按职能方向或难度筛选，也可直接用 AI 推荐，快速定位适合你当前阶段的练习题目。",
              },
              {
                step: "02",
                title: "作答",
                desc: "文字或语音作答，模拟真实面试节奏，支持反复练习，找到最自然的表达方式。",
              },
              {
                step: "03",
                title: "复盘",
                desc: "获取多维度 AI 分析报告，精准定位改进点，形成有效的练习闭环，持续进步。",
              },
            ].map(({ step, title, desc }, i) => (
              <div
                key={step}
                className={`flex items-start gap-8 px-8 md:px-12 py-8${
                  i < 2 ? " border-b border-border/50" : ""
                }`}
              >
                <div className="tabular-nums font-display text-4xl font-bold text-accent/20 leading-none pt-0.5 w-14 shrink-0">
                  {step}
                </div>
                <div className="flex-1">
                  <div className="font-display text-lg font-semibold text-foreground mb-1.5">
                    {title}
                  </div>
                  <div className="text-sm text-foreground-muted leading-relaxed">{desc}</div>
                </div>
                <div className="hidden md:flex h-8 w-8 rounded-full border border-accent/20 items-center justify-center mt-1 shrink-0">
                  <ArrowRight className="h-3.5 w-3.5 text-accent/50" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-accent px-10 py-16 md:py-24 text-center"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40 mb-6">
              开始行动
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              下一个 offer，
              <br />
              从今天开始练。
            </h2>
            <p className="text-white/55 text-base mb-10 max-w-xs mx-auto leading-relaxed">
              免费开始，按需升级。
              <br />
              加入正在系统备战的求职者。
            </p>
            <Link
              href="/practice"
              className="inline-flex h-12 items-center gap-2.5 rounded-full bg-white px-8 text-sm font-semibold text-accent hover:bg-white/90 transition-colors"
            >
              免费开始练习
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="py-10 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded bg-accent flex items-center justify-center">
                <span className="text-white text-xs font-bold font-display">FP</span>
              </div>
              <span className="font-display font-semibold text-foreground">FacePrep</span>
            </div>
            <div className="text-sm text-foreground-muted">© 2025 FacePrep. 保留所有权利。</div>
          </div>
        </div>
      </footer>

    </main>
  );
}
