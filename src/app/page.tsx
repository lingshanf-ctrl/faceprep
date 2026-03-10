"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  Zap,
  TrendingUp,
  ArrowRight,
  Play,
  Star,
  CheckCircle2,
  Mic,
  Target,
  Award,
} from "lucide-react";

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
  },
};

// Feature card component
function FeatureCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="group relative"
    >
      <div className="relative overflow-hidden rounded-3xl bg-surface p-6 md:p-8 transition-all duration-500 hover:shadow-soft-lg border border-transparent hover:border-accent/10">
        {/* Icon */}
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 transition-transform duration-500 group-hover:scale-110 group-hover:bg-accent/20">
          <Icon className="h-7 w-7 text-accent" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <h3 className="mb-3 font-display text-xl font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-body leading-relaxed text-foreground-muted">
          {description}
        </p>

        {/* Hover accent line */}
        <div className="absolute bottom-0 left-0 h-1 w-0 bg-accent transition-all duration-500 group-hover:w-full" />
      </div>
    </motion.div>
  );
}

// Step card component
function StepCard({
  number,
  title,
  description,
  align,
  index,
}: {
  number: string;
  title: string;
  description: string;
  align: "left" | "right";
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={`flex flex-col ${
        align === "right" ? "md:flex-row-reverse" : "md:flex-row"
      } items-center gap-8 md:gap-16`}
    >
      {/* Number */}
      <div className="relative">
        <span className="font-display text-[8rem] font-bold leading-none text-accent/10 md:text-[10rem]">
          {number}
        </span>
      </div>

      {/* Content */}
      <div className={`text-center ${align === "right" ? "md:text-right" : "md:text-left"} max-w-md`}>
        <h3 className="mb-3 font-display text-2xl font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-body-lg text-foreground-muted leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// Stat item component
function StatItem({
  value,
  label,
  index,
}: {
  value: string;
  label: string;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="mb-2 font-display text-4xl font-bold text-foreground md:text-5xl">
        {value}
      </div>
      <div className="text-sm font-medium uppercase tracking-wider text-foreground-muted">
        {label}
      </div>
    </motion.div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent shadow-glow">
                <span className="font-display text-sm font-bold text-white">FP</span>
              </div>
              <span className="font-display text-lg font-semibold text-foreground hidden sm:block">
                FacePrep
              </span>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:block text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
              >
                登录
              </Link>
              <Link
                href="/practice"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-white shadow-glow hover:bg-accent-dark hover:shadow-glow-lg transition-all"
              >
                开始使用
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left content */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div
                variants={fadeUp}
                custom={0}
                className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-4 py-2 mb-8"
              >
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-accent">
                  AI 驱动的面试练习
                </span>
              </motion.div>

              {/* Heading */}
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight mb-6"
              >
                掌控你的
                <br />
                <span className="text-accent">面试表现</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-body-lg text-foreground-muted max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed"
              >
                为求职者打造的智能面试准备平台。通过 AI 反馈、精选题库和进度追踪，助你拿下理想工作。
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
              >
                <Link
                  href="/practice"
                  className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-8 text-base font-semibold text-white shadow-glow hover:bg-accent-dark hover:shadow-glow-lg hover:scale-[1.02] transition-all"
                >
                  开始练习
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/questions"
                  className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-full bg-surface border border-border px-8 text-base font-medium text-foreground hover:bg-accent/5 hover:border-accent/20 transition-all"
                >
                  <Play className="h-4 w-4" />
                  浏览题库
                </Link>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                variants={fadeUp}
                custom={4}
                className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-sm text-foreground-muted"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>免费开始</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>无需信用卡</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right content - Visual */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main card */}
                <div className="relative bg-surface rounded-3xl border border-border p-6 shadow-soft-xl">
                  {/* Card header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-3 w-3 rounded-full bg-error" />
                    <div className="h-3 w-3 rounded-full bg-warning" />
                    <div className="h-3 w-3 rounded-full bg-success" />
                  </div>

                  {/* Question preview */}
                  <div className="mb-6">
                    <div className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2">
                      项目经历
                    </div>
                    <div className="font-display text-lg font-semibold text-foreground">
                      "介绍一个你做过的最有挑战的项目"
                    </div>
                  </div>

                  {/* Answer area */}
                  <div className="bg-background rounded-2xl border border-border p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Mic className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-2 bg-border rounded w-full" />
                        <div className="h-2 bg-border rounded w-3/4" />
                        <div className="h-2 bg-border rounded w-1/2" />
                      </div>
                    </div>
                  </div>

                  {/* AI Feedback preview */}
                  <div className="bg-accent/5 rounded-2xl border border-accent/10 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <span className="text-sm font-semibold text-accent">AI 反馈</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">78</div>
                        <div className="text-xs text-foreground-muted">综合得分</div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-accent rounded-full" />
                        </div>
                        <div className="text-xs text-foreground-muted">内容完整度</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-soft-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">+24%</div>
                      <div className="text-xs text-foreground-muted">本周提升</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-soft-lg border border-border p-4"
                >
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-accent" />
                    <span className="text-sm font-medium text-foreground">连续 7 天练习</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-20 border-y border-border bg-surface/50">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
          >
            <StatItem value="100+" label="精选题目" index={0} />
            <StatItem value="AI" label="智能反馈" index={1} />
            <StatItem value="24/7" label="随时练习" index={2} />
            <StatItem value="免费" label="开始使用" index={3} />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 md:mb-20"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              一切所需，尽在掌握
            </h2>
            <p className="text-body-lg text-foreground-muted max-w-2xl mx-auto">
              完整的面试准备工具箱，助你从容应对每一次机会
            </p>
          </motion.div>

          {/* Feature grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={BookOpen}
              title="精选题库"
              description="100+ 道精选面试题，覆盖技术、行为、项目经历等全类型"
              index={0}
            />
            <FeatureCard
              icon={Zap}
              title="AI 反馈"
              description="即时获得详细分析和可操作的改进建议，快速提升回答质量"
              index={1}
            />
            <FeatureCard
              icon={Target}
              title="进度追踪"
              description="可视化你的成长轨迹，精准识别薄弱环节，针对性突破"
              index={2}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 md:py-32 bg-surface/50">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              三步走向成功
            </h2>
            <p className="text-body-lg text-foreground-muted">
              简单高效的练习流程，让进步看得见
            </p>
          </motion.div>

          {/* Steps */}
          <div className="space-y-16 md:space-y-24">
            <StepCard
              number="01"
              title="选择题库"
              description="浏览精选题库或获取智能推荐，找到最适合你的练习题目，模拟真实面试场景"
              align="left"
              index={0}
            />
            <StepCard
              number="02"
              title="练习回答"
              description="思考并组织你的回答，支持语音输入，就像在真实面试中一样自然表达"
              align="right"
              index={1}
            />
            <StepCard
              number="03"
              title="获取 AI 反馈"
              description="接收多维度分析，包括综合得分、优点总结和具体改进建议，持续精进"
              align="left"
              index={2}
            />
          </div>
        </div>
      </section>

      {/* Testimonials / Trust */}
      <section className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              用户怎么说
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "通过 FacePrep 的练习，我在字节跳动的面试中表现出色，成功拿到了offer！",
                author: "张明",
                role: "前端工程师",
              },
              {
                quote: "AI 反馈非常实用，帮我发现了自己回答中的很多问题，进步很明显。",
                author: "李雪",
                role: "产品经理",
              },
              {
                quote: "每天练习30分钟，一个月后面试信心大增。现在已经入职心仪的公司了！",
                author: "王鹏",
                role: "后端开发",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                custom={index}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-surface rounded-3xl p-6 md:p-8 border border-border"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-foreground-muted">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-accent p-8 md:p-16 text-center"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            </div>

            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6">
                准备好拿下
                <br />
                下一场面试了吗？
              </h2>
              <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
                加入数千名通过 FacePrep 提升面试技能的求职者，开启你的成功之路
              </p>
              <Link
                href="/practice"
                className="inline-flex h-14 items-center gap-3 rounded-full bg-white px-10 text-base font-semibold text-accent shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                免费开始练习
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                <span className="font-display text-sm font-bold text-white">FP</span>
              </div>
              <span className="font-display font-semibold text-foreground">FacePrep</span>
            </div>
            <div className="text-sm text-foreground-muted">
              © 2025 FacePrep. 保留所有权利。
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
