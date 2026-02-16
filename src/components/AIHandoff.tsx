import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIHandoffProps {
  context: string;
}

const tools = [
  { name: "ChatGPT", url: "https://chat.openai.com/?q=" },
  { name: "Claude", url: "https://claude.ai/new?q=" },
  { name: "Gemini", url: "https://gemini.google.com/app?q=" },
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
          >
            {tool.name}
            <ExternalLink className="h-3 w-3 ml-1" />
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
