import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Calendar, Apple, Dumbbell, ShoppingCart, Heart, Brain, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/vitaflow/Layout";
import heroImg from "@/assets/hero-vitaflow.jpg";

const features = [
  { icon: Calendar, title: "Rotina semanal", desc: "Horários equilibrados de segunda a domingo, adaptados à tua vida." },
  { icon: Apple, title: "Plano alimentar", desc: "Refeições variadas e realistas — pequeno-almoço, almoço, snack e jantar." },
  { icon: Dumbbell, title: "Treinos suaves", desc: "Sugestões adaptadas ao teu objetivo e dias disponíveis." },
  { icon: ShoppingCart, title: "Lista de compras", desc: "Gerada automaticamente a partir do teu plano semanal." },
  { icon: Heart, title: "Foco em bem-estar", desc: "Sem dietas extremas. Equilíbrio, sono e consistência primeiro." },
  { icon: Brain, title: "IA personalizada", desc: "Cada plano é único, baseado nas tuas preferências e objetivos." },
];

const Index = () => {
  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-soft">
        <div className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]">
          <div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-float" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="container py-16 md:py-24 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Powered by IA
            </span>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-[1.05]">
              Organiza a tua{" "}
              <span className="text-gradient">vida saudável</span>{" "}
              em segundos.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              O VitaFlow cria a tua rotina semanal completa e plano alimentar personalizado —
              equilibrado, realista e adaptado ao teu ritmo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-gradient-hero shadow-glow hover:shadow-glow text-base h-12 px-7 text-primary-foreground border-0 hover:opacity-95 transition-all">
                <Link to="/generate">
                  Criar minha rotina <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-7 text-base">
                <Link to="/about">Como funciona</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" /> Sem dietas extremas</div>
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-secondary" /> 100% personalizado</div>
            </div>
          </div>

          <div className="relative animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-hero opacity-20 blur-2xl" />
            <img
              src={heroImg}
              alt="Jovem a alongar ao nascer do sol com taça de fruta — estilo de vida saudável"
              width={1536}
              height={1024}
              className="relative rounded-[2rem] shadow-glow object-cover w-full aspect-[4/3]"
            />
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-card shadow-card p-4 border border-border/50 hidden sm:block animate-float">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                  <Heart className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Hoje</div>
                  <div className="font-semibold text-sm">Plano equilibrado ✓</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">Tudo o que precisas, num só sítio</h2>
          <p className="mt-4 text-muted-foreground">
            Da rotina diária à lista de compras — o VitaFlow trata de tudo por ti.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-2xl bg-gradient-card border border-border/60 p-6 shadow-soft hover:shadow-card transition-all hover:-translate-y-1 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:bg-gradient-hero transition-colors">
                <f.icon className="h-6 w-6 text-accent-foreground group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        {/* PRICING TEASER */}
        <div className="mb-10 rounded-3xl border border-border/60 bg-gradient-card p-8 md:p-10 shadow-soft">
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                <Sparkles className="h-3 w-3" /> VitaFlow Premium
              </span>
              <h3 className="mt-3 text-2xl md:text-3xl font-bold">Resultados que duram, por 4,99€/mês.</h3>
              <p className="mt-2 text-muted-foreground">IA ilimitada, ajuste automático, exportação e acompanhamento avançado. Cancela quando quiseres.</p>
              <Button asChild className="mt-5 rounded-full bg-gradient-hero text-primary-foreground border-0 shadow-soft">
                <Link to="/pricing">Obter plano completo <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <ul className="grid gap-2 text-sm">
              {["IA ilimitada", "Ajuste automático da rotina", "Exportação de planos", "Histórico completo"].map((it) => (
                <li key={it} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {it}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 md:p-16 text-center shadow-glow">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
          <h2 className="relative text-3xl md:text-5xl font-bold text-primary-foreground">
            Pronto para começar?
          </h2>
          <p className="relative mt-4 text-primary-foreground/90 max-w-xl mx-auto">
            Cria a tua primeira rotina em menos de um minuto. Grátis, sem compromisso.
          </p>
          <Button asChild size="lg" className="relative mt-8 rounded-full bg-background text-foreground hover:bg-background/90 h-12 px-8 text-base">
            <Link to="/generate">Começar agora <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
