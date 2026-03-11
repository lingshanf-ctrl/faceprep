"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

export default function ClaimPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    credits?: number;
  } | null>(null);

  const handleClaim = async () => {
    if (!email || !email.includes("@")) {
      setResult({
        success: false,
        message: "请输入有效的邮箱地址",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/claim-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "领取成功！",
          credits: data.credits,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "领取失败，请稍后重试",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "网络错误，请稍后重试",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">FacePrep</h1>
          <p className="text-slate-500 mt-1">AI 驱动的面试准备平台</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-3">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl">免费领取体验卡</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              新用户专享，每人限领一次
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 权益说明 */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>3 次 AI 深度评估</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>模拟面试报告</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>优化建议 + 话术模板</span>
              </div>
            </div>

            {/* 输入框 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                请输入您的邮箱
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || result?.success}
                className="h-12"
                onKeyDown={(e) => e.key === "Enter" && handleClaim()}
              />
              <p className="text-xs text-slate-500">
                体验卡将发放到该邮箱对应的账户
              </p>
            </div>

            {/* 领取按钮 */}
            <Button
              onClick={handleClaim}
              disabled={loading || result?.success}
              className="w-full h-12 bg-accent hover:bg-accent-dark text-white"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  领取中...
                </span>
              ) : result?.success ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  已领取
                </span>
              ) : (
                "立即领取"
              )}
            </Button>

            {/* 结果提示 */}
            {result && (
              <div
                className={`p-4 rounded-xl text-sm ${
                  result.success
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">
                      {result.success ? "领取成功！" : "领取失败"}
                    </p>
                    <p className="mt-1">{result.message}</p>
                    {result.success && (
                      <div className="mt-3 p-3 bg-white rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">
                          现在您可以：
                        </p>
                        <a
                          href="/login"
                          className="text-accent hover:underline font-medium"
                        >
                          登录账户开始使用 →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 说明文字 */}
            <p className="text-xs text-slate-400 text-center">
              每个账户限领一次 · 体验卡有效期 30 天
            </p>
          </CardContent>
        </Card>

        {/* 底部链接 */}
        <div className="text-center mt-6 space-x-4 text-sm text-slate-500">
          <a href="/" className="hover:text-accent transition-colors">
            返回首页
          </a>
          <span>·</span>
          <a href="/login" className="hover:text-accent transition-colors">
            已有账户？登录
          </a>
        </div>
      </div>
    </div>
  );
}
