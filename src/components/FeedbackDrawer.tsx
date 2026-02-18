import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquareText, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function FeedbackDrawer() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed || trimmed.length > 1000) {
      toast.error(trimmed ? "Message too long (max 1000 chars)" : "Please enter a message");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        user_id: user?.id || "anonymous",
        email: email.trim() || (user?.email ?? null),
        category,
        message: trimmed,
      });
      if (error) throw error;
      toast.success("Thanks for your feedback!");
      setMessage("");
      setEmail("");
      setCategory("general");
      setOpen(false);
    } catch (err: any) {
      toast.error("Failed to submit: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
          <MessageSquareText className="h-3 w-3" />
          Feedback
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-nunito">Send Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="bug">Bug Report</SelectItem>
              <SelectItem value="feature">Feature Request</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="What's on your mind? We read every message."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] rounded-xl resize-none"
            maxLength={1000}
          />
          {!user && (
            <Input
              type="email"
              placeholder="Email (optional, for follow-up)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl"
            />
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{message.length}/1000</span>
            <Button onClick={handleSubmit} disabled={!message.trim() || submitting} className="rounded-full gap-1.5" size="sm">
              <Send className="h-3.5 w-3.5" />
              {submitting ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
