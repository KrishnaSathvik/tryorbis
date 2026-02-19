import { ExternalLink, Smartphone, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatGPTIcon, ClaudeIcon, GeminiIcon, CursorIcon, CodexIcon } from "@/components/icons/AIBrandIcons";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useState, type SVGProps } from "react";

interface AIHandoffProps {
  context: string;
}

const tools: {
  name: string;
  url: string;
  deepLink?: string;
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
}[] = [
  { name: "ChatGPT", url: "https://chat.openai.com/?q=", deepLink: "chatgpt://", icon: ChatGPTIcon },
  { name: "Claude", url: "https://claude.ai/new?q=", icon: ClaudeIcon },
  { name: "Gemini", url: "https://gemini.google.com/app?q=", icon: GeminiIcon },
  { name: "Cursor", url: "https://cursor.com", icon: CursorIcon },
  { name: "Codex", url: "https://chatgpt.com/codex?q=", icon: CodexIcon },
];

export function AIHandoff({ context }: AIHandoffProps) {
  const encoded = encodeURIComponent(context);
  const isMobile = useIsMobile();
  const [pendingTool, setPendingTool] = useState<typeof tools[number] | null>(null);
  const [copied, setCopied] = useState(false);

  const isPWA = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;

  const copyAndOpen = async (tool: typeof tools[number]) => {
    try {
      await navigator.clipboard.writeText(context);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy context");
    }

    const targetUrl = `${tool.url}${encoded}`;
    window.open(targetUrl, '_blank');
    setPendingTool(null);
  };

  const handleToolClick = (tool: typeof tools[number]) => {
    setPendingTool(tool);
    setCopied(false);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Continue with AI</h3>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <Button
            key={tool.name}
            variant="outline"
            size="sm"
            onClick={() => handleToolClick(tool)}
            className="gap-1.5"
          >
            <tool.icon className="h-3.5 w-3.5" />
            {tool.name}
            {isPWA || (isMobile && tool.deepLink) ? (
              <Smartphone className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => { navigator.clipboard.writeText(context); toast.success("Context copied to clipboard"); }}
        >
          Copy Context
        </Button>
      </div>

      <Dialog open={!!pendingTool} onOpenChange={(open) => !open && setPendingTool(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingTool && <pendingTool.icon className="h-5 w-5" />}
              Open {pendingTool?.name}?
            </DialogTitle>
            <DialogDescription>
              Your research context will be copied to your clipboard. After {pendingTool?.name} opens, paste it into a new chat to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-muted p-3 max-h-32 overflow-y-auto">
            <p className="text-xs text-muted-foreground line-clamp-4">{context.slice(0, 300)}{context.length > 300 ? '...' : ''}</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setPendingTool(null)}>
              Cancel
            </Button>
            <Button onClick={() => pendingTool && copyAndOpen(pendingTool)} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied! Opening..." : `Copy & Open ${pendingTool?.name}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
