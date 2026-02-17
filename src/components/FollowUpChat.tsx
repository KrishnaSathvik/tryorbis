import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, MessageSquare, RotateCcw } from "lucide-react";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface FollowUpChatProps {
  reportContext: string;
  onRevalidate: (ideaText: string) => void;
}

export function FollowUpChat({ reportContext, onRevalidate }: FollowUpChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = inputValue.trim();
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
        // Show a re-validate button after the message
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

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)} className="gap-2">
        <MessageSquare className="h-4 w-4" /> Ask a follow-up question
      </Button>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="bg-muted/30 px-4 py-2.5 border-b flex items-center justify-between">
        <p className="text-sm font-medium">Follow-up Chat</p>
        <p className="text-xs text-muted-foreground">Ask about pivots, positioning, or refine your idea</p>
      </div>
      <div className="max-h-80 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Try: "What if I pivot to B2B?" or "How could I differentiate from competitors?"
          </p>
        )}
        {messages.map((msg) => {
          if (msg.text.startsWith('__REVALIDATE__')) {
            const idea = msg.text.replace('__REVALIDATE__', '');
            return (
              <div key={msg.id} className="flex justify-start">
                <Button size="sm" variant="outline" onClick={() => onRevalidate(idea)} className="gap-1.5">
                  <RotateCcw className="h-3 w-3" /> Re-validate: "{idea.slice(0, 50)}..."
                </Button>
              </div>
            );
          }
          return (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 items-center">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="What if I pivot to B2B instead?"
            className="flex-1"
            disabled={isTyping}
          />
          <Button size="icon" onClick={sendMessage} disabled={!inputValue.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
