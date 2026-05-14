import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { chatTutor } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/voice")({ component: VoicePage });

function VoicePage() {
  const fn = useServerFn(chatTutor);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [lang, setLang] = useState("en-US");
  const recogRef = useRef<any>(null);

  const langs = [
    ["en-US", "English"], ["es-ES", "Spanish"], ["fr-FR", "French"], ["de-DE", "German"],
    ["hi-IN", "Hindi"], ["ta-IN", "Tamil"], ["te-IN", "Telugu"], ["ja-JP", "Japanese"], ["zh-CN", "Chinese"],
  ] as const;

  const start = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return toast.error("Voice not supported in this browser");
    const r = new SR(); r.lang = lang; r.interimResults = false; r.continuous = false;
    r.onresult = async (e: any) => {
      const text = e.results[0][0].transcript; setTranscript(text); setListening(false);
      const res = await fn({ data: { messages: [{ role: "user", content: text }] } });
      if (res.ok) { setReply(res.reply); speak(res.reply); } else toast.error(res.error);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recogRef.current = r; r.start(); setListening(true);
  };
  const stop = () => { recogRef.current?.stop(); setListening(false); };
  const speak = (text: string) => { const u = new SpeechSynthesisUtterance(text); u.lang = lang; speechSynthesis.speak(u); };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Voice Tutor</h1><p className="text-sm text-muted-foreground">Speak in your language. NovaMentor will speak back.</p></div>

      <div className="glass rounded-2xl p-6 shadow-card space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Language</label>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm">
            {langs.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </div>

        <div className="flex justify-center">
          <button onClick={listening ? stop : start} className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${listening ? "bg-destructive shadow-glow animate-pulse" : "bg-gradient-primary shadow-glow"}`}>
            {listening ? <MicOff className="w-10 h-10 text-primary-foreground" /> : <Mic className="w-10 h-10 text-primary-foreground" />}
          </button>
        </div>
        <p className="text-center text-sm text-muted-foreground">{listening ? "Listening…" : "Tap to speak"}</p>

        {transcript && <div className="bg-secondary rounded-xl p-4"><div className="text-xs text-muted-foreground mb-1">You said</div><div>{transcript}</div></div>}
        {reply && (
          <div className="bg-gradient-primary text-primary-foreground rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs mb-1 opacity-80"><Volume2 className="w-3 h-3" /> NovaMentor</div>
            <div className="whitespace-pre-wrap">{reply}</div>
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => speak(reply)}>Replay</Button>
          </div>
        )}
      </div>
    </div>
  );
}
