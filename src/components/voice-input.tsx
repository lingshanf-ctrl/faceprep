"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

type RecognitionProvider = "native" | "baidu" | null;

// 检查 API 支持
const checkSupport = () => {
  if (typeof window === "undefined") return { native: false, mediaRecorder: false };
  return {
    native: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    mediaRecorder: !!(window.MediaRecorder && navigator.mediaDevices),
  };
};

// 使用 memo 优化性能
export const VoiceInput = memo(function VoiceInput({
  onTranscript,
  onInterimTranscript,
  disabled = false,
  className = "",
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [provider, setProvider] = useState<RecognitionProvider>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // 使用 ref 避免重渲染
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 初始化
  useEffect(() => {
    const { native, mediaRecorder } = checkSupport();
    // 优先使用百度语音（国内更稳定）
    if (mediaRecorder) {
      setProvider("baidu");
    } else if (native) {
      setProvider("native");
    }
  }, []);

  // 清理函数
  const cleanup = useCallback(() => {
    // 取消进行中的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 停止录音
    if (mediaRecorderRef.current?.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;

    // 停止原生识别
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    // 停止音频流
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    // 停止可视化
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    analyserRef.current = null;
    audioChunksRef.current = [];
    setAudioLevel(0);
  }, []);

  // 组件卸载时清理
  useEffect(() => cleanup, [cleanup]);

  // 音频可视化
  const startVisualization = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(average / 255);
        animationRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch {
      // 可视化失败不影响主功能
    }
  }, []);

  // 百度语音识别 - 优化版本
  const startBaiduRecognition = useCallback(async () => {
    if (!navigator.mediaDevices) {
      setError("浏览器不支持录音");
      return;
    }

    try {
      setError(null);
      audioChunksRef.current = [];

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

      audioStreamRef.current = stream;
      startVisualization(stream);

      // 创建 MediaRecorder - 使用默认配置
      let mediaRecorder;
      try {
        // 优先尝试 webm
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
          console.log("使用 audio/webm");
        } else {
          mediaRecorder = new MediaRecorder(stream);
          console.log("使用默认格式:", mediaRecorder.mimeType);
        }
      } catch (e) {
        console.error("创建 MediaRecorder 失败:", e);
        setError("浏览器不支持录音");
        return;
      }

      mediaRecorderRef.current = mediaRecorder;

      // 监听错误
      mediaRecorder.onerror = (e) => {
        console.error("MediaRecorder 错误:", e);
        setError("录音出错，请重试");
      };

      // 收集音频数据
      mediaRecorder.ondataavailable = (e) => {
        console.log("收到音频数据:", e.data.size, "bytes, 类型:", e.data.type);
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("录音停止，数据块数:", audioChunksRef.current.length);

        setIsListening(false);

        // 先保存数据，再 cleanup（cleanup 会清空数组）
        const chunks = [...audioChunksRef.current];
        const actualMimeType = mediaRecorder.mimeType || "audio/webm";

        cleanup();

        // 合并音频数据
        const audioBlob = new Blob(chunks, { type: actualMimeType });
        console.log("总录音大小:", audioBlob.size, "bytes, 类型:", actualMimeType);

        // 调试：如果有数据但太小，也尝试发送
        if (audioBlob.size === 0) {
          setError("没有录音数据，请检查麦克风权限");
          return;
        }

        if (audioBlob.size < 500) {
          console.log("录音较小但尝试识别...");
        }

        // 将 webm 转换为 wav（百度 API 只支持 pcm/wav/amr/m4a）
        try {
          setIsListening(false);
          console.log("正在转换格式...");
          const wavBlob = await convertWebmToWav(audioBlob);
          console.log("转换后 WAV 大小:", wavBlob.size, "bytes");
          await sendToBaidu(wavBlob);
        } catch (err) {
          console.error("转换失败:", err);
          setError("音频格式转换失败: " + (err instanceof Error ? err.message : String(err)));
        }
      };

      // 开始录音 - 使用 100ms 间隔确保数据被收集
      mediaRecorder.start(100);
      console.log("录音开始，状态:", mediaRecorder.state, "类型:", mediaRecorder.mimeType);
      setIsListening(true);

      // 最长录制 60 秒
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 60000);
    } catch (err) {
      console.error("录音启动失败:", err);
      setError(err instanceof Error ? err.message : "无法访问麦克风");
      cleanup();
    }
  }, [cleanup, startVisualization]);

  // 发送音频到后端识别
  const sendToBaidu = async (audioBlob: Blob) => {
    abortControllerRef.current = new AbortController();

    try {
      // 发送 WAV 格式音频
      const formData = new FormData();
      const fileName = audioBlob.type.includes('wav') ? 'recording.wav' : 'recording.webm';
      formData.append("audio", audioBlob, fileName);

      const response = await fetch("/api/baidu-asr", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `识别失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.err_no === 0 && data.result?.length > 0) {
        const text = data.result[0].trim();
        if (text) {
          onTranscript(text);
        }
      } else if (data.err_no !== 0) {
        throw new Error(data.err_msg || "识别失败");
      } else {
        setError("未识别到语音，请重试");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("识别错误:", err);
      setError(err instanceof Error ? err.message : "识别服务暂时不可用");
    } finally {
      abortControllerRef.current = null;
    }
  };

  // 原生语音识别（备用）
  const startNativeRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("浏览器不支持语音识别");
      return;
    }

    setError(null);
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      if (interimText) {
        onInterimTranscript?.(interimText);
      }
      if (finalText) {
        onTranscript(finalText);
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "not-allowed") {
        setError("请允许麦克风权限");
      } else if (e.error === "no-speech") {
        setError("未检测到语音");
      } else if (e.error === "network") {
        setError("网络错误，请切换到百度语音");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      setError("启动失败");
    }
  }, [onTranscript, onInterimTranscript]);

  // 开始/停止录音
  const toggleListening = useCallback(() => {
    if (disabled) return;

    if (isListening) {
      console.log("停止录音...");
      // 停止录音
      const mediaRecorder = mediaRecorderRef.current;
      console.log("MediaRecorder 状态:", mediaRecorder?.state);
      if (mediaRecorder?.state === "recording") {
        // 先请求最后的数据，然后停止
        try {
          mediaRecorder.requestData();
        } catch (e) {
          console.log("requestData 失败:", e);
        }
        mediaRecorder.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      // 开始录音
      if (provider === "native") {
        startNativeRecognition();
      } else {
        startBaiduRecognition();
      }
    }
  }, [disabled, isListening, provider, startNativeRecognition, startBaiduRecognition, cleanup]);

  // 切换提供商
  const switchProvider = () => {
    setProvider(prev => (prev === "native" ? "baidu" : "native"));
    setError(null);
  };

  // WebM 转 WAV 格式（百度 API 只支持 wav/pcm/amr/m4a）
  const convertWebmToWav = async (webmBlob: Blob): Promise<Blob> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();

    try {
      // 解码 webm 音频
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // 转换为 16kHz 单声道
      const targetSampleRate = 16000;
      const offlineContext = new OfflineAudioContext(
        1, // 单声道
        audioBuffer.duration * targetSampleRate,
        targetSampleRate
      );

      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();

      const renderedBuffer = await offlineContext.startRendering();

      // 编码为 WAV
      return audioBufferToWav(renderedBuffer);
    } finally {
      audioContext.close();
    }
  };

  // AudioBuffer 编码为 WAV Blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numberOfChannels * bytesPerSample;

    const dataLength = length * numberOfChannels * bytesPerSample;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // WAV 头部
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    view.setUint32(8, 0x57415645, false); // 'WAVE'
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // 16-bit
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // PCM 数据
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={`
          relative flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
          transition-all duration-200 active:scale-95
          ${isListening
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${className}
        `}
        title={isListening ? "点击停止录音" : "点击开始语音输入"}
      >
        {/* 音频波纹动画 */}
        {isListening && (
          <>
            <span
              className="absolute inset-0 rounded-full bg-red-400/30 animate-ping"
              style={{ transform: `scale(${1 + audioLevel * 0.3})` }}
            />
            <span
              className="absolute inset-0 rounded-full bg-red-400/20"
              style={{ transform: `scale(${1 + audioLevel * 0.2})` }}
            />
          </>
        )}

        {/* 麦克风图标 */}
        <svg
          className={`relative w-4 h-4 ${isListening ? "animate-pulse" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>

        <span className="relative">
          {isListening ? (provider === "baidu" ? "录音中..." : "识别中...") : "语音"}
        </span>
      </button>

      {/* 切换提供商按钮 */}
      {!isListening && provider && (
        <button
          onClick={switchProvider}
          className="ml-1.5 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center hover:scale-110 transition-transform"
          title={provider === "native" ? "切换到百度语音" : "切换到系统语音"}
        >
          {provider === "native" ? "G" : "B"}
        </button>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg whitespace-nowrap z-10 shadow-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">×</button>
        </div>
      )}
    </div>
  );
});
