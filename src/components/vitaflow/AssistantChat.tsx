import { FormEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { usePremium, FREE_AI_LIMIT } from "@/hooks/usePremium";
import { useUpgradeModal } from "@/components/vitaflow/UpgradeModal";
const QUICK_PROMPTS = [
  "Como ajusto o treino se dormi mal?",
  "Sugestão de snack saudável",
  "Como me manter hidratado?",
];

type Message = { id?: string; role: "user" | "assistant"; content: string; created_at?: string };

const isMessageRole = (role: string): role is Message["role"] => role === "user" || role === "assistant";

export const AssistantChat = ({ activeRoutineId }: { activeRoutineId?: string | null }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isPremium, aiUsedToday, aiRemaining, refresh: refreshPremium } = usePremium();
  const { open: openUpgrade } = useUpgradeModal();
  const blocked = !isPremium && aiRemaining <= 0;

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: rows } = await supabase
        .from("assistant_messages")
        .select("id, role, content, created_at")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: true })
        .limit(40);
      setMessages((rows ?? []).filter((row) => isMessageRole(row.role)) as Message[]);
    });
  }, []);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    if (blocked) {
      toast({ title: "Limite diário atingido", description: "Faz upgrade para Premium para continuares a usar o assistente." });
      return;
    }
    setInput("");
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Inicia sessão para falar com o assistente.");

      const userMessage: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);

      await supabase.from("assistant_messages").insert({ user_id: user.id, role: "user", content: text });
      if (!isPremium) {
        await supabase.rpc("increment_ai_usage", { _user_id: user.id });
        await refreshPremium();
      }
      const [{ data: healthProfile }, { data: routine }] = await Promise.all([
        supabase.from("health_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        activeRoutineId
          ? supabase.from("routines").select("id, title, inputs, plan, created_at").eq("id", activeRoutineId).maybeSingle()
          : supabase.from("routines").select("id, title, inputs, plan, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      const { data: replyData, error } = await supabase.functions.invoke("generate-routine", {
        body: { action: "assistant_chat", message: text, healthProfile, routine, messages: [...messages, userMessage].slice(-12) },
      });
      if (error || replyData?.error) throw new Error(replyData?.error || error?.message);
      const assistantMessage: Message = { role: "assistant", content: replyData.reply || "Estou aqui para ajudar." };
      setMessages((prev) => [...prev, assistantMessage]);
      await supabase.from("assistant_messages").insert({ user_id: user.id, role: "assistant", content: assistantMessage.content });
    } catch (e: unknown) {
      toast({ title: "Erro no assistente", description: e instanceof Error ? e.message : "Tenta novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-card border border-border/60 shadow-soft overflow-hidden">
      <div className="p-4 border-b border-border/60 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-hero flex items-center justify-center"><Bot className="h-5 w-5 text-primary-foreground" /></div>
        <div>
          <h2 className="font-bold">Assistente VitaFlow</h2>
          <p className="text-sm text-muted-foreground">Respostas curtas e diretas, com base no teu perfil e rotina.</p>
        </div>
      </div>
      {!isPremium && (
        <div className="px-4 py-2 border-b border-border/60 bg-accent/30 flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            Mensagens hoje: <strong className="text-foreground">{Math.min(aiUsedToday, FREE_AI_LIMIT)}</strong>/{FREE_AI_LIMIT}
          </span>
          <button onClick={() => openUpgrade("ai-limit")} className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            <Sparkles className="h-3 w-3" /> Upgrade Premium
          </button>
        </div>
      )}
      <ScrollArea className="h-[420px] p-4">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Pergunta sobre treino, refeições, rotina, descanso ou ajustes ao teu dia.</div>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="text-xs rounded-full border border-border bg-background px-3 py-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div key={message.id ?? index} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-accent-foreground" /></div>}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isUser ? "bg-primary text-primary-foreground" : "bg-background border border-border/60"}`}>
                  {isUser ? (
                    <span className="whitespace-pre-wrap">{message.content}</span>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0 prose-headings:mt-1 prose-headings:mb-1.5 prose-headings:text-base">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
                {isUser && <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0"><User className="h-4 w-4 text-muted-foreground" /></div>}
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-accent-foreground" /></div>
              <div className="rounded-2xl px-4 py-2 text-sm bg-background border border-border/60 flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> a pensar...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <form onSubmit={send} className="p-4 border-t border-border/60 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={blocked ? "Limite diário atingido — faz upgrade para Premium" : "Escreve a tua pergunta..."}
          maxLength={600}
          disabled={blocked}
        />
        {blocked ? (
          <Button type="button" onClick={() => openUpgrade("ai-limit")} className="rounded-full bg-gradient-hero text-primary-foreground border-0">
            <Sparkles className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={loading} className="rounded-full bg-gradient-hero text-primary-foreground border-0"><Send className="h-4 w-4" /></Button>
        )}
      </form>
    </div>
  );
};