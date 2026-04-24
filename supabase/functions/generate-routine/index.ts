import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `És o VitaFlow, um assistente de bem-estar para jovens (13-25 anos).
Crias rotinas semanais EQUILIBRADAS e SEGURAS — sem dietas extremas, sem restrições calóricas perigosas, sem treinos exagerados.
Foca em: hidratação, sono regular, alimentação variada, atividade moderada, tempo de descanso e bem-estar mental.
Adapta-te ao horário, objetivo e restrições do utilizador.

Regras de logística obrigatórias quando montares o schedule do dia:
1. TEMPO DE DESLOCAÇÃO: deixa SEMPRE 20-30 min antes do início da escola/trabalho ou de qualquer compromisso fixo (e 15-20 min depois) para o utilizador se deslocar e preparar. Não coloques refeições nem treino exatamente colados ao horário de saída/chegada.
2. DIGESTÃO: deixa pelo menos 45-60 min entre o fim de uma refeição principal (almoço/jantar) e o início de um treino, e pelo menos 30 min entre o pequeno-almoço/snack e exercício moderado. Após o jantar deve haver 60-90 min antes de dormir.
3. Hidratação ao longo do dia e janela de sono respeitada.

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
              meal_calories: {
                type: "object",
                description: "Estimativa calórica aproximada por refeição e total diário.",
                properties: {
                  breakfast: { type: "number" },
                  lunch: { type: "number" },
                  snack: { type: "number" },
                  dinner: { type: "number" },
                  total: { type: "number" },
                },
                required: ["breakfast", "lunch", "snack", "dinner", "total"],
                additionalProperties: false,
              },
              workout: {
                type: "string",
                description: "Sugestão de treino (ou 'Descanso ativo' / 'Descanso')",
              },
            },
            required: ["day", "schedule", "meals", "meal_calories", "workout"],
            additionalProperties: false,
          },
        },
        shopping_list: {
          type: "array",
          description: "Lista de compras agregada para a semana, com quantidade e qualidade recomendada.",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nome do ingrediente. Ex: Frango" },
              quantity: { type: "string", description: "Quantidade total para a semana. Ex: 1,2 kg" },
              quality: { type: "string", description: "Qualidade/dica de escolha. Ex: peito fresco, biológico se possível" },
              category: { type: "string", description: "Categoria. Ex: Proteínas, Hortícolas, Mercearia, Lacticínios, Frutas" },
            },
            required: ["name", "quantity", "quality", "category"],
            additionalProperties: false,
          },
        },
      },
      required: ["summary", "weekly_tip", "days", "shopping_list"],
      additionalProperties: false,
    },
  },
};

const dailyTool = {
  type: "function",
  function: {
    name: "daily_suggestion",
    description: "Devolve uma sugestão inteligente diária curta e prática.",
    parameters: {
      type: "object",
      properties: {
        suggestion: { type: "string", description: "Sugestão diária em português europeu, 2-4 frases." },
      },
      required: ["suggestion"],
      additionalProperties: false,
    },
  },
};

const reorganizeTool = {
  type: "function",
  function: {
    name: "reorganize_day",
    description: "Reorganiza apenas um dia falhado, mantendo a semana equilibrada.",
    parameters: tool.function.parameters.properties.days.items,
  },
};

const assistantTool = {
  type: "function",
  function: {
    name: "assistant_reply",
    description: "Responde como assistente de bem-estar com sugestões seguras e personalizadas.",
    parameters: {
      type: "object",
      properties: {
        reply: { type: "string", description: "Resposta em português europeu, curta (máx 120 palavras), em markdown, com título curto opcional, bullets quando útil e tom direto." },
      },
      required: ["reply"],
      additionalProperties: false,
    },
  },
};

const MAX_JSON_CHARS = 6_000;
const allowedActions = new Set(["generate_plan", "daily_suggestion", "reorganize_day", "assistant_chat"]);
type ScheduleInput = { day?: unknown; hours?: unknown };
type CommitmentInput = { title?: unknown; days?: unknown; time?: unknown };

const text = (value: unknown, max = 300) =>
  typeof value === "string" ? value.replace(/\p{Cc}/gu, " ").trim().slice(0, max) : "";

const num = (value: unknown, fallback = 0, min = 0, max = 100) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

const safeJson = (value: unknown, max = MAX_JSON_CHARS) => text(JSON.stringify(value ?? {}), max);

const authUser = async (req: Request) => {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) throw new Error("Auth configuration missing");

  const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await authUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autorizado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inputs = await req.json();
    const action = text(inputs.action || "generate_plan", 40);
    if (!allowedActions.has(action)) {
      return new Response(JSON.stringify({ error: "Ação inválida." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const weekly = Array.isArray(inputs.weeklySchedule) && inputs.weeklySchedule.length
      ? inputs.weeklySchedule.slice(0, 7).map((s: ScheduleInput) => `  - ${text(s.day, 20)}: ${text(s.hours, 120) || "Livre"}`).join("\n")
      : `  (genérico) ${text(inputs.schedule, 500) || "não indicado"}`;

    const commitments = Array.isArray(inputs.fixedCommitments) && inputs.fixedCommitments.length
      ? inputs.fixedCommitments
          .slice(0, 20)
          .map((c: CommitmentInput) => `  - ${text(c.title, 80)} | ${text(c.days, 80)} | ${text(c.time, 40)}`)
          .join("\n")
      : "  (nenhum)";

    if (action === "daily_suggestion") {
      const userPrompt = `Com base nesta rotina semanal e progresso, gera uma sugestão diária prática e segura para hoje.
