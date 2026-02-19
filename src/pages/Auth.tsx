import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import orbisLogo from "@/assets/orbis-logo.png";
import { Eye, EyeOff, Zap, Sparkles } from "lucide-react";

export default function Auth() {
  usePageTitle("Sign In");
  const { signUp, signIn, signInAsGuest, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isGuestMode = searchParams.get("mode") === "guest";
  const [loading, setLoading] = useState(false);

  // Sign Up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignUpPw, setShowSignUpPw] = useState(false);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPw, setShowSignInPw] = useState(false);

  // Guest state
  const [guestName, setGuestName] = useState("");

  // Redirect if already logged in (but not if anonymous/guest wanting to upgrade)
  if (user && !user.is_anonymous) { navigate("/dashboard", { replace: true }); return null; }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim()) { toast.error("Please enter your name"); return; }
    if (!signUpEmail.trim()) { toast.error("Please enter your email"); return; }
    if (signUpPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await signUp(signUpEmail.trim(), signUpPassword, signUpName.trim());
      toast.success("Account created! Welcome to Orbis.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      await signIn(signInEmail.trim(), signInPassword);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    } finally { setLoading(false); }
  };

  const handleGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInAsGuest(guestName.trim());
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  if (isGuestMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md rounded-[32px] border border-border/50 shadow-xl animate-slide-up">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <a href="/" className="cursor-pointer"><img src={orbisLogo} alt="Orbis" className="h-14 w-14 mx-auto dark-invert" /></a>
              <h1 className="text-2xl font-bold tracking-tight font-nunito">
                Welcome to <a href="/" className="text-gradient-primary hover:opacity-80 transition-opacity">Orbis</a>
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-powered product research & validation
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 rounded-xl p-3">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Continue as guest with free credits. <strong className="text-foreground">No account needed.</strong></span>
            </div>

            <form onSubmit={handleGuest} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nickname <span className="text-muted-foreground font-normal">(optional)</span></label>
                <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="e.g. Explorer" className="rounded-xl" autoFocus />
              </div>
              <Button type="submit" className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90" disabled={loading}>
                {loading ? "Creating your guest workspace…" : "Start instantly with 5 credits →"}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">Upgrade later to save your research.</p>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <button onClick={() => navigate("/auth")} className="text-primary hover:underline font-medium">Log in</button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md rounded-[32px] border border-border/50 shadow-xl animate-slide-up">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <a href="/" className="cursor-pointer"><img src={orbisLogo} alt="Orbis" className="h-14 w-14 mx-auto dark-invert" /></a>
            <h1 className="text-2xl font-bold tracking-tight font-nunito">
              Welcome to <a href="/" className="text-gradient-primary hover:opacity-80 transition-opacity">Orbis</a>
            </h1>
            <p className="text-sm text-muted-foreground">
              AI-powered product research & validation
            </p>
          </div>

          <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-xl">
              <TabsTrigger value="signup" className="rounded-lg text-xs">Sign Up</TabsTrigger>
              <TabsTrigger value="signin" className="rounded-lg text-xs">Log In</TabsTrigger>
              <TabsTrigger value="guest" className="rounded-lg text-xs">Guest</TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="mt-4">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Name</label>
                  <Input value={signUpName} onChange={e => setSignUpName(e.target.value)} placeholder="Your name" className="rounded-xl" autoFocus />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} placeholder="you@example.com" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Input type={showSignUpPw ? "text" : "password"} value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} placeholder="Min 6 characters" className="rounded-xl pr-10" />
                    <button type="button" onClick={() => setShowSignUpPw(!showSignUpPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showSignUpPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 rounded-xl p-3">
                  <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>You'll get <strong className="text-foreground">20 free credits</strong> to explore Orbis</span>
                </div>
                <Button type="submit" className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account →"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signin" className="mt-4">
              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} placeholder="you@example.com" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Input type={showSignInPw ? "text" : "password"} value={signInPassword} onChange={e => setSignInPassword(e.target.value)} placeholder="Your password" className="rounded-xl pr-10" />
                    <button type="button" onClick={() => setShowSignInPw(!showSignInPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showSignInPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90" disabled={loading}>
                  {loading ? "Signing in..." : "Log In →"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="guest" className="mt-4">
              <form onSubmit={handleGuest} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nickname <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="e.g. Explorer" className="rounded-xl" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-warning/10 rounded-xl p-3">
                  <Zap className="h-3.5 w-3.5 text-warning shrink-0" />
                  <span>Guest accounts get <strong className="text-foreground">5 credits</strong>. Sign up later to upgrade & keep your data.</span>
                </div>
                <Button type="submit" variant="outline" className="w-full rounded-full" disabled={loading}>
                  {loading ? "Starting..." : "Try as Guest →"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
