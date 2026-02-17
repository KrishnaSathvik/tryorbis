import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatGPTIcon, ClaudeIcon, GeminiIcon, CursorIcon, CodexIcon } from "@/components/icons/AIBrandIcons";
import { type SVGProps } from "react";

interface AIHandoffProps {
  context: string;
}

const tools: { name: string; url: string; icon: (props: SVGProps<SVGSVGElement>) => JSX.Element }[] = [
  { name: "ChatGPT", url: "https://chat.openai.com/?q=", icon: ChatGPTIcon },
  { name: "Claude", url: "https://claude.ai/new?q=", icon: ClaudeIcon },
  { name: "Gemini", url: "https://gemini.google.com/app?q=", icon: GeminiIcon },
  { name: "Cursor", url: "https://cursor.com", icon: CursorIcon },
  { name: "Codex", url: "https://chatgpt.com/codex?q=", icon: CodexIcon },
];

export function AIHandoff({ context }: AIHandoffProps) {
  const encoded = encodeURIComponent(context);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Continue with AI</h3>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <Button
            key={tool.name}
            variant="outline"
            size="sm"
            onClick={() => window.open(`${tool.url}${encoded}`, '_blank')}
            className="gap-1.5"
          >
            <tool.icon className="h-3.5 w-3.5" />
            {tool.name}
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => { navigator.clipboard.writeText(context); }}
        >
          Copy Context
        </Button>
      </div>
    </div>
  );
}
