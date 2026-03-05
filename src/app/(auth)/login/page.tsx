"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function LoginPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    // 验证手机号
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError("请输入正确的手机号");
      return;
    }

    setIsSendingCode(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "发送失败，请重试");
      } else {
        setCountdown(60); // 60秒倒计时
        // 开发环境显示验证码
        if (data.code) {
          console.log("验证码:", data.code);
          setError(`【开发环境】验证码: ${data.code}`);
        }
      }
    } catch {
      setError("发送失败，请检查网络");
    } finally {
      setIsSendingCode(false);
    }
  };

  // 登录/注册
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 验证手机号
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError("请输入正确的手机号");
      return;
    }

    // 验证验证码
    if (!/^\d{6}$/.test(code)) {
      setError("请输入6位验证码");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        phone,
        code,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError(locale === "zh" ? "登录失败，请重试" : "Login failed, please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-display font-bold">{t.appShortName}</span>
            </div>
            <span className="font-display text-xl font-semibold">{t.appName}</span>
          </Link>

          <div className="max-w-md">
            <blockquote className="text-2xl font-display font-light leading-relaxed mb-6">
              &ldquo;{t.auth.quote.login}&rdquo;
            </blockquote>
            <p className="text-white/70">{t.tagline}</p>
          </div>

          <div className="text-sm text-white/50">
            © {new Date().getFullYear()} {t.appName}. {locale === "zh" ? "版权所有" : "All rights reserved"}.
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="flex lg:hidden items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
              <span className="text-white font-display font-bold">{t.appShortName}</span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">{t.appName}</span>
          </Link>

          <div className="mb-10">
            <h1 className="font-display text-display-sm font-bold text-foreground tracking-tight mb-3">
              {locale === "zh" ? "手机号登录" : "Phone Login"}
            </h1>
            <p className="text-foreground-muted">
              {locale === "zh" ? "输入手机号和验证码即可登录/注册" : "Enter phone and verification code to login/register"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 手机号 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {locale === "zh" ? "手机号" : "Phone Number"}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={locale === "zh" ? "请输入11位手机号" : "Enter 11-digit phone number"}
                maxLength={11}
                required
                className="w-full px-5 py-4 bg-surface border border-border rounded-2xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>

            {/* 验证码 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {locale === "zh" ? "验证码" : "Verification Code"}
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder={locale === "zh" ? "请输入6位验证码" : "Enter 6-digit code"}
                  maxLength={6}
                  required
                  className="flex-1 px-5 py-4 bg-surface border border-border rounded-2xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isSendingCode || !phone}
                  className="px-5 py-4 bg-surface border border-border rounded-2xl text-foreground font-medium hover:bg-accent hover:text-white hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap min-w-[120px]"
                >
                  {isSendingCode
                    ? locale === "zh" ? "发送中..." : "Sending..."
                    : countdown > 0
                    ? `${countdown}s`
                    : locale === "zh" ? "获取验证码" : "Get Code"}
                </button>
              </div>
            </div>

            {error && (
              <div className={`p-4 rounded-2xl text-sm ${error.includes("【开发环境】") ? "bg-success/5 border border-success/20 text-success" : "bg-error/5 border border-error/20 text-error"}`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-accent text-white rounded-full font-medium hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-glow"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {locale === "zh" ? "登录中..." : "Logging in..."}
                </span>
              ) : (
                locale === "zh" ? "登录 / 注册" : "Login / Register"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-foreground-muted mt-8">
            {locale === "zh" ? "首次登录将自动创建账号" : "First login will automatically create an account"}
          </p>
        </div>
      </div>
    </div>
  );
}
