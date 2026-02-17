import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, Sparkles, Rocket } from "lucide-react";

const CREDIT_PACKS = [
  { name: "Starter", credits: 10, price: "$5", priceId: "price_1T1sjACdTY1cTZAe7ASHex1C", icon: Zap },
  { name: "Pro", credits: 50, price: "$20", priceId: "price_1T1sjTCdTY1cTZAe4geYvcD7", icon: Sparkles },
  { name: "Power", credits: 100, price: "$35", priceId: "price_1T1sjdCdTY1cTZAel26iNNkH", icon: Rocket },
];

interface PaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Paywall({ open, onOpenChange }: PaywallProps) {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  const handlePurchase = async (pack: typeof CREDIT_PACKS[0]) => {
    setLoadingPack(pack.priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: pack.priceId, credits: pack.credits },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast.error("Failed to start checkout: " + (err.message || "Unknown error"));
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-nunito">You're out of credits</DialogTitle>
          <DialogDescription>
            Each Generate or Validate action costs 1 credit. Pick a pack to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.priceId}
              onClick={() => handlePurchase(pack)}
              disabled={loadingPack !== null}
              className="w-full flex items-center gap-4 rounded-xl border border-border/50 p-4 hover:bg-accent transition-colors text-left disabled:opacity-50"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <pack.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{pack.name}</p>
                <p className="text-xs text-muted-foreground">{pack.credits} credits</p>
              </div>
              <span className="font-semibold text-sm">{pack.price}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
