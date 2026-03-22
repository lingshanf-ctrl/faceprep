"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { ErrorBanner } from "@/components/ui/error-banner";
import { InlineLoading } from "@/components/ui/loading-state";
import { getAnonymousId } from "@/lib/anonymous-user";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useLanguage();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 获取 redirect 参数
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  // 调试：检查匿名ID
  useEffect(() => {
    const anonId = getAnonymousId();
    console.log("[Debug Login Page] anonymousId in localStorage:", anonId);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push(redirectUrl);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-gradient">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-display font-bold">{t.appShortName}</span>
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">{t.appName}</span>
          </Link>

          {/* Quote */}
          <div className="max-w-md">
            <div className="p-8 rounded-2xl bg-white/10 border border-white/15">
              <blockquote className="text-2xl font-display font-light leading-relaxed mb-4">
                &ldquo;{t.auth.quote.login}&rdquo;
              </blockquote>
              <p className="text-white/70 text-sm">{t.tagline}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-white/60 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            © {new Date().getFullYear()} {t.appName}. {locale === "zh" ? "版权所有" : "All rights reserved"}.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-background relative">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="flex lg:hidden items-center justify-center gap-3 mb-12 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 bg-primary-gradient shadow-glow">
              <span className="text-white font-display font-bold">{t.appShortName}</span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">{t.appName}</span>
          </Link>

          {/* Header */}
          <div className="mb-10 animate-fade-up">
            <h1 className="font-display text-display-sm font-bold text-foreground tracking-tight mb-3">
              {locale === "zh" ? "欢迎回来" : "Welcome Back"}
            </h1>
            <p className="text-foreground-muted text-lg">
              {locale === "zh" ? "登录您的账号继续练习" : "Sign in to continue practicing"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                {locale === "zh" ? "邮箱" : "Email"}
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={locale === "zh" ? "请输入邮箱" : "Enter your email"}
                  required
                  className="input-stitch w-full"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                {locale === "zh" ? "密码" : "Password"}
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={locale === "zh" ? "请输入密码" : "Enter your password"}
                  required
                  className="w-full px-5 py-4 pr-12 bg-surface/50 border border-border/50 rounded-xl text-foreground placeholder-foreground-muted
                    focus:outline-none focus:border-accent focus:bg-white focus:shadow-soft-md
                    transition-all duration-300
                    hover:border-accent/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="animate-fade-in">
                <ErrorBanner message={error} variant="inline" />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 text-white rounded-xl font-semibold text-base transition-all duration-300 bg-primary-gradient shadow-glow hover:shadow-glow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <InlineLoading />
                    <span>{locale === "zh" ? "登录中..." : "Signing in..."}</span>
                  </>
                ) : (
                  <span>{locale === "zh" ? "登录" : "Sign In"}</span>
                )}
              </span>
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-foreground-muted mt-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            {locale === "zh" ? "还没有账号？" : "Don't have an account?"}{" "}
            <Link
              href="/register"
              className="text-accent hover:text-accent-dark font-semibold transition-colors"
            >
              {locale === "zh" ? "立即注册" : "Sign up"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><InlineLoading /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
