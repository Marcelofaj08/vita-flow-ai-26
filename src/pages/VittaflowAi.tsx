import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity, AlertCircle, ArrowRight, BarChart3, Brain, CheckCircle2,
  ChevronDown, FileCheck2, HeartPulse, Hospital, Lock, Quote, ShieldCheck,
  Sparkles, Stethoscope, TrendingDown, Users, Workflow, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const trustLogos = [
  "MedCare Group", "NorthBay Health", "Atlas Insurance",
  "VivaClinic", "Helix Hospitals", "Wellspring Co.",
];

const compliance = [
  { icon: ShieldCheck, label: "GDPR" },
  { icon: Lock, label: "HIPAA" },
  { icon: FileCheck2, label: "SOC 2 Type II" },
  { icon: ShieldCheck, label: "ISO 27001" },
];

const problems = [
  { icon: AlertCircle, title: "Deteção tardia de risco", desc: "Sinais clínicos críticos passam despercebidos até que seja tarde demais." },
  { icon: Workflow, title: "Dados clínicos fragmentados", desc: "Informação dispersa entre EHRs, laboratórios e dispositivos sem visão unificada." },
  { icon: TrendingDown, title: "Agravamentos evitáveis", desc: "Doenças crónicas progridem por falta de intervenção preventiva atempada." },
  { icon: Activity, title: "Ineficiências operacionais", desc: "Equipas clínicas sobrecarregadas com tarefas administrativas e triagem manual." },
];

const steps = [
  { n: "01", title: "Integrar dados", desc: "Conectamos com o teu EHR/EMR, dispositivos e fontes clínicas em horas, não meses." },
  { n: "02", title: "IA analisa em tempo real", desc: "Os modelos identificam padrões de risco e estratificam pacientes continuamente." },
  { n: "03", title: "Receber alertas acionáveis", desc: "Recomendações explicáveis chegam à equipa clínica no momento certo." },
];

const features = [
  { icon: Brain, title: "Estratificação preditiva de risco", desc: "Identifica pacientes em risco com até 12 meses de antecedência." },
  { icon: Activity, title: "Monitorização em tempo real", desc: "Vigilância contínua com alertas inteligentes para a equipa clínica." },
  { icon: Zap, title: "Automação de intervenções", desc: "Workflows preventivos personalizados desencadeados por evidência." },
  { icon: Sparkles, title: "IA explicável", desc: "Cada recomendação acompanhada da justificação clínica completa." },
  { icon: Workflow, title: "Integração com EHR/EMR", desc: "Compatível com Epic, Cerner, Allscripts e sistemas FHIR." },
  { icon: BarChart3, title: "Population health analytics", desc: "Insights agregados para gestão de coortes e programas." },
];

const benefits = [
  { stat: "—38%", label: "complicações evitáveis" },
  { stat: "+24%", label: "eficiência clínica" },
  { stat: "+47%", label: "envolvimento dos pacientes" },
  { stat: "—21%", label: "custos operacionais" },
];

const testimonials = [
  { quote: "A VittaFlow transformou a forma como antecipamos riscos. Reduzimos readmissões em 32% no primeiro ano.", name: "Dra. Helena Martins", role: "CMO, NorthBay Health" },
  { quote: "A IA explicável foi decisiva. As nossas equipas confiam nas recomendações porque vêem o porquê.", name: "Carlos Ribeiro", role: "Diretor Clínico, MedCare Group" },
  { quote: "Implementação em 6 semanas, integração com Epic sem fricções. Resultados clínicos mensuráveis.", name: "Dr. Tomás Vieira", role: "CIO, Helix Hospitals" },
];

const faqs = [
  { q: "Como os dados dos pacientes são protegidos?", a: "Encriptação ponta a ponta (AES-256), conformidade GDPR e HIPAA, infraestrutura SOC 2 Type II e auditoria contínua. Os dados nunca abandonam a tua jurisdição." },
  { q: "A plataforma integra-se com sistemas existentes?", a: "Sim. Suportamos Epic, Cerner, Allscripts e qualquer sistema compatível com FHIR/HL7. Implementação típica entre 4 e 8 semanas." },
  { q: "Quanto tempo demora a implementação?", a: "Entre 4 e 8 semanas para uma organização de média dimensão, com onboarding clínico, integrações técnicas e formação das equipas incluídas." },
  { q: "A IA é clinicamente validada?", a: "Os nossos modelos são treinados com dados validados, auditados por painéis clínicos independentes e publicados em literatura peer-reviewed." },
  { q: "A IA substitui os profissionais de saúde?", a: "Não. A VittaFlow complementa e reforça a tomada de decisão clínica. A supervisão humana está sempre no centro do processo." },
];

