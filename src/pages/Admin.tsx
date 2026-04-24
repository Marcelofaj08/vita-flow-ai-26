import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Search, ShieldCheck, Users } from "lucide-react";
import { Layout } from "@/components/vitaflow/Layout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

type Row = {
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  signed_up_at: string;
  last_sign_in_at: string | null;
  routines_count: number;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
};

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth"); return; }

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) {
          setAuthorized(false);
          setBusy(false);
          return;
        }
        setAuthorized(true);
        const { data: list, error } = await supabase.rpc("admin_list_users");
        if (error) {
          toast({ title: "Erro a carregar utilizadores", description: error.message, variant: "destructive" });
        } else {
          setRows((list ?? []) as Row[]);
        }
        setBusy(false);
      });
  }, [user, loading, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      row.email.toLowerCase().includes(q) || (row.display_name ?? "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  const fmt = (value: string | null) =>
    value ? new Date(value).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" }) : "—";

  if (busy) {
    return (
      <Layout>
        <div className="container py-20 text-center text-muted-foreground">A verificar permissões...</div>
      </Layout>
    );
  }

  if (!authorized) {
    return (
      <Layout>
        <div className="container py-20 max-w-lg text-center space-y-3">
          <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Acesso restrito</h1>
          <p className="text-muted-foreground">Esta área é apenas para administradores do VitaFlow.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container py-10 md:py-14">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Badge variant="secondary" className="mb-3"><ShieldCheck className="h-3 w-3 mr-1" /> Painel de administração</Badge>
            <h1 className="text-3xl md:text-4xl font-bold">Utilizadores VitaFlow</h1>
            <p className="text-muted-foreground mt-2">Lista completa de pessoas com conta, atividade e dados de saúde declarados.</p>
          </div>
          <div className="rounded-2xl bg-gradient-card border border-border/60 p-4 shadow-soft flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center"><Users className="h-5 w-5 text-accent-foreground" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Total de contas</div>
              <div className="text-2xl font-bold">{rows.length}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 relative max-w-md">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Procurar por nome ou email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="mt-6 rounded-2xl border border-border/60 bg-gradient-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Utilizador</th>
                  <th className="text-left font-semibold px-4 py-3">Email</th>
                  <th className="text-left font-semibold px-4 py-3">Conta criada</th>
                  <th className="text-left font-semibold px-4 py-3">Último acesso</th>
                  <th className="text-left font-semibold px-4 py-3">Rotinas</th>
                  <th className="text-left font-semibold px-4 py-3">Idade · Peso · Altura</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Sem utilizadores correspondentes.
                    </td>
                  </tr>
                )}
                {filtered.map((row) => (
                  <tr key={row.user_id} className="border-t border-border/60 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{row.display_name || row.email.split("@")[0]}</div>
                      <div className="text-xs text-muted-foreground font-mono">{row.user_id.slice(0, 8)}…</div>
                    </td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(row.signed_up_at)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-primary" />
                        {fmt(row.last_sign_in_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={row.routines_count > 0 ? "default" : "outline"}>{row.routines_count}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.age ?? "—"} a · {row.weight_kg ?? "—"} kg · {row.height_cm ?? "—"} cm
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Admin;