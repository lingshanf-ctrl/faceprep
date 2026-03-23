"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAnonymousId, clearAnonymousId } from "@/lib/anonymous-user";
import { syncFavoritesFromAPI } from "@/lib/favorites-store";

interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface MembershipStatus {
  membershipType: "MONTHLY" | "CREDIT" | "FREE";
  creditsRemaining: number | null;
  monthlyExpiresAt: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  membershipStatus: MembershipStatus | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshMembership: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const router = useRouter();

  const refreshMembership = async () => {
    try {
      const res = await fetch("/api/membership/status");
      if (res.ok) {
        const data = await res.json();
        if (data.status) setMembershipStatus(data.status);
      }
    } catch {
      // non-critical — leave existing status
    }
  };

  // 获取当前用户
  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  // 初始加载
  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  // 用户登录后加载 membership 并同步收藏
  useEffect(() => {
    if (user) {
      refreshMembership();
      syncFavoritesFromAPI(); // 静默同步收藏，不阻塞渲染
    } else {
      setMembershipStatus(null);
    }
  }, [user]);

  // 登录
  const login = async (email: string, password: string) => {
    try {
      // 获取匿名ID用于数据迁移（新的key）
      const anonymousId = getAnonymousId();
      // 也获取旧的匿名ID（为了兼容之前的数据）
      const oldAnonymousId = typeof window !== 'undefined' ? localStorage.getItem('anonymous-id') : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (anonymousId) {
        headers["X-Anonymous-Id"] = anonymousId;
      }
      if (oldAnonymousId) {
        headers["X-Anonymous-Id-Old"] = oldAnonymousId;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers,
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || "登录失败" };
      }

      // 登录成功后清除匿名ID
      clearAnonymousId();
      setUser(data.user);
      // membership 会由 user useEffect 触发加载
      return {};
    } catch {
      return { error: "登录失败，请检查网络" };
    }
  };

  // 注册
  const register = async (email: string, password: string, name?: string) => {
    try {
      // 获取匿名ID用于数据迁移（新的key）
      const anonymousId = getAnonymousId();
      // 也获取旧的匿名ID（为了兼容之前的数据）
      const oldAnonymousId = typeof window !== 'undefined' ? localStorage.getItem('anonymous-id') : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (anonymousId) {
        headers["X-Anonymous-Id"] = anonymousId;
      }
      if (oldAnonymousId) {
        headers["X-Anonymous-Id-Old"] = oldAnonymousId;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers,
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || "注册失败" };
      }

      // 注册成功后清除匿名ID
      clearAnonymousId();
      setUser(data.user);
      // membership 会由 user useEffect 触发加载
      return {};
    } catch {
      return { error: "注册失败，请检查网络" };
    }
  };

  // 登出
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setMembershipStatus(null);
      router.push("/");
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, membershipStatus, login, register, logout, refreshUser, refreshMembership }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
