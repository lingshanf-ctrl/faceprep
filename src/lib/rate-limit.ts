// 简单的内存频率限制器
// 生产环境建议使用 Redis

interface RateLimitEntry {
  attempts: number;
  resetTime: number;
  blocked: boolean;
}

const attempts = new Map<string, RateLimitEntry>();

// 清理过期的条目
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts.entries()) {
    if (entry.resetTime < now) {
      attempts.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  blocked: boolean;
  message?: string;
}

/**
 * 检查登录频率限制
 * @param key - 标识符（IP 地址或用户邮箱）
 * @returns 频率限制结果
 */
export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 分钟窗口
  const maxAttempts = 5; // 最多 5 次尝试
  const blockDuration = 15 * 60 * 1000; // 封禁 15 分钟

  const entry = attempts.get(key);

  if (!entry) {
    // 首次尝试
    attempts.set(key, {
      attempts: 1,
      resetTime: now + windowMs,
      blocked: false,
    });
    return {
      success: true,
      remaining: maxAttempts - 1,
      resetTime: now + windowMs,
      blocked: false,
    };
  }

  // 如果被封禁
  if (entry.blocked) {
    if (entry.resetTime > now) {
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
        blocked: true,
        message: `登录尝试过多，请 ${Math.ceil((entry.resetTime - now) / 60000)} 分钟后重试`,
      };
    }
    // 封禁时间已过，重置
    attempts.delete(key);
    return checkRateLimit(key);
  }

  // 窗口期已过，重置
  if (entry.resetTime < now) {
    attempts.delete(key);
    return checkRateLimit(key);
  }

  // 增加尝试次数
  entry.attempts++;

  // 检查是否超过限制
  if (entry.attempts >= maxAttempts) {
    entry.blocked = true;
    entry.resetTime = now + blockDuration;
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      blocked: true,
      message: "登录尝试失败次数过多，请 15 分钟后重试",
    };
  }

  return {
    success: true,
    remaining: maxAttempts - entry.attempts,
    resetTime: entry.resetTime,
    blocked: false,
  };
}

/**
 * 重置频率限制（成功登录后调用）
 * @param key - 标识符
 */
export function resetRateLimit(key: string): void {
  attempts.delete(key);
}
