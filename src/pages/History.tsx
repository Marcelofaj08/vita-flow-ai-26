import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { Layout } from "@/components/vitaflow/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type Row = { id: string; title: string; created_at: string };

const History = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }
    supabase.from("routines").select("id, title, created_at").order("created_at", { ascending: false }).then(({ data }) => {
      setRows(data ?? []);
      setBusy(false);
    });
  }, [user, loading, navigate]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("routines").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", variant: "destructive" });
      return;
    }
    setRows((p) => p.filter((r) => r.id !== id));
  };

  return (
    <Layout>
      <section className="container py-12 max-w-3xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">As tuas rotinas</h1>
            <p className="text-muted-foreground mt-1">Histórico dos planos gerados.</p>
          </div>
          <Button asChild className="rounded-full bg-gradient-hero text-primary-foreground border-0">
            <Link to="/generate"><Plus className="h-4 w-4 mr-1" /> Nova rotina</Link>
          </Button>
        </div>

        <div className="mt-8 space-y-3">
          {busy && <div className="text-muted-foreground text-sm">A carregar...</div>}
          {!busy && rows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="mt-3 text-muted-foreground">Ainda não criaste nenhuma rotina.</p>
              <Button asChild className="mt-4 rounded-full"><Link to="/generate">Criar primeira</Link></Button>
            </div>
          )}
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl bg-gradient-card border border-border/60 p-4 flex items-center justify-between shadow-soft hover:shadow-card transition-all">
              <Link to={`/result?id=${r.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default History;