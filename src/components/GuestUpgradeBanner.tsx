import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, Eye, EyeOff } from "lucide-react";

export function GuestUpgradeBanner() {
  const { isGuest, upgradeGuest } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isGuest) return null;

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter your email"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await upgradeGuest(email.trim(), password);
      toast.success("Account upgraded! Your data is preserved.");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to upgrade");
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-warning/5 border border-warning/15 rounded-xl px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
          <Shield className="h-3.5 w-3.5 text-warning shrink-0" />
          <span className="truncate"><strong className="text-foreground">Guest mode</strong> — upgrade to keep data</span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-full text-xs h-7 px-3 shrink-0 border-warning/30 text-warning hover:bg-warning/10 hover:text-warning">Upgrade</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-[24px]">
            <DialogHeader>
              <DialogTitle className="font-nunito">Upgrade Your Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpgrade} className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="rounded-xl pr-10" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">All your ideas, validations, and chat history will be preserved.</p>
              <Button type="submit" className="w-full rounded-full" disabled={loading}>
                {loading ? "Upgrading..." : "Upgrade Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
