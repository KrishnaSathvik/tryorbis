import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/UpgradeModal";
import {
  Mail,
  FileText,
  ArrowUpCircle,
  MessageSquareText,
  Trash2,
  LogOut,
  Shield,
  Sparkles,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FeedbackDrawer } from "@/components/FeedbackDrawer";

interface ProfileSheetProps {
  children: React.ReactNode;
}

export function ProfileSheet({ children }: ProfileSheetProps) {
  const { user, profile, signOut, isGuest } = useAuth();
  const { reportsUsed, maxReports, credits } = useCredits();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const displayName = profile?.display_name || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const reportPercent = maxReports > 0 ? (reportsUsed / maxReports) * 100 : 0;

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || "Failed to delete account");

      await signOut();
      toast.success("Your account has been permanently deleted.");
      setDeleteDialogOpen(false);
      setOpen(false);
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    } finally {
      setDeleting(false);
      setDeleteConfirmText("");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate("/");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="left" className="w-[340px] sm:w-[380px] p-0 rounded-r-2xl border-r-0 overflow-y-auto" aria-describedby={undefined}>
        <VisuallyHidden><SheetTitle>Profile</SheetTitle></VisuallyHidden>
        <div className="flex flex-col h-full">
          {/* Header / Avatar */}
          <div className="flex flex-col items-center pt-8 pb-6 px-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-primary">{initials}</span>
            </div>
            <h2 className="text-lg font-bold font-nunito">{displayName}</h2>
            {isGuest ? (
              <span className="text-xs bg-warning/10 text-warning px-2.5 py-1 rounded-full font-semibold mt-1.5">
                Guest Account
              </span>
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">{profile?.email || ""}</p>
            )}
          </div>

          <Separator />

          {/* Reports Section */}
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-primary" />
                Free Reports
              </div>
              <span className="text-sm font-bold text-primary">
                {reportsUsed} / {maxReports} used
              </span>
            </div>
            <Progress value={reportPercent} className="h-2 rounded-full" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              You get 2 free reports. Upgrade for unlimited access.
            </p>
          </div>

          <Separator />

          {/* Account Section */}
          <div className="px-6 py-4 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-3">
              Account
            </p>

            {!isGuest && profile?.email && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
            )}

            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Free Plan (2 reports)</span>
            </div>

            {isGuest && (
              <Button
                variant="outline"
                className="w-full rounded-xl gap-2 mt-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40"
                onClick={() => {
                  setOpen(false);
                  navigate("/auth");
                }}
              >
                <ArrowUpCircle className="h-4 w-4" />
                Upgrade to Full Account
              </Button>
            )}

            <Button
              className="w-full rounded-xl gap-2 mt-2 bg-foreground text-background hover:bg-foreground/90"
              onClick={() => setUpgradeOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
              Go Pro — Unlimited Reports
            </Button>
          </div>

          <Separator />

          {/* Actions */}
          <div className="px-6 py-4 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-3">
              Actions
            </p>

            <div className="px-3 py-2.5">
              <FeedbackDrawer />
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground rounded-xl transition-all hover:text-foreground hover:bg-accent w-full"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>

            <AlertDialog open={deleteDialogOpen} onOpenChange={(v) => { setDeleteDialogOpen(v); if (!v) setDeleteConfirmText(""); }}>
              <AlertDialogTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-destructive/70 rounded-xl transition-all hover:text-destructive hover:bg-destructive/5 w-full">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Account</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-nunito text-destructive">Delete Account Permanently?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <span className="block">
                      This will <strong className="text-foreground">permanently delete</strong> your entire account including:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>All saved ideas and backlog items</li>
                      <li>All research reports (Generate & Validate)</li>
                      <li>All chat conversations</li>
                      <li>Your profile data</li>
                    </ul>
                    <span className="block font-semibold text-destructive">
                      ⚠ This action cannot be undone.
                    </span>
                    <span className="block text-sm">
                      Type <strong className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded">DELETE</strong> to confirm:
                    </span>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-destructive/30 font-mono"
                      autoComplete="off"
                    />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmText !== "DELETE"}
                    variant="destructive"
                    className="rounded-xl"
                  >
                    {deleting ? "Deleting..." : "Delete My Account Forever"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Footer */}
          <div className="mt-auto px-6 py-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground/40 text-center">
              Orbis v1.0 · Your data is encrypted and secure
            </p>
          </div>
        </div>

        <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      </SheetContent>
    </Sheet>
  );
}
