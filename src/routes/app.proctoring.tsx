import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Eye, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/proctoring")({ component: ProctoringPage });

type Event = { ts: number; type: string; severity: "info" | "warn" | "danger"; detail?: string };

function ProctoringPage() {
  const [active, setActive] = useState(false);
  const [examId] = useState(() => `exam_${Date.now()}`);
  const [events, setEvents] = useState<Event[]>([]);
  const [score, setScore] = useState(100);
  const [faceCount, setFaceCount] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const userIdRef = useRef<string | null>(null);

  const log = async (type: string, severity: Event["severity"], detail?: string) => {
    const ev: Event = { ts: Date.now(), type, severity, detail };
    setEvents((e) => [ev, ...e].slice(0, 50));
    setScore((s) => Math.max(0, s - (severity === "danger" ? 15 : severity === "warn" ? 5 : 0)));
    if (userIdRef.current) {
      await supabase.from("proctoring_events").insert({
        user_id: userIdRef.current, exam_id: examId, event_type: type, severity, detail: detail ?? null,
      });
    }
  };

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      userIdRef.current = u.user?.id ?? null;
    })();
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setActive(true);
      setScore(100);
      setEvents([]);
      log("session_start", "info", "Proctoring session started");

      // Request fullscreen
      try { await document.documentElement.requestFullscreen(); } catch { /* ignore */ }

      // Listeners
      document.addEventListener("visibilitychange", onVis);
      window.addEventListener("blur", onBlur);
      document.addEventListener("copy", onCopy);
      document.addEventListener("paste", onPaste);
      document.addEventListener("contextmenu", onCtx);
      document.addEventListener("fullscreenchange", onFs);
      document.addEventListener("keydown", onKey);

      // Face monitor loop
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      canvas.width = 160; canvas.height = 120;
      // @ts-ignore
      const FaceDetector = (window as any).FaceDetector;
      const detector = FaceDetector ? new FaceDetector({ fastMode: true }) : null;
      let absentFrames = 0;
      let lastCheck = 0;

      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        const now = performance.now();
        if (now - lastCheck > 1500) {
          lastCheck = now;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          if (detector) {
            try {
              const faces = await detector.detect(canvas);
              setFaceCount(faces.length);
              if (faces.length === 0) {
                absentFrames++;
                if (absentFrames === 2) log("face_absent", "danger", "No face detected");
              } else if (faces.length > 1) {
                log("multiple_faces", "danger", `${faces.length} faces detected`);
                absentFrames = 0;
              } else {
                absentFrames = 0;
              }
            } catch { /* ignore */ }
          } else {
            // Luma fallback
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let sum = 0;
            for (let i = 0; i < img.data.length; i += 16) sum += img.data[i];
            const avg = sum / (img.data.length / 16);
            if (avg < 25) { absentFrames++; if (absentFrames === 3) log("face_absent", "warn", "Low light / no face"); }
            else absentFrames = 0;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err: any) {
      toast.error(err?.message ?? "Camera required for proctoring");
    }
  };

  const stop = async () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("copy", onCopy);
    document.removeEventListener("paste", onPaste);
    document.removeEventListener("contextmenu", onCtx);
    document.removeEventListener("fullscreenchange", onFs);
    document.removeEventListener("keydown", onKey);
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    log("session_end", "info", `Final integrity score: ${score}`);
    setActive(false);
  };

  const onVis = () => { if (document.hidden) log("tab_hidden", "danger", "User switched tabs/windows"); };
  const onBlur = () => log("window_blur", "warn", "Window lost focus");
  const onCopy = () => log("copy", "warn", "Copy attempted");
  const onPaste = () => log("paste", "danger", "Paste attempted");
  const onCtx = (e: MouseEvent) => { e.preventDefault(); log("right_click", "warn", "Right-click blocked"); };
  const onFs = () => { if (!document.fullscreenElement) log("fullscreen_exit", "danger", "Exited fullscreen"); };
  const onKey = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && ["c", "v", "u", "s", "p"].includes(e.key.toLowerCase())) {
      e.preventDefault();
      log("blocked_shortcut", "warn", `Ctrl+${e.key.toUpperCase()} blocked`);
    }
  };

  useEffect(() => () => { if (active) stop(); }, [active]);

  const sev = (s: Event["severity"]) =>
    s === "danger" ? "text-destructive" : s === "warn" ? "text-yellow-400" : "text-muted-foreground";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Exam Proctoring</h1>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full glass ${score >= 70 ? "text-primary-glow" : "text-destructive"}`}>
          {score >= 70 ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          Integrity score: <strong>{score}</strong>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="glass rounded-2xl p-4">
          <div className="aspect-video rounded-xl overflow-hidden bg-black/60 relative">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            {!active && (
              <div className="absolute inset-0 grid place-items-center text-muted-foreground text-sm">
                Camera will activate when you start the exam
              </div>
            )}
            {active && (
              <div className="absolute top-2 left-2 text-xs bg-black/70 px-2 py-1 rounded flex items-center gap-1">
                <Eye className="w-3 h-3" /> Monitoring · faces: {faceCount ?? "—"}
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            {!active ? (
              <Button onClick={start} className="bg-gradient-primary shadow-glow">Start proctored exam</Button>
            ) : (
              <Button onClick={stop} variant="destructive">End session</Button>
            )}
            <div className="text-xs text-muted-foreground self-center">Exam ID: {examId}</div>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>• Tab/window switch: <span className="text-destructive">−15</span></div>
            <div>• Lost focus: <span className="text-yellow-400">−5</span></div>
            <div>• Copy: <span className="text-yellow-400">−5</span> · Paste: <span className="text-destructive">−15</span></div>
            <div>• Multiple faces / no face: <span className="text-destructive">−15</span></div>
            <div>• Exit fullscreen: <span className="text-destructive">−15</span></div>
            <div>• Right-click & shortcuts blocked</div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h2 className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Event log</h2>
          <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-1">
            {events.map((e, i) => (
              <div key={i} className="text-xs border-l-2 border-border pl-2">
                <div className={`font-mono ${sev(e.severity)}`}>{new Date(e.ts).toLocaleTimeString()} · {e.type}</div>
                {e.detail && <div className="text-muted-foreground">{e.detail}</div>}
              </div>
            ))}
            {!events.length && <div className="text-sm text-muted-foreground">No events yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
