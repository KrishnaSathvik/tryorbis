import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useCredits } from "@/hooks/useCredits";
import { isQuotaExhausted } from "@/lib/quotaExhausted";
import { MessageSquare, Archive, FileText, Sparkles } from "lucide-react";

/**
 * Compact dashboard surface when free research reports are exhausted.
 * Replaces the need to misuse GuestUpgradeBanner (guest→account conversion).
 */
export function PostQuotaContinuationPanel() {
  const { remaining, loading, unavailable } = useCredits();
  const navigate = useNavigate();
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  if (!isQuotaExhausted({ remaining, loading, unavailable })) {
    return null;
  }

  return (
    <section
      className="rounded-2xl border border-border/60 bg-secondary/40 px-5 py-4 space-y-3"
      aria-labelledby="post-quota-heading"
      data-testid="post-quota-continuation-panel"
    >
      <div className="space-y-1">
        <h2 id="post-quota-heading" className="font-nunito text-base font-semibold">
          You've used your free research reports
        </h2>
        <p className="text-sm text-muted-foreground">
          Generate and Validate need available reports. You can still use Orbis AI, review saved
          work, or join the Pro waitlist. Joining does not restore reports.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="rounded-full h-10 gap-2"
          onClick={() =>
            navigate("/chat", {
              state: { focusComposer: true, source: "quota_exhausted" },
            })
          }
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          Continue with Orbis AI
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-full h-10 gap-2 text-muted-foreground"
          onClick={() => navigate("/ideas")}
        >
          <Archive className="h-4 w-4" aria-hidden="true" />
          My Ideas
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-full h-10 gap-2 text-muted-foreground"
          onClick={() => navigate("/history")}
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          History
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-full h-10 gap-2 sm:ml-auto"
          onClick={() => setWaitlistOpen(true)}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Join waitlist
        </Button>
      </div>

      <UpgradeModal
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        mode="quota_exhausted"
        source="dashboard"
      />
    </section>
  );
}
