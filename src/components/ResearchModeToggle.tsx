import { useId } from "react";
import { cn } from "@/lib/utils";
import { Zap, Microscope } from "lucide-react";

interface ResearchModeToggleProps {
  mode: "regular" | "deep";
  onChange: (mode: "regular" | "deep") => void;
}

export function ResearchModeToggle({ mode, onChange }: ResearchModeToggleProps) {
  const groupId = useId();
  const name = `research-mode-${groupId}`;

  return (
    <fieldset className="m-0 flex w-fit items-center gap-1 rounded-full border border-border/50 bg-secondary/60 p-1">
      <legend className="sr-only">Research mode</legend>

      <label
        title="Fast research using Sonar-Pro — ~15s, up to 8 citations"
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
          "has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
          mode === "regular"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <input
          type="radio"
          name={name}
          value="regular"
          checked={mode === "regular"}
          onChange={() => onChange("regular")}
          className="sr-only"
        />
        <Zap className="h-3.5 w-3.5" aria-hidden />
        Regular
      </label>

      <label
        title="Expert-level multi-query analysis — slower but significantly more thorough with more citations"
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
          "has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
          mode === "deep"
            ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <input
          type="radio"
          name={name}
          value="deep"
          checked={mode === "deep"}
          onChange={() => onChange("deep")}
          className="sr-only"
        />
        <Microscope className="h-3.5 w-3.5" aria-hidden />
        Deep Research
      </label>
    </fieldset>
  );
}
