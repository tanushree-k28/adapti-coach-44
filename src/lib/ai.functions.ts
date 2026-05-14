import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  system: z.string().optional(),
});

export const chatTutor = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI key not configured" };
    }
    const systemPrompt =
      data.system ??
      "You are NovaMentor, an enthusiastic AI tutor for students. Explain clearly with examples, use simple language, and break down topics step-by-step. Use short paragraphs and lists. Encourage the learner.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) return { ok: false as const, error: "Rate limited. Try again shortly." };
      if (res.status === 402) return { ok: false as const, error: "AI credits exhausted. Add credits in Workspace." };
      return { ok: false as const, error: `AI error: ${text.slice(0, 200)}` };
    }

    const json: any = await res.json();
    const reply = json?.choices?.[0]?.message?.content ?? "";
    return { ok: true as const, reply };
  });

export const generateNotes = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ topic: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI key not configured" };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You generate concise, well-structured smart study notes in markdown with headings, bullet points, and a 'Key Takeaways' section." },
          { role: "user", content: `Create smart study notes about: ${data.topic}` },
        ],
      }),
    });
    if (!res.ok) {
      if (res.status === 429) return { ok: false as const, error: "Rate limited" };
      if (res.status === 402) return { ok: false as const, error: "AI credits exhausted" };
      return { ok: false as const, error: "AI error" };
    }
    const json: any = await res.json();
    return { ok: true as const, notes: json?.choices?.[0]?.message?.content ?? "" };
  });
