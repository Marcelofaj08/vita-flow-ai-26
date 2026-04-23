import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Activity, Calendar, Camera, CheckCircle2, FileText, Plus, Ruler, Scale, UserRound } from "lucide-react";
import { Layout } from "@/components/vitaflow/Layout";
import { AssistantChat } from "@/components/vitaflow/AssistantChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type HealthProfile = {
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  bioimpedance_notes: string | null;
  bioimpedance_file_path: string | null;
  active_routine_id: string | null;
};

type RoutineRow = { id: string; title: string; created_at: string; inputs: any };

const Account = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [health, setHealth] = useState<HealthProfile | null>(null);
  const [routines, setRoutines] = useState<RoutineRow[]>([]);
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }

    Promise.all([
      (supabase as any).from("health_profiles").select("weight_kg, height_cm, age, bioimpedance_notes, bioimpedance_file_path, active_routine_id").eq("user_id", user.id).maybeSingle(),
      supabase.from("routines").select("id, title, created_at, inputs").order("created_at", { ascending: false }).limit(8),
      (supabase as any).from("profiles").select("avatar_url").eq("id", user.id).maybeSingle(),
    ]).then(async ([healthResult, routinesResult, profileResult]) => {
      setHealth((healthResult.data ?? null) as HealthProfile | null);
      const routineRows = (routinesResult.data ?? []) as RoutineRow[];
      setRoutines(routineRows);
      setActiveRoutineId(healthResult.data?.active_routine_id ?? routineRows[0]?.id ?? null);
      const path = profileResult.data?.avatar_url;
      if (path) {
        const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
        setAvatarUrl(data?.signedUrl ?? null);
      }
      setBusy(false);
    });
  }, [user, loading, navigate]);

  const activeRoutine = routines.find((routine) => routine.id === activeRoutineId) ?? routines[0];
  const latestInputs = activeRoutine?.inputs ?? {};

  const setActiveRoutine = async (routineId: string) => {
    if (!user) return;
    setActiveRoutineId(routineId);
    await (supabase as any).from("health_profiles").update({ active_routine_id: routineId }).eq("user_id", user.id);
  };

  const uploadAvatar = async (file?: File) => {
    if (!user || !file) return;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${user.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Erro ao enviar foto", description: uploadError.message, variant: "destructive" });
      return;
    }
    const { error } = await (supabase as any).from("profiles").update({ avatar_url: path }).eq("id", user.id);
    if (error) {
      toast({ title: "Erro ao guardar foto", description: error.message, variant: "destructive" });
      return;
    }
    const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
    setAvatarUrl(data?.signedUrl ?? null);
    toast({ title: "Foto atualizada", description: "A tua foto de perfil foi guardada." });
  };

  const infoCards = [
    { label: "Idade", value: health?.age ?? latestInputs.age ?? "—", suffix: health?.age || latestInputs.age ? "anos" : "", icon: UserRound },
    { label: "Peso", value: health?.weight_kg ?? latestInputs.weightKg ?? "—", suffix: health?.weight_kg || latestInputs.weightKg ? "kg" : "", icon: Scale },
    { label: "Altura", value: health?.height_cm ?? latestInputs.heightCm ?? "—", suffix: health?.height_cm || latestInputs.heightCm ? "cm" : "", icon: Ruler },
    { label: "Rotinas", value: routines.length, suffix: "guardadas", icon: Calendar },
  ];

  return (
    <Layout>
      <section className="container py-10 md:py-14">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Badge variant="secondary" className="mb-3">Conta VitaFlow</Badge>
            <h1 className="text-3xl md:text-4xl font-bold">As tuas informações</h1>
            <p className="text-muted-foreground mt-2">Perfil, dados de saúde, rotinas e assistente num só espaço.</p>
          </div>
          <Button asChild className="rounded-full bg-gradient-hero text-primary-foreground border-0 shadow-soft">
            <Link to="/generate"><Plus className="h-4 w-4 mr-1" /> Atualizar dados</Link>
          </Button>
        </div>

        {busy ? (
          <div className="mt-10 text-sm text-muted-foreground">A carregar informações...</div>
        ) : (
          <Tabs defaultValue={params.get("tab") === "chat" ? "chat" : "info"} className="mt-8">
            <TabsList className="rounded-full">
              <TabsTrigger value="info" className="rounded-full">Informações</TabsTrigger>
              <TabsTrigger value="chat" className="rounded-full">Assistente</TabsTrigger>
              <TabsTrigger value="history" className="rounded-full">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6 space-y-6">
              <div className="rounded-2xl bg-gradient-card border border-border/60 p-5 shadow-soft flex items-center gap-4 flex-wrap">
                <Avatar className="h-20 w-20 border border-border/60">
                  <AvatarImage src={avatarUrl ?? undefined} alt="Foto de perfil" />
                  <AvatarFallback>{user?.email?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-[220px]">
                  <h2 className="font-bold flex items-center gap-2"><Camera className="h-5 w-5 text-primary" /> Foto de perfil</h2>
                  <p className="text-sm text-muted-foreground mt-1">Adiciona uma imagem para personalizar a tua conta.</p>
                </div>
                <Input type="file" accept="image/*" className="max-w-xs" onChange={(e) => uploadAvatar(e.target.files?.[0])} />
              </div>

              <div className="rounded-2xl bg-gradient-card border border-border/60 p-5 shadow-soft">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="font-bold flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Rotina ativa no chat</h2>
                    <p className="text-sm text-muted-foreground mt-1">O assistente usa esta rotina automaticamente nas respostas.</p>
                  </div>
                  {activeRoutine && <Badge variant="secondary">{activeRoutine.title}</Badge>}
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {routines.map((routine) => {
                    const active = routine.id === activeRoutineId;
                    return (
                      <button
                        key={routine.id}
                        type="button"
                        onClick={() => setActiveRoutine(routine.id)}
                        className={`text-left rounded-xl border p-3 transition-all ${active ? "border-primary bg-accent shadow-soft" : "border-border bg-background hover:border-primary/40"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold truncate">{routine.title}</span>
                          {active && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{new Date(routine.created_at).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" })}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {infoCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="rounded-2xl bg-gradient-card border border-border/60 p-5 shadow-soft">
                      <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center"><Icon className="h-5 w-5 text-accent-foreground" /></div>
                      <div className="mt-4 text-sm text-muted-foreground">{card.label}</div>
                      <div className="text-2xl font-bold">{card.value} <span className="text-sm font-medium text-muted-foreground">{card.suffix}</span></div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl bg-gradient-card border border-border/60 p-5 shadow-soft">
                  <h2 className="font-bold flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Objetivo e rotina</h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Objetivo</dt><dd className="font-medium">{latestInputs.goal ?? "Ainda não definido"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Treinos</dt><dd className="font-medium text-right">{latestInputs.workoutDays?.join(", ") ?? "—"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Sono</dt><dd className="font-medium">{latestInputs.wakeTime ?? "—"} · {latestInputs.sleepTime ?? "—"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Alimentação</dt><dd className="font-medium text-right">{latestInputs.dietary || "Sem restrições registadas"}</dd></div>
                  </dl>
                </div>
                <div className="rounded-2xl bg-gradient-card border border-border/60 p-5 shadow-soft">
                  <h2 className="font-bold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Bioimpedância</h2>
                  <p className="mt-4 text-sm text-muted-foreground whitespace-pre-wrap">{health?.bioimpedance_notes || latestInputs.bioimpedanceNotes || "Ainda não adicionaste dados de bioimpedância."}</p>
                  {(health?.bioimpedance_file_path || latestInputs.bioimpedanceFilePath) && <Badge variant="outline" className="mt-4">Ficheiro anexado</Badge>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="mt-6 max-w-3xl">
              <AssistantChat activeRoutineId={activeRoutineId} />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <div className="grid gap-3 max-w-3xl">
                {routines.length === 0 && <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">Ainda não tens rotinas guardadas.</div>}
                {routines.map((routine) => (
                  <Link key={routine.id} to={`/result?id=${routine.id}`} className="rounded-2xl bg-gradient-card border border-border/60 p-4 shadow-soft hover:shadow-card transition-all">
                    <div className="font-semibold">{routine.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(routine.created_at).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" })}</div>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </section>
    </Layout>
  );
};

export default Account;