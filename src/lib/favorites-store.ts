// 收藏题目本地存储

const STORAGE_KEY = "job-pilot-favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function addFavorite(questionId: string): void {
  const favorites = getFavorites();
  if (!favorites.includes(questionId)) {
    favorites.push(questionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }
}

export function removeFavorite(questionId: string): void {
  const favorites = getFavorites();
  const filtered = favorites.filter((id) => id !== questionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function isFavorite(questionId: string): boolean {
  const favorites = getFavorites();
  return favorites.includes(questionId);
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
