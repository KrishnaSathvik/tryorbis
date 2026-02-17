import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import orbisLogo from "@/assets/orbis-logo.png";

export default function Auth() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setLoading(true);
    try {
      await signUp(name.trim(), email.trim() || undefined);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md rounded-[32px] border border-border/50 shadow-xl animate-slide-up">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <img src={orbisLogo} alt="Orbis" className="h-14 w-14 mx-auto" />
            <h1 className="text-2xl font-bold tracking-tight font-nunito">
              Join <span className="text-gradient-primary">Orbis</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Pick a name and start discovering product ideas instantly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Name *</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex"
                className="rounded-xl"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Email <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Only used if you want to recover your account later.</p>
            </div>
            <Button type="submit" className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90" disabled={loading}>
              {loading ? "Creating account..." : "Start Exploring →"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
