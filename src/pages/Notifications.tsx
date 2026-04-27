import { useEffect, useState } from "react";
import { Layout } from "@/components/vitaflow/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentSubscription, pushSupported, subscribePush, unsubscribePush } from "@/lib/push";
import { useNavigate } from "react-router-dom";

type Prefs = {
  timezone: string;
  meals_enabled: boolean;
  meal_times: { breakfast: string; lunch: string; snack: string; dinner: string };
  workouts_enabled: boolean;
  workout_time: string;
  hydration_enabled: boolean;
  hydration_start: string;
  hydration_end: string;
  hydration_interval_minutes: number;
};

const DEFAULT_PREFS: Prefs = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo",
  meals_enabled: true,
  meal_times: { breakfast: "08:00", lunch: "12:30", snack: "16:00", dinner: "19:30" },
  workouts_enabled: true,
  workout_time: "18:00",
  hydration_enabled: true,
  hydration_start: "08:00",
  hydration_end: "22:00",
  hydration_interval_minutes: 120,
};

export default function Notifications() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const sub = await getCurrentSubscription();
      setSubscribed(!!sub);
      const { data } = await supabase
        .from("reminder_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPrefs({
          timezone: data.timezone,
          meals_enabled: data.meals_enabled,
          meal_times: (data.meal_times as Prefs["meal_times"]) ?? DEFAULT_PREFS.meal_times,
          workouts_enabled: data.workouts_enabled,
          workout_time: data.workout_time,
          hydration_enabled: data.hydration_enabled,
          hydration_start: data.hydration_start,
          hydration_end: data.hydration_end,
          hydration_interval_minutes: data.hydration_interval_minutes,
        });
      }
    })();
  }, [user]);

  const enable = async () => {
    setBusy(true);
    try {
      await subscribePush();
      setSubscribed(true);
      await savePrefs(prefs);
      toast.success("Notificações ativadas neste dispositivo");
    } catch (e: any) {
      toast.error(e.message || "Falha ao ativar notificações");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      await unsubscribePush();
      setSubscribed(false);
      toast.success("Notificações desativadas neste dispositivo");
    } catch (e: any) {
      toast.error(e.message || "Falha");
    } finally {
      setBusy(false);
    }
  };

  const savePrefs = async (p: Prefs) => {
    if (!user) return;
    const { error } = await supabase.from("reminder_preferences").upsert({
      user_id: user.id,
      ...p,
    });
    if (error) throw error;
  };

  const onSave = async () => {
    setBusy(true);
    try {
      await savePrefs(prefs);
      toast.success("Preferências salvas");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-push", {
        body: { title: "VitaFlow", body: "Notificação de teste 🎉", url: "/" },
      });
      if (error) throw error;
      toast.success(`Teste enviado (${(data as any)?.sent ?? 0} dispositivo(s))`);
    } catch (e: any) {
      toast.error(e.message || "Falha no teste");
    } finally {
      setBusy(false);
    }
  };

  if (!pushSupported()) {
    return (
      <Layout>
        <div className="container py-10">
          <Card>
            <CardHeader>
              <CardTitle>Notificações não suportadas</CardTitle>
              <CardDescription>
                Seu navegador não suporta Web Push. Use Chrome, Edge, Firefox ou Android. No iOS,
                instale o site na tela inicial para ativar notificações.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lembretes</h1>
          <p className="text-muted-foreground mt-1">Receba alertas mesmo com a aba fechada.</p>
        </div>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {subscribed ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
              <div>
                <div className="font-medium">{subscribed ? "Notificações ativas" : "Notificações desativadas"}</div>
                <div className="text-xs text-muted-foreground">Neste dispositivo</div>
              </div>
            </div>
            {subscribed ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={sendTest} disabled={busy}>
                  <Send className="h-4 w-4 mr-1" /> Testar
                </Button>
                <Button variant="ghost" size="sm" onClick={disable} disabled={busy}>Desativar</Button>
              </div>
            ) : (
              <Button onClick={enable} disabled={busy}>Ativar</Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horários</CardTitle>
            <CardDescription>Ative o que quiser receber e ajuste os horários.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Refeições */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="meals" className="font-medium">Refeições</Label>
                <Switch id="meals" checked={prefs.meals_enabled}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, meals_enabled: v }))} />
              </div>
              {prefs.meals_enabled && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["breakfast", "lunch", "snack", "dinner"] as const).map((k) => (
                    <div key={k}>
                      <Label className="text-xs text-muted-foreground">
                        {k === "breakfast" ? "Café" : k === "lunch" ? "Almoço" : k === "snack" ? "Lanche" : "Jantar"}
                      </Label>
                      <Input type="time" value={prefs.meal_times[k]}
                        onChange={(e) => setPrefs((p) => ({ ...p, meal_times: { ...p.meal_times, [k]: e.target.value } }))} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t" />

            {/* Treino */}
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="wo" className="font-medium">Treino</Label>
              <div className="flex items-center gap-3">
                {prefs.workouts_enabled && (
                  <Input type="time" className="w-28" value={prefs.workout_time}
                    onChange={(e) => setPrefs((p) => ({ ...p, workout_time: e.target.value }))} />
                )}
                <Switch id="wo" checked={prefs.workouts_enabled}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, workouts_enabled: v }))} />
              </div>
            </div>

            <div className="border-t" />

            {/* Hidratação */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="hy" className="font-medium">Hidratação</Label>
                <Switch id="hy" checked={prefs.hydration_enabled}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, hydration_enabled: v }))} />
              </div>
              {prefs.hydration_enabled && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                  Das
                  <Input type="time" className="w-28" value={prefs.hydration_start}
                    onChange={(e) => setPrefs((p) => ({ ...p, hydration_start: e.target.value }))} />
                  às
                  <Input type="time" className="w-28" value={prefs.hydration_end}
                    onChange={(e) => setPrefs((p) => ({ ...p, hydration_end: e.target.value }))} />
                  a cada
                  <Input type="number" min={15} step={15} className="w-20" value={prefs.hydration_interval_minutes}
                    onChange={(e) => setPrefs((p) => ({ ...p, hydration_interval_minutes: Math.max(15, parseInt(e.target.value || "120", 10)) }))} />
                  min
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button onClick={onSave} disabled={busy} size="lg" className="w-full">Salvar</Button>
      </div>
    </Layout>
  );
}