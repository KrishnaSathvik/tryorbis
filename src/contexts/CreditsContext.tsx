/* eslint-disable react-refresh/only-export-components -- provider + hook mirror AuthContext */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type CreditsContextValue = {
  credits: number;
  remaining: number | null;
  maxCredits: number;
  reportsUsed: number;
  maxReports: number;
  loading: boolean;
  unavailable: boolean;
  hasCredits: boolean;
  deductCredit: () => Promise<boolean>;
  refreshCredits: () => Promise<void>;
};

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [credits, setCredits] = useState<number | null>(null);
  const [maxCredits, setMaxCredits] = useState<number>(2);
  const [loading, setLoading] = useState(!!userId);
  const [unavailable, setUnavailable] = useState(false);

  const requestIdRef = useRef(0);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const fetchCredits = useCallback(async (forUserId: string | null) => {
    const requestId = ++requestIdRef.current;

    if (!forUserId) {
      if (requestId !== requestIdRef.current) return;
      setCredits(null);
      setUnavailable(false);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("credits, max_credits")
      .eq("user_id", forUserId)
      .single();

    // Drop stale responses after user switch or a newer request
    if (requestId !== requestIdRef.current || userIdRef.current !== forUserId) {
      return;
    }

    if (error || !data) {
      setCredits(null);
      setUnavailable(true);
      setLoading(false);
      return;
    }

    setCredits(data.credits ?? 0);
    setMaxCredits(data.max_credits ?? 2);
    setUnavailable(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Clear prior user's allowance immediately on auth transition
    setCredits(null);
    setUnavailable(false);
    setLoading(!!userId);
    void fetchCredits(userId);
  }, [userId, fetchCredits]);

  const refreshCredits = useCallback(async () => {
    await fetchCredits(userIdRef.current);
  }, [fetchCredits]);

  const deductCredit = useCallback(async () => {
    const currentUserId = userIdRef.current;
    if (!currentUserId || credits === null || credits <= 0) return false;
    const { data: deducted, error } = await supabase.rpc("try_deduct_credit", {
      p_user_id: currentUserId,
    });
    if (error || !deducted) return false;
    setCredits((prev) => (prev !== null ? prev - 1 : null));
    setTimeout(() => {
      void fetchCredits(userIdRef.current);
    }, 100);
    return true;
  }, [credits, fetchCredits]);

  const remaining = credits;
  const safeCredits = credits ?? 0;

  const value: CreditsContextValue = {
    credits: safeCredits,
    remaining,
    maxCredits,
    reportsUsed: maxCredits - safeCredits,
    maxReports: maxCredits,
    loading,
    unavailable,
    hasCredits: safeCredits > 0,
    deductCredit,
    refreshCredits,
  };

  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}

export function useCredits(): CreditsContextValue {
  const ctx = useContext(CreditsContext);
  if (!ctx) throw new Error("useCredits must be used within CreditsProvider");
  return ctx;
}
