// 匿名用户管理 - 支持免登录使用

const ANONYMOUS_ID_KEY = "job-pilot-anonymous-id";
const ANONYMOUS_DATA_WARNING_KEY = "job-pilot-data-warning-dismissed";

// 生成匿名用户ID
export function getAnonymousId(): string {
  if (typeof window === "undefined") return "";

  let anonymousId = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!anonymousId) {
    anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
  }
  return anonymousId;
}

// 清除匿名ID（登录后调用）
export function clearAnonymousId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ANONYMOUS_ID_KEY);
}

// 检查是否是匿名用户
export function isAnonymousUser(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(ANONYMOUS_ID_KEY);
}

// 获取或创建用户标识（优先使用登录用户ID，否则使用匿名ID）
export function getUserIdentifier(sessionUserId?: string): {
  userId: string;
  isAnonymous: boolean;
} {
  if (sessionUserId) {
    return { userId: sessionUserId, isAnonymous: false };
  }
  return { userId: getAnonymousId(), isAnonymous: true };
}

// 数据警告相关
export function hasDismissedDataWarning(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ANONYMOUS_DATA_WARNING_KEY) === "true";
}

export function dismissDataWarning(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANONYMOUS_DATA_WARNING_KEY, "true");
}

export function resetDataWarning(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ANONYMOUS_DATA_WARNING_KEY);
}

// 生成请求头（包含匿名ID）
export function getAnonymousHeaders(sessionUserId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!sessionUserId) {
    const anonymousId = getAnonymousId();
    if (anonymousId) {
      headers["X-Anonymous-Id"] = anonymousId;
    }
  }

  return headers;
}
