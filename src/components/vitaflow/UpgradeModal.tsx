import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Check, X, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type UpgradeReason =
  | "ai-limit"
  | "export-pdf"
  | "export-calendar"
  | "daily-suggestion"
  | "reorganize"
  | "routine-limit"
  | "generic";

const REASONS: Record<UpgradeReason, { title: string; description: string; highlight: string }> = {
  "ai-limit": {
    title: "Atingiste o limite diário de IA",
    description: "O plano grátis inclui 5 mensagens por dia. Faz upgrade para conversares sem limites.",
    highlight: "Mensagens IA ilimitadas",
  },
  "export-pdf": {
    title: "Exportar PDF é Premium",
    description: "Leva a tua rotina para qualquer lado em PDF, pronto a imprimir ou partilhar.",
    highlight: "Exportação ilimitada de planos",
  },
  "export-calendar": {
    title: "Sincronizar calendário é Premium",
    description: "Importa a tua rotina diretamente para o Google ou Apple Calendar.",
    highlight: "Integração com calendários",
  },
  "daily-suggestion": {
    title: "Sugestões diárias são Premium",
    description: "Recebe todos os dias uma dica personalizada da IA baseada no teu progresso.",
    highlight: "Sugestões inteligentes diárias",
  },
  reorganize: {
    title: "Ajuste automático é Premium",
    description: "A IA reorganiza dias falhados e adapta o teu plano em segundos.",
    highlight: "Ajuste automático da rotina",
  },
  "routine-limit": {
    title: "Só podes ter 1 rotina ativa",
    description: "O plano grátis permite uma rotina. Premium dá-te rotinas ilimitadas e histórico completo.",
    highlight: "Rotinas ilimitadas + histórico",
  },
  generic: {
    title: "Funcionalidade Premium",
    description: "Desbloqueia todas as funcionalidades avançadas do VitaFlow.",
    highlight: "Tudo incluído",
  },
};

const PERKS = [
  "Rotinas ilimitadas + histórico",
  "Mensagens IA ilimitadas",
  "Sugestões diárias personalizadas",
  "Ajuste automático da rotina",
  "Exportação PDF + calendário",
  "Suporte prioritário",
];

type Ctx = { open: (reason?: UpgradeReason) => void };
const UpgradeContext = createContext<Ctx>({ open: () => {} });

export const useUpgradeModal = () => useContext(UpgradeContext);

export const UpgradeModalProvider = ({ children }: { children: ReactNode }) => {
  const [reason, setReason] = useState<UpgradeReason | null>(null);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const { refresh } = usePremium();
  const navigate = useNavigate();

  const open = useCallback((r: UpgradeReason = "generic") => setReason(r), []);
  const close = () => setReason(null);

  const handleUpgrade = async () => {
    if (!user) {
      close();
      navigate("/auth?next=/pricing");
      return;
    }
    setBusy(true);
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
    close();
    toast({ title: "Bem-vindo ao Premium! ✨", description: "Já tens acesso a tudo." });
  };

  const meta = reason ? REASONS[reason] : null;

  return (
    <UpgradeContext.Provider value={{ open }}>
      {children}
      <Dialog open={!!reason} onOpenChange={(v) => !v && close()}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0">
          <div className="bg-gradient-hero p-6 text-primary-foreground relative">
            <button onClick={close} className="absolute top-3 right-3 opacity-70 hover:opacity-100 transition">
              <X className="h-4 w-4" />
            </button>
            <Badge className="bg-background/20 text-primary-foreground border-0 mb-3 gap-1">
              <Sparkles className="h-3 w-3" /> Upgrade VitaFlow Premium
            </Badge>
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary-foreground">{meta?.title}</DialogTitle>
              <DialogDescription className="text-primary-foreground/90 mt-2">
                {meta?.description}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6">
            <div className="flex items-baseline gap-1 mb-4">
              <Zap className="h-5 w-5 text-primary self-center" />
              <span className="text-3xl font-bold">4,99€</span>
              <span className="text-muted-foreground text-sm">/mês</span>
              <span className="ml-auto text-xs text-muted-foreground">Cancela quando quiseres</span>
            </div>

            <ul className="space-y-2 text-sm">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className={meta?.highlight === perk ? "font-semibold" : ""}>{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          <DialogFooter className="px-6 pb-6 gap-2 sm:gap-2 flex-col sm:flex-row">
            <Button variant="ghost" onClick={close} className="rounded-full">
              Agora não
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/pricing" onClick={close}>Ver detalhes</Link>
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={busy}
              className="rounded-full bg-gradient-hero text-primary-foreground border-0 shadow-soft"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {busy ? "A processar..." : "Obter Premium"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UpgradeContext.Provider>
  );
};