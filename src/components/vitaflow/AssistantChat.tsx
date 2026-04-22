import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Message = { id?: string; role: "user" | "assistant"; content: string; created_at?: string };

export const AssistantChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: rows } = await (supabase as any)
        .from("assistant_messages")
        .select("id, role, content, created_at")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: true })
        .limit(40);
      setMessages((rows ?? []) as Message[]);
    });
  }, []);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Inicia sessão para falar com o assistente.");

      const userMessage: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);

      await (supabase as any).from("assistant_messages").insert({ user_id: user.id, role: "user", content: text });
      const [{ data: healthProfile }, { data: routine }] = await Promise.all([
        (supabase as any).from("health_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("routines").select("title, inputs, plan, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      const { data: replyData, error } = await supabase.functions.invoke("generate-routine", {
        body: { action: "assistant_chat", message: text, healthProfile, routine, messages: [...messages, userMessage].slice(-12) },
      });
      if (error || replyData?.error) throw new Error(replyData?.error || error?.message);
      const assistantMessage: Message = { role: "assistant", content: replyData.reply || "Estou aqui para ajudar." };
      setMessages((prev) => [...prev, assistantMessage]);
      await (supabase as any).from("assistant_messages").insert({ user_id: user.id, role: "assistant", content: assistantMessage.content });
    } catch (e: any) {
      toast({ title: "Erro no assistente", description: e.message, variant: "destructive" });
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
          <p className="text-sm text-muted-foreground">Usa o teu perfil e rotina para responder melhor.</p>
        </div>
      </div>
      <ScrollArea className="h-[420px] p-4">
        <div className="space-y-3">
          {messages.length === 0 && <div className="text-sm text-muted-foreground">Pergunta sobre treino, refeições, rotina, descanso ou ajustes ao teu dia.</div>}
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div key={message.id ?? index} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-accent-foreground" /></div>}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isUser ? "bg-primary text-primary-foreground" : "bg-background border border-border/60"}`}>{message.content}</div>
                {isUser && <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0"><User className="h-4 w-4 text-muted-foreground" /></div>}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <form onSubmit={send} className="p-4 border-t border-border/60 flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escreve a tua pergunta..." maxLength={600} />
        <Button type="submit" disabled={loading} className="rounded-full bg-gradient-hero text-primary-foreground border-0"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
};