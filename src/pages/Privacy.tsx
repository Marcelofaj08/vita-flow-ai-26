import { Layout } from "@/components/vitaflow/Layout";

const Privacy = () => (
  <Layout>
    <section className="container py-16 max-w-3xl prose prose-sm">
      <h1 className="text-3xl font-bold">Privacidade & Termos</h1>
      <p className="mt-4 text-muted-foreground">
        Esta página descreve, de forma simples, como tratamos os teus dados e as condições de utilização do VitaFlow.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Dados que recolhemos</h2>
      <p className="text-muted-foreground mt-2">
        Apenas o teu email (para criar conta) e as informações que introduzes no formulário (nome, horário, objetivos, preferências alimentares). Nada mais.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Como usamos os dados</h2>
      <p className="text-muted-foreground mt-2">
        Os dados são usados unicamente para gerar a tua rotina e guardar o teu histórico. Não partilhamos com terceiros para marketing.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Aviso de saúde</h2>
      <p className="text-muted-foreground mt-2">
        O VitaFlow promove hábitos saudáveis e equilibrados. Não substitui aconselhamento médico, nutricional ou psicológico. Não geramos dietas extremas nem recomendações que possam ser prejudiciais. Em caso de condição de saúde, consulta um profissional.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Os teus direitos</h2>
      <p className="text-muted-foreground mt-2">
        Podes apagar qualquer rotina no histórico a qualquer momento. Para apagar a conta, contacta-nos.
      </p>
    </section>
  </Layout>
);

export default Privacy;