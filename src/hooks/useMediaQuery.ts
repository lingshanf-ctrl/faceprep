// 响应式媒体查询 Hook

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  // 始终以 false 初始化，与 SSR 保持一致，由 useEffect 同步真实值
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

    // 兼容旧版 Safari
    if (media.addEventListener) {
      media.addEventListener("change", listener);
    } else {
      // @ts-ignore - 旧版 Safari 支持
      media.addListener(listener);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", listener);
      } else {
        // @ts-ignore - 旧版 Safari 支持
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

// 常用断点
export function useIsMobile() {
  return useMediaQuery("(max-width: 640px)");
}

export function useIsTablet() {
  return useMediaQuery("(min-width: 641px) and (max-width: 1024px)");
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 1025px)");
}

export function useIsTouchDevice() {
  return useMediaQuery("(pointer: coarse)");
}
