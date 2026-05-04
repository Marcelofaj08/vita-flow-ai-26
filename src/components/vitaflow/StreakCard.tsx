import { Flame, Trophy, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useStreak } from "@/hooks/useStreak";

export const StreakCard = () => {
  const { streak, weekly, loading } = useStreak();

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-card border border-border/60 p-5 shadow-soft animate-pulse h-32" />
    );
  }

  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;

  return (
    <div className="rounded-2xl bg-gradient-card border border-border/60 p-5 shadow-soft">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-hero flex items-center justify-center">
            <Flame className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="text-3xl font-bold leading-none">{current} <span className="text-base font-medium text-muted-foreground">dias</span></div>
            <div className="text-sm text-muted-foreground mt-1">Sequência atual</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="font-semibold">{longest}</span>
            <span className="text-muted-foreground">recorde</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-semibold">{weekly.percent}%</span>
            <span className="text-muted-foreground">semana</span>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Progresso semanal</span>
          <span>{weekly.done}/{weekly.total} tarefas</span>
        </div>
        <Progress value={weekly.percent} className="h-2" />
      </div>
    </div>
  );
};