import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Lock } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // O Supabase coloca a sessão de recuperação automaticamente quando o link é aberto.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    const parsed = schema.safeParse({ password });
    if (!parsed.success) {
      toast({ title: "Verifica a palavra-passe", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "As palavras-passe não coincidem", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Palavra-passe atualizada", description: "Já podes iniciar sessão com a nova palavra-passe." });
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    } catch (e: unknown) {
      toast({ title: "Não foi possível atualizar", description: e instanceof Error ? e.message : "Tenta novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">VitaFlow</span>
        </Link>

        <div className="rounded-3xl bg-card border border-border/60 shadow-card p-8">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-2xl bg-accent flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center">Definir nova palavra-passe</h1>
          <p className="mt-1 text-sm text-muted-foreground text-center">
            {ready ? "Escolhe uma palavra-passe forte para a tua conta." : "A validar o teu link..."}
          </p>

          {ready && (
            <div className="space-y-4 mt-6">
              <div>
                <Label htmlFor="pw">Nova palavra-passe</Label>
                <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="pw2">Confirmar palavra-passe</Label>
                <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••" className="mt-1.5" />
              </div>
              <Button onClick={submit} disabled={loading} className="w-full bg-gradient-hero text-primary-foreground border-0 h-11 rounded-full shadow-soft">
                {loading ? "A guardar..." : "Atualizar palavra-passe"}
              </Button>
            </div>
          )}

          {!ready && (
            <div className="mt-6 text-center text-sm">
              <Link to="/auth" className="text-primary hover:underline">Voltar para iniciar sessão</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;