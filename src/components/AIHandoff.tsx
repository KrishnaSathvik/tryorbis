import { ExternalLink, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatGPTIcon, ClaudeIcon, GeminiIcon, CursorIcon, CodexIcon } from "@/components/icons/AIBrandIcons";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { type SVGProps } from "react";

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

  const handleToolClick = (tool: typeof tools[number]) => {
    if (isMobile && tool.deepLink) {
      // Copy context first, then try to open the app
      navigator.clipboard.writeText(context).then(() => {
        toast.success(`Context copied! Opening ${tool.name} app...`, {
          description: "Paste the context in the chat to continue.",
          duration: 4000,
        });
      }).catch(() => {
        toast.info(`Opening ${tool.name}...`);
      });

      // Try deep link first, fall back to browser URL
      const timeout = setTimeout(() => {
        window.open(`${tool.url}${encoded}`, '_blank');
      }, 1500);

      window.location.href = tool.deepLink;

      // If the page is still visible after a short delay, the deep link didn't work
      const handleVisibilityChange = () => {
        if (document.hidden) {
          clearTimeout(timeout);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      window.open(`${tool.url}${encoded}`, '_blank');
    }
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
            {isMobile && tool.deepLink ? (
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
    </div>
  );
}