const VittaflowAi = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    document.title = "VittaFlow AI — IA preventiva para organizações de saúde";
    const meta = document.querySelector('meta[name="description"]');
    const desc = "Plataforma de IA explicável para predição de risco, monitorização inteligente e intervenções preventivas em saúde.";
    if (meta) meta.setAttribute("content", desc);
    else { const m = document.createElement("meta"); m.name = "description"; m.content = desc; document.head.appendChild(m); }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/vittaflow-ai" className="flex items-center gap-2 font-bold text-lg">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[hsl(210_85%_55%)] to-[hsl(220_70%_25%)] flex items-center justify-center">
              <HeartPulse className="h-4.5 w-4.5 text-white" />
            </div>
            VittaFlow <span className="text-[hsl(210_85%_45%)]">AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#solucao" className="hover:text-foreground transition">Solução</a>
            <a href="#funcionalidades" className="hover:text-foreground transition">Funcionalidades</a>
            <a href="#seguranca" className="hover:text-foreground transition">Segurança</a>
            <a href="#faq" className="hover:text-foreground transition">FAQ</a>
          </nav>
          <Button asChild className="rounded-full bg-gradient-to-r from-[hsl(210_85%_50%)] to-[hsl(220_70%_30%)] text-white border-0 shadow-md hover:opacity-95">
            <a href="#cta">Agendar Demo <ArrowRight className="h-4 w-4" /></a>
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(210_60%_98%)] via-background to-[hsl(210_80%_96%)]" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[hsl(210_90%_70%)]/20 blur-3xl -z-10" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[hsl(220_70%_50%)]/10 blur-3xl -z-10" />

        <div className="container py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-[hsl(210_80%_85%)] bg-white/80 px-4 py-1.5 text-xs font-semibold text-[hsl(220_70%_30%)] shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> IA explicável para saúde preventiva
            </span>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Preveja Riscos.{" "}
              <span className="bg-gradient-to-r from-[hsl(210_85%_50%)] to-[hsl(220_70%_30%)] bg-clip-text text-transparent">
                Previna Doenças.
              </span>{" "}
              Transforme Cuidados.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              A VittaFlow AI ajuda organizações de saúde a identificar riscos mais cedo, automatizar intervenções preventivas
              e melhorar resultados clínicos com inteligência artificial explicável.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full h-12 px-7 bg-gradient-to-r from-[hsl(210_85%_50%)] to-[hsl(220_70%_30%)] text-white border-0 shadow-lg hover:opacity-95">
                <a href="#cta">Agendar Demonstração <ArrowRight className="h-4 w-4" /></a>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-7 border-[hsl(210_30%_85%)]">
                <a href="#como-funciona">Ver Como Funciona</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[hsl(210_85%_45%)]" /> GDPR & HIPAA</span>
              <span className="flex items-center gap-1.5"><Brain className="h-4 w-4 text-[hsl(210_85%_45%)]" /> IA baseada em evidência</span>
              <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-[hsl(210_85%_45%)]" /> Encriptação ponta a ponta</span>
            </div>
          </div>

          <div className="relative animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="absolute -inset-6 bg-gradient-to-tr from-[hsl(210_90%_60%)]/30 to-[hsl(220_70%_40%)]/20 rounded-[2.5rem] blur-2xl" />
            <DashboardMockup />
          </div>
        </div>

        {/* TRUST BAR */}
        <div className="container border-t border-border/50 py-8">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">Em quem confiam organizações líderes em saúde</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-60">
            {trustLogos.map((l) => (
              <span key={l} className="font-semibold text-sm tracking-tight text-foreground/70">{l}</span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {compliance.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(210_60%_97%)] border border-[hsl(210_40%_90%)] px-3 py-1 text-xs font-medium text-[hsl(220_70%_30%)]">
                <Icon className="h-3.5 w-3.5" /> {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMA / SOLUÇÃO */}
      <section id="solucao" className="container py-24">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-widest text-[hsl(210_85%_45%)] font-semibold">Desafio &rarr; Solução</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">O sistema de saúde está reativo. A VittaFlow torna-o preventivo.</h2>
          <p className="mt-4 text-muted-foreground text-lg">Resolvemos os quatro pontos críticos que custam vidas e milhões anualmente.</p>
        </div>
        <div className="mt-14 grid md:grid-cols-2 gap-5">
          {problems.map((p, i) => (
            <div key={p.title} className="group rounded-2xl border border-border/60 bg-card p-7 hover:border-[hsl(210_80%_70%)] hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-[hsl(210_60%_97%)] flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-[hsl(210_85%_55%)] group-hover:to-[hsl(220_70%_30%)] transition-colors">
                  <p.icon className="h-5 w-5 text-[hsl(220_70%_35%)] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Problema {String(i + 1).padStart(2, "0")}</div>
                  <h3 className="mt-1 font-bold text-lg">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="relative py-24 bg-gradient-to-b from-[hsl(210_60%_98%)] to-background">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-[hsl(210_85%_45%)] font-semibold">Como funciona</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Da integração ao impacto clínico em 3 passos</h2>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-[hsl(210_70%_70%)] to-transparent" />
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl bg-card border border-border/60 p-7 shadow-sm hover:shadow-lg transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[hsl(210_85%_55%)] to-[hsl(220_70%_30%)] text-white font-bold flex items-center justify-center shadow-md">{s.n}</div>
                <h3 className="mt-5 font-bold text-xl">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="container py-24">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-widest text-[hsl(210_85%_45%)] font-semibold">Plataforma</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Funcionalidades de nível enterprise</h2>
          <p className="mt-4 text-muted-foreground text-lg">Uma plataforma completa para equipas clínicas modernas.</p>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border/60 bg-gradient-to-b from-white to-[hsl(210_60%_98%)] p-6 hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[hsl(210_85%_55%)] to-[hsl(220_70%_30%)] flex items-center justify-center shadow-sm">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-5 font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[hsl(220_70%_15%)] to-[hsl(210_85%_30%)]" />
        <div className="absolute inset-0 -z-10 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
        <div className="container">
          <div className="text-center max-w-2xl mx-auto text-white">
            <span className="text-xs uppercase tracking-widest text-[hsl(210_90%_80%)] font-semibold">Resultados</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Impacto mensurável em todas as métricas que importam</h2>
          </div>
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.label} className="text-center rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6">
                <div className="text-4xl md:text-5xl font-bold text-white tracking-tight">{b.stat}</div>
                <div className="mt-2 text-sm text-[hsl(210_60%_85%)]">{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO PRODUTO */}
      <section className="container py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs uppercase tracking-widest text-[hsl(210_85%_45%)] font-semibold">Demonstração</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Vê os teus dados clínicos numa nova dimensão</h2>
            <p className="mt-4 text-muted-foreground text-lg">Visualização de scores de risco em tempo real, timeline completa do paciente e painel de recomendações clínicas explicáveis.</p>
            <ul className="mt-6 space-y-3">
              {[
                "Score de risco preditivo por paciente",
                "Timeline clínica unificada e cronológica",
                "Recomendações com justificação clínica",
                "Alertas priorizados por urgência",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[hsl(210_85%_45%)] shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{t}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8 rounded-full h-12 px-7 bg-gradient-to-r from-[hsl(210_85%_50%)] to-[hsl(220_70%_30%)] text-white border-0 shadow-lg hover:opacity-95">
              <a href="#cta">Pedir demonstração ao vivo <ArrowRight className="h-4 w-4" /></a>
            </Button>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-tr from-[hsl(210_90%_60%)]/20 to-[hsl(220_70%_40%)]/15 rounded-[2.5rem] blur-2xl" />
            <PatientCard />
          </div>
        </div>
      </section>

      {/* TESTEMUNHOS */}
      <section className="bg-gradient-to-b from-background to-[hsl(210_60%_98%)] py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-[hsl(210_85%_45%)] font-semibold">Prova social</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Líderes do setor confiam na VittaFlow</h2>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl bg-card border border-border/60 p-7 shadow-sm hover:shadow-xl transition-shadow flex flex-col">
                <Quote className="h-8 w-8 text-[hsl(210_85%_55%)]/40" />
                <p className="mt-4 text-foreground/90 leading-relaxed flex-1">"{t.quote}"</p>
                <div className="mt-6 pt-5 border-t border-border/60">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEGURANÇA */}
      <section id="seguranca" className="container py-24">
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-[hsl(210_60%_98%)] to-white p-10 md:p-14 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs uppercase tracking-widest text-[hsl(210_85%_45%)] font-semibold">Segurança & Conformidade</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Construído para os ambientes mais exigentes</h2>
            <p className="mt-4 text-muted-foreground">Confidencialidade, integridade e disponibilidade dos dados clínicos são o nosso ponto de partida — nunca uma reflexão tardia.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: ShieldCheck, t: "GDPR & HIPAA", d: "Conformidade integral por design." },
              { icon: Lock, t: "Encriptação E2E", d: "AES-256 em repouso e em trânsito." },
              { icon: Brain, t: "IA explicável", d: "Cada output com justificação clínica." },
              { icon: Stethoscope, t: "Supervisão humana", d: "O clínico mantém sempre o controlo." },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl bg-white border border-border/60 p-5">
                <c.icon className="h-6 w-6 text-[hsl(210_85%_45%)]" />
                <div className="mt-3 font-semibold">{c.t}</div>
                <div className="text-sm text-muted-foreground mt-1">{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container py-24 max-w-3xl">
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest text-[hsl(210_85%_45%)] font-semibold">Perguntas frequentes</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">Tudo o que precisas de saber</h2>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <div key={f.q} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-[hsl(210_60%_98%)] transition-colors"
              >
                <span className="font-semibold text-base md:text-lg">{f.q}</span>
                <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-6 text-muted-foreground leading-relaxed animate-fade-in-up">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="cta" className="container pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(220_70%_20%)] via-[hsl(220_70%_25%)] to-[hsl(210_85%_35%)] p-10 md:p-16 text-center shadow-2xl">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[hsl(210_90%_70%)]/30 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 px-4 py-1.5 text-xs font-semibold text-white">
              <Hospital className="h-3.5 w-3.5" /> Para clínicas, hospitais & seguradoras
            </div>
            <h2 className="mt-6 text-3xl md:text-5xl font-bold text-white tracking-tight">Pronto para liderar o futuro da saúde preventiva?</h2>
            <p className="mt-4 text-[hsl(210_60%_88%)] max-w-2xl mx-auto text-lg">Junta-te às organizações que já estão a transformar resultados clínicos com IA explicável e auditável.</p>
            <Button asChild size="lg" className="mt-8 rounded-full h-12 px-8 bg-white text-[hsl(220_70%_25%)] hover:bg-white/95 shadow-xl">
              <a href="mailto:demo@vittaflow.ai?subject=Pedido%20de%20demonstra%C3%A7%C3%A3o%20VittaFlow%20AI">
                Marcar Demonstração <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[hsl(210_60%_85%)]">
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Equipa especializada em onboarding</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Implementação em 4–8 semanas</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 py-10">
        <div className="container flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[hsl(210_85%_55%)] to-[hsl(220_70%_25%)] flex items-center justify-center">
              <HeartPulse className="h-4 w-4 text-white" />
            </div>
            VittaFlow AI
          </div>
          <div>© {new Date().getFullYear()} VittaFlow AI. Todos os direitos reservados.</div>
        </div>
      </footer>
    </div>
  );
};

/* ───────────── Decorative components ───────────── */

const DashboardMockup = () => (
  <div className="relative rounded-3xl bg-white border border-border/60 shadow-2xl overflow-hidden">
    {/* Top bar */}
    <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-[hsl(210_60%_98%)]">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-[hsl(0_70%_70%)]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[hsl(40_90%_70%)]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[hsl(140_60%_60%)]" />
      </div>
      <div className="text-xs font-semibold text-muted-foreground">vittaflow.ai / dashboard</div>
      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[hsl(210_85%_55%)] to-[hsl(220_70%_30%)]" />
    </div>

    <div className="p-5 grid grid-cols-3 gap-4">
      {/* Risk score */}
      <div className="col-span-2 rounded-2xl border border-border/60 p-4 bg-gradient-to-br from-white to-[hsl(210_60%_98%)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Patient Risk Trend</div>
            <div className="text-lg font-bold mt-0.5">+12.4% últimas 24h</div>
          </div>
          <span className="text-[10px] rounded-full bg-[hsl(210_85%_50%)]/10 text-[hsl(220_70%_30%)] px-2 py-1 font-semibold">REAL-TIME</span>
        </div>
        <svg viewBox="0 0 300 100" className="mt-3 w-full h-24">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(210 85% 55%)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(210 85% 55%)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,70 C30,60 50,40 80,45 C110,50 130,20 160,25 C190,30 210,55 240,40 C260,30 280,35 300,20 L300,100 L0,100 Z" fill="url(#g)" />
          <path d="M0,70 C30,60 50,40 80,45 C110,50 130,20 160,25 C190,30 210,55 240,40 C260,30 280,35 300,20" stroke="hsl(210 85% 50%)" strokeWidth="2.5" fill="none" />
          <circle cx="160" cy="25" r="4" fill="hsl(220 70% 30%)" />
        </svg>
      </div>

      {/* Score donut */}
      <div className="rounded-2xl border border-border/60 p-4 bg-white flex flex-col items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
          <circle cx="50" cy="50" r="42" stroke="hsl(210 40% 92%)" strokeWidth="10" fill="none" />
          <circle cx="50" cy="50" r="42" stroke="hsl(210 85% 50%)" strokeWidth="10" fill="none"
            strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - 0.78)}`} strokeLinecap="round" />
        </svg>
        <div className="-mt-16 text-center">
          <div className="text-2xl font-bold text-[hsl(220_70%_25%)]">78</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Score</div>
        </div>
        <div className="mt-12 text-[10px] text-muted-foreground">Atualizado agora</div>
      </div>

      {/* Alert cards */}
      {[
        { c: "hsl(0 75% 55%)", t: "High risk", n: 12 },
        { c: "hsl(35 95% 55%)", t: "Medium", n: 47 },
        { c: "hsl(150 60% 45%)", t: "Stable", n: 284 },
      ].map((a) => (
        <div key={a.t} className="rounded-xl border border-border/60 p-3 bg-white">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: a.c }} />
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">{a.t}</span>
          </div>
          <div className="mt-1.5 text-xl font-bold">{a.n}</div>
        </div>
      ))}
    </div>
  </div>
);

const PatientCard = () => (
  <div className="relative rounded-3xl bg-white border border-border/60 shadow-2xl p-6">
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[hsl(210_85%_55%)] to-[hsl(220_70%_30%)] flex items-center justify-center text-white font-bold">MR</div>
      <div>
        <div className="font-bold">Maria R., 64</div>
        <div className="text-xs text-muted-foreground">ID #VF-208714 · Hipertensão, Diabetes T2</div>
      </div>
      <div className="ml-auto rounded-full bg-[hsl(0_75%_55%)]/10 text-[hsl(0_75%_45%)] text-xs font-bold px-3 py-1">RISCO ALTO</div>
    </div>

    <div className="mt-5 rounded-2xl bg-[hsl(210_60%_98%)] p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Risk score evolução</span><span>90 dias</span>
      </div>
      <svg viewBox="0 0 300 80" className="mt-2 w-full h-16">
        <path d="M0,60 C40,55 70,50 100,45 C130,40 160,38 190,30 C220,22 260,15 300,10" stroke="hsl(0 75% 55%)" strokeWidth="2.5" fill="none" />
      </svg>
    </div>

    <div className="mt-4 space-y-2">
      {[
        { i: AlertCircle, t: "Pressão arterial fora do alvo (5 leituras consecutivas)", c: "hsl(0 75% 55%)" },
        { i: Activity, t: "HbA1c subiu 0.8 pontos no último trimestre", c: "hsl(35 95% 55%)" },
        { i: CheckCircle2, t: "Adesão à medicação: 92%", c: "hsl(150 60% 45%)" },
      ].map((r, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl border border-border/60 p-3">
          <r.i className="h-4 w-4 mt-0.5 shrink-0" style={{ color: r.c }} />
          <span className="text-sm text-foreground/90">{r.t}</span>
        </div>
      ))}
    </div>

    <div className="mt-4 rounded-2xl bg-gradient-to-br from-[hsl(210_85%_55%)]/10 to-[hsl(220_70%_30%)]/10 border border-[hsl(210_80%_85%)] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[hsl(220_70%_30%)]">
        <Sparkles className="h-3.5 w-3.5" /> Recomendação IA · explicável
      </div>
      <p className="mt-2 text-sm text-foreground/90">Agendar consulta de revisão nas próximas 7 dias. Considerar ajuste de metformina (+evidência clínica do agravamento metabólico).</p>
    </div>
  </div>
);

export default VittaflowAi;