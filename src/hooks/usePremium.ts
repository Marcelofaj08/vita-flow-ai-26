import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const FREE_AI_LIMIT = 5;
export const FREE_ROUTINE_LIMIT = 1;

export type PremiumState = {
  isPremium: boolean;
  loading: boolean;
  aiUsedToday: number;
  aiRemaining: number;
  refresh: () => Promise<void>;
};

export function usePremium(): PremiumState {
  const { user, loading: authLoading } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [aiUsedToday, setAiUsedToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setIsPremium(false);
      setAiUsedToday(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: sub }, { data: usage }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("usage_counters")
        .select("ai_messages")
        .eq("user_id", user.id)
        .eq("day", today)
        .maybeSingle(),
    ]);
    const active =
      sub?.plan === "premium" &&
      (sub.status === "active" || sub.status === "trialing") &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
    setIsPremium(!!active);
    setAiUsedToday(usage?.ai_messages ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  const aiRemaining = isPremium ? Infinity : Math.max(0, FREE_AI_LIMIT - aiUsedToday);

  return { isPremium, loading, aiUsedToday, aiRemaining, refresh: load };
}