// 答题计时器 Hook

import { useState, useCallback, useRef, useEffect } from "react";

interface UseTimerOptions {
  initialSeconds?: number;
  targetSeconds?: number;
  onTimeout?: () => void;
}

export function useTimer(options: UseTimerOptions = {}) {
  const { initialSeconds = 0, targetSeconds = 120, onTimeout } = options;

  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          if (next >= targetSeconds && onTimeout) {
            onTimeout();
          }
          return next;
        });
      }, 1000);
    }
  }, [isRunning, targetSeconds, onTimeout]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    pause();
    setSeconds(initialSeconds);
  }, [pause, initialSeconds]);

  const stop = useCallback(() => {
    pause();
    const finalSeconds = seconds;
    return finalSeconds;
  }, [pause, seconds]);

  // 格式化显示
  const formatTime = useCallback((secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    seconds,
    formattedTime: formatTime(seconds),
    isRunning,
    isTimeout: seconds >= targetSeconds,
    progress: Math.min((seconds / targetSeconds) * 100, 100),
    start,
    pause,
    reset,
    stop,
  };
}
