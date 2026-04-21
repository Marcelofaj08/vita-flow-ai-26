import { Link } from "react-router-dom";
import { Heart, Shield, Sparkles, Users } from "lucide-react";
import { Layout } from "@/components/vitaflow/Layout";
import { Button } from "@/components/ui/button";

const About = () => (
  <Layout>
    <section className="container py-16 max-w-3xl">
      <h1 className="text-4xl md:text-5xl font-bold">Sobre o <span className="text-gradient">VitaFlow</span></h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Acreditamos que ter uma vida saudável não tem de ser complicado. O VitaFlow nasceu para ajudar
        jovens a organizar a semana com equilíbrio — sono, estudo, alimentação e movimento — usando IA.
      </p>

      <div className="mt-10 grid sm:grid-cols-2 gap-5">
        {[
          { icon: Heart, title: "Equilíbrio primeiro", desc: "Nada de dietas extremas ou treinos exagerados. Hábitos sustentáveis." },
          { icon: Sparkles, title: "Personalizado", desc: "Cada plano é único, gerado a partir das tuas preferências e ritmo." },
          { icon: Shield, title: "Seguro", desc: "Os teus dados são privados. As rotinas só ficam visíveis para ti." },
          { icon: Users, title: "Para jovens", desc: "Pensado para a vida real de quem estuda, trabalha e quer evoluir." },
        ].map((b) => (
          <div key={b.title} className="rounded-2xl bg-gradient-card border border-border/60 p-5 shadow-soft">
            <b.icon className="h-7 w-7 text-primary" />
            <h3 className="mt-3 font-semibold">{b.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-accent border border-border/60 p-5 text-sm text-accent-foreground">
        <strong>Aviso importante:</strong> O VitaFlow é uma ferramenta de organização e bem-estar. Não substitui aconselhamento médico, nutricional ou psicológico profissional. Em caso de dúvida, consulta sempre um profissional de saúde.
      </div>

      <div className="mt-10 text-center">
        <Button asChild size="lg" className="rounded-full bg-gradient-hero text-primary-foreground border-0 shadow-soft">
          <Link to="/generate">Criar a minha rotina</Link>
        </Button>
      </div>
    </section>
  </Layout>
);

export default About;