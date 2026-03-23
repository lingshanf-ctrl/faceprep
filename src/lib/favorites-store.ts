// 收藏题目存储：localStorage 缓存 + DB 持久化（Hybrid 模式）

const STORAGE_KEY = "job-pilot-favorites";

// 从 API 同步收藏到 localStorage 缓存（登录/会话恢复时调用）
export async function syncFavoritesFromAPI(): Promise<void> {
  try {
    const res = await fetch("/api/favorites");
    if (!res.ok) return;
    const { favorites } = await res.json();
    const ids: string[] = favorites.map((f: { questionId: string }) => f.questionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // 离线时静默失败
  }
}

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function addFavorite(questionId: string): void {
  // 1. 更新 localStorage（即时）
  const favorites = getFavorites();
  if (!favorites.includes(questionId)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites, questionId]));
  }
  // 2. 异步持久化到 DB（fire-and-forget）
  fetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId }),
  }).catch(() => {});
}

export function removeFavorite(questionId: string): void {
  // 1. 更新 localStorage（即时）
  const filtered = getFavorites().filter((id) => id !== questionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  // 2. 异步删除 DB 记录
  fetch(`/api/favorites?questionId=${encodeURIComponent(questionId)}`, { method: "DELETE" }).catch(() => {});
}

export function isFavorite(questionId: string): boolean {
  return getFavorites().includes(questionId);
}

export function toggleFavorite(questionId: string): boolean {
  if (isFavorite(questionId)) {
    removeFavorite(questionId);
    return false;
  } else {
    addFavorite(questionId);
    return true;
  }
}

export function getFavoriteCount(): number {
  return getFavorites().length;
}
