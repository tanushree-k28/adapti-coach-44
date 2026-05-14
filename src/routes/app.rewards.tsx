import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadProgress, syncFromDb, totalXp, streakCount, medalFor } from "@/lib/progress";
import { Trophy, Flame, Gift } from "lucide-react";

export const Route = createFileRoute("/app/rewards")({ component: RewardsPage });

function RewardsPage() {
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  useEffect(() => { syncFromDb().then(p => { setXp(totalXp(p)); setStreak(streakCount(p)); }); }, []);
  const medal = medalFor(xp);

  const tiers = [
    { name: "Bronze", min: 100, color: "text-bronze", bg: "from-bronze/30 to-bronze/10" },
    { name: "Silver", min: 400, color: "text-silver", bg: "from-silver/30 to-silver/10" },
    { name: "Gold", min: 1000, color: "text-gold", bg: "from-gold/30 to-gold/10" },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Rewards & Medals</h1><p className="text-sm text-muted-foreground">Earn medals as you grow.</p></div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5"><div className="flex items-center gap-2 text-muted-foreground text-xs"><Flame className="w-4 h-4" /> Streak</div><div className="text-3xl font-bold mt-1">{streak}🔥</div></div>
        <div className="glass rounded-2xl p-5"><div className="flex items-center gap-2 text-muted-foreground text-xs"><Trophy className="w-4 h-4" /> Total XP</div><div className="text-3xl font-bold mt-1 text-gradient">{xp}</div></div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {tiers.map((t) => {
          const earned = xp >= t.min;
          return (
            <div key={t.name} className={`rounded-2xl p-6 text-center bg-gradient-to-b ${t.bg} border border-border ${earned ? "shadow-glow" : "opacity-50"}`}>
              <Trophy className={`w-12 h-12 mx-auto ${t.color}`} />
              <h3 className={`mt-3 font-bold text-lg ${t.color}`}>{t.name}</h3>
              <p className="text-xs text-muted-foreground">{t.min} XP required</p>
              {earned && <p className="mt-2 text-xs">✓ Earned</p>}
            </div>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-2"><Gift className="w-5 h-5 text-primary-glow" /><h2 className="font-semibold">Festival Offers</h2></div>
        <p className="text-sm text-muted-foreground">🎉 Diwali Special: 30% off premium · 🎄 Holiday: free certificate templates · 🎂 Birthday week: 2x XP</p>
      </div>

      {medal && <p className="text-center text-sm text-muted-foreground">Current medal: <span className="font-bold uppercase">{medal}</span></p>}
    </div>
  );
}
