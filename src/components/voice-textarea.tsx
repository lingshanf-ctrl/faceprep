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

type Status = "idle" | "connecting" | "listening" | "processing" | "error";

const BAR_RATIOS = [0.5, 0.8, 1.0, 0.8, 0.5];

// AudioWorklet processor as blob URL — captures 16kHz PCM in 160ms frames
const WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._frameSize = 2560; // 160ms * 16000Hz
    this._buf = new Float32Array(this._frameSize * 2);
    this._len = 0;
  }
  process(inputs) {
    const ch = inputs[0]?.[0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this._buf[this._len++] = ch[i];
      if (this._len >= this._frameSize) {
        const pcm = new Int16Array(this._frameSize);
        for (let j = 0; j < this._frameSize; j++) {
          const s = Math.max(-1, Math.min(1, this._buf[j]));
          pcm[j] = s < 0 ? (s * 32768) | 0 : (s * 32767) | 0;
        }
        this.port.postMessage(pcm.buffer, [pcm.buffer]);
        const remaining = this._len - this._frameSize;
        if (remaining > 0) {
          this._buf.copyWithin(0, this._frameSize, this._len);
        }
        this._len = remaining;
      }
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

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
  const [status, setStatus] = useState<Status>("idle");
  const [interimText, setInterimText] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorPulse, setErrorPulse] = useState(false);

  // Stable refs
  const statusRef = useRef<Status>("idle");
  const valueRef = useRef(value);
  const workletUrlRef = useRef<string | null>(null);
  const stopFnRef = useRef<(() => void) | null>(null);

  // Audio/WS resource refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const insertPosRef = useRef({ start: 0, end: 0 });

  // Keep refs in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const stopAudio = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setAudioLevel(0);
  }, []);

  const handleError = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    stopFnRef.current = null;
    stopAudio();
    setStatus("error");
    setInterimText("");
    statusRef.current = "error";
    setErrorPulse(true);
    setTimeout(() => setErrorPulse(false), 600);
    setTimeout(() => {
      if (statusRef.current === "error") {
        setStatus("idle");
        statusRef.current = "idle";
      }
    }, 2000);
  }, [stopAudio]);

  const insertText = useCallback((text: string) => {
    if (!text) return;
    const { start, end } = insertPosRef.current;
    const current = valueRef.current;
    const newValue = current.slice(0, start) + text + current.slice(end);
    onChange(newValue);
    const newPos = start + text.length;
    insertPosRef.current = { start: newPos, end: newPos };
    setTimeout(() => {
      const ta = textareaRef.current;
      if (ta) {
        ta.setSelectionRange(newPos, newPos);
        ta.focus();
      }
    }, 0);
  }, [onChange]);

  const startVisualization = useCallback((stream: MediaStream, ctx: AudioContext) => {
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    const src = ctx.createMediaStreamSource(stream);
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setAudioLevel(Math.min(1, avg / 45));
      animationRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  // REST fallback: MediaRecorder + POST /api/baidu-asr
  const startListeningRest = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000, channelCount: 1 },
    });
    streamRef.current = stream;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;
    startVisualization(stream, ctx);

    const recorder = MediaRecorder.isTypeSupported("audio/webm")
      ? new MediaRecorder(stream, { mimeType: "audio/webm" })
      : new MediaRecorder(stream);

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = async () => {
      setStatus("processing");
      statusRef.current = "processing";
      stopAudio();
      const blob = new Blob(chunks, { type: recorder.mimeType });
      if (blob.size === 0) { handleError(); return; }
      try {
        const wavBlob = await convertToWav(blob);
        const fd = new FormData();
        fd.append("audio", wavBlob, "rec.wav");
        fd.append("language", language);
        const res = await fetch("/api/baidu-asr", { method: "POST", body: fd });
        const data = await res.json();
        if (data.err_no === 0 && data.result?.[0]) {
          insertText(data.result[0].trim());
        }
      } catch { /* silent */ }
      setStatus("idle");
      statusRef.current = "idle";
    };

    stopFnRef.current = () => recorder.stop();
    recorder.start(100);
    setStatus("listening");
    statusRef.current = "listening";
  }, [language, startVisualization, stopAudio, handleError, insertText]);

  // Main WebSocket streaming start
  const startListening = useCallback(async () => {
    if (disabled || statusRef.current !== "idle") return;
    setStatus("connecting");
    statusRef.current = "connecting";
    setInterimText("");

    // Save cursor position before anything async
    const ta = textareaRef.current;
    if (ta) {
      insertPosRef.current = { start: ta.selectionStart, end: ta.selectionEnd };
    }

    try {
      // Get access token + credentials from server
      const tokenRes = await fetch("/api/baidu-token", { method: "POST" });
      if (!tokenRes.ok) throw new Error("token_fail");
      const { accessToken, appId, appKey } = await tokenRes.json();
      if (!accessToken) throw new Error("no_token");

      // Get microphone at 16kHz
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000, channelCount: 1 },
      });
      streamRef.current = stream;

      // AudioContext at 16kHz
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = ctx;
      startVisualization(stream, ctx);

      // Load AudioWorklet module (blob URL, created once)
      if (!workletUrlRef.current) {
        const blob = new Blob([WORKLET_CODE], { type: "application/javascript" });
        workletUrlRef.current = URL.createObjectURL(blob);
      }
      await ctx.audioWorklet.addModule(workletUrlRef.current);
      const workletNode = new AudioWorkletNode(ctx, "pcm-processor");
      workletNodeRef.current = workletNode;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(workletNode);
      // Intentionally not connecting to destination (silent monitoring)

      // Open Baidu realtime ASR WebSocket
      const ws = new WebSocket("wss://vop.baidu.com/realtime_asr");
      wsRef.current = ws;
      ws.binaryType = "arraybuffer";

      let serverReady = false;
      const pendingFrames: ArrayBuffer[] = [];

      // Buffer PCM frames until WS is ready
      workletNode.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
        if (ws.readyState === WebSocket.OPEN && serverReady) {
          ws.send(e.data);
        } else if (ws.readyState === WebSocket.OPEN) {
          pendingFrames.push(e.data);
        }
      };

      ws.onopen = () => {
        const devPid = language === "en" ? 1737 : 1537;
        ws.send(JSON.stringify({
          type: "START",
          data: {
            appid: appId ? parseInt(appId, 10) : 0,
            appkey: appKey || "",
            token: accessToken,
            dev_pid: devPid,
            cuid: `faceprep_${Date.now()}`,
            format: "pcm",
            rate: 16000,
          },
        }));
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string);
          if (msg.type === "SERVER_READY") {
            serverReady = true;
            for (const frame of pendingFrames) ws.send(frame);
            pendingFrames.length = 0;
            setStatus("listening");
            statusRef.current = "listening";
          } else if (msg.type === "MID_TEXT") {
            setInterimText(msg.result || "");
          } else if (msg.type === "FIN_TEXT") {
            const text = (msg.result || "").trim();
            if (text) insertText(text);
            setInterimText("");
            wsRef.current = null;
            stopFnRef.current = null;
            stopAudio();
            setStatus("idle");
            statusRef.current = "idle";
          } else if (msg.type === "ERROR") {
            throw new Error(msg.err_msg || "ws_error");
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        console.warn("[VoiceTextarea] WebSocket failed, falling back to REST");
        ws.close();
        wsRef.current = null;
        stopAudio();
        setStatus("connecting");
        statusRef.current = "connecting";
        startListeningRest().catch(handleError);
      };

      ws.onclose = () => {
        const s = statusRef.current;
        if (s === "listening" || s === "connecting") {
          stopAudio();
          setStatus("idle");
          statusRef.current = "idle";
          setInterimText("");
        }
      };

      stopFnRef.current = () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "END" }));
          setStatus("processing");
          statusRef.current = "processing";
          setInterimText("");
        }
      };

    } catch (err) {
      console.warn("[VoiceTextarea] WS setup failed, falling back to REST:", err);
      stopAudio();
      wsRef.current = null;
      startListeningRest().catch(handleError);
    }
  }, [disabled, language, startVisualization, stopAudio, insertText, startListeningRest, handleError]);

  const stopListening = useCallback(() => {
    if (stopFnRef.current) {
      stopFnRef.current();
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (disabled) return;
    const s = statusRef.current;
    if (s === "idle" || s === "error") {
      startListening();
    } else if (s === "listening") {
      stopListening();
    }
  }, [disabled, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      stopAudio();
    };
  }, [stopAudio]);

  const isConnecting = status === "connecting";
  const isListening = status === "listening";
  const isProcessing = status === "processing";
  const isActive = isConnecting || isListening || isProcessing;
  const isError = status === "error";

  return (
    <div className={`relative ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-3">{label}</div>
      )}

      {/* Textarea container */}
      <div
        className={`relative transition-all duration-200 rounded-2xl ${
          isListening ? "ring-2 ring-accent/20" : ""
        }`}
      >
        {/* Main textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isListening ? "" : placeholder}
          disabled={disabled || isConnecting || isListening || isProcessing}
          rows={rows}
          className={`
            w-full px-5 py-4 bg-surface border rounded-2xl
            text-foreground placeholder-foreground-muted
            resize-none focus:outline-none focus:ring-2 focus:ring-accent/20
            transition-all duration-200 font-[inherit]
            ${isActive ? "border-accent" : "border-border focus:border-accent"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          style={{ minHeight }}
        />

        {/* Interim text overlay — shown during listening */}
        {isListening && (
          <div
            className="absolute inset-0 px-5 py-4 pointer-events-none overflow-hidden rounded-2xl bg-surface"
            style={{ minHeight, fontFamily: "inherit", fontSize: "inherit", lineHeight: "inherit" }}
          >
            <span className="whitespace-pre-wrap break-words text-foreground">{value}</span>
            {interimText ? (
              <>
                <span className="text-foreground-muted opacity-50">{interimText}</span>
                <span className="inline-block w-0.5 h-4 bg-foreground-muted/40 ml-0.5 animate-pulse align-middle" />
              </>
            ) : (
              <span className="inline-block w-0.5 h-4 bg-accent/50 ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        )}

      </div>

      {/* Footer row: unified mic pill + lang toggle + footer */}
      <div className="flex items-center gap-2 mt-3">

        {/* Mic pill — waveform bars appear inside when listening */}
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled || isProcessing}
          className={`
            flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium
            transition-all duration-300 active:scale-[0.97] select-none
            ${isError
              ? `bg-red-50 border border-red-200 text-red-500 ${errorPulse ? "animate-pulse" : ""}`
              : isListening
              ? "bg-accent text-white shadow-sm shadow-accent/25"
              : isConnecting || isProcessing
              ? "bg-accent/8 border border-accent/20 text-accent"
              : "bg-surface border border-border text-foreground-muted hover:border-accent/40 hover:text-accent"
            }
            ${(disabled || isProcessing) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {/* Inline waveform — only visible when listening */}
          {isListening && (
            <span className="flex items-end gap-px" style={{ height: "14px" }} aria-hidden="true">
              {BAR_RATIOS.map((ratio, i) => (
                <span
                  key={i}
                  className="w-0.5 bg-white/80 rounded-full"
                  style={{
                    height: `${Math.max(3, audioLevel * 14 * ratio)}px`,
                    transition: "height 80ms ease",
                    transitionDelay: `${i * 16}ms`,
                  }}
                />
              ))}
            </span>
          )}

          {isConnecting || isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          ) : (
            <Mic
              className="w-3.5 h-3.5 shrink-0 transition-transform duration-75"
              style={isListening ? { transform: `scale(${1 + audioLevel * 0.18})` } : undefined}
            />
          )}

          <span>
            {isConnecting ? "准备中" : isListening ? "录音中" : isProcessing ? "识别中" : "语音"}
          </span>
        </button>

        {/* Language toggle — visually paired with mic pill */}
        {onLanguageChange && (
          <button
            type="button"
            onClick={() => onLanguageChange(language === "zh" ? "en" : "zh")}
            disabled={isActive}
            className={`
              px-3 py-2 rounded-full text-xs font-medium border transition-all duration-200
              ${language === "en"
                ? "bg-accent text-white border-accent shadow-sm shadow-accent/20"
                : "bg-surface text-foreground-muted border-border hover:border-accent/40 hover:text-accent"
              }
              ${isActive ? "opacity-40 cursor-not-allowed" : ""}
            `}
          >
            {language === "zh" ? "中文" : "EN"}
          </button>
        )}

        {footer}
      </div>
    </div>
  );
});

// ─── Utilities ───────────────────────────────────────────────────────────────

async function convertToWav(blob: Blob): Promise<Blob> {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const offline = new OfflineAudioContext(1, decoded.duration * 16000, 16000);
    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.connect(offline.destination);
    src.start();
    const rendered = await offline.startRendering();
    return bufferToWav(rendered);
  } finally {
    ctx.close();
  }
}

function bufferToWav(buf: AudioBuffer): Blob {
  const len = buf.length;
  const sr = buf.sampleRate;
  const ab = new ArrayBuffer(44 + len * 2);
  const view = new DataView(ab);
  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  str(0, "RIFF"); view.setUint32(4, 36 + len * 2, true);
  str(8, "WAVE"); str(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sr, true); view.setUint32(28, sr * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  str(36, "data"); view.setUint32(40, len * 2, true);
  const ch = buf.getChannelData(0);
  let off = 44;
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, ch[i]));
    view.setInt16(off, s < 0 ? (s * 32768) | 0 : (s * 32767) | 0, true);
    off += 2;
  }
  return new Blob([ab], { type: "audio/wav" });
}
