import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadProgress, syncFromDb, type DailyEntry } from "@/lib/progress";
import { Star } from "lucide-react";

export const Route = createFileRoute("/app/reports")({ component: ReportsPage });

function ReportsPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [rating, setRating] = useState(0);
  useEffect(() => { syncFromDb().then(p => setEntries(p.slice().reverse())); }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Daily Learning Report</h1><p className="text-sm text-muted-foreground">What you learned, every day.</p></div>

      {entries.length === 0 && <div className="glass rounded-2xl p-8 text-center text-muted-foreground">No activity yet. Start a session to build your report.</div>}

      <div className="space-y-3">
        {entries.map((e) => {
          const d = new Date(e.date);
          return (
            <div key={e.date} className="glass rounded-2xl p-5 shadow-card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                  <div className="text-xs text-muted-foreground">{d.toLocaleTimeString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gradient">{e.minutes} min</div>
                  <div className="text-xs text-muted-foreground">+{e.xp} XP</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {e.topics.map((t) => <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-secondary">{t}</span>)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass rounded-2xl p-6 shadow-card">
        <h3 className="font-semibold mb-3">Rate today's session</h3>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)}>
              <Star className={`w-7 h-7 ${n <= rating ? "fill-gold text-gold" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
        {rating > 0 && <p className="text-sm text-muted-foreground mt-2">Thanks for your feedback!</p>}
      </div>
    </div>
  );
}
