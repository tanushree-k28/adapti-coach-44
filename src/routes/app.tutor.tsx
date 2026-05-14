import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { chatTutor } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send } from "lucide-react";
import { toast } from "sonner";
import { logActivity } from "@/lib/progress";

export const Route = createFileRoute("/app/tutor")({ component: TutorPage });

type Msg = { role: "user" | "assistant"; content: string };

function TutorPage() {
  const fn = useServerFn(chatTutor);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm NovaMentor. Ask me about any topic — I'll explain step-by-step and adapt to your level." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: input }];
    setMessages(next); setInput(""); setLoading(true);
    try {
      const res = await fn({ data: { messages: next } });
      if (!res.ok) toast.error(res.error);
      else { setMessages([...next, { role: "assistant", content: res.reply }]); logActivity("AI Tutor chat", 5, 15); }
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow"><Brain className="w-5 h-5 text-primary-foreground" /></div>
        <div><h1 className="text-2xl font-bold">AI Tutor</h1><p className="text-sm text-muted-foreground">Ask any doubt, on any topic.</p></div>
      </div>

      <div className="glass rounded-2xl p-4 shadow-card h-[60vh] overflow-y-auto space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{m.content}</div>
          </div>
        ))}
        {loading && <div className="text-sm text-muted-foreground italic">NovaMentor is thinking…</div>}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <Input placeholder="Ask anything…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} disabled={loading} />
        <Button onClick={send} disabled={loading} className="bg-gradient-primary shadow-glow"><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}
