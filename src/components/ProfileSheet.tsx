import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Mail,
  Zap,
  ArrowUpCircle,
  MessageSquareText,
  Trash2,
  LogOut,
  Shield,
  Clock,
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
  const { credits, maxCredits, timeLeft } = useCredits();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const displayName = profile?.display_name || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const creditPercent = maxCredits > 0 ? (credits / maxCredits) * 100 : 0;

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Delete user data (cascades via RLS)
      await Promise.all([
        supabase.from("backlog_items").delete().eq("user_id", user.id),
        supabase.from("generator_runs").delete().eq("user_id", user.id),
        supabase.from("validation_reports").delete().eq("user_id", user.id),
        supabase.from("conversations").delete().eq("user_id", user.id),
      ]);
      await signOut();
      toast.success("Account data deleted. You've been signed out.");
      setOpen(false);
      navigate("/");
    } catch (err: any) {
      toast.error("Failed to delete account data");
    } finally {
      setDeleting(false);
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
      <SheetContent side="left" className="w-[340px] sm:w-[380px] p-0 rounded-r-2xl border-r-0 overflow-y-auto">
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

          {/* Credits Section */}
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Zap className="h-4 w-4 text-primary" />
                Credits
              </div>
              <span className="text-sm font-bold text-primary">
                {credits} / {maxCredits}
              </span>
            </div>
            <Progress value={creditPercent} className="h-2 rounded-full" />
            {credits === 0 && timeLeft && (
              <div className="flex items-center gap-1.5 text-xs text-warning">
                <Clock className="h-3 w-3" />
                Resets in {timeLeft}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Generate Ideas costs 1 credit (3 for Deep Research). Validate Idea costs 1 credit. Credits auto-refill 24h after depletion.
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
              <span>{isGuest ? "Guest (5 credits)" : "Registered (20 credits)"}</span>
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

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-destructive/70 rounded-xl transition-all hover:text-destructive hover:bg-destructive/5 w-full">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Account Data</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-nunito">Delete Account Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your saved ideas, research history, and conversations. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Deleting..." : "Delete Everything"}
                  </AlertDialogAction>
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
      </SheetContent>
    </Sheet>
  );
}
