"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type SpeechRecognitionInstance = InstanceType<typeof SpeechRecognition>;

type UseSpeechRecognitionReturn = {
  isSupported: boolean;
  isListening: boolean;
  interimTranscript: string;
  start: (onTranscript: (text: string) => void) => void;
  stop: () => void;
  error: string | null;
};

function getRecognitionConstructor(): typeof SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onTranscriptRef = useRef<((text: string) => void) | null>(null);

  const isSupported = typeof window !== "undefined" && getRecognitionConstructor() !== null;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const start = useCallback(
    (onTranscript: (text: string) => void) => {
      const Ctor = getRecognitionConstructor();
      if (!Ctor) return;

      // 既に録音中なら停止
      if (recognitionRef.current) {
        stop();
        return;
      }

      setError(null);
      onTranscriptRef.current = onTranscript;

      const recognition = new Ctor();
      recognition.lang = "ja-JP";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalText = "";
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        setInterimTranscript(interim);

        if (finalText && onTranscriptRef.current) {
          onTranscriptRef.current(finalText);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "not-allowed") {
          setError("マイクの使用が許可されていません。ブラウザの設定を確認してください");
        } else if (event.error === "aborted") {
          // ユーザーによる停止は無視
        } else {
          setError("音声認識でエラーが発生しました。もう一度お試しください");
        }
        recognitionRef.current = null;
        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    },
    [stop],
  );

  // クリーンアップ
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return { isSupported, isListening, interimTranscript, start, stop, error };
}
