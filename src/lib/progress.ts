// LocalStorage-backed progress tracking. Keeps app demo-functional without DB writes.
export type DailyEntry = {
  date: string; // YYYY-MM-DD
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

export function logActivity(topic: string, minutes: number, xp = 25) {
  if (typeof window === "undefined") return;
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
  localStorage.setItem(KEY, JSON.stringify(all));
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