Nome: ${text(inputs.name, 40) || "utilizador"}
Dia: ${text(inputs.day, 20) || "hoje"}
Progresso concluído: ${num(inputs.progress, 0, 0, 100)}%
Rotina: ${safeJson(inputs.plan)}

Foca em adaptação de treino, alimentação, hidratação, descanso ou organização. Não faças recomendações extremas.`;

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userPrompt }],
          tools: [dailyTool],
          tool_choice: { type: "function", function: { name: "daily_suggestion" } },
        }),
      });

      if (!resp.ok) return new Response(JSON.stringify({ error: "Erro do serviço de IA." }), { status: resp.status === 429 ? 429 : resp.status === 402 ? 402 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const data = await resp.json();
      const call = data.choices?.[0]?.message?.tool_calls?.[0];
      return new Response(JSON.stringify(JSON.parse(call.function.arguments)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "reorganize_day") {
      const userPrompt = `O utilizador falhou o dia ${text(inputs.day, 20)}. Reorganiza APENAS esse dia da rotina, mantendo tudo seguro e realista.
Dados pessoais e horários: ${safeJson(inputs.inputs)}
Plano atual: ${safeJson(inputs.plan)}

Mantém o mesmo nome do dia, inclui refeições equilibradas, descanso e adapta o treino sem exageros.`;

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userPrompt }],
          tools: [reorganizeTool],
          tool_choice: { type: "function", function: { name: "reorganize_day" } },
        }),
      });

      if (!resp.ok) return new Response(JSON.stringify({ error: "Erro do serviço de IA." }), { status: resp.status === 429 ? 429 : resp.status === 402 ? 402 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const data = await resp.json();
      const call = data.choices?.[0]?.message?.tool_calls?.[0];
      return new Response(JSON.stringify({ dayPlan: JSON.parse(call.function.arguments) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "assistant_chat") {
      const userPrompt = `Responde à pergunta do utilizador com base no perfil e rotina disponíveis.
Dados pessoais/saúde: ${safeJson(inputs.healthProfile, 2_000)}
Dados da última rotina: ${safeJson(inputs.routine)}
Histórico recente do chat: ${safeJson(Array.isArray(inputs.messages) ? inputs.messages.slice(-10) : [], 3_000)}
Pergunta: ${text(inputs.message, 600)}

