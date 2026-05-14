import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateNotes } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { logActivity } from "@/lib/progress";

export const Route = createFileRoute("/app/notes")({ component: NotesPage });

function NotesPage() {
  const fn = useServerFn(generateNotes);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const gen = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    const res = await fn({ data: { topic } });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    setNotes(res.notes); logActivity(topic, 8, 20);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Smart Notes Generator</h1><p className="text-sm text-muted-foreground">AI creates revision-ready notes for any topic.</p></div>
      <div className="flex gap-2">
        <Input placeholder="e.g. Photosynthesis, Pythagoras theorem…" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <Button onClick={gen} disabled={loading} className="bg-gradient-primary shadow-glow">{loading ? "Generating…" : "Generate"}</Button>
      </div>
      {notes && <div className="glass rounded-2xl p-6 shadow-card whitespace-pre-wrap text-sm leading-relaxed">{notes}</div>}
    </div>
  );
}
