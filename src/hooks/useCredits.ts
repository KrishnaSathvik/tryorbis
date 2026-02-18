import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [maxCredits, setMaxCredits] = useState<number>(20);
  const [resetAt, setResetAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!user) { setCredits(null); setResetAt(null); setLoading(false); return; }
    const { data } = await supabase
      .from("profiles")
      .select("credits, credits_reset_at, max_credits")
      .eq("user_id", user.id)
      .single();
    if (data) {
      // Check if reset time has passed client-side for immediate UI update
      if (data.credits_reset_at && new Date(data.credits_reset_at) <= new Date()) {
        setCredits(data.max_credits ?? 20);
        setResetAt(null);
      } else {
        setCredits(data.credits ?? 0);
        setResetAt(data.credits_reset_at ?? null);
      }
      setMaxCredits(data.max_credits ?? 20);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  // Countdown timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!resetAt) { setTimeLeft(null); return; }

    const update = () => {
      const diff = new Date(resetAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        setResetAt(null);
        fetchCredits(); // refetch to get refilled credits
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };

    update();
    timerRef.current = setInterval(update, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetAt, fetchCredits]);

  const deductCredit = useCallback(async () => {
    if (!user || credits === null || credits <= 0) return false;
    const { data: deducted, error } = await supabase.rpc('try_deduct_credit', { p_user_id: user.id });
    if (error || !deducted) return false;
    setCredits(prev => (prev !== null ? prev - 1 : null));
    setTimeout(() => fetchCredits(), 100);
    return true;
  }, [user, credits, fetchCredits]);

  const refreshCredits = useCallback(() => fetchCredits(), [fetchCredits]);

  return {
    credits: credits ?? 0,
    maxCredits,
    loading,
    hasCredits: (credits ?? 0) > 0,
    deductCredit,
    refreshCredits,
    resetAt,
    timeLeft,
  };
}