REGRAS DE FORMATO (obrigatórias):
- Português europeu, máximo 120 palavras.
- Estrutura em markdown:
  - Começa com 1 frase direta a responder à pergunta.
  - Se houver passos, usa lista com no máximo 4 bullets curtos (1 linha cada).
  - Termina com 1 dica prática ou pergunta de follow-up (opcional).
- Sem introduções genéricas tipo "Claro!" ou "Ótima pergunta!".
- Sem diagnósticos médicos. Se faltar info crítica, pede APENAS o dado em falta numa frase.`;

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userPrompt }],
          tools: [assistantTool],
          tool_choice: { type: "function", function: { name: "assistant_reply" } },
        }),
      });

      if (!resp.ok) return new Response(JSON.stringify({ error: "Erro do serviço de IA." }), { status: resp.status === 429 ? 429 : resp.status === 402 ? 402 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const data = await resp.json();
      const call = data.choices?.[0]?.message?.tool_calls?.[0];
      return new Response(JSON.stringify(JSON.parse(call.function.arguments)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userPrompt = `Cria uma rotina semanal completa e plano alimentar para:
Nome: ${text(inputs.name, 40) || "utilizador"}
Idade: ${num(inputs.age, 18, 13, 100)}
Objetivo: ${text(inputs.goal, 300)}
Dias disponíveis para treino: ${Array.isArray(inputs.workoutDays) ? inputs.workoutDays.slice(0, 7).map((d: unknown) => text(d, 20)).join(", ") : "não indicado"}
Hora de acordar: ${text(inputs.wakeTime, 10)} | Hora de dormir: ${text(inputs.sleepTime, 10)}
Preferências/restrições alimentares: ${text(inputs.dietary, 500) || "Nenhuma"}
Peso: ${num(inputs.weightKg, 0, 0, 400) || "não indicado"} kg | Altura: ${num(inputs.heightCm, 0, 0, 250) || "não indicada"} cm
Bioimpedância/observações: ${text(inputs.bioimpedanceNotes, 1000) || "não indicado"}
Ficheiro de bioimpedância anexado: ${inputs.bioimpedanceFilePath ? "sim" : "não"}

Horário de escola/trabalho POR DIA (respeita rigorosamente):
${weekly}

Compromissos fixos recorrentes (devem aparecer no schedule do(s) dia(s) indicado(s) com o tipo "rotina" ou apropriado):
${commitments}

Cria os 7 dias (Segunda a Domingo) com horários realistas que respeitem o horário de escola/trabalho de cada dia e incluam todos os compromissos fixos nos respetivos dias e horas. Refeições equilibradas variadas (não repetir a mesma refeição todos os dias), com estimativas calóricas aproximadas por refeição e total diário. Treinos apenas nos dias disponíveis.

LISTA DE COMPRAS (obrigatório, 15-25 itens):
- Calcula a QUANTIDADE TOTAL para a semana com base no número de porções que cada ingrediente aparece nas refeições dos 7 dias e no peso/idade/objetivo do utilizador.
- Usa unidades concretas e realistas: kg, g, L, ml, unidades, dúzias, embalagens. Ex: "1,4 kg" de peito de frango, "12 ovos", "500 g" de aveia, "2 L" de leite, "6 unidades" de banana.
- NUNCA deixes a quantidade vazia, "a gosto" ou "q.b." — tem de ser uma quantidade comprável no supermercado.
- Soma todas as ocorrências do ingrediente na semana antes de indicar a quantidade (ex: se aparece em 4 almoços a 150 g, indica "600 g").
- Inclui NOME, QUANTIDADE total para a semana, QUALIDADE recomendada (ex: fresco, biológico, integral, magro) e CATEGORIA (Proteínas, Hortícolas, Frutas, Lacticínios, Mercearia, etc.).`;

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
      JSON.stringify({ error: "Ocorreu um erro interno. Por favor tenta novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});