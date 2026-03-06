"use client";

import { useState, useRef, useCallback, memo, useEffect } from "react";
import { Mic, Loader2 } from "lucide-react";

interface VoiceTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  minHeight?: string;
  label?: React.ReactNode;
  footer?: React.ReactNode;
  language?: "zh" | "en";
  onLanguageChange?: (lang: "zh" | "en") => void;
}

// 识别状态
type RecognitionState =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "listening" }
  | { status: "processing" }
  | { status: "typing"; text: string }; // 新增：逐字动画状态

export const VoiceTextarea = memo(function VoiceTextarea({
  value,
  onChange,
  placeholder = "在此输入你的回答...",
  disabled = false,
  className = "",
  rows = 8,
  minHeight = "200px",
  label,
  footer,
  language = "zh",
  onLanguageChange,
}: VoiceTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState<RecognitionState>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [typingText, setTypingText] = useState(""); // 打字机动画的临时文本

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 在光标位置插入文本（带逐字动画）
  const insertTextWithAnimation = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !text) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);

    // 设置打字机动画状态
    setState({ status: "typing", text });
    setTypingText("");

    let currentIndex = 0;
    const chars = text.split("");

    // 逐字动画（每个字30ms，模拟打字机效果）
    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < chars.length) {
        setTypingText(prev => prev + chars[currentIndex]);
        currentIndex++;
      } else {
        // 动画完成，插入到实际文本框
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }

        const newValue = before + text + after;
        onChange(newValue);
        setTypingText("");
        setState({ status: "idle" });

        // 设置光标位置
        setTimeout(() => {
          const newPosition = start + text.length;
          textarea.setSelectionRange(newPosition, newPosition);
          textarea.focus();
        }, 0);
      }
    }, 30); // 30ms per character
  }, [value, onChange]);

  // 立即插入文本（无动画，用于直接输入）
  const insertText = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);

    const newValue = before + text + after;
    onChange(newValue);

    setTimeout(() => {
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  // 音频可视化
  const startVisualization = useCallback(async (stream: MediaStream) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
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

  // 开始语音识别（使用百度API + 逐字动画）
  const startListening = useCallback(async () => {
    if (!navigator.mediaDevices) {
      setError("浏览器不支持录音");
      return;
    }

    try {
      setError(null);
      setState({ status: "connecting" });

      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      });

      streamRef.current = stream;
      startVisualization(stream);

      // 创建 MediaRecorder
      let mediaRecorder;
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      } else {
        mediaRecorder = new MediaRecorder(stream);
      }

      recognitionRef.current = mediaRecorder as any;
      const audioChunks: Blob[] = [];

      // 收集音频数据
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.push(e.data);
        }
      };

      // 录音停止后处理
      mediaRecorder.onstop = async () => {
        setState({ status: "processing" });
        stopVisualization();

        const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });

        if (audioBlob.size === 0) {
          setError("没有录音数据，请重试");
          setState({ status: "idle" });
          return;
        }

        try {
          // 转换为 WAV
          const wavBlob = await convertWebmToWav(audioBlob);

          // 发送到百度识别
          const formData = new FormData();
          formData.append("audio", wavBlob, "recording.wav");
          formData.append("language", language);

          const response = await fetch("/api/baidu-asr", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`识别失败: ${response.status}`);
          }

          const data = await response.json();

          if (data.err_no === 0 && data.result?.length > 0) {
            const text = data.result[0].trim();
            if (text) {
              // 使用逐字动画插入文本
              insertTextWithAnimation(text);
            } else {
              setError("未识别到内容");
              setState({ status: "idle" });
            }
          } else {
            setError(data.err_msg || "未识别到语音");
            setState({ status: "idle" });
          }
        } catch (err) {
          console.error("识别错误:", err);
          setError(err instanceof Error ? err.message : "识别失败");
          setState({ status: "idle" });
        }
      };

      // 开始录音
      mediaRecorder.start(100);
      setState({ status: "listening" });

      // 最长60秒
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 60000);
    } catch (err) {
      console.error("启动失败:", err);
      setError(err instanceof Error ? err.message : "无法访问麦克风");
      setState({ status: "idle" });
    }
  }, [insertTextWithAnimation, startVisualization, stopVisualization]);

  // 停止识别
  const stopListening = useCallback(() => {
    const mediaRecorder = recognitionRef.current as any;
    if (mediaRecorder && mediaRecorder.state === "recording") {
      try {
        mediaRecorder.requestData();
        mediaRecorder.stop();
      } catch (err) {
        console.error("停止录音失败:", err);
      }
    }
    recognitionRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    stopVisualization();
  }, [stopVisualization]);

  // WebM 转 WAV
  const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();

    try {
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // 转换为 16kHz 单声道
      const targetSampleRate = 16000;
      const offlineContext = new OfflineAudioContext(
        1,
        audioBuffer.duration * targetSampleRate,
        targetSampleRate
      );

      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();

      const renderedBuffer = await offlineContext.startRendering();
      return audioBufferToWav(renderedBuffer);
    } finally {
      audioContext.close();
    }
  };

  // AudioBuffer 转 WAV
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const dataLength = length * 2;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // WAV 头部
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, dataLength, true);

    // PCM 数据
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  };

  // 切换监听
  const toggleListening = useCallback(() => {
    if (disabled) return;
    if (state.status === "listening") {
      stopListening();
    } else if (state.status === "idle") {
      startListening();
    }
  }, [disabled, state.status, startListening, stopListening]);

  // 清理打字机动画
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const isListening = state.status === "listening";
  const isConnecting = state.status === "connecting";
  const isProcessing = state.status === "processing";
  const isTyping = state.status === "typing";
  const isActive = isListening || isConnecting || isProcessing || isTyping;

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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isActive}
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

        {/* 打字机动画叠加层 */}
        {isTyping && typingText && (
          <div
            className="absolute inset-0 px-5 py-4 pointer-events-none overflow-hidden rounded-2xl"
            style={{ minHeight }}
          >
            <div className="whitespace-pre-wrap break-words">
              {/* 占位符 - 保持和原文本对齐 */}
              <span className="opacity-0">{value}</span>
              {/* 打字机文本 - 逐字出现 */}
              <span className="text-accent font-medium">
                {typingText}
                <span className="inline-block w-0.5 h-5 bg-accent ml-0.5 animate-pulse" />
              </span>
            </div>
          </div>
        )}

        {/* 状态指示器 - 右下角 */}
        {isActive && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-full text-xs font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span
                className="relative inline-flex rounded-full h-2 w-2 bg-white transition-transform duration-100"
                style={{ transform: `scale(${0.7 + audioLevel * 0.6})` }}
              />
            </span>
            <span>
              {isConnecting && "准备中..."}
              {isListening && "录音中..."}
              {isProcessing && "识别中..."}
              {isTyping && "输入中..."}
            </span>
          </div>
        )}
      </div>

      {/* 底部工具栏 */}
      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled || isProcessing || isTyping}
          className={`
            relative flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-medium
            transition-all duration-200 active:scale-95 shadow-md
            ${isListening
              ? "bg-red-500 text-white hover:bg-red-600 shadow-red-500/30"
              : "bg-accent text-white hover:bg-accent/90 shadow-accent/20"
            }
            ${(disabled || isProcessing || isTyping) ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {/* 动态波纹效果 */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />
              <span
                className="absolute inset-0 rounded-full bg-red-400/20"
                style={{ transform: `scale(${1 + audioLevel * 0.2})` }}
              />
            </>
          )}

          {/* 图标 */}
          {isConnecting || isProcessing ? (
            <Loader2 className="relative w-4 h-4 animate-spin" />
          ) : isListening ? (
            <div className="relative flex items-center gap-0.5 h-4">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="w-0.5 bg-current rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(4, 4 + audioLevel * 12)}px`,
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
            {isConnecting && "准备中..."}
            {isListening && "停止录音"}
            {isProcessing && "识别中..."}
            {isTyping && "输入中..."}
            {state.status === "idle" && "语音输入"}
          </span>
        </button>

        {/* 语言切换按钮 */}
        {onLanguageChange && (
          <button
            type="button"
            onClick={() => onLanguageChange(language === "zh" ? "en" : "zh")}
            disabled={isActive}
            className={`
              px-3 py-2 rounded-full text-xs font-medium border transition-all
              ${language === "en"
                ? "bg-accent text-white border-accent"
                : "bg-surface text-foreground-muted border-border hover:border-accent/50"
              }
              ${isActive ? "opacity-50 cursor-not-allowed" : ""}
            `}
            title={language === "zh" ? "切换到英文识别" : "切换到中文识别"}
          >
            {language === "zh" ? "中文" : "EN"}
          </button>
        )}

        {footer}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-3 px-4 py-3 bg-error/10 border border-error/20 text-error text-sm rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-3 text-error/60 hover:text-error transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* 提示文字 */}
      {state.status === "idle" && !error && (
        <div className="mt-3 text-xs text-foreground-muted flex items-center gap-2">
          <Mic className="w-3 h-3" />
          <span>点击"语音输入"开始录音，停止后文字会逐字出现</span>
        </div>
      )}
    </div>
  );
});
