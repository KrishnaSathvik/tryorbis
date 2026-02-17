import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import orbisLogo from "@/assets/orbis-logo.png";
import {
  Send,
  Plus,
  Sparkles,
  User,
  MessageSquare,
  Trash2,
  Loader2,
  Lightbulb,
  Target,
  Rocket,
  HelpCircle,
} from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

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
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
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

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false });
    setConversations((data as Conversation[]) || []);
    setLoadingConvos(false);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!activeConvoId) { setMessages([]); return; }
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
    const title = firstMessage.length > 50 ? firstMessage.slice(0, 50) + "…" : firstMessage;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();
    if (error || !data) { toast.error("Failed to create conversation"); return null; }
    const newConvo: Conversation = { id: data.id, title, updated_at: new Date().toISOString() };
    setConversations((prev) => [newConvo, ...prev]);
    setActiveConvoId(data.id);
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
    if (!convoId) { convoId = await createConversation(text); if (!convoId) return; }

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
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

  const deleteConversation = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvoId === id) { setActiveConvoId(null); setMessages([]); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const startNewChat = () => { setActiveConvoId(null); setMessages([]); };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-0 p-4 animate-fade-in">
      {/* Conversation sidebar */}
      <div className="w-72 shrink-0 flex flex-col rounded-l-2xl border border-r-0 border-border/50 bg-secondary/30 overflow-hidden">
        {/* Sidebar header */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            <img src={orbisLogo} alt="Orbis" className="h-5 w-5 dark-invert" />
            <span className="text-sm font-bold font-nunito text-foreground">Conversations</span>
          </div>
          <Button
            onClick={startNewChat}
            variant="outline"
            size="sm"
            className="w-full gap-2 rounded-xl h-9 text-xs font-medium border-border/50 bg-background/80 hover:bg-background shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </Button>
        </div>

        {/* Conversation list */}
        <ScrollArea className="flex-1">
          <div className="px-2 pb-2 space-y-0.5">
            {loadingConvos ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-xs text-muted-foreground/60">
                  No conversations yet
                </p>
              </div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    activeConvoId === c.id
                      ? "bg-background shadow-sm border border-border/50"
                      : "hover:bg-background/60"
                  }`}
                  onClick={() => setActiveConvoId(c.id)}
                >
                  <MessageSquare className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${activeConvoId === c.id ? "text-primary" : "text-muted-foreground/50"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs truncate ${activeConvoId === c.id ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {c.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                      {formatDate(c.updated_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground/40 hover:text-destructive transition-colors" />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col rounded-r-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-border/30 flex items-center gap-3 bg-background/50">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold font-nunito leading-tight">Orbis AI</p>
            <p className="text-[11px] text-muted-foreground/70">
              Brainstorm, strategize, refine your ideas
            </p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-6 max-w-2xl mx-auto">
            {messages.length === 0 && !isStreaming ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 animate-fade-in">
                <div className="relative">
                  <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/5">
                    <Sparkles className="h-9 w-9 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500/90 flex items-center justify-center border-2 border-background">
                    <span className="text-[10px] text-white">✓</span>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold font-nunito tracking-tight">
                    What's on your mind?
                  </h2>
                  <p className="text-sm text-muted-foreground/80 max-w-sm leading-relaxed">
                    I'm your AI startup advisor. Let's brainstorm ideas, analyze markets, or sharpen your strategy.
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
                  return (
                    <div key={i} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} animate-fade-in`}>
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
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>strong]:text-foreground">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
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
        <div className="border-t border-border/30 p-4 bg-background/50">
          <div className="max-w-2xl mx-auto">
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
      </div>
    </div>
  );
}
