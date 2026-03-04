"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// 识别状态
type RecognitionState =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "listening"; interimText: string }
  | { status: "processing" };

// 浏览器原生语音识别 - 真正的流式打字机效果
export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [state, setState] = useState<RecognitionState>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 音频可视化
  const startVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
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
    } catch {
      // 可视化失败不影响识别
    }
  }, []);

  // 停止可视化
  const stopVisualization = useCallback(() => {
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

  // 开始语音识别
  const startListening = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("浏览器不支持语音识别，请使用 Chrome/Edge");
      return;
    }

    setError(null);
    setState({ status: "connecting" });

    try {
      // 先请求麦克风权限
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // 创建识别实例
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // 配置：中文、连续识别、返回中间结果（这是打字机效果的关键）
      recognition.lang = "zh-CN";
      recognition.continuous = true;
      recognition.interimResults = true;  // 必须开启，才能实时获取中间结果
      recognition.maxAlternatives = 1;

      // 开始识别
      recognition.onstart = () => {
        setState({ status: "listening", interimText: "" });
        startVisualization();
      };

      // 实时识别结果 - 打字机效果的核心
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        let interimTranscript = "";

        // 遍历所有结果
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            // 最终结果 - 确认录入
            finalTranscript += transcript;
          } else {
            // 中间结果 - 实时显示（打字机效果）
            interimTranscript += transcript;
          }
        }

        // 更新 UI 显示中间结果
        if (interimTranscript) {
          setState({ status: "listening", interimText: interimTranscript });
        }

        // 有最终结果时，直接追加到文本框
        if (finalTranscript) {
          onTranscript(finalTranscript);
          // 清空中间状态，继续听写
          setState({ status: "listening", interimText: "" });
        }
      };

      // 错误处理
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);

        if (event.error === "not-allowed") {
          setError("请允许麦克风权限");
        } else if (event.error === "no-speech") {
          // 没检测到语音，继续监听
          return;
        } else if (event.error === "network") {
          setError("网络错误，请检查网络连接");
        } else {
          setError(`识别错误: ${event.error}`);
        }

        stopVisualization();
        setState({ status: "idle" });
      };

      // 识别结束
      recognition.onend = () => {
        // 如果是主动停止的，不再重启
        if (state.status === "listening") {
          stopVisualization();
          setState({ status: "idle" });
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setError(err instanceof Error ? err.message : "启动失败");
      setState({ status: "idle" });
    }
  }, [onTranscript, startVisualization, stopVisualization, state.status]);

  // 停止识别
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    stopVisualization();
    setState({ status: "idle" });
  }, [stopVisualization]);

  // 切换监听状态
  const toggleListening = useCallback(() => {
    if (disabled) return;

    if (state.status === "listening" || state.status === "connecting") {
      stopListening();
    } else {
      startListening();
    }
  }, [disabled, state.status, startListening, stopListening]);

  // 清理
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const isListening = state.status === "listening" || state.status === "connecting";

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        className={`
          relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
          transition-all duration-200
          ${isListening
            ? "bg-red-500 text-white"
            : "bg-accent text-white hover:bg-accent/90"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {/* 音频波形动画 */}
        {isListening && (
          <span className="absolute inset-0 rounded-full animate-ping bg-current opacity-20" />
        )}

        {/* 动态波形条 */}
        {isListening ? (
          <span className="relative flex items-center gap-0.5 h-4">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-0.5 bg-current rounded-full animate-pulse"
                style={{
                  height: `${Math.max(4, Math.min(16, 4 + audioLevel * 12 * (i % 2 === 0 ? 1.5 : 1)))}px`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: "400ms",
                }}
              />
            ))}
          </span>
        ) : (
          <Mic className="w-4 h-4" />
        )}

        <span className="relative">
          {state.status === "connecting" ? (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              连接中
            </span>
          ) : isListening ? (
            "听写中..."
          ) : (
            "语音输入"
          )}
        </span>
      </button>

      {/* 实时预览 - 打字机效果 */}
      {state.status === "listening" && state.interimText && (
        <div className="absolute left-full ml-3 px-3 py-2 bg-surface border border-border rounded-xl shadow-lg whitespace-nowrap z-10 animate-in fade-in slide-in-from-left-2">
          <p className="text-sm text-foreground-muted">
            {state.interimText}
            <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse" />
          </p>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-error/10 border border-error/20 text-error text-xs rounded-lg whitespace-nowrap z-10">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-error/60 hover:text-error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
