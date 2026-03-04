"use client";

import { useState, useRef, useCallback, useEffect, memo } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface VoiceTextareaRealtimeProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  minHeight?: string;
  label?: React.ReactNode;
  footer?: React.ReactNode;
}

type RecognitionState =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "listening"; interimText: string }
  | { status: "error"; message: string };

/**
 * 优化的实时语音输入文本框
 *
 * 核心特性：
 * 1. 真正的流式打字机效果 - 说话时文字实时出现
 * 2. 视觉层次清晰 - 已确认文本 + 灰色中间文本 + 闪烁光标
 * 3. 即时反馈 - 无延迟感的实时显示
 * 4. 智能标点 - 自动识别标点符号
 */
export const VoiceTextareaRealtime = memo(function VoiceTextareaRealtime({
  value,
  onChange,
  placeholder = "在此输入你的回答...",
  disabled = false,
  className = "",
  rows = 8,
  minHeight = "200px",
  label,
  footer,
}: VoiceTextareaRealtimeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState<RecognitionState>({ status: "idle" });
  const [interimText, setInterimText] = useState(""); // 中间识别结果
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 音频可视化
  const startAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.min(1, average / 128));
        animationRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn("Audio visualization failed:", err);
    }
  }, []);

  // 停止音频可视化
  const stopAudioVisualization = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // 在光标位置插入文本
  const insertTextAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);

    const newValue = before + text + after;
    onChange(newValue);

    // 保持光标位置
    setTimeout(() => {
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  // 开始语音识别
  const startListening = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState({
        status: "error",
        message: "浏览器不支持语音识别，请使用 Chrome/Edge/Safari"
      });
      return;
    }

    try {
      setState({ status: "starting" });
      setInterimText("");

      // 请求麦克风权限
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // 创建识别实例
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // 核心配置 - 实现实时打字机效果
      recognition.lang = "zh-CN";
      recognition.continuous = true;        // 持续识别，不自动停止
      recognition.interimResults = true;    // 启用中间结果（打字机效果的关键）
      recognition.maxAlternatives = 1;

      // 识别开始
      recognition.onstart = () => {
        console.log("✅ 语音识别已启动");
        setState({ status: "listening", interimText: "" });
        startAudioVisualization();
      };

      // 实时结果处理 - 打字机效果的核心
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalText = "";
        let currentInterimText = "";

        // 遍历所有识别结果
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            // 最终结果 - 确认并插入到文本框
            finalText += transcript;
          } else {
            // 中间结果 - 实时显示（打字机效果）
            currentInterimText += transcript;
          }
        }

        // 更新中间文本显示（实时打字机效果）
        if (currentInterimText) {
          setInterimText(currentInterimText);
          setState({ status: "listening", interimText: currentInterimText });
        }

        // 有最终结果时，插入到文本框
        if (finalText) {
          console.log("📝 最终结果:", finalText);
          insertTextAtCursor(finalText);
          setInterimText(""); // 清空中间文本
        }
      };

      // 错误处理
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("❌ 识别错误:", event.error);

        // 不同错误的处理
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setState({
            status: "error",
            message: "请允许麦克风权限后重试"
          });
          stopAudioVisualization();
        } else if (event.error === "no-speech") {
          // 没有检测到语音，继续监听（不报错）
          console.log("⚠️ 未检测到语音，继续监听...");
        } else if (event.error === "network") {
          setState({
            status: "error",
            message: "网络错误，请检查网络连接"
          });
          stopAudioVisualization();
        } else if (event.error === "aborted") {
          // 用户主动停止，不报错
          console.log("🛑 用户停止识别");
        } else {
          setState({
            status: "error",
            message: `识别出错: ${event.error}`
          });
          stopAudioVisualization();
        }
      };

      // 识别意外结束 - 自动重启（实现连续识别）
      recognition.onend = () => {
        console.log("🔄 识别会话结束");

        // 如果还在监听状态，自动重启（实现真正的连续识别）
        if (state.status === "listening" || recognitionRef.current) {
          console.log("🔄 自动重启识别...");
          // 延迟100ms后重启，避免过快重启
          restartTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (err) {
                console.error("重启失败:", err);
                stopListening();
              }
            }
          }, 100);
        } else {
          stopAudioVisualization();
          setState({ status: "idle" });
        }
      };

      // 启动识别
      recognition.start();
      console.log("🎤 开始语音识别...");

    } catch (err) {
      console.error("启动失败:", err);
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "无法启动语音识别"
      });
      stopAudioVisualization();
    }
  }, [startAudioVisualization, stopAudioVisualization, insertTextAtCursor, state.status]);

  // 停止语音识别
  const stopListening = useCallback(() => {
    console.log("🛑 停止语音识别");

    // 清理重启定时器
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    // 停止识别
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("停止识别失败:", err);
      }
      recognitionRef.current = null;
    }

    stopAudioVisualization();
    setInterimText("");
    setState({ status: "idle" });
  }, [stopAudioVisualization]);

  // 切换监听状态
  const toggleListening = useCallback(() => {
    if (disabled) return;

    if (state.status === "listening" || state.status === "starting") {
      stopListening();
    } else {
      startListening();
    }
  }, [disabled, state.status, startListening, stopListening]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // 错误自动清除
  useEffect(() => {
    if (state.status === "error") {
      const timer = setTimeout(() => {
        setState({ status: "idle" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.status]);

  const isListening = state.status === "listening";
  const isStarting = state.status === "starting";
  const isActive = isListening || isStarting;

  // 显示值：原始文本 + 中间识别文本（灰色）
  const displayValue = value;
  const hasInterimText = isListening && interimText;

  return (
    <div className={`relative ${className}`}>
      {/* 标签 */}
      {label && (
        <div className="flex items-center justify-between mb-3">
          {label}
        </div>
      )}

      {/* 文本框容器 */}
      <div className="relative">
        {/* 主文本框 */}
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`
            w-full px-5 py-4 bg-surface border rounded-2xl
            text-foreground placeholder-foreground-muted
            resize-none focus:outline-none focus:ring-2 focus:ring-accent/20
            transition-all duration-200
            ${isActive ? "border-accent shadow-lg shadow-accent/10" : "border-border focus:border-accent"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          style={{ minHeight }}
        />

        {/* 中间识别结果叠加层 - 打字机效果的视觉呈现 */}
        {hasInterimText && (
          <div
            className="absolute inset-0 px-5 py-4 pointer-events-none overflow-hidden rounded-2xl"
            style={{ minHeight }}
          >
            <div className="whitespace-pre-wrap break-words">
              {/* 占位符 - 保持和原文本对齐 */}
              <span className="opacity-0">{displayValue}</span>
              {/* 中间识别文本 - 灰色半透明 + 打字机光标 */}
              <span className="text-foreground-muted/60 font-normal">
                {interimText}
                <span className="inline-block w-0.5 h-5 bg-accent ml-0.5 animate-pulse"
                      style={{ animation: "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
              </span>
            </div>
          </div>
        )}

        {/* 监听中指示器 - 右下角 */}
        {isListening && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-full text-xs font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span
                className="relative inline-flex rounded-full h-2 w-2 bg-white transition-transform duration-100"
                style={{ transform: `scale(${0.7 + audioLevel * 0.6})` }}
              />
            </span>
            <span>听写中...</span>
          </div>
        )}
      </div>

      {/* 底部工具栏 */}
      <div className="flex items-center justify-between mt-4">
        {/* 语音输入按钮 */}
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled}
          className={`
            relative flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-medium
            transition-all duration-200 active:scale-95
            ${isActive
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
              : "bg-accent text-white hover:bg-accent/90 shadow-md"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {/* 动态波纹效果 */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />
              <span className="absolute inset-0 rounded-full bg-red-400/20"
                    style={{ transform: `scale(${1 + audioLevel * 0.2})` }} />
            </>
          )}

          {/* 图标 */}
          {isStarting ? (
            <Loader2 className="relative w-4 h-4 animate-spin" />
          ) : isListening ? (
            <div className="relative flex items-center gap-0.5 h-4">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="w-0.5 bg-current rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(4, 4 + audioLevel * 12 + Math.sin(Date.now() / 200 + i) * 4)}px`,
                    animation: "pulse 0.8s ease-in-out infinite",
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            <Mic className="relative w-4 h-4" />
          )}

          {/* 文字 */}
          <span className="relative">
            {isStarting ? "启动中..." : isListening ? "停止" : "语音输入"}
          </span>
        </button>

        {footer}
      </div>

      {/* 错误提示 */}
      {state.status === "error" && (
        <div className="mt-3 px-4 py-3 bg-error/10 border border-error/20 text-error text-sm rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span>{state.message}</span>
          <button
            onClick={() => setState({ status: "idle" })}
            className="ml-3 text-error/60 hover:text-error transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* 使用提示 */}
      {state.status === "idle" && (
        <div className="mt-3 text-xs text-foreground-muted flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <Mic className="w-3 h-3" />
            提示：点击"语音输入"开始说话，文字会实时出现
          </span>
        </div>
      )}
    </div>
  );
});
