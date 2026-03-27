import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
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
  const initializedRef = useRef(false);

  const isGuest = !!user?.is_anonymous;

  const fetchProfile = async (userId: string) => {
    for (let i = 0; i < 5; i++) {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("display_name, email")
          .eq("user_id", userId)
          .single();
        if (data) { setProfile(data); return; }
      } catch {
        // ignore fetch errors during retries
      }
      if (i < 4) await new Promise(r => setTimeout(r, 600));
    }
    // Even if profile fetch fails, don't block the user — set a fallback
    setProfile({ display_name: "User" });
  };

  const saveFingerprint = async (userId: string) => {
    try {
      const fp = getDeviceFingerprint();
      await supabase.from("profiles").update({ device_fingerprint: fp }).eq("user_id", userId);
    } catch {
      // Non-critical — don't block auth flow
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Set up listener FIRST (before getSession) to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => {
            if (mounted) fetchProfile(u.id);
          }, 0);
        } else {
          setProfile(null);
        }
        // Only set loading=false from onAuthStateChange AFTER initial load is done
        if (initializedRef.current) {
          // Don't set loading false here — initial load handles it
        }
      }
    );

    // 2. Then do the initial session check
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
        if (mounted) {
          initializedRef.current = true;
          setLoading(false);
        }
      }
    };
    init();

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
      // Wait briefly for the trigger to create the profile
      await new Promise(r => setTimeout(r, 300));
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
      // Wait for the handle_new_user trigger to create the profile
      await new Promise(r => setTimeout(r, 500));
      await saveFingerprint(data.user.id);
      await fetchProfile(data.user.id);
    }
  };

  const upgradeGuest = async (email: string, password: string) => {
    const { error } = await supabase.auth.updateUser({
      email,
      password,
    });
    if (error) throw error;
    if (user) {
      await supabase
        .from("profiles")
        .update({ email })
        .eq("user_id", user.id);
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
