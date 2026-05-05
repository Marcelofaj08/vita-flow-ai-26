import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Sparkles, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Layout } from "@/components/vitaflow/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { RoutineInputs, FixedCommitment } from "@/types/vitaflow";
import type { Json } from "@/integrations/supabase/types";
import { usePremium, FREE_ROUTINE_LIMIT } from "@/hooks/usePremium";
import { PremiumLock } from "@/components/vitaflow/PremiumLock";

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const schema = z.object({
  name: z.string().trim().min(2, "Diz-nos o teu nome").max(40),
  age: z.string().max(3).optional(),
  weightKg: z.string().max(6).optional(),
  heightCm: z.string().max(6).optional(),
  bioimpedanceNotes: z.string().max(1000).optional(),
  goal: z.enum(["manter", "perder", "ganhar"]),
  workoutDays: z.array(z.string()).min(1, "Escolhe pelo menos um dia"),
  wakeTime: z.string().min(1),
  sleepTime: z.string().min(1),
  dietary: z.string().max(300).optional(),
  weeklySchedule: z.array(z.object({ day: z.string(), hours: z.string().max(60) })).length(7),
  fixedCommitments: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Dá um nome ao compromisso").max(60),
        days: z.string().trim().min(1).max(60),
        time: z.string().trim().min(1).max(30),
      }),
    )
    .max(10),
});

