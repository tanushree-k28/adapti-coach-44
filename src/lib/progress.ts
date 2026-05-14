// Progress tracking — DB-persisted via Supabase with localStorage cache fallback.
import { supabase } from "@/integrations/supabase/client";

export type DailyEntry = {
  date: string;
  minutes: number;
  topics: string[];
  xp: number;
};

const KEY = "nova_progress_v1";

export function loadProgress(): DailyEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveLocal(all: DailyEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(all));
}

/** Pull last 30 days from DB and project into DailyEntry[]. Updates localStorage cache. */
export async function syncFromDb(): Promise<DailyEntry[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return loadProgress();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from("progress_events")
    .select("kind, subject, xp, created_at")
    .eq("user_id", u.user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: true });
  if (error || !data) return loadProgress();

  const map = new Map<string, DailyEntry>();
  for (const row of data) {
    const date = (row.created_at as string).slice(0, 10);
    const e = map.get(date) ?? { date, minutes: 0, topics: [], xp: 0 };
    e.xp += row.xp ?? 0;
    e.minutes += Math.max(1, Math.round((row.xp ?? 0) / 5));
    if (row.subject && !e.topics.includes(row.subject)) e.topics.push(row.subject);
    map.set(date, e);
  }
  const arr = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  saveLocal(arr);
  return arr;
}

/** Log an activity to DB + cache. */
export async function logActivity(topic: string, minutes: number, xp = 25, kind = "study") {
  if (typeof window === "undefined") return;
  // Optimistic local update
  const all = loadProgress();
  const today = new Date().toISOString().slice(0, 10);
  const idx = all.findIndex((e) => e.date === today);
  if (idx >= 0) {
    all[idx].minutes += minutes;
    all[idx].xp += xp;
    if (!all[idx].topics.includes(topic)) all[idx].topics.push(topic);
  } else {
    all.push({ date: today, minutes, xp, topics: [topic] });
  }
  saveLocal(all);

  // Persist to DB if signed in
  const { data: u } = await supabase.auth.getUser();
  if (u.user) {
    await supabase.from("progress_events").insert({
      user_id: u.user.id,
      kind,
      subject: topic,
      xp,
      meta: { minutes },
    });
  }
}

export function streakCount(entries: DailyEntry[]): number {
  if (!entries.length) return 0;
  const dates = new Set(entries.map((e) => e.date));
  let count = 0;
  const d = new Date();
  while (dates.has(d.toISOString().slice(0, 10))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export function totalXp(entries: DailyEntry[]): number {
  return entries.reduce((s, e) => s + e.xp, 0);
}

export function medalFor(xp: number): "gold" | "silver" | "bronze" | null {
  if (xp >= 1000) return "gold";
  if (xp >= 400) return "silver";
  if (xp >= 100) return "bronze";
  return null;
}
