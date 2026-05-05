import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import jsPDF from "jspdf";
import { ArrowLeft, RefreshCw, ShoppingCart, Sparkles, Coffee, Utensils, Apple, Moon, Dumbbell, BookOpen, Briefcase, Smile, Sun, Download, CheckCircle2, Wand2, CalendarPlus, type LucideIcon } from "lucide-react";
import { Layout } from "@/components/vitaflow/Layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { RoutinePlan, RoutineInputs, ScheduleBlock } from "@/types/vitaflow";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";
import { estimateItemPrice, formatEUR, unitLabel } from "@/lib/priceEstimator";
import { usePremium } from "@/hooks/usePremium";
import { PremiumBadge } from "@/components/vitaflow/PremiumLock";
import { useUpgradeModal } from "@/components/vitaflow/UpgradeModal";

const typeMeta: Record<ScheduleBlock["type"], { icon: LucideIcon; cls: string; label: string }> = {
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
const dayIndexes: Record<string, number> = { Segunda: 1, Terça: 2, Quarta: 3, Quinta: 4, Sexta: 5, Sábado: 6, Domingo: 0 };

const getMealCalories = (day: RoutinePlan["days"][number], meal: keyof typeof mealLabels) =>
  day.meal_calories?.[meal] ? `${Math.round(day.meal_calories[meal] ?? 0)} kcal` : "kcal a definir";

const escapeIcs = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");

const nextDateForDay = (day: string) => {
  const now = new Date();
  const diff = (dayIndexes[day] - now.getDay() + 7) % 7;
  const date = new Date(now);
  date.setDate(now.getDate() + diff);
  return date;
};

const formatIcsDate = (date: Date) =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}00`;

const buildEventDates = (day: string, time: string) => {
  const match = time.match(/(\d{1,2}):(\d{2})(?:\s*-\s*(\d{1,2}):(\d{2}))?/);
  const start = nextDateForDay(day);
  start.setHours(match ? Number(match[1]) : 9, match ? Number(match[2]) : 0, 0, 0);
  const end = new Date(start);
  end.setHours(match?.[3] ? Number(match[3]) : start.getHours() + 1, match?.[4] ? Number(match[4]) : start.getMinutes(), 0, 0);
  if (end <= start) end.setHours(start.getHours() + 1);
  return { start, end };
};

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
  const { isPremium } = usePremium();
  const { open: openUpgrade } = useUpgradeModal();
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
        setPlan(data.plan as unknown as RoutinePlan);
        setInputs(data.inputs as unknown as RoutineInputs);
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
  const todayName = plan?.days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.day;
  const todayPlan = plan?.days.find((day) => day.day === todayName) ?? plan?.days[0];

  const toggleTask = (key: string) => {
    const next = { ...completed, [key]: !completed[key] };
    setCompleted(next);
    localStorage.setItem(progressKey, JSON.stringify(next));
  };

  const exportPdf = () => {
    if (!isPremium) {
      openUpgrade("export-pdf");
      return;
    }
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

  const exportCalendar = () => {
    if (!isPremium) {
      openUpgrade("export-calendar");
      return;
    }
    if (!plan || !inputs) return;
    const events = plan.days.flatMap((day) =>
      day.schedule.map((block, index) => {
        const dates = buildEventDates(day.day, block.time);
        return [
          "BEGIN:VEVENT",
          `UID:vitaflow-${id ?? "local"}-${day.day}-${index}@vitaflow`,
          `DTSTAMP:${formatIcsDate(new Date())}`,
          `DTSTART:${formatIcsDate(dates.start)}`,
          `DTEND:${formatIcsDate(dates.end)}`,
          `SUMMARY:${escapeIcs(block.activity)}`,
          `DESCRIPTION:${escapeIcs(`VitaFlow · ${typeMeta[block.type]?.label ?? "Rotina"}`)}`,
          "END:VEVENT",
        ].join("\r\n");
      }),
    );
    const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VitaFlow//Routine//PT", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `vitaflow-calendario-${inputs.name || "rotina"}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Calendário exportado", description: "Importa o ficheiro .ics no Google Calendar ou Apple Calendar." });
  };

  const getDailySuggestion = async () => {
    if (!isPremium) {
      openUpgrade("daily-suggestion");
      return;
    }
    if (!plan || !inputs) return;
    setAiLoading("suggestion");
    try {
      const today = plan.days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]?.day;
      const { data, error } = await supabase.functions.invoke("generate-routine", { body: { action: "daily_suggestion", plan, progress, day: today, name: inputs.name } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setSuggestion(data.suggestion);
    } catch (e: unknown) {
      toast({ title: "Não foi possível gerar a sugestão", description: e instanceof Error ? e.message : "Tenta novamente.", variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  const reorganizeDay = async (day: string) => {
    if (!isPremium) {
      openUpgrade("reorganize");
      return;
    }
    if (!plan || !inputs) return;
    setAiLoading(day);
    try {
      const { data, error } = await supabase.functions.invoke("generate-routine", { body: { action: "reorganize_day", day, plan, inputs } });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      const next = { ...plan, days: plan.days.map((d) => (d.day === day ? data.dayPlan : d)) };
      setPlan(next);
      if (id) await supabase.from("routines").update({ plan: next as unknown as Json }).eq("id", id);
      else sessionStorage.setItem("vitaflow:lastPlan", JSON.stringify({ plan: next, inputs }));
      toast({ title: "Dia reorganizado", description: `${day} foi ajustado pela IA.` });
    } catch (e: unknown) {
      toast({ title: "Não foi possível reorganizar", description: e instanceof Error ? e.message : "Tenta novamente.", variant: "destructive" });
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
              <Button onClick={exportPdf} size="sm" variant="secondary" className="rounded-full">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Exportar PDF {!isPremium && <PremiumBadge />}
              </Button>
              <Button onClick={exportCalendar} size="sm" variant="secondary" className="rounded-full">
                <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> Exportar calendário {!isPremium && <PremiumBadge />}
              </Button>
              <Button onClick={getDailySuggestion} size="sm" variant="secondary" className="rounded-full" disabled={aiLoading === "suggestion"}>
                <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Sugestão do dia {!isPremium && <PremiumBadge />}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl bg-gradient-card border border-border/60 p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Progresso semanal</h2>
                <p className="text-sm text-muted-foreground">Treinos e refeições concluídos.</p>
              </div>
              <span className="text-2xl font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="mt-4 h-3" />
          </div>
          {suggestion && (
            <div className="rounded-2xl bg-accent border border-border/60 p-5 text-sm text-accent-foreground flex gap-3 items-start shadow-soft">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div><strong>Sugestão inteligente:</strong> {suggestion}</div>
            </div>
          )}
        </div>

        {plan.weekly_tip && (
          <div className="mt-6 rounded-2xl bg-accent border border-border/60 p-4 text-sm text-accent-foreground flex gap-3 items-start">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div><strong>Dica da semana:</strong> {plan.weekly_tip}</div>
          </div>
        )}

        <Tabs defaultValue={params.get("tab") ?? "today"} className="mt-8">
          <TabsList className="rounded-full">
            <TabsTrigger value="today" className="rounded-full">Hoje</TabsTrigger>
            <TabsTrigger value="week" className="rounded-full">Semana</TabsTrigger>
            <TabsTrigger value="meals" className="rounded-full">Refeições</TabsTrigger>
            <TabsTrigger value="shopping" className="rounded-full">
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" /> Compras
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-6">
            {todayPlan && (
              <div className="rounded-2xl bg-gradient-card border border-border/60 p-5 shadow-soft max-w-3xl">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-xl font-bold">Plano de hoje · {todayPlan.day}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Só o essencial para seguires o dia sem distrações{todayPlan.meal_calories?.total ? ` · ${Math.round(todayPlan.meal_calories.total)} kcal estimadas` : ""}.</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => reorganizeDay(todayPlan.day)} disabled={aiLoading === todayPlan.day}>
                    <Wand2 className="h-3.5 w-3.5 mr-1.5" /> {aiLoading === todayPlan.day ? "A reorganizar..." : "Falhei este dia"}
                  </Button>
                </div>
                <div className="mt-5 space-y-3">
                  {todayPlan.schedule.map((b, j) => {
                    const meta = typeMeta[b.type] ?? typeMeta.rotina;
                    const Icon = meta.icon;
                    const taskKey = `${todayPlan.day}:block:${j}`;
                    const trackable = b.type === "treino" || b.type === "refeicao";
                    return (
                      <div key={j} className="flex items-start gap-3 text-sm rounded-xl border border-border/60 bg-background p-3">
                        <div className="font-mono text-xs text-muted-foreground w-14 pt-1">{b.time}</div>
                        <div className={`rounded-md border p-1.5 ${meta.cls}`}><Icon className="h-4 w-4" /></div>
                        <div className="flex-1 leading-snug pt-0.5">{b.activity}</div>
                        {trackable && <Checkbox checked={!!completed[taskKey]} onCheckedChange={() => toggleTask(taskKey)} aria-label={`Concluir ${b.activity}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

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
                      const taskKey = `${d.day}:block:${j}`;
                      const trackable = b.type === "treino" || b.type === "refeicao";
                      return (
                        <div key={j} className="flex items-start gap-3 text-sm">
                          <div className="font-mono text-xs text-muted-foreground w-12 pt-0.5">{b.time}</div>
                          <div className={`rounded-md border p-1 ${meta.cls}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 leading-snug">{b.activity}</div>
                          {trackable && <Checkbox checked={!!completed[taskKey]} onCheckedChange={() => toggleTask(taskKey)} aria-label={`Concluir ${b.activity}`} />}
                        </div>
                      );
                    })}
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 rounded-full w-full" onClick={() => reorganizeDay(d.day)} disabled={aiLoading === d.day}>
                    <Wand2 className="h-3.5 w-3.5 mr-1.5" /> {aiLoading === d.day ? "A reorganizar..." : "Falhei este dia"}
                  </Button>
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
                      const taskKey = `${d.day}:meal:${k}`;
                      return (
                        <div key={k} className="flex gap-3">
                          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-accent-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{mealLabels[k]}</div>
                            <div className="text-sm">{d.meals[k]}</div>
                            <div className="mt-1 text-xs font-semibold text-primary">{getMealCalories(d, k)}</div>
                          </div>
                          <Checkbox checked={!!completed[taskKey]} onCheckedChange={() => toggleTask(taskKey)} aria-label={`Concluir ${mealLabels[k]}`} />
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
            <div className="rounded-2xl bg-gradient-card border border-border/60 p-6 shadow-soft max-w-3xl">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" /> Lista de compras da semana
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Quantidade <span className="font-semibold text-foreground">total para a semana</span> com unidades padronizadas (g, kg, ml, L, unidades).
              </p>
              {(() => {
                const items = plan.shopping_list ?? [];
                // Separa quantidade numérica da unidade para destaque visual.
                const splitQty = (q: string) => {
                  const trimmed = (q || "").trim();
                  if (!trimmed) return { value: "", unit: "" };
                  const m = trimmed.match(/^([\d.,]+(?:\s*[-–x×]\s*[\d.,]+)?)\s*(.*)$/);
                  if (!m) return { value: trimmed, unit: "" };
                  return { value: m[1].trim(), unit: (m[2] || "").trim() };
                };
                const normalized = items.map((raw) => {
                  if (typeof raw === "string") {
                    return { name: raw, quantity: "", quality: "", category: "Outros" };
                  }
                  return {
                    name: raw?.name ?? "",
                    quantity: raw?.quantity ?? "",
                    quality: raw?.quality ?? "",
                    category: raw?.category ?? "Outros",
                  };
                });
                const grouped = normalized.reduce<Record<string, typeof normalized>>((acc, it) => {
                  const key = it.category || "Outros";
                  (acc[key] ||= []).push(it);
                  return acc;
                }, {});
                // Estima preços por item, calcula totais por categoria e geral.
                const priced = Object.entries(grouped).map(([category, list]) => {
                  const itemsWithPrice = list.map((it) => ({
                    ...it,
                    estimate: estimateItemPrice(it.name, it.quantity),
                  }));
                  const subtotal = itemsWithPrice.reduce((s, it) => s + it.estimate.price, 0);
                  return { category, list: itemsWithPrice, subtotal };
                });
                const grandTotal = priced.reduce((s, c) => s + c.subtotal, 0);
                const totalItems = normalized.length;
                return (
                  <div className="mt-5 space-y-6">
                    {/* Resumo da estimativa */}
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-primary/80">Estimativa total</div>
                        <div className="mt-1 text-2xl font-extrabold text-primary">{formatEUR(grandTotal)}</div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {totalItems} {totalItems === 1 ? "produto" : "produtos"} • valores médios em supermercado PT
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-muted-foreground max-w-[260px]">
                        Estimativa indicativa. Os preços reais variam por marca, loja e promoções.
                      </div>
                    </div>

                    {priced.map(({ category, list, subtotal }) => (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{category}</h4>
                          <span className="text-[10px] text-muted-foreground">
                            {list.length} {list.length === 1 ? "item" : "itens"} • <span className="font-semibold text-foreground">{formatEUR(subtotal)}</span>
                          </span>
                        </div>
                        <ul className="grid sm:grid-cols-2 gap-2">
                          {list.map((item, i) => {
                            const { value, unit } = splitQty(item.quantity);
                            const est = item.estimate;
                            return (
                              <li key={`${category}-${i}`} className="rounded-lg border border-border/60 bg-background p-3 hover:border-primary/40 transition-colors">
                                <div className="flex items-start justify-between gap-3">
                                  <span className="text-sm font-semibold">{item.name}</span>
                                  {value ? (
                                    <span className="inline-flex items-baseline gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 shrink-0">
                                      <span className="text-xs font-mono font-bold text-primary">{value}</span>
                                      {unit && <span className="text-[10px] font-medium uppercase tracking-wide text-primary/80">{unit}</span>}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] italic text-muted-foreground shrink-0">qtd. a definir</span>
                                  )}
                                </div>
                                {item.quality && (
                                  <div className="mt-1 text-xs text-muted-foreground">{item.quality}</div>
                                )}
                                <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/50 pt-2">
                                  <span className="text-[10px] text-muted-foreground">
                                    ~{formatEUR(est.pricePerUnit)}/{unitLabel(est.unit)}
                                  </span>
                                  <span className="text-xs font-bold text-foreground">
                                    {formatEUR(est.price)}
                                    {est.estimated && <span className="ml-1 text-[9px] font-normal text-muted-foreground">aprox.</span>}
                                  </span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
};

export default Result;