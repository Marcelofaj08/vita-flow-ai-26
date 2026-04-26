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
      <div className="container py-8 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificações de lembrete</h1>
          <p className="text-muted-foreground mt-1">
            Receba alertas das refeições, treinos e hidratação — mesmo com a aba fechada.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {subscribed ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5" />}
              Este dispositivo
            </CardTitle>
            <CardDescription>
              {subscribed
                ? "Está ativo. Você receberá notificações neste navegador/dispositivo."
                : "Ative para autorizar notificações neste navegador."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {subscribed ? (
              <>
                <Button variant="outline" onClick={disable} disabled={busy}>
                  Desativar neste dispositivo
                </Button>
                <Button onClick={sendTest} disabled={busy}>
                  <Send className="h-4 w-4 mr-2" /> Enviar notificação de teste
                </Button>
              </>
            ) : (
              <Button onClick={enable} disabled={busy}>
                <Bell className="h-4 w-4 mr-2" /> Ativar notificações
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refeições</CardTitle>
            <CardDescription>Lembretes nos horários das suas refeições.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="meals">Ativar lembretes de refeições</Label>
              <Switch
                id="meals"
                checked={prefs.meals_enabled}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, meals_enabled: v }))}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(["breakfast", "lunch", "snack", "dinner"] as const).map((k) => (
                <div key={k}>
                  <Label className="text-xs capitalize">
                    {k === "breakfast" ? "Café" : k === "lunch" ? "Almoço" : k === "snack" ? "Lanche" : "Jantar"}
                  </Label>
                  <Input
                    type="time"
                    value={prefs.meal_times[k]}
                    onChange={(e) =>
                      setPrefs((p) => ({
                        ...p,
                        meal_times: { ...p.meal_times, [k]: e.target.value },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Treino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="wo">Ativar lembrete de treino</Label>
              <Switch
                id="wo"
                checked={prefs.workouts_enabled}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, workouts_enabled: v }))}
              />
            </div>
            <div className="max-w-[160px]">
              <Label className="text-xs">Horário</Label>
              <Input
                type="time"
                value={prefs.workout_time}
                onChange={(e) => setPrefs((p) => ({ ...p, workout_time: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hidratação</CardTitle>
            <CardDescription>Lembretes periódicos para beber água.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="hy">Ativar lembretes de hidratação</Label>
              <Switch
                id="hy"
                checked={prefs.hydration_enabled}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, hydration_enabled: v }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Início</Label>
                <Input
                  type="time"
                  value={prefs.hydration_start}
                  onChange={(e) => setPrefs((p) => ({ ...p, hydration_start: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Fim</Label>
                <Input
                  type="time"
                  value={prefs.hydration_end}
                  onChange={(e) => setPrefs((p) => ({ ...p, hydration_end: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">Intervalo (min)</Label>
                <Input
                  type="number"
                  min={15}
                  step={15}
                  value={prefs.hydration_interval_minutes}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      hydration_interval_minutes: Math.max(15, parseInt(e.target.value || "120", 10)),
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 sticky bottom-4">
          <Button onClick={onSave} disabled={busy} size="lg">
            Salvar preferências
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Fuso horário usado: <strong>{prefs.timezone}</strong>. Os lembretes são enviados a cada 5 min
          conforme seus horários. Ative em todos os dispositivos onde quiser receber.
        </p>
      </div>
    </Layout>
  );
}