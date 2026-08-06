import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [maxCredits, setMaxCredits] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(null);
      setUnavailable(false);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("credits, max_credits")
      .eq("user_id", user.id)
      .single();

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
  }, [user]);

  useEffect(() => {
    setLoading(true);
    setUnavailable(false);
    setCredits(null);
    fetchCredits();
  }, [fetchCredits]);

  const deductCredit = useCallback(async () => {
    if (!user || credits === null || credits <= 0) return false;
    const { data: deducted, error } = await supabase.rpc("try_deduct_credit", { p_user_id: user.id });
    if (error || !deducted) return false;
    setCredits((prev) => (prev !== null ? prev - 1 : null));
    setTimeout(() => fetchCredits(), 100);
    return true;
  }, [user, credits, fetchCredits]);

  const refreshCredits = useCallback(() => fetchCredits(), [fetchCredits]);

  const remaining = credits;
  const safeCredits = credits ?? 0;

  return {
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
}
