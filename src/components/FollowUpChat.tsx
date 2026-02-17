import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare, RotateCcw, Sparkles, User } from "lucide-react";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface FollowUpChatProps {
  reportContext: string;
  onRevalidate: (ideaText: string) => void;
}

const SUGGESTIONS = [
  "What if I pivot to B2B?",
  "How do I differentiate?",
  "What's my go-to-market?",
  "Who's my ideal first user?",
];

export function FollowUpChat({ reportContext, onRevalidate }: FollowUpChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [inputValue]);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || inputValue).trim();
    if (!text || isTyping) return;
    setInputValue("");

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-followup', {
        body: {
          reportContext,
          messages: updated.map(m => ({ role: m.role, content: m.text })),
        },
      });
      if (error) throw error;

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: data.reply || "Let me think about that...",
      };
      setIsTyping(false);
      setMessages(prev => [...prev, aiMsg]);

      if (data.revalidate && data.params?.ideaText) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: `__REVALIDATE__${data.params.ideaText}`,
          }]);
        }, 500);
      }
    } catch (err: any) {
      setIsTyping(false);
      toast.error("Error: " + (err.message || "Unknown error"));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-3 w-full px-5 py-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/30 hover:bg-card transition-all duration-200"
      >
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-foreground">Ask a follow-up question</p>
          <p className="text-xs text-muted-foreground">Pivots, positioning, go-to-market, and more</p>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border/40 flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold font-nunito">Orbis AI</p>
          <p className="text-[11px] text-muted-foreground">Ask about pivots, positioning, or refine your idea</p>
        </div>
      </div>

      {/* Messages */}
      <div className="max-h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground text-center">Try asking:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border/60 bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => {
          if (msg.text.startsWith('__REVALIDATE__')) {
            const idea = msg.text.replace('__REVALIDATE__', '');
            return (
              <div key={msg.id} className="flex justify-start pl-10">
                <Button size="sm" variant="outline" onClick={() => onRevalidate(idea)} className="gap-1.5 rounded-xl text-xs">
                  <RotateCcw className="h-3 w-3" /> Re-validate: "{idea.slice(0, 40)}..."
                </Button>
              </div>
            );
          }
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isUser ? 'bg-primary/10' : 'bg-secondary'}`}>
                {isUser ? (
                  <User className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'bg-primary text-primary-foreground rounded-tr-md' : 'bg-secondary/70 text-foreground rounded-tl-md'}`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="bg-secondary/70 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1.5 items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/40 p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about this research..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary/30 transition-all disabled:opacity-50"
            disabled={isTyping}
          />
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || isTyping}
            className="h-10 w-10 rounded-xl shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
