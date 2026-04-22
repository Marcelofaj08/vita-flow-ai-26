import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import jsPDF from "jspdf";
import { ArrowLeft, RefreshCw, ShoppingCart, Sparkles, Coffee, Utensils, Apple, Moon, Dumbbell, BookOpen, Briefcase, Smile, Sun, Download, CheckCircle2, Wand2 } from "lucide-react";
import { Layout } from "@/components/vitaflow/Layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { RoutinePlan, RoutineInputs, ScheduleBlock } from "@/types/vitaflow";
import { toast } from "@/hooks/use-toast";

const typeMeta: Record<ScheduleBlock["type"], { icon: any; cls: string; label: string }> = {
  sono: { icon: Moon, cls: "bg-secondary/15 text-secondary border-secondary/30", label: "Sono" },
  estudo: { icon: BookOpen, cls: "bg-accent text-accent-foreground border-border", label: "Estudo" },
  treino: { icon: Dumbbell, cls: "bg-primary/15 text-primary border-primary/30", label: "Treino" },
  refeicao: { icon: Utensils, cls: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900", label: "Refeição" },
  lazer: { icon: Smile, cls: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:text-pink-300 dark:border-pink-900", label: "Lazer" },
  trabalho: { icon: Briefcase, cls: "bg-accent text-accent-foreground border-border", label: "Trabalho" },
  rotina: { icon: Sun, cls: "bg-muted text-muted-foreground border-border", label: "Rotina" },
};

const mealIcons = { breakfast: Coffee, lunch: Utensils, snack: Apple, dinner: Moon };
const mealLabels = { breakfast: "Pequeno-almoço", lunch: "Almoço", snack: "Snack", dinner: "Jantar" };

const getTrackableTasks = (plan: RoutinePlan) =>
  plan.days.flatMap((day) => [
    ...day.schedule
      .map((block, index) => ({ key: `${day.day}:block:${index}`, label: `${day.day} · ${block.activity}` , type: block.type }))
      .filter((task) => task.type === "treino" || task.type === "refeicao"),
    ...(["breakfast", "lunch", "snack", "dinner"] as const).map((meal) => ({
      key: `${day.day}:meal:${meal}`,
      label: `${day.day} · ${mealLabels[meal]}`,
      type: "refeicao" as const,
    })),
  ]);

const Result = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get("id");
  const [plan, setPlan] = useState<RoutinePlan | null>(null);
  const [inputs, setInputs] = useState<RoutineInputs | null>(null);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [suggestion, setSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      supabase.from("routines").select("plan, inputs").eq("id", id).single().then(({ data, error }) => {
        if (error || !data) {
          toast({ title: "Rotina não encontrada", variant: "destructive" });
          navigate("/generate");
          return;
        }
        setPlan(data.plan as any);
        setInputs(data.inputs as any);
        setCompleted(JSON.parse(localStorage.getItem(`vitaflow:progress:${id}`) || "{}"));
      });
    } else {
      const cached = sessionStorage.getItem("vitaflow:lastPlan");
      if (!cached) {
        navigate("/generate");
        return;
      }
      const { plan, inputs } = JSON.parse(cached);
      setPlan(plan);
      setInputs(inputs);
      setCompleted(JSON.parse(localStorage.getItem("vitaflow:progress:last") || "{}"));
    }
  }, [id, navigate]);

  const progressKey = id ? `vitaflow:progress:${id}` : "vitaflow:progress:last";
  const tasks = plan ? getTrackableTasks(plan) : [];
  const progress = tasks.length ? Math.round((tasks.filter((t) => completed[t.key]).length / tasks.length) * 100) : 0;

  const toggleTask = (key: string) => {
    const next = { ...completed, [key]: !completed[key] };
    setCompleted(next);
    localStorage.setItem(progressKey, JSON.stringify(next));
  };

  const exportPdf = () => {
    if (!plan || !inputs) return;
    const doc = new jsPDF();
    let y = 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`VitaFlow - Rotina de ${inputs.name}`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 8;
    doc.text(`Progresso semanal: ${progress}%`, 14, y);
    y += 8;
    doc.text(doc.splitTextToSize(plan.summary, 180), 14, y);
    y += 14;
    plan.days.forEach((day) => {
      if (y > 260) { doc.addPage(); y = 18; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(day.day, 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      day.schedule.slice(0, 8).forEach((block) => {
        const lines = doc.splitTextToSize(`${block.time} - ${block.activity}`, 180);
        doc.text(lines, 16, y);
        y += lines.length * 5;
      });
      doc.text(doc.splitTextToSize(`Treino: ${day.workout}`, 180), 16, y);
      y += 8;
    });
    doc.save(`vitaflow-rotina-${inputs.name || "semanal"}.pdf`);
    toast({ title: "PDF exportado", description: "A tua rotina foi descarregada." });
  };

  const getDailySuggestion = async () => {
    if (!plan || !inputs) return;
    setAiLoading("suggestion");
    try {
      const today = plan.days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.day;
      const { data, error } = await supabase.functions.invoke("generate-routine", { body: { action: "daily_suggestion", plan, progress, day: today, name: inputs.name } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setSuggestion(data.suggestion);
    } catch (e: any) {
      toast({ title: "Não foi possível gerar a sugestão", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  const reorganizeDay = async (day: string) => {
    if (!plan || !inputs) return;
    setAiLoading(day);
    try {
      const { data, error } = await supabase.functions.invoke("generate-routine", { body: { action: "reorganize_day", day, plan, inputs } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      const next = { ...plan, days: plan.days.map((d) => (d.day === day ? data.dayPlan : d)) };
      setPlan(next);
      if (id) await supabase.from("routines").update({ plan: next as any }).eq("id", id);
      else sessionStorage.setItem("vitaflow:lastPlan", JSON.stringify({ plan: next, inputs }));
      toast({ title: "Dia reorganizado", description: `${day} foi ajustado pela IA.` });
    } catch (e: any) {
      toast({ title: "Não foi possível reorganizar", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  if (!plan || !inputs) {
    return (
      <Layout>
        <div className="container py-20 text-center text-muted-foreground">A carregar a tua rotina...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container py-10 md:py-14">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/generate"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link>
        </Button>

        <div className="rounded-3xl bg-gradient-hero p-8 md:p-10 text-primary-foreground shadow-glow relative overflow-hidden animate-fade-in-up">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,white,transparent_60%)]" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-background/20 backdrop-blur px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-3 w-3" /> Plano gerado por IA
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold">Olá, {inputs.name}! 👋</h1>
            <p className="mt-3 max-w-2xl text-primary-foreground/90">{plan.summary}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => navigate("/generate")} size="sm" variant="secondary" className="rounded-full">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Gerar novamente
              </Button>
            </div>
          </div>
        </div>

        {plan.weekly_tip && (
          <div className="mt-6 rounded-2xl bg-accent border border-border/60 p-4 text-sm text-accent-foreground flex gap-3 items-start">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div><strong>Dica da semana:</strong> {plan.weekly_tip}</div>
          </div>
        )}

        <Tabs defaultValue="week" className="mt-8">
          <TabsList className="rounded-full">
            <TabsTrigger value="week" className="rounded-full">Semana</TabsTrigger>
            <TabsTrigger value="meals" className="rounded-full">Refeições</TabsTrigger>
            <TabsTrigger value="shopping" className="rounded-full">
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Compras
            </TabsTrigger>
          </TabsList>

          {/* Week */}
          <TabsContent value="week" className="mt-6">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {plan.days.map((d, i) => (
                <div
                  key={d.day}
                  className="rounded-2xl bg-gradient-card border border-border/60 p-5 shadow-soft hover:shadow-card transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-bold">{d.day}</h3>
                    {d.workout && d.workout !== "Descanso" && (
                      <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
                        💪 {d.workout.length > 24 ? d.workout.slice(0, 24) + "…" : d.workout}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    {d.schedule.map((b, j) => {
                      const meta = typeMeta[b.type] ?? typeMeta.rotina;
                      const Icon = meta.icon;
                      return (
                        <div key={j} className="flex items-start gap-3 text-sm">
                          <div className="font-mono text-xs text-muted-foreground w-12 pt-0.5">{b.time}</div>
                          <div className={`rounded-md border p-1 ${meta.cls}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 leading-snug">{b.activity}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Meals */}
          <TabsContent value="meals" className="mt-6">
            <div className="grid gap-5 md:grid-cols-2">
              {plan.days.map((d, i) => (
                <div key={d.day} className="rounded-2xl bg-gradient-card border border-border/60 p-5 shadow-soft animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <h3 className="text-lg font-bold mb-3">{d.day}</h3>
                  <div className="space-y-3">
                    {(["breakfast", "lunch", "snack", "dinner"] as const).map((k) => {
                      const Icon = mealIcons[k];
                      return (
                        <div key={k} className="flex gap-3">
                          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-accent-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{mealLabels[k]}</div>
                            <div className="text-sm">{d.meals[k]}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Shopping */}
          <TabsContent value="shopping" className="mt-6">
            <div className="rounded-2xl bg-gradient-card border border-border/60 p-6 shadow-soft max-w-2xl">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" /> Lista de compras da semana
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Gerada a partir do teu plano alimentar.</p>
              <ul className="mt-5 grid sm:grid-cols-2 gap-2">
                {plan.shopping_list.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent/50 transition-colors">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
};

export default Result;