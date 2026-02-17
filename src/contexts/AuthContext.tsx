import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: { display_name: string; email?: string } | null;
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInAsGuest: (displayName: string) => Promise<void>;
  upgradeGuest: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Anti-abuse: fingerprint via localStorage
const FINGERPRINT_KEY = "orbis_device_fp";
function getDeviceFingerprint(): string {
  let fp = localStorage.getItem(FINGERPRINT_KEY);
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem(FINGERPRINT_KEY, fp);
  }
  return fp;
}

const SIGNUP_TRACKER_KEY = "orbis_signup_count";
function getSignupCount(): number {
  return parseInt(localStorage.getItem(SIGNUP_TRACKER_KEY) || "0", 10);
}
function incrementSignupCount() {
  localStorage.setItem(SIGNUP_TRACKER_KEY, String(getSignupCount() + 1));
}
const MAX_SIGNUPS_PER_DEVICE = 3;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ display_name: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const isGuest = !!user?.is_anonymous;

  const fetchProfile = async (userId: string) => {
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

  const saveFingerprint = async (userId: string) => {
    const fp = getDeviceFingerprint();
    await supabase.from("profiles").update({ device_fingerprint: fp }).eq("user_id", userId);
  };

  useEffect(() => {
    let mounted = true;
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
          fetchProfile(u.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    if (getSignupCount() >= MAX_SIGNUPS_PER_DEVICE) {
      throw new Error("Too many accounts created from this device. Please contact support.");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
    if (data.user) {
      incrementSignupCount();
      await saveFingerprint(data.user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInAsGuest = async (displayName: string) => {
    if (getSignupCount() >= MAX_SIGNUPS_PER_DEVICE) {
      throw new Error("Too many accounts created from this device. Please contact support.");
    }

    const { data, error } = await supabase.auth.signInAnonymously({
      options: { data: { display_name: displayName || "Guest" } },
    });
    if (error) throw error;
    if (data.user) {
      incrementSignupCount();
      await saveFingerprint(data.user.id);
    }
  };

  const upgradeGuest = async (email: string, password: string) => {
    const { error } = await supabase.auth.updateUser({
      email,
      password,
    });
    if (error) throw error;
    // Update profile email
    if (user) {
      await supabase.from("profiles").update({ email }).eq("user_id", user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isGuest, signUp, signIn, signInAsGuest, upgradeGuest, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
