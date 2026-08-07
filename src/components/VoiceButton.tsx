import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function VoiceButton({ isListening, isSupported, onStart, onStop, disabled }: VoiceButtonProps) {
  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      disabled={disabled}
      aria-label={isListening ? "Stop voice input" : "Start voice input"}
      aria-pressed={isListening}
      className={cn(
        "h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isListening
          ? "bg-destructive/10 text-destructive animate-pulse ring-2 ring-destructive/30"
          : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5",
        "disabled:opacity-30 disabled:cursor-not-allowed"
      )}
      title={isListening ? "Stop voice input" : "Start voice input"}
    >
      {isListening ? (
        <MicOff className="h-4 w-4" aria-hidden />
      ) : (
        <Mic className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
