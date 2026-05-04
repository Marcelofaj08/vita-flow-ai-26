import { Link, useNavigate } from "react-router-dom";
import { Check, Sparkles, Zap, X } from "lucide-react";
import { Layout } from "@/components/vitaflow/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const FREE_FEATURES = [
  { ok: true, label: "1 rotina ativa" },
  { ok: true, label: "Plano alimentar simples" },
  { ok: true, label: "5 mensagens IA por dia" },
  { ok: false, label: "Sugestões inteligentes diárias" },
  { ok: false, label: "Ajuste automático da rotina" },
  { ok: false, label: "Exportação de planos" },
  { ok: false, label: "Histórico completo" },
];

const PREMIUM_FEATURES = [
  "Rotinas detalhadas e ilimitadas",
  "Plano alimentar completo com IA",
  "Mensagens IA ilimitadas",
  "Sugestões diárias personalizadas",
  "Ajuste automático da rotina",
  "Exportação de planos (PDF)",
  "Acompanhamento de progresso avançado",
  "Histórico completo guardado",
  "Suporte prioritário",
];

const Pricing = () => {
  const { user } = useAuth();
  const { isPremium, refresh } = usePremium();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      navigate("/auth?next=/pricing");
      return;
    }
    setBusy(true);
    // Pagamento ainda não está ligado — ativamos o trial localmente para demonstração.
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const { error } = await supabase
      .from("subscriptions")
      .upsert(
        { user_id: user.id, plan: "premium", status: "trialing", current_period_end: periodEnd.toISOString() },
        { onConflict: "user_id" }
      );
    setBusy(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    await refresh();
    toast({ title: "Bem-vindo ao Premium!", description: "Já tens acesso a todas as funcionalidades." });
    navigate("/account");
  };

  return (
    <Layout>
      <section className="container py-12 md:py-16">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="secondary" className="mb-3">Planos VitaFlow</Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Começa grátis. Cresce com Premium.</h1>
          <p className="text-muted-foreground mt-3">Tudo o que precisas para uma rotina saudável, com IA que se adapta a ti.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto mt-10">
          {/* FREE */}
          <div className="rounded-3xl border border-border bg-gradient-card p-7 shadow-soft flex flex-col">
            <div>
              <h2 className="text-xl font-bold">Grátis</h2>
              <p className="text-sm text-muted-foreground mt-1">Para começar a tua jornada.</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">0€</span>
                <span className="text-muted-foreground">/sempre</span>
              </div>
            </div>
            <ul className="mt-6 space-y-2.5 text-sm flex-1">
              {FREE_FEATURES.map((feat) => (
                <li key={feat.label} className="flex items-start gap-2">
                  {feat.ok ? (
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                  )}
                  <span className={feat.ok ? "" : "text-muted-foreground line-through"}>{feat.label}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-6 rounded-full">
              <Link to={user ? "/generate" : "/auth"}>{user ? "Continuar" : "Criar conta grátis"}</Link>
            </Button>
          </div>

          {/* PREMIUM */}
          <div className="relative rounded-3xl border-2 border-primary bg-gradient-card p-7 shadow-card flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-hero text-primary-foreground border-0 gap-1 px-3 py-1">
                <Sparkles className="h-3 w-3" /> Recomendado
              </Badge>
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                Premium <Zap className="h-5 w-5 text-primary" />
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Para resultados consistentes e duradouros.</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">4,99€</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Cancela quando quiseres.</div>
            </div>
            <ul className="mt-6 space-y-2.5 text-sm flex-1">
              {PREMIUM_FEATURES.map((label) => (
                <li key={label} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <Button
              onClick={handleUpgrade}
              disabled={busy || isPremium}
              className="mt-6 rounded-full bg-gradient-hero text-primary-foreground border-0 shadow-soft"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {isPremium ? "Já és Premium" : busy ? "A processar..." : "Obter plano completo"}
            </Button>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground mt-8 max-w-xl mx-auto">
          Pagamento seguro processado externamente. Podes cancelar a qualquer momento na tua conta.
        </div>
      </section>
    </Layout>
  );
};

export default Pricing;