import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Sparkles, Loader2 } from "lucide-react";
import { Layout } from "@/components/vitaflow/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { RoutineInputs } from "@/types/vitaflow";

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const schema = z.object({
  name: z.string().trim().min(2, "Diz-nos o teu nome").max(40),
  schedule: z.string().trim().min(3).max(200),
  goal: z.enum(["manter", "perder", "ganhar"]),
  workoutDays: z.array(z.string()).min(1, "Escolhe pelo menos um dia"),
  wakeTime: z.string().min(1),
  sleepTime: z.string().min(1),
  dietary: z.string().max(300).optional(),
});

const Generate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<RoutineInputs>({
    name: "",
    schedule: "Escola das 8h às 16h",
    goal: "manter",
    workoutDays: ["Segunda", "Quarta", "Sexta"],
    wakeTime: "07:00",
    sleepTime: "23:00",
    dietary: "",
  });

  const update = <K extends keyof RoutineInputs>(k: K, v: RoutineInputs[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const toggleDay = (d: string) => {
    update(
      "workoutDays",
      form.workoutDays.includes(d) ? form.workoutDays.filter((x) => x !== d) : [...form.workoutDays, d],
    );
  };

  const onSubmit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Verifica os campos", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-routine", { body: form });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // save if logged in
      const { data: { session } } = await supabase.auth.getSession();
      let routineId: string | null = null;
      if (session) {
        const { data: row, error: e2 } = await supabase
          .from("routines")
          .insert({
            user_id: session.user.id,
            title: `Rotina de ${form.name}`,
            inputs: form as any,
            plan: data.plan,
          })
          .select("id")
          .single();
        if (!e2) routineId = row.id;
      }
      sessionStorage.setItem("vitaflow:lastPlan", JSON.stringify({ plan: data.plan, inputs: form }));
      navigate(routineId ? `/result?id=${routineId}` : "/result");
    } catch (e: any) {
      toast({
        title: "Não conseguimos gerar a rotina",
        description: e.message ?? "Tenta novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="container py-12 md:py-16 max-w-3xl">
        <div className="text-center mb-10 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Personaliza a tua semana
          </span>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold">Conta-nos sobre ti</h1>
          <p className="mt-3 text-muted-foreground">
            A IA cria uma rotina semanal completa em segundos, adaptada a ti.
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-card border border-border/60 shadow-card p-6 md:p-10 space-y-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">O teu nome</Label>
              <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ana" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="schedule">Horário diário</Label>
              <Input id="schedule" value={form.schedule} onChange={(e) => update("schedule", e.target.value)} placeholder="Escola 8h-16h" className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>Qual é o teu objetivo?</Label>
            <RadioGroup value={form.goal} onValueChange={(v) => update("goal", v as any)} className="mt-2 grid sm:grid-cols-3 gap-3">
              {[
                { v: "manter", l: "Manter saúde", e: "💚" },
                { v: "perder", l: "Perder peso", e: "🔥" },
                { v: "ganhar", l: "Ganhar massa", e: "💪" },
              ].map((o) => (
                <Label
                  key={o.v}
                  htmlFor={`g-${o.v}`}
                  className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${
                    form.goal === o.v ? "border-primary bg-accent shadow-soft" : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem id={`g-${o.v}`} value={o.v} className="sr-only" />
                  <div className="text-2xl">{o.e}</div>
                  <div className="mt-1 text-sm font-medium">{o.l}</div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label>Dias disponíveis para treino</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const active = form.workoutDays.includes(d);
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={`rounded-full px-4 py-2 text-sm font-medium border transition-all ${
                      active
                        ? "bg-gradient-hero text-primary-foreground border-transparent shadow-soft"
                        : "bg-background border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="wake">Hora de acordar</Label>
              <Input id="wake" type="time" value={form.wakeTime} onChange={(e) => update("wakeTime", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="sleep">Hora de dormir</Label>
              <Input id="sleep" type="time" value={form.sleepTime} onChange={(e) => update("sleepTime", e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label htmlFor="diet">Preferências ou restrições alimentares</Label>
            <Textarea
              id="diet"
              value={form.dietary}
              onChange={(e) => update("dietary", e.target.value)}
              placeholder="Ex: vegetariano, sem lactose, alergia a frutos secos..."
              className="mt-1.5 min-h-[80px]"
            />
          </div>

          <Button onClick={onSubmit} disabled={loading} size="lg" className="w-full h-12 rounded-full bg-gradient-hero text-primary-foreground border-0 shadow-glow text-base">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A criar a tua rotina...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Gerar a minha rotina</>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            ⚠️ O VitaFlow promove hábitos saudáveis e não substitui aconselhamento médico ou nutricional profissional.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Generate;