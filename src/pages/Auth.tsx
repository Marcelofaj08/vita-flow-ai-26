import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/generate", { replace: true });
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/generate", { replace: true });
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handle = async (mode: "signin" | "signup") => {
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast({ title: "Verifica os dados", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/generate` },
        });
        if (error) throw error;

        if (data.session) {
          toast({ title: "Conta criada!", description: "Já podes começar a tua rotina." });
          navigate("/generate", { replace: true });
        } else {
          toast({ title: "Confirma o teu email", description: "Enviámos um link de confirmação. Depois volta aqui para entrar." });
          setTab("signin");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        if (!data.session) throw new Error("Não foi possível iniciar sessão. Confirma o teu email e tenta novamente.");
        navigate("/generate", { replace: true });
      }
    } catch (e: any) {
      const message = e.message === "Invalid login credentials"
        ? "Email ou palavra-passe incorretos. Se acabaste de criar conta, confirma primeiro o email."
        : e.message === "Email not confirmed"
          ? "Confirma o teu email antes de iniciar sessão. Enviámos o link para a tua caixa de entrada."
          : e.message ?? "Tenta novamente";
      toast({ title: "Erro ao entrar", description: message, variant: "destructive" });
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
          <h1 className="text-2xl font-bold text-center">Bem-vindo</h1>
          <p className="mt-1 text-sm text-muted-foreground text-center">
            Entra ou cria conta para guardares as tuas rotinas.
          </p>

          <Tabs value={tab} onValueChange={(value) => setTab(value as "signin" | "signup")} className="mt-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            {(["signin", "signup"] as const).map((m) => (
              <TabsContent key={m} value={m} className="space-y-4 mt-6">
                <div>
                  <Label htmlFor={`email-${m}`}>Email</Label>
                  <Input id={`email-${m}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="o-teu@email.com" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor={`pw-${m}`}>Palavra-passe</Label>
                  <Input id={`pw-${m}`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="mt-1.5" />
                </div>
                <Button onClick={() => handle(m)} disabled={loading} className="w-full bg-gradient-hero text-primary-foreground border-0 h-11 rounded-full shadow-soft">
                  {loading ? "Aguarda..." : m === "signin" ? "Entrar" : "Criar conta"}
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;