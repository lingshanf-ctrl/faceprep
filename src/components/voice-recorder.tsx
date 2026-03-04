"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, Square, Pause, Play, Trash2 } from "lucide-react";

interface VoiceRecorderProps {
  onTranscript?: (text: string) => void;
  onRecordingComplete?: (blob: Blob, duration: number) => void;
  maxDuration?: number;
}

export function VoiceRecorder({
  onTranscript,
  onRecordingComplete,
  maxDuration = 300,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        onRecordingComplete?.(audioBlob, finalDuration);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      startTimeRef.current = Date.now();

      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "zh-CN";

        recognition.onresult = (event) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          const newTranscript = transcript + finalTranscript;
          setTranscript(newTranscript);
          onTranscript?.(newTranscript + interimTranscript);
        };

        recognition.onerror = (event) => {
          if (event.error !== "aborted") {
            setError("语音识别出错，但录音仍在继续");
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 1000);

      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      setError("无法访问麦克风，请检查权限设置");
    }
  }, [maxDuration, onRecordingComplete, onTranscript, transcript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  }, [isRecording]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      recognitionRef.current?.start();
      mediaRecorderRef.current?.resume();
      startTimeRef.current = Date.now() - duration * 1000;
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    setIsPaused(!isPaused);
  }, [isPaused, duration]);

  const clearRecording = useCallback(() => {
    setTranscript("");
    setDuration(0);
    setError(null);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 录音状态显示 */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        {/* 计时器 */}
        <div className="text-center mb-6">
          <div className={`text-5xl font-mono font-bold ${isRecording ? "text-red-500" : "text-gray-700"}`}>
            {formatTime(duration)}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {isRecording ? (isPaused ? "已暂停" : "录音中...") : "准备就绪"}
          </p>
        </div>

        {/* 波形动画 */}
        {isRecording && !isPaused && (
          <div className="flex justify-center items-center gap-1 mb-6 h-12">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-red-500 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 40 + 10}px`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
            >
              <Mic className="w-8 h-8" />
            </button>
          ) : (
            <>
              <button
                onClick={togglePause}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors"
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>

              <button
                onClick={stopRecording}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
              >
                <Square className="w-6 h-6 fill-current" />
              </button>

              <button
                onClick={clearRecording}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
        )}
      </div>

      {/* 实时转录 */}
      {transcript && (
        <div className="mt-4 bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-500 mb-2">语音识别结果：</p>
          <p className="text-gray-800">{transcript}</p>
        </div>
      )}
    </div>
  );
}
