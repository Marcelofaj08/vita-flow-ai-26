import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type StreakData = {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  total_completions: number;
};

export type WeeklyProgress = {
  done: number;
  total: number;
  percent: number;
};

export function useStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [weekly, setWeekly] = useState<WeeklyProgress>({ done: 0, total: 21, percent: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setStreak(null);
      setWeekly({ done: 0, total: 21, percent: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startISO = sevenDaysAgo.toISOString().slice(0, 10);

    const [{ data: s }, { data: progress }] = await Promise.all([
      supabase.from("user_streaks").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("daily_progress")
        .select("id, day, completed")
        .eq("user_id", user.id)
        .gte("day", startISO),
    ]);

    setStreak(
      s
        ? {
            current_streak: s.current_streak,
            longest_streak: s.longest_streak,
            last_active_date: s.last_active_date,
            total_completions: s.total_completions,
          }
        : { current_streak: 0, longest_streak: 0, last_active_date: null, total_completions: 0 }
    );

    const done = (progress ?? []).filter((p) => p.completed).length;
    const total = 21; // 3 tasks/day x 7 days target
    setWeekly({ done, total, percent: Math.min(100, Math.round((done / total) * 100)) });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const completeTask = useCallback(
    async (taskKey: string, taskType: string = "general") => {
      if (!user) return;
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase
        .from("daily_progress")
        .insert({ user_id: user.id, day: today, task_key: taskKey, task_type: taskType, completed: true });
      if (!error || error.code === "23505") {
        // Either inserted or already exists for today — update streak only on first of the day
        await supabase.rpc("update_streak", { _user_id: user.id });
      }
      await load();
    },
    [user, load]
  );

  return { streak, weekly, loading, completeTask, refresh: load };
}