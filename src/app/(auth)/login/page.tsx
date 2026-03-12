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
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-accent/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[100px] animate-float" style={{ animationDelay: "1s", animationDuration: "4s" }} />
      </div>

      {/* Left Side - Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent via-accent-dark to-[#000B4D] relative overflow-hidden">
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white/20 rounded-2xl backdrop-blur-sm animate-float" style={{ animationDuration: "6s" }} />
        <div className="absolute bottom-32 right-32 w-24 h-24 border-2 border-white/15 rounded-full backdrop-blur-sm animate-float" style={{ animationDuration: "5s", animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-20 w-16 h-16 bg-white/10 rounded-xl backdrop-blur-sm animate-float" style={{ animationDuration: "7s", animationDelay: "2s" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group animate-fade-in">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:bg-white/30 group-hover:shadow-glow">
              <span className="text-white font-display font-bold text-lg">{t.appShortName}</span>
            </div>
            <span className="font-display text-2xl font-semibold tracking-tight">{t.appName}</span>
          </Link>

          {/* Quote Card with Glass Morphism */}
          <div className="max-w-lg animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              {/* Decorative Quote Mark */}
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                </svg>
              </div>

              <blockquote className="text-2xl font-display font-light leading-relaxed mb-4 mt-2">
                &ldquo;{t.auth.quote.login}&rdquo;
              </blockquote>
              <p className="text-white/80 text-sm">{t.tagline}</p>
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
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
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
                  className="w-full px-5 py-4 bg-surface/50 border-2 border-border rounded-2xl text-foreground placeholder-foreground-muted
                    focus:outline-none focus:border-accent focus:bg-white focus:shadow-soft-md
                    transition-all duration-300
                    hover:border-accent/40"
                />
                <div className="absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-accent/20 ring-offset-2" />
                </div>
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
                  className="w-full px-5 py-4 pr-12 bg-surface/50 border-2 border-border rounded-2xl text-foreground placeholder-foreground-muted
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
                <div className="absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-accent/20 ring-offset-2" />
                </div>
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
              className="group relative w-full py-4 bg-accent text-white rounded-full font-semibold text-base
                transition-all duration-300 overflow-hidden
                hover:bg-accent-dark hover:shadow-glow hover:scale-[1.02]
                active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <InlineLoading />
                    <span>{locale === "zh" ? "登录中..." : "Signing in..."}</span>
                  </>
                ) : (
                  <>
                    <span>{locale === "zh" ? "登录" : "Sign In"}</span>
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-foreground-muted mt-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            {locale === "zh" ? "还没有账号？" : "Don't have an account?"}{" "}
            <Link
              href="/register"
              className="text-accent hover:text-accent-dark font-semibold transition-colors relative group"
            >
              {locale === "zh" ? "立即注册" : "Sign up"}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
            </Link>
          </p>

          {/* Decorative Elements */}
          <div className="absolute top-10 right-10 w-20 h-20 bg-accent/5 rounded-full blur-2xl animate-float hidden lg:block" />
          <div className="absolute bottom-20 left-10 w-16 h-16 bg-accent/5 rounded-2xl blur-xl animate-float hidden lg:block" style={{ animationDelay: "1s" }} />
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
