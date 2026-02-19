import { useState, useRef, useEffect, useCallback } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Plus,
  Sparkles,
  User,
  Lightbulb,
  Target,
  Rocket,
  HelpCircle,
} from "lucide-react";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  { text: "I have an idea for a SaaS tool — help me think it through", icon: Lightbulb },
  { text: "What industries have the most unmet needs right now?", icon: Target },
  { text: "How do I find my first 100 users?", icon: Rocket },
  { text: "Help me decide between two startup ideas", icon: HelpCircle },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orbis-chat`;

export default function OrbisChat() {
  usePageTitle("Orbis AI Chat");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeConvoId, setActiveConvoId] = useState<string | null>(searchParams.get("c"));
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 140) + "px";
    }
  }, [input]);

  // Load from URL param
  useEffect(() => {
    const cId = searchParams.get("c");
    if (cId && cId !== activeConvoId) setActiveConvoId(cId);
  }, [searchParams]);

  // Load messages for active conversation (skip if we already have optimistic messages)
  const skipNextLoad = useRef(false);
  useEffect(() => {
    if (!activeConvoId) { setMessages([]); return; }
    if (skipNextLoad.current) { skipNextLoad.current = false; return; }
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", activeConvoId)
        .order("created_at", { ascending: true });
      setMessages((data as ChatMsg[]) || []);
    })();
  }, [activeConvoId]);

  const createConversation = async (firstMessage: string) => {
    if (!user) return null;
    const title = firstMessage.length > 60 ? firstMessage.slice(0, 60) + "…" : firstMessage;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();
    if (error || !data) { toast.error("Failed to create conversation"); return null; }
    setActiveConvoId(data.id);
    setSearchParams({ c: data.id });
    return data.id;
  };

  const persistMessage = async (convoId: string, role: "user" | "assistant", content: string) => {
    await supabase.from("chat_messages").insert({ conversation_id: convoId, role, content });
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || isStreaming) return;
    setInput("");

    let convoId = activeConvoId;
    if (!convoId) { skipNextLoad.current = true; convoId = await createConversation(text); if (!convoId) return; }

    const userMsg: ChatMsg = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setIsStreaming(true);
    await persistMessage(convoId, "user", text);

    let assistantContent = "";
    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: allMessages.map((m) => ({ role: m.role, content: m.content })) }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }
      if (!resp.body) throw new Error("No response stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {}
        }
      }

      if (assistantContent) await persistMessage(convoId, "assistant", assistantContent);
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convoId);
    } catch (err: any) {
      toast.error(err.message || "Failed to get response");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const startNewChat = () => {
    setActiveConvoId(null);
    setMessages([]);
    setSearchParams({});
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)] max-w-3xl mx-auto animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold font-nunito leading-tight">Orbis AI</p>
            <p className="text-[11px] text-muted-foreground/70">Your startup advisor</p>
          </div>
        </div>
        <Button
          onClick={startNewChat}
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-xl h-8 text-xs font-medium border-border/50 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          New Chat
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 -mx-1 min-h-0">
        <div className="px-1 py-4">
          {messages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center min-h-[55vh] space-y-8 animate-fade-in">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold font-nunito tracking-tight">What's on your mind?</h2>
                <p className="text-sm text-muted-foreground/80 max-w-sm leading-relaxed">
                  Let's brainstorm ideas, analyze markets, or sharpen your strategy.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 w-full max-w-md">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => sendMessage(s.text)}
                    className="group text-left text-[13px] leading-snug px-4 py-3.5 rounded-2xl border border-border/40 bg-background/80 text-muted-foreground hover:text-foreground hover:border-primary/25 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <s.icon className="h-4 w-4 text-primary/60 group-hover:text-primary mb-2 transition-colors" />
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                const isLastAssistant = !isUser && (i === messages.length - 1 || messages.slice(i + 1).every(m => m.role === "user"));
                const lowerContent = msg.content.toLowerCase();
                const showGenerate = !isUser && isLastAssistant && !isStreaming && (lowerContent.includes("generate") || lowerContent.includes("idea") || lowerContent.includes("pain point") || lowerContent.includes("unmet need"));
                const showValidate = !isUser && isLastAssistant && !isStreaming && (lowerContent.includes("validate") || lowerContent.includes("verdict") || lowerContent.includes("build") || lowerContent.includes("pivot"));
                return (
                  <div key={i} className="animate-fade-in">
                    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-1 ${
                        isUser ? "bg-primary/10" : "bg-gradient-to-br from-primary/15 to-primary/5"
                      }`}>
                        {isUser ? (
                          <User className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
                        isUser
                          ? "bg-primary text-primary-foreground rounded-tr-md shadow-md shadow-primary/10"
                          : "bg-secondary/60 text-foreground rounded-tl-md"
                      }`}>
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&>strong]:text-foreground">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                    {(showGenerate || showValidate) && (
                      <div className="flex gap-2 mt-2 ml-10">
                        {showGenerate && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl gap-1.5 text-xs h-8 border-primary/20 hover:bg-primary/5 hover:border-primary/40"
                            onClick={() => navigate("/generate")}
                          >
                            <Lightbulb className="h-3.5 w-3.5 text-primary" />
                            Generate Ideas
                          </Button>
                        )}
                        {showValidate && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl gap-1.5 text-xs h-8 border-primary/20 hover:bg-primary/5 hover:border-primary/40"
                            onClick={() => navigate("/validate")}
                          >
                            <Target className="h-3.5 w-3.5 text-primary" />
                            Validate Idea
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                  </div>
                  <div className="bg-secondary/60 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1.5 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="py-3 sm:py-4 px-1 shrink-0">
        <div className="flex items-end gap-2.5 p-1.5 rounded-2xl border border-border/50 bg-background shadow-sm focus-within:border-primary/30 focus-within:shadow-md focus-within:shadow-primary/5 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Orbis anything..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none disabled:opacity-50"
            disabled={isStreaming}
          />
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            className="h-9 w-9 rounded-xl shrink-0 shadow-none"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
          Orbis AI may make mistakes. Validate important insights.
        </p>
      </div>
    </div>
  );
}
