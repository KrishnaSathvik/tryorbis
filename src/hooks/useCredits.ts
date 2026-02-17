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
    if (data) setCredits((data as any).credits ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  const deductCredit = useCallback(async () => {
    if (!user || credits === null || credits <= 0) return false;
    const { error } = await supabase
      .from("profiles")
      .update({ credits: credits - 1 } as any)
      .eq("user_id", user.id);
    if (error) return false;
    setCredits(prev => (prev !== null ? prev - 1 : null));
    return true;
  }, [user, credits]);

  const refreshCredits = useCallback(() => fetchCredits(), [fetchCredits]);

  return {
    credits: credits ?? 0,
    loading,
    hasCredits: (credits ?? 0) > 0,
    deductCredit,
    refreshCredits,
  };
}
