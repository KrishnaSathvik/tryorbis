import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!user) { setCredits(null); setLoading(false); return; }
    const { data } = await supabase
      .from("profiles")
      .select("credits")
      .eq("user_id", user.id)
      .single();
    if (data) setCredits(data.credits ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  const deductCredit = useCallback(async () => {
    if (!user || credits === null || credits <= 0) return false;
    // Use atomic server-side credit deduction
    const { data: deducted, error } = await supabase.rpc('try_deduct_credit', { p_user_id: user.id });
    if (error || !deducted) return false;
    setCredits(prev => (prev !== null ? prev - 1 : null));
    setTimeout(() => fetchCredits(), 100);
    return true;
  }, [user, credits, fetchCredits]);

  const refreshCredits = useCallback(() => fetchCredits(), [fetchCredits]);

  return {
    credits: credits ?? 0,
    loading,
    hasCredits: (credits ?? 0) > 0,
    deductCredit,
    refreshCredits,
  };
}
