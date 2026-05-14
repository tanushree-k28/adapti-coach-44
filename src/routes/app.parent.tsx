import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadProgress, totalXp, streakCount } from "@/lib/progress";
import { Users, TrendingUp, Award } from "lucide-react";

export const Route = createFileRoute("/app/parent")({ component: ParentPage });

function ParentPage() {
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [days, setDays] = useState(0);
  useEffect(() => {
    const p = loadProgress(); setXp(totalXp(p)); setStreak(streakCount(p)); setDays(p.length);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow"><Users className="w-5 h-5 text-primary-foreground" /></div>
        <div><h1 className="text-2xl font-bold">Parent Dashboard</h1><p className="text-sm text-muted-foreground">Your child's learning at a glance.</p></div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5"><div className="text-xs text-muted-foreground">Active days</div><div className="text-3xl font-bold mt-1">{days}</div></div>
        <div className="glass rounded-2xl p-5"><div className="text-xs text-muted-foreground">Current streak</div><div className="text-3xl font-bold mt-1">{streak} 🔥</div></div>
        <div className="glass rounded-2xl p-5"><div className="text-xs text-muted-foreground">Total XP</div><div className="text-3xl font-bold mt-1 text-gradient">{xp}</div></div>
      </div>
      <div className="glass rounded-2xl p-6 shadow-card space-y-3">
        <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary-glow" /><span className="font-semibold">AI Insights</span></div>
        <p className="text-sm text-muted-foreground">Your child is most engaged in afternoon sessions. Strongest growth in problem solving. Recommend a 15-min review of yesterday's topics.</p>
        <div className="flex items-center gap-2 pt-2"><Award className="w-4 h-4 text-gold" /><span className="text-sm">Recent achievement: First streak milestone</span></div>
      </div>
    </div>
  );
}