const Generate = () => {
  const navigate = useNavigate();
  const { isPremium } = usePremium();
  const [loading, setLoading] = useState(false);
  const [routineCount, setRoutineCount] = useState<number | null>(null);

  useState; // noop to keep order
  const [bioFile, setBioFile] = useState<File | null>(null);
  const [form, setForm] = useState<RoutineInputs>({
    name: "",
    age: "",
    weightKg: "",
    heightCm: "",
    bioimpedanceNotes: "",
    goal: "manter",
    workoutDays: ["Segunda", "Quarta", "Sexta"],
    wakeTime: "07:00",
    sleepTime: "23:00",
    dietary: "",
    weeklySchedule: DAYS.map((d) => ({
      day: d,
      hours: d === "Sábado" || d === "Domingo" ? "Livre" : "08:00-16:00",
    })),
    fixedCommitments: [],
  });

  const update = <K extends keyof RoutineInputs>(k: K, v: RoutineInputs[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const toggleDay = (d: string) => {
    update(
      "workoutDays",
      form.workoutDays.includes(d) ? form.workoutDays.filter((x) => x !== d) : [...form.workoutDays, d],
    );
  };

  const updateDayHours = (day: string, hours: string) => {
    update(
      "weeklySchedule",
      form.weeklySchedule.map((s) => (s.day === day ? { ...s, hours } : s)),
    );
  };

  const addCommitment = () =>
    update("fixedCommitments", [...form.fixedCommitments, { title: "", days: "", time: "" }]);

  const updateCommitment = (i: number, patch: Partial<FixedCommitment>) =>
    update(
      "fixedCommitments",
      form.fixedCommitments.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    );

  const removeCommitment = (i: number) =>
    update("fixedCommitments", form.fixedCommitments.filter((_, idx) => idx !== i));

  const onSubmit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Verifica os campos", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Inicia sessão", description: "Cria conta ou entra para guardar a tua rotina no histórico." });
        navigate("/auth");
        return;
      }

      if (!isPremium) {
        const { count } = await supabase
          .from("routines")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id);
        if ((count ?? 0) >= FREE_ROUTINE_LIMIT) {
          toast({
            title: "Limite do plano grátis",
            description: `Só podes ter ${FREE_ROUTINE_LIMIT} rotina ativa. Faz upgrade para Premium para criares ilimitadas.`,
            variant: "destructive",
          });
          navigate("/pricing");
          setLoading(false);
          return;
        }
      }

      let bioimpedanceFilePath = form.bioimpedanceFilePath;
      if (bioFile) {
        const safeName = bioFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        bioimpedanceFilePath = `${session.user.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("bioimpedance").upload(bioimpedanceFilePath, bioFile, { upsert: true });
        if (uploadError) throw uploadError;
      }

      const enrichedForm = { ...form, bioimpedanceFilePath };
      const { error: profileError } = await supabase.from("health_profiles").upsert({
        user_id: session.user.id,
        weight_kg: enrichedForm.weightKg ? Number(enrichedForm.weightKg) : null,
        height_cm: enrichedForm.heightCm ? Number(enrichedForm.heightCm) : null,
        age: enrichedForm.age ? Number(enrichedForm.age) : null,
        bioimpedance_notes: enrichedForm.bioimpedanceNotes || null,
        bioimpedance_file_path: bioimpedanceFilePath || null,
      }, { onConflict: "user_id" });
      if (profileError) throw profileError;

      const { data, error } = await supabase.functions.invoke("generate-routine", { body: enrichedForm });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { data: row, error: e2 } = await supabase
        .from("routines")
        .insert({
          user_id: session.user.id,
          title: `Rotina de ${form.name}`,
          inputs: enrichedForm as unknown as Json,
          plan: data.plan,
        })
        .select("id")
        .single();
      if (e2) throw e2;
      await supabase.from("health_profiles").update({ active_routine_id: row.id }).eq("user_id", session.user.id);
      sessionStorage.setItem("vitaflow:lastPlan", JSON.stringify({ plan: data.plan, inputs: enrichedForm }));
      navigate(`/result?id=${row.id}`);
    } catch (e: unknown) {
      toast({
        title: "Não conseguimos gerar a rotina",
        description: e instanceof Error ? e.message : "Tenta novamente em instantes.",
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="wake">Acordar</Label>
                <Input id="wake" type="time" value={form.wakeTime} onChange={(e) => update("wakeTime", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="sleep">Dormir</Label>
                <Input id="sleep" type="time" value={form.sleepTime} onChange={(e) => update("sleepTime", e.target.value)} className="mt-1.5" />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="age">Idade</Label>
              <Input id="age" inputMode="numeric" value={form.age ?? ""} onChange={(e) => update("age", e.target.value)} placeholder="18" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input id="weight" inputMode="decimal" value={form.weightKg ?? ""} onChange={(e) => update("weightKg", e.target.value)} placeholder="68" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="height">Altura (cm)</Label>
              <Input id="height" inputMode="decimal" value={form.heightCm ?? ""} onChange={(e) => update("heightCm", e.target.value)} placeholder="172" className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>Horário de escola/trabalho por dia</Label>
            <p className="text-xs text-muted-foreground mt-1">Ex: <span className="font-mono">08:00-16:00</span> ou <span className="font-mono">Livre</span></p>
            <div className="mt-3 grid sm:grid-cols-2 gap-2">
              {form.weeklySchedule.map((s) => (
                <div key={s.day} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-sm font-medium text-muted-foreground">{s.day}</span>
                  <Input
                    value={s.hours}
                    onChange={(e) => updateDayHours(s.day, e.target.value)}
                    placeholder="08:00-16:00"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Qual é o teu objetivo?</Label>
            <RadioGroup value={form.goal} onValueChange={(v) => update("goal", v as RoutineInputs["goal"])} className="mt-2 grid sm:grid-cols-3 gap-3">
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

          <div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <Label>Compromissos fixos</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Aulas extra, consultas, atividades recorrentes que devem entrar na rotina.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCommitment} className="rounded-full">
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>

            {form.fixedCommitments.length > 0 && (
              <div className="mt-3 space-y-2">
                {form.fixedCommitments.map((c, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_auto] gap-2 items-center rounded-xl border border-border/60 bg-background p-2">
                    <Input
                      value={c.title}
                      onChange={(e) => updateCommitment(i, { title: e.target.value })}
                      placeholder="Ex: Aula de piano"
                    />
                    <Input
                      value={c.days}
                      onChange={(e) => updateCommitment(i, { days: e.target.value })}
                      placeholder="Ex: Terça, Quinta"
                    />
                    <Input
                      value={c.time}
                      onChange={(e) => updateCommitment(i, { time: e.target.value })}
                      placeholder="18:00-19:00"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCommitment(i)}
                      aria-label="Remover compromisso"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="bio-notes">Bioimpedância ou observações corporais</Label>
              <Textarea
                id="bio-notes"
                value={form.bioimpedanceNotes ?? ""}
                onChange={(e) => update("bioimpedanceNotes", e.target.value)}
                placeholder="Ex: % gordura, massa muscular, água corporal, metabolismo basal..."
                className="mt-1.5 min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="bio-file">Anexar bioimpedância</Label>
              <label htmlFor="bio-file" className="mt-1.5 flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background p-4 text-center text-sm text-muted-foreground hover:border-primary/50 transition-colors">
                <Upload className="h-5 w-5 text-primary mb-2" />
                {bioFile ? bioFile.name : "PDF ou imagem com a tua avaliação"}
              </label>
              <Input id="bio-file" type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => setBioFile(e.target.files?.[0] ?? null)} />
            </div>
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