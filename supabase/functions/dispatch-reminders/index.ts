import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import webpush from "https://esm.sh/web-push@3.6.7?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:notify@vitaflow.app";
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const MEAL_LABELS: Record<string, { title: string; body: string }> = {
  breakfast: { title: "🥐 Hora do pequeno-almoço", body: "Veja seu plano e prepare a refeição." },
  lunch: { title: "🍽️ Hora do almoço", body: "Hora de comer! Confira sua rotina." },
  snack: { title: "🍎 Hora do lanche", body: "Faça um lanche saudável agora." },
  dinner: { title: "🌙 Hora do jantar", body: "Hora do jantar conforme seu plano." },
};

function nowInTZ(tz: string) {
  // Returns { hh, mm } in target timezone
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const hh = parts.find((p) => p.type === "hour")?.value || "00";
  const mm = parts.find((p) => p.type === "minute")?.value || "00";
  return { hh: parseInt(hh, 10), mm: parseInt(mm, 10) };
}

function dateKeyInTZ(tz: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(new Date());
}

function withinWindow(target: string, now: { hh: number; mm: number }, windowMin = 5) {
  const [th, tm] = target.split(":").map((n) => parseInt(n, 10));
  if (isNaN(th) || isNaN(tm)) return false;
  const t = th * 60 + tm;
  const n = now.hh * 60 + now.mm;
  return n >= t && n < t + windowMin;
}

async function sendToUser(userId: string, payload: { title: string; body: string; url?: string; tag?: string }) {
  const { data: subs } = await admin.from("push_subscriptions").select("*").eq("user_id", userId);
  if (!subs || subs.length === 0) return 0;
  const body = JSON.stringify(payload);
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        );
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        } else {
          console.error("push error", e?.statusCode, e?.body);
        }
      }
    })
  );
  return sent;
}

async function alreadySent(userId: string, key: string) {
  const since = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("reminder_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("reminder_key", key)
    .gte("sent_at", since);
  return (count ?? 0) > 0;
}

async function logSent(userId: string, key: string) {
  await admin.from("reminder_log").insert({ user_id: userId, reminder_key: key });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { data: prefs, error } = await admin.from("reminder_preferences").select("*");
    if (error) throw error;
    let totalSent = 0;
    const dayKey = (uid: string, tz: string, suffix: string) => `${dateKeyInTZ(tz)}|${suffix}`;

    for (const p of prefs || []) {
      const tz = p.timezone || "America/Sao_Paulo";
      const now = nowInTZ(tz);
      const today = dateKeyInTZ(tz);

      // Meals
      if (p.meals_enabled && p.meal_times && typeof p.meal_times === "object") {
        for (const [k, t] of Object.entries(p.meal_times as Record<string, string>)) {
          if (!withinWindow(t, now)) continue;
          const key = `${today}|meal|${k}`;
          if (await alreadySent(p.user_id, key)) continue;
          const label = MEAL_LABELS[k] || { title: "Hora da refeição", body: "Confira sua rotina." };
          const sent = await sendToUser(p.user_id, { ...label, url: "/result", tag: key });
          if (sent > 0) await logSent(p.user_id, key);
          totalSent += sent;
        }
      }
      // Workout
      if (p.workouts_enabled && withinWindow(p.workout_time, now)) {
        const key = `${today}|workout`;
        if (!(await alreadySent(p.user_id, key))) {
          const sent = await sendToUser(p.user_id, {
            title: "💪 Hora do treino",
            body: "Bora se mexer! Veja seu treino do dia.",
            url: "/result",
            tag: key,
          });
          if (sent > 0) await logSent(p.user_id, key);
          totalSent += sent;
        }
      }
      // Hydration
      if (p.hydration_enabled) {
        const [sh, sm] = String(p.hydration_start).split(":").map((n) => parseInt(n, 10));
        const [eh, em] = String(p.hydration_end).split(":").map((n) => parseInt(n, 10));
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        const nowMin = now.hh * 60 + now.mm;
        const interval = Math.max(15, Number(p.hydration_interval_minutes) || 120);
        if (nowMin >= startMin && nowMin <= endMin) {
          const offset = nowMin - startMin;
          if (offset % interval < 5) {
            const slot = Math.floor(offset / interval);
            const key = `${today}|hydration|${slot}`;
            if (!(await alreadySent(p.user_id, key))) {
              const sent = await sendToUser(p.user_id, {
                title: "💧 Hora de beber água",
                body: "Mantenha-se hidratado. Beba um copo d'água agora.",
                url: "/",
                tag: key,
              });
              if (sent > 0) await logSent(p.user_id, key);
              totalSent += sent;
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});