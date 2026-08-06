import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { readWaitlistJoined, writeWaitlistJoined } from "@/lib/waitlistStorage";
import { toast } from "sonner";
import { Sparkles, ArrowRight, MessageSquare, Archive, FileText } from "lucide-react";

export type UpgradeModalMode = "general" | "quota_exhausted";
export type UpgradeModalSource =
  | "meter"
  | "generate"
  | "validate"
  | "dashboard"
  | "profile";

export interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: UpgradeModalMode;
  source?: UpgradeModalSource;
}

function waitlistIdentity(userId: string | undefined, email: string | undefined): string | null {
  if (userId) return userId;
  if (email) return email.trim().toLowerCase();
  return null;
}

export function UpgradeModal({
  open,
  onOpenChange,
  mode = "general",
  source,
}: UpgradeModalProps) {
  const { user, profile, isGuest } = useAuth();
  const { remaining, loading: creditsLoading, unavailable } = useCredits();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const identity = waitlistIdentity(user?.id, profile?.email ?? email);

  // Reset / hydrate waitlist state when modal opens or user changes
  useEffect(() => {
    if (!open) return;
    setEmail("");
    setSubmitting(false);
    setStatusMessage(null);
    setJoined(readWaitlistJoined(identity));
  }, [open, identity, user?.id]);

  // If reports become available while exhausted modal is open, close it
  useEffect(() => {
    if (!open || mode !== "quota_exhausted") return;
    if (creditsLoading || unavailable) return;
    if (remaining !== null && remaining > 0) {
      onOpenChange(false);
    }
  }, [open, mode, creditsLoading, unavailable, remaining, onOpenChange]);

  const handleJoinWaitlist = async () => {
    if (submitting) return;
    const waitlistEmail = isGuest || !profile?.email ? email.trim() : profile.email;
    if (!waitlistEmail) {
      toast.error("Please enter your email");
      setStatusMessage("Please enter your email");
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);
    try {
      const { error } = await supabase.from("waitlist").insert({
        email: waitlistEmail,
        user_id: user?.id ?? null,
      });
      if (error) throw error;
      setJoined(true);
      writeWaitlistJoined(waitlistIdentity(user?.id, waitlistEmail));
      const msg = "You're on the list! We'll notify you when Pro launches. Your report count is unchanged.";
      setStatusMessage(msg);
      toast.success(msg);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : String(err ?? "");
      if (message.toLowerCase().includes("duplicate")) {
        setJoined(true);
        writeWaitlistJoined(waitlistIdentity(user?.id, waitlistEmail));
        const msg = "You're already on the waitlist!";
        setStatusMessage(msg);
        toast.info(msg);
      } else {
        const msg = "Something went wrong. Please try again.";
        setStatusMessage(msg);
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const closeAndNavigate = (path: string, state?: Record<string, unknown>) => {
    onOpenChange(false);
    if (state) {
      navigate(path, { state });
    } else {
      navigate(path);
    }
  };

  const isExhausted = mode === "quota_exhausted";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[24px] max-h-[min(90vh,720px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-nunito text-xl text-center">
            {isExhausted
              ? "You've used your free research reports"
              : "Orbis Pro — coming soon"}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            {isExhausted
              ? "Generate and Validate are paused for now, but you can still talk with Orbis AI, review your saved work, or join the Pro waitlist. Joining does not activate Pro or restore reports."
              : "Join the waitlist for unlimited research reports. Billing is not live yet — no charge until launch."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {!isExhausted && (
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-extrabold font-nunito">$19</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Planned: unlimited reports and Pro features
                </p>
              </div>
            </div>
          )}

          {isExhausted && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full rounded-full h-11 gap-2 text-base"
                onClick={() =>
                  closeAndNavigate("/chat", {
                    focusComposer: true,
                    source: "quota_exhausted",
                  })
                }
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Continue with Orbis AI
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full h-10 gap-1.5 text-sm text-muted-foreground"
                  onClick={() => closeAndNavigate("/ideas")}
                >
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                  My Ideas
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full h-10 gap-1.5 text-sm text-muted-foreground"
                  onClick={() => closeAndNavigate("/history")}
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                  History
                </Button>
              </div>
            </div>
          )}

          {(isGuest || !profile?.email) && !joined && (
            <div className="space-y-1.5">
              <label htmlFor="upgrade-waitlist-email" className="text-sm font-medium">
                Your email
              </label>
              <Input
                id="upgrade-waitlist-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-xl"
                disabled={submitting}
              />
            </div>
          )}

          {joined ? (
            <div className="text-center space-y-2" role="status" aria-live="polite">
              <p className="text-sm font-medium text-primary">You're on the waitlist!</p>
              <p className="text-xs text-muted-foreground">
                We'll email you when Pro launches. Your free report count stays the same.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full mt-2"
                onClick={() => onOpenChange(false)}
              >
                Got it
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => void handleJoinWaitlist()}
              disabled={submitting}
              aria-busy={submitting}
              className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2 text-base hover:-translate-y-0.5 transition-all shadow-lg h-11"
            >
              {submitting ? "Joining..." : "Join the Pro waitlist"}
              {!submitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </Button>
          )}

          <p className="text-[11px] text-muted-foreground text-center">
            Coming soon. No charge until launch.
            {source ? (
              <span className="sr-only"> Opened from {source}.</span>
            ) : null}
          </p>

          <div className="sr-only" aria-live="polite">
            {statusMessage}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
