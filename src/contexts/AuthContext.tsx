import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: { display_name: string; email?: string } | null;
  loading: boolean;
  signUp: (displayName: string, email?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ display_name: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    // Retry a few times since the profile trigger may not have fired yet
    for (let i = 0; i < 3; i++) {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("user_id", userId)
        .single();
      if (data) { setProfile(data); return; }
      if (i < 2) await new Promise(r => setTimeout(r, 500));
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initialize session
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        const u = session?.user ?? null;
        setUser(u);
        if (u) await fetchProfile(u.id);
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          // Don't await in the callback — fetch profile in background
          fetchProfile(u.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (displayName: string, email?: string) => {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) throw error;

    // Update profile with email if provided
    if (email && data.user) {
      await supabase
        .from("profiles")
        .update({ email })
        .eq("user_id", data.user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
