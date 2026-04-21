import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `És o VitaFlow, um assistente de bem-estar para jovens (13-25 anos).
Crias rotinas semanais EQUILIBRADAS e SEGURAS — sem dietas extremas, sem restrições calóricas perigosas, sem treinos exagerados.
Foca em: hidratação, sono regular, alimentação variada, atividade moderada, tempo de descanso e bem-estar mental.
Adapta-te ao horário, objetivo e restrições do utilizador.
Responde SEMPRE em português europeu.
Devolves SEMPRE através da função structured "generate_plan" — nunca texto livre.`;

const tool = {
  type: "function",
  function: {
    name: "generate_plan",
    description: "Devolve a rotina semanal e plano alimentar estruturado.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Resumo motivador (2-3 frases) do plano." },
        weekly_tip: { type: "string", description: "Uma dica saudável da semana." },
        days: {
          type: "array",
          minItems: 7,
          maxItems: 7,
          items: {
            type: "object",
            properties: {
              day: {
                type: "string",
                enum: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"],
              },
              schedule: {
                type: "array",
                description: "Blocos do dia em ordem cronológica.",
                items: {
                  type: "object",
                  properties: {
                    time: { type: "string", description: "Ex: 07:00" },
                    activity: { type: "string" },
                    type: {
                      type: "string",
                      enum: ["sono", "estudo", "treino", "refeicao", "lazer", "trabalho", "rotina"],
                    },
                  },
                  required: ["time", "activity", "type"],
                  additionalProperties: false,
                },
              },
              meals: {
                type: "object",
                properties: {
                  breakfast: { type: "string" },
                  lunch: { type: "string" },
                  snack: { type: "string" },
                  dinner: { type: "string" },
                },
                required: ["breakfast", "lunch", "snack", "dinner"],
                additionalProperties: false,
              },
              workout: {
                type: "string",
                description: "Sugestão de treino (ou 'Descanso ativo' / 'Descanso')",
              },
            },
            required: ["day", "schedule", "meals", "workout"],
            additionalProperties: false,
          },
        },
        shopping_list: {
          type: "array",
          description: "Lista de compras agregada para a semana.",
          items: { type: "string" },
        },
      },
      required: ["summary", "weekly_tip", "days", "shopping_list"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const inputs = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const weekly = Array.isArray(inputs.weeklySchedule) && inputs.weeklySchedule.length
      ? inputs.weeklySchedule.map((s: any) => `  - ${s.day}: ${s.hours || "Livre"}`).join("\n")
      : `  (genérico) ${inputs.schedule || "não indicado"}`;

    const commitments = Array.isArray(inputs.fixedCommitments) && inputs.fixedCommitments.length
      ? inputs.fixedCommitments
          .map((c: any) => `  - ${c.title} | ${c.days} | ${c.time}`)
          .join("\n")
      : "  (nenhum)";

    const userPrompt = `Cria uma rotina semanal completa e plano alimentar para:
Nome: ${inputs.name}
Idade: ${inputs.age || "jovem"}
Objetivo: ${inputs.goal}
Dias disponíveis para treino: ${(inputs.workoutDays || []).join(", ")}
Hora de acordar: ${inputs.wakeTime} | Hora de dormir: ${inputs.sleepTime}
Preferências/restrições alimentares: ${inputs.dietary || "Nenhuma"}

Horário de escola/trabalho POR DIA (respeita rigorosamente):
${weekly}

Compromissos fixos recorrentes (devem aparecer no schedule do(s) dia(s) indicado(s) com o tipo "rotina" ou apropriado):
${commitments}

Cria os 7 dias (Segunda a Domingo) com horários realistas que respeitem o horário de escola/trabalho de cada dia e incluam todos os compromissos fixos nos respetivos dias e horas. Refeições equilibradas variadas (não repetir a mesma refeição todos os dias) e treinos apenas nos dias disponíveis. Inclui uma lista de compras realista (15-25 itens).`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "generate_plan" } },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI gateway error", resp.status, text);
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiados pedidos. Tenta novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adiciona créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ error: "Erro do serviço de IA." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      throw new Error("AI did not return structured plan");
    }
    const plan = JSON.parse(call.function.arguments);

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-routine error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});