import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, ArrowRight } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const { user, profile, isGuest } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoinWaitlist = async () => {
    const waitlistEmail = isGuest || !profile?.email ? email.trim() : profile.email;
    if (!waitlistEmail) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("waitlist").insert({
        email: waitlistEmail,
        user_id: user?.id ?? null,
      });
      if (error) throw error;
      setJoined(true);
      toast.success("You're on the list! We'll notify you when unlimited launches.");
    } catch (err: any) {
      if (err.message?.includes("duplicate")) {
        toast.info("You're already on the waitlist!");
        setJoined(true);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="font-nunito text-xl text-center">
            You've used your 2 free reports
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Upgrade to unlimited reports for $19/month.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Pricing display */}
          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-extrabold font-nunito">$19</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Unlimited reports, AI advisor, idea backlog
              </p>
            </div>
          </div>

          {/* Email input for guests / users without email */}
          {(isGuest || !profile?.email) && !joined && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Your email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-xl"
              />
            </div>
          )}

          {/* CTA */}
          {joined ? (
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-primary">You're on the waitlist!</p>
              <p className="text-xs text-muted-foreground">We'll email you when unlimited access launches.</p>
              <Button
                variant="outline"
                className="w-full rounded-full mt-2"
                onClick={() => onOpenChange(false)}
              >
                Got it
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleJoinWaitlist}
              disabled={loading}
              className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 gap-2 text-base hover:-translate-y-0.5 transition-all shadow-lg"
            >
              {loading ? "Joining..." : "Join the waitlist for unlimited access"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          )}

          <p className="text-[11px] text-muted-foreground text-center">
            Coming soon. No charge until launch.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
