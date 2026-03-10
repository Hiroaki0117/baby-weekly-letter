"use client";

import { useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { toast } from "sonner";

type VoiceInputButtonProps = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
};

export function VoiceInputButton({
  onTranscript,
  disabled,
}: VoiceInputButtonProps) {
  const { isSupported, isListening, start, stop, error } =
    useSpeechRecognition();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (!isSupported) return null;

  function handleClick() {
    if (isListening) {
      stop();
    } else {
      start(onTranscript);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={isListening ? "音声入力を停止" : "音声入力を開始"}
      className={`absolute right-2 top-2 rounded-full p-1.5 transition-all ${
        isListening
          ? "animate-pulse bg-destructive text-destructive-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } disabled:pointer-events-none disabled:opacity-50`}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
