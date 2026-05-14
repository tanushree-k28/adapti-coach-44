import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadProgress, streakCount, totalXp, medalFor, logActivity, type DailyEntry } from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, BookOpen, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function Dashboard() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  useEffect(() => setEntries(loadProgress()), []);

  const xp = totalXp(entries);
  const streak = streakCount(entries);
  const medal = medalFor(xp);
  const minutesToday = entries.find((e) => e.date === new Date().toISOString().slice(0, 10))?.minutes ?? 0;

  // last 7 days
  const days: { date: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: d.toLocaleDateString(undefined, { weekday: "short" }), minutes: entries.find((e) => e.date === key)?.minutes ?? 0 });
  }

  const quickStudy = () => { logActivity("Quick session", 10); setEntries(loadProgress()); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back 👋</h1>
        <p className="text-muted-foreground">Here's your adaptive learning snapshot.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<Flame className="w-5 h-5" />} label="Streak" value={`${streak} day${streak === 1 ? "" : "s"}`} />
        <Stat icon={<Trophy className="w-5 h-5" />} label="Total XP" value={`${xp}`} />
        <Stat icon={<Clock className="w-5 h-5" />} label="Today" value={`${minutesToday} min`} />
        <Stat icon={<BookOpen className="w-5 h-5" />} label="Medal" value={medal ? medal.toUpperCase() : "—"}
          accent={medal === "gold" ? "text-gold" : medal === "silver" ? "text-silver" : medal === "bronze" ? "text-bronze" : ""} />
      </div>

      <div className="glass rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Last 7 days</h2>
          <Button size="sm" onClick={quickStudy} className="bg-gradient-primary shadow-glow">+10 min session</Button>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.06 295 / 40%)" />
              <XAxis dataKey="date" stroke="oklch(0.72 0.04 300)" fontSize={12} />
              <YAxis stroke="oklch(0.72 0.04 300)" fontSize={12} />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.05 295)", border: "1px solid oklch(0.4 0.1 305 / 40%)", borderRadius: 12 }} />
              <Line type="monotone" dataKey="minutes" stroke="oklch(0.78 0.22 320)" strokeWidth={3} dot={{ fill: "oklch(0.65 0.25 305)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent = "" }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="glass rounded-2xl p-5 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon}<span>{label}</span></div>
      <div className={`mt-2 text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}
