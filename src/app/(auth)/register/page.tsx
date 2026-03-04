"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t.auth.errors.passwordMismatch);
      return;
    }

    if (password.length < 6) {
      setError(t.auth.errors.passwordTooShort);
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        name,
        email,
        password,
        action: "register",
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError(t.auth.errors.registerFailed);
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
              &ldquo;{t.auth.quote.register}&rdquo;
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
              {t.auth.register.title}
            </h1>
            <p className="text-foreground-muted">{t.auth.register.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t.auth.register.name}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={locale === "zh" ? "请输入姓名" : "Your name"}
                required
                className="w-full px-5 py-4 bg-surface border border-border rounded-2xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t.auth.register.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-5 py-4 bg-surface border border-border rounded-2xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t.auth.register.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={locale === "zh" ? "至少6个字符" : "At least 6 characters"}
                required
                className="w-full px-5 py-4 bg-surface border border-border rounded-2xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t.auth.register.confirmPassword}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={locale === "zh" ? "请再次输入密码" : "Confirm your password"}
                required
                className="w-full px-5 py-4 bg-surface border border-border rounded-2xl text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
            </div>

            {error && (
              <div className="p-4 bg-error/5 border border-error/20 rounded-2xl text-error text-sm">
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
                  {t.auth.register.creating}
                </span>
              ) : (
                t.auth.register.createAccount
              )}
            </button>
          </form>

          <p className="text-center text-sm text-foreground-muted mt-8">
            {t.auth.register.hasAccount}{" "}
            <Link href="/login" className="text-accent font-medium hover:text-accent-dark transition-colors">
              {t.auth.register.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
